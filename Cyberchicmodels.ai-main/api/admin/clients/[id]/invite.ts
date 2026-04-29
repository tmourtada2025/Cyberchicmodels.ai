// api/admin/clients/[id]/invite.ts
// PATCHED — Step 5 fix.
// POST: Admin invites a client. Creates auth user, links to client, sends magic link.
// Phase 1: enforces single user per client at app layer.
//
// Key fixes vs previous version:
//   - Removed redundant generateLink call (was consuming rate limit budget)
//   - Uses only signInWithOtp from anon client for the actual send
//   - Rolls back auth.users + client_users on email send failure (clean retries)
//   - Returns 429 with friendly message on rate limit instead of 500

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.VITE_SITE_URL || process.env.SITE_URL || "https://www.cyberchicmodels.ai";

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
  throw new Error("Missing required env vars");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Tightened admin gate ────────────────────────────────────────────────────
async function requireAdmin(req: any, res: any): Promise<{ userId: string } | null> {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Missing auth token" });
    return null;
  }
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid token" });
    return null;
  }
  const { data: adminRow } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", data.user.id)
    .maybeSingle();
  if (!adminRow) {
    res.status(403).json({ error: "Not an admin user" });
    return null;
  }
  return { userId: data.user.id };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const clientId = req.query.id as string;
  if (!clientId) {
    return res.status(400).json({ error: "Missing client id" });
  }

  // ─── Load client + verify ─────────────────────────────────────────────
  const { data: client, error: clientErr } = await supabaseAdmin
    .from("clients")
    .select("id, slug, name, contact_email, is_active")
    .eq("id", clientId)
    .single();

  if (clientErr || !client) {
    return res.status(404).json({ error: "Client not found" });
  }

  if (!client.is_active) {
    return res.status(400).json({
      error: "Client is inactive. Activate the client before sending invite.",
    });
  }

  if (!client.contact_email) {
    return res.status(400).json({
      error: "Client has no contact email. Set contact_email before inviting.",
    });
  }

  const email = client.contact_email.trim().toLowerCase();

  // ─── Phase 1: enforce single user per client ──────────────────────────
  const { count: existingUsers } = await supabaseAdmin
    .from("client_users")
    .select("id", { count: "exact", head: true })
    .eq("client_id", clientId);

  if (existingUsers && existingUsers > 0) {
    return res.status(409).json({
      error: "Client already has a user. Phase 1 supports one user per client. Delete the existing client_users row to re-invite.",
    });
  }

  // ─── Track what we create so we can roll back on failure ──────────────
  let createdAuthUserId: string | null = null; // null = pre-existing, not created by us
  let createdClientUserRowId: string | null = null;

  const rollback = async () => {
    if (createdClientUserRowId) {
      await supabaseAdmin.from("client_users").delete().eq("id", createdClientUserRowId);
    }
    if (createdAuthUserId) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUserId);
    }
  };

  try {
    // ─── Find or create auth user ─────────────────────────────────────
    let authUserId: string;

    const { data: existing, error: lookupErr } = await supabaseAdmin.auth.admin
      .listUsers({ page: 1, perPage: 200 });

    if (lookupErr) {
      return res.status(500).json({ error: "Auth lookup failed: " + lookupErr.message });
    }

    const existingUser = existing.users.find(
      u => u.email?.toLowerCase() === email
    );

    if (existingUser) {
      authUserId = existingUser.id;

      // Defensive: ensure this auth user isn't already linked to another client
      const { data: otherLink } = await supabaseAdmin
        .from("client_users")
        .select("client_id")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      if (otherLink && otherLink.client_id !== clientId) {
        return res.status(409).json({
          error: "This email is already linked to another client. One client per email in Phase 1.",
        });
      }
    } else {
      // Create new auth user (no password, magic-link only)
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin
        .createUser({
          email,
          email_confirm: true,
          user_metadata: {
            client_id: clientId,
            client_slug: client.slug,
          },
        });

      if (createErr || !created.user) {
        return res.status(500).json({
          error: "Failed to create auth user: " + (createErr?.message || "unknown"),
        });
      }
      authUserId = created.user.id;
      createdAuthUserId = authUserId; // mark for potential rollback
    }

    // ─── Create client_users row ──────────────────────────────────────
    const { data: insertedRow, error: linkErr } = await supabaseAdmin
      .from("client_users")
      .insert({
        client_id: clientId,
        auth_user_id: authUserId,
        email,
        role: "owner",
      })
      .select()
      .single();

    if (linkErr) {
      // 23505 = unique violation (already exists). For new auth users, that's a bug.
      // For existing users, it means a previous invite already linked this user.
      await rollback();
      return res.status(500).json({
        error: "Failed to link user to client: " + linkErr.message,
      });
    }
    createdClientUserRowId = insertedRow.id;

    // ─── Send magic link via signInWithOtp ────────────────────────────
    // signInWithOtp from anon client triggers the actual email send.
    // shouldCreateUser:false ensures we don't accidentally create another auth user.
    const { error: otpErr } = await supabaseAnon.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${SITE_URL}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (otpErr) {
      await rollback();

      // Detect rate limit and return friendly error
      const msg = otpErr.message || "";
      if (msg.includes("seconds") || msg.toLowerCase().includes("rate")) {
        return res.status(429).json({
          error: "Rate limited by email provider. Please wait 60 seconds and try again.",
          rate_limited: true,
        });
      }

      return res.status(500).json({
        error: "Failed to send magic link: " + msg,
      });
    }

    // ─── Mark invite sent ─────────────────────────────────────────────
    const sentAt = new Date().toISOString();
    await supabaseAdmin
      .from("clients")
      .update({ invite_sent_at: sentAt })
      .eq("id", clientId);

    return res.status(200).json({
      ok: true,
      invite_sent_at: sentAt,
      email,
      message: `Magic link sent to ${email}.`,
    });

  } catch (e: any) {
    // Anything unexpected → rollback partial state
    await rollback();
    console.error("Invite handler crashed:", e);
    return res.status(500).json({
      error: "Unexpected error: " + (e.message || String(e)),
    });
  }
}
