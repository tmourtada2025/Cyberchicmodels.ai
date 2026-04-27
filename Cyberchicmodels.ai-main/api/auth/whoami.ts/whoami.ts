// api/auth/whoami.ts
// GET: returns the current user's role + routing info.
// Used by AuthCallback to determine where to redirect after magic link.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing required env vars");
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(200).json({ role: "none" });
  }

  const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
  if (userErr || !userData.user) {
    return res.status(200).json({ role: "none" });
  }

  const userId = userData.user.id;
  const email = userData.user.email;

  // Check admin first (admins take priority if somehow both)
  const { data: adminRow } = await supabaseAdmin
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (adminRow) {
    return res.status(200).json({
      role: "admin",
      email,
    });
  }

  // Check client_users
  const { data: clientUserRow } = await supabaseAdmin
    .from("client_users")
    .select("client_id, role, clients(slug, name, is_active)")
    .eq("auth_user_id", userId)
    .maybeSingle();

  if (clientUserRow) {
    const clientData = clientUserRow.clients as any;
    if (!clientData?.is_active) {
      return res.status(200).json({
        role: "client_inactive",
        email,
      });
    }
    // Update last_login_at
    await supabaseAdmin
      .from("client_users")
      .update({ last_login_at: new Date().toISOString() })
      .eq("auth_user_id", userId);

    return res.status(200).json({
      role: "client",
      email,
      client_slug: clientData.slug,
      client_name: clientData.name,
      client_role: clientUserRow.role,
    });
  }

  // Authenticated but no role — orphan auth user
  return res.status(200).json({
    role: "orphan",
    email,
  });
}
