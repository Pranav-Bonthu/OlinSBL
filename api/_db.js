// Shared helpers for the API routes. Files starting with "_" are not exposed as routes.
import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';
import seed from './_seed.js';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
export const sql = url ? neon(url) : null;

let ready = false;
// Creates the single-row table on first use and loads the starting data.
export async function ensureTable() {
  if (!sql) throw new Error('DATABASE_URL is not set. Connect a Neon database to this Vercel project.');
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
