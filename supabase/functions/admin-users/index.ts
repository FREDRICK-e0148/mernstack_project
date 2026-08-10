import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ROLES = ["admin", "staff", "user"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) throw new Error("Unauthorized");

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden: admin only");

    const body = req.method === "POST" ? await req.json() : {};
    const action = body.action ?? "list";

    if (action === "list") {
      const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) throw error;
      const { data: allRoles } = await admin.from("user_roles").select("user_id, role");
      const roleMap = new Map<string, string[]>();
      for (const r of allRoles ?? []) {
        roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role]);
      }
      return new Response(
        JSON.stringify({
          users: data.users.map((u) => ({
            id: u.id,
            email: u.email,
            phone: u.phone,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            roles: roleMap.get(u.id) ?? [],
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "create") {
      const { email, password, role } = body;
      if (!email || !password) throw new Error("email and password required");
      if (role && !ROLES.includes(role)) throw new Error("invalid role");
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error) throw error;
      if (role && role !== "user" && data.user) {
        const { error: roleErr } = await admin
          .from("user_roles")
          .insert({ user_id: data.user.id, role });
        if (roleErr) throw roleErr;
      }
      return new Response(JSON.stringify({ user: data.user }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "set_role") {
      const { user_id, role } = body;
      if (!user_id || !ROLES.includes(role)) throw new Error("user_id and valid role required");
      if (user_id === userData.user.id) throw new Error("Cannot change your own role");
      await admin.from("user_roles").delete().eq("user_id", user_id);
      if (role !== "user") {
        const { error } = await admin.from("user_roles").insert({ user_id, role });
        if (error) throw error;
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const { user_id } = body;
      if (!user_id) throw new Error("user_id required");
      if (user_id === userData.user.id) throw new Error("Cannot delete yourself");
      const { error } = await admin.auth.admin.deleteUser(user_id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown action");
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unexpected error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
