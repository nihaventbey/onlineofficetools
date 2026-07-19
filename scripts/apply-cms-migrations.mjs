#!/usr/bin/env node
/**
 * Apply pending CMS migrations to the remote Supabase Postgres database.
 *
 * Requires one of:
 *   - DATABASE_URL  (postgresql://...)
 *   - SUPABASE_DB_PASSWORD (+ NEXT_PUBLIC_SUPABASE_URL for host/ref)
 *
 * Usage:
 *   DATABASE_URL='postgresql://...' node scripts/apply-cms-migrations.mjs
 *   SUPABASE_DB_PASSWORD='...' node scripts/apply-cms-migrations.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvLocal() {
  const path = resolve(root, ".env.local");
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const i = trimmed.indexOf("=");
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = { ...loadEnvLocal(), ...process.env };

const MIGRATIONS = [
  "20260719150000_cms_expansion.sql",
  "20260719160000_cms_patch_adsense_concurrency.sql",
];

function buildConnectionString() {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  const password = env.SUPABASE_DB_PASSWORD;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!password || !url) return null;
  const ref = url
    .replace(/^https?:\/\//, "")
    .split(".")[0]
    .replace(/\/$/, "");
  // Prefer IPv4 pooler — direct db.* hosts are often IPv6-only.
  const region = env.SUPABASE_POOLER_REGION || "ap-southeast-1";
  return `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
}

async function main() {
  const connectionString = buildConnectionString();
  if (!connectionString) {
    console.error(
      "Missing DATABASE_URL or SUPABASE_DB_PASSWORD (+ NEXT_PUBLIC_SUPABASE_URL).",
    );
    console.error(
      "Get the DB password from Supabase Dashboard → Project Settings → Database.",
    );
    process.exit(1);
  }

  let pg;
  try {
    const require = createRequire(import.meta.url);
    pg = require("pg");
  } catch {
    console.error("Install pg first: npm install pg --no-save");
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  console.log("Connected.");

  // Ensure schema_migrations tracking table exists (Supabase CLI style).
  await client.query(`
    create table if not exists supabase_migrations.schema_migrations (
      version text primary key,
      statements text[],
      name text
    );
  `).catch(async () => {
    await client.query(`create schema if not exists supabase_migrations`);
    await client.query(`
      create table if not exists supabase_migrations.schema_migrations (
        version text primary key,
        statements text[],
        name text
      );
    `);
  });

  for (const file of MIGRATIONS) {
    const version = file.slice(0, 14);
    const name = file.replace(/^\d+_/, "").replace(/\.sql$/, "");
    const { rows } = await client.query(
      `select 1 from supabase_migrations.schema_migrations where version = $1`,
      [version],
    );
    if (rows.length) {
      console.log(`skip ${file} (already applied)`);
      continue;
    }

    const sql = readFileSync(resolve(root, "supabase/migrations", file), "utf8");
    console.log(`applying ${file}...`);
    await client.query("begin");
    try {
      await client.query(sql);
      await client.query(
        `insert into supabase_migrations.schema_migrations (version, name, statements)
         values ($1, $2, $3)
         on conflict (version) do nothing`,
        [version, name, [sql]],
      );
      await client.query("commit");
      console.log(`ok ${file}`);
    } catch (err) {
      await client.query("rollback");
      console.error(`failed ${file}:`, err.message);
      await client.end();
      process.exit(1);
    }
  }

  // Smoke checks
  const checks = await client.query(`
    select
      to_regclass('public.tool_revisions') is not null as tool_revisions,
      to_regclass('public.cms_audit_events') is not null as cms_audit_events,
      exists(select 1 from pg_proc where proname = 'admin_upsert_tool') as admin_upsert_tool,
      exists(
        select 1 from storage.buckets
        where id = 'cms-media'
          and 'image/svg+xml' = any(allowed_mime_types)
      ) as svg_allowed
  `);
  console.log("checks:", checks.rows[0]);

  await client.end();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
