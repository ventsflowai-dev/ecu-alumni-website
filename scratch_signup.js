import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function main() {
  console.log("Signing up admin user...");
  const { data, error } = await supabase.auth.signUp({
    email: "ifeoluwadaniel25@gmail.com",
    password: "Dannyfrosh1999#",
    options: {
      data: {
        full_name: "Major Admin",
      },
    },
  });

  if (error) {
    console.error("Sign up error:", error.message);
  } else {
    console.log("Sign up successful! User ID:", data.user?.id);
    console.log(`
======================================================
ACTION REQUIRED:
Please run this SQL query in your Supabase SQL Editor
to make this user the major admin:
======================================================

INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' FROM auth.users WHERE email = 'ifeoluwadaniel25@gmail.com' 
ON CONFLICT (user_id, role) DO NOTHING;

======================================================
    `);
  }
}

main();
