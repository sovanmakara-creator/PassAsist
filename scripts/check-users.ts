import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

// Bypasses RLS to query auth and public tables
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function main() {
  console.log("=== Checking User Accounts ===");
  const { data: authData, error: authError } = await supabase.auth.admin.listUsers();
  if (authError) {
    console.error("Failed to list auth users:", authError.message);
  } else {
    console.log(`Found ${authData?.users?.length || 0} user(s) in auth.users:`);
    authData?.users?.forEach((u) => {
      console.log(`- Email: ${u.email} | ID: ${u.id} | Confirmed: ${!!u.email_confirmed_at}`);
    });
  }

  console.log("\n=== Checking user_roles Table ===");
  const { data: roleData, error: roleError } = await supabase.from("user_roles").select("*");
  if (roleError) {
    console.error("Failed to fetch user roles:", roleError.message);
  } else {
    console.log(`Found ${roleData?.length || 0} role mapping(s) in public.user_roles:`);
    roleData?.forEach((r) => {
      console.log(`- ID: ${r.id} | Role: ${r.role}`);
    });
  }
}

main().catch(console.error);
