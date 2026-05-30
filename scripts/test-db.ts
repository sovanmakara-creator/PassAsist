import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log("Checking database connection and tables...");

  const { data: resources, error: resError } = await supabase
    .from("resources")
    .select("count", { count: "exact", head: true });

  if (resError) {
    console.error("Error reading resources table:", resError.message);
  } else {
    console.log(`Resources table exists. Row count: ${resources?.[0] || 0}`);
  }

  const { data: courses, error: courseError } = await supabase
    .from("courses")
    .select("count", { count: "exact", head: true });

  if (courseError) {
    console.error("Error reading courses table:", courseError.message);
  } else {
    console.log(`Courses table exists. Row count: ${courses?.[0] || 0}`);
  }

  const { data: roles, error: roleError } = await supabase
    .from("user_roles")
    .select("count", { count: "exact", head: true });

  if (roleError) {
    console.error("Error reading user_roles table:", roleError.message);
  } else {
    console.log(`User_roles table exists. Row count: ${roles?.[0] || 0}`);
  }
}

test().catch(console.error);
