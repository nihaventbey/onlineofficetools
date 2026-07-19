/**
 * Create or promote a Supabase admin user.
 *
 * Usage:
 *   node scripts/create-admin.mjs [email]
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL in .env.local
 * Password is generated and printed once — never written to the repo.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const file = path.resolve(".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function generatePassword(length = 20) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

loadEnvLocal();

const email = process.argv[2] || "resulyilmaz@gmail.com";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const password = generatePassword();

const { data: listed, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});
if (listError) {
  console.error("listUsers failed:", listError.message);
  process.exit(1);
}

const existing = listed.users.find(
  (u) => u.email?.toLowerCase() === email.toLowerCase(),
);

if (existing) {
  const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
    app_metadata: { ...(existing.app_metadata ?? {}), role: "admin" },
  });
  if (error) {
    console.error("updateUser failed:", error.message);
    process.exit(1);
  }
  console.log("Admin user updated (role=admin, password reset).");
  console.log("Email:", data.user.email);
  console.log("Password:", password);
  console.log("Save this password now — it will not be shown again.");
  process.exit(0);
}

const { data, error } = await supabase.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  app_metadata: { role: "admin" },
});

if (error) {
  console.error("createUser failed:", error.message);
  process.exit(1);
}

console.log("Admin user created.");
console.log("Email:", data.user.email);
console.log("Password:", password);
console.log("Save this password now — it will not be shown again.");
