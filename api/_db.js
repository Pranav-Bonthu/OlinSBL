// Shared helpers for the API routes. Files starting with "_" are not exposed as routes.
import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import seed from './_seed.js';

// Neon's Vercel integration names this DATABASE_URL by default, but a custom prefix
// (e.g. STORAGE_URL or NEON_DATABASE_URL) is picked up too.
function findDbUrl() {
  const env = process.env;
  const preferred = ['DATABASE_URL', 'POSTGRES_URL', 'NEON_DATABASE_URL'];
  for (const k of preferred) if (env[k]) return env[k];
  const keys = Object.keys(env).filter(k => /^postgres(ql)?:\/\//.test(env[k] || ''));
  const pooled = keys.find(k => /(^|_)(DATABASE_URL|POSTGRES_URL|URL)$/.test(k) && !/UNPOOLED|NON_POOLING/.test(k));
  return env[pooled || keys[0]] || '';
}
const url = findDbUrl();
export const sql = url ? neon(url) : null;

let ready = false;
// Creates the single-row table on first use and loads the starting data.
export async function ensureTable() {
  if (!sql) throw new Error('No database connection string found. In Vercel, connect the Neon database to this project for Production, then redeploy.');
  if (ready) return;
  await sql`create table if not exists osbl_league (
    id int primary key,
    version int not null,
    data jsonb not null,
    updated_at timestamptz not null default now()
  )`;
  await sql`insert into osbl_league (id, version, data)
            values (1, 1, ${JSON.stringify(seed)}::jsonb)
            on conflict (id) do nothing`;
  ready = true;
}

// Constant-time comparison against the EDITOR_PASSCODE environment variable.
export function editorKeyOk(key) {
  const want = process.env.EDITOR_PASSCODE || '';
  if (!want || typeof key !== 'string' || !key) return false;
  const a = crypto.createHash('sha256').update(key).digest();
  const b = crypto.createHash('sha256').update(want).digest();
  return crypto.timingSafeEqual(a, b);
}
