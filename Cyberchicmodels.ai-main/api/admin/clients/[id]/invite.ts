// api/admin/clients/[id]/invite.ts
// POST: Admin invites a client. Creates auth user, links to client, sends magic link.
// Phase 1: enforces single user per client at app layer.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE_URL = process.env.VITE_SITE_URL || process.env.SITE_URL || "https://www.cyberchicmodels.ai";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing required env vars");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Auth helper — tightened: checks admin_users table ───────────────────────
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
  // NEW in Step 5: check admin_users table, not just any authed user
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
      error: "Client already has a user. Phase 1 supports one user per client.",
    });
  }

  // ─── Find or create auth user ─────────────────────────────────────────
  // We use admin API to create user. If email already exists in auth.users
  // (from another flow), we look it up instead.
  let authUserId: string;

  // Check if user already exists
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
        email_confirm: true, // skip Supabase's confirm flow; magic link IS the confirmation
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
  }

  // ─── Create client_users row ──────────────────────────────────────────
  const { error: linkErr } = await supabaseAdmin
    .from("client_users")
    .insert({
      client_id: clientId,
      auth_user_id: authUserId,
      email,
      role: "owner",
    });

  if (linkErr) {
    // If row already exists (e.g. retry), don't fail
    if (linkErr.code !== "23505") {
      return res.status(500).json({ error: "Failed to link user to client: " + linkErr.message });
    }
  }

  // ─── Send magic link ──────────────────────────────────────────────────
  const { error: linkSendErr } = await supabaseAdmin.auth.admin
    .generateLink({
      type: "magiclink",
      email,
      options: {
        redirectTo: `${SITE_URL}/auth/callback`,
      },
    });

  // Note: generateLink returns the link itself but we want Supabase to send it
  // Actually generateLink just returns the link - we need signInWithOtp from
  // a non-admin client to send the email. Let's use that instead.

  if (linkSendErr) {
    // Fallback: use OTP send via the regular auth API
    const supabaseAnon = createClient(
      SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY as string,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: otpErr } = await supabaseAnon.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${SITE_URL}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (otpErr) {
      return res.status(500).json({
        error: "Failed to send magic link: " + otpErr.message,
      });
    }
  } else {
    // generateLink succeeded - but we still need to actually send the email
    // Use signInWithOtp from anon client to trigger the email send
    const supabaseAnon = createClient(
      SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY as string,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error: otpErr } = await supabaseAnon.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${SITE_URL}/auth/callback`,
        shouldCreateUser: false,
      },
    });

    if (otpErr) {
      return res.status(500).json({
        error: "Failed to send magic link email: " + otpErr.message,
      });
    }
  }

  // ─── Mark invite sent ─────────────────────────────────────────────────
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
}
