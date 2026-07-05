/**
 * Applies SQL files in supabase/migrations/ to the remote Supabase Postgres database.
 *
 * Set in .env.local (from Supabase → Project Settings → Database):
 *   DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
 * or:
 *   SUPABASE_DB_PASSWORD=your_database_password
 *
 * Run: npm run db:apply
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function loadDotEnvLocal() {
  const p = path.join(root, '.env.local');
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const env = { ...process.env, ...loadDotEnvLocal() };
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || '';
const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
const projectRef = match?.[1];
const password = env.SUPABASE_DB_PASSWORD;

let connectionString = (env.DATABASE_URL || env.SUPABASE_DATABASE_URL || env.SUPABASE_DB_URL || '').trim();

function ensureSslForSupabase(url) {
  if (!url || url.includes('sslmode=')) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}uselibpqcompat=true&sslmode=require`;
}

function buildClientConfig() {
  if (connectionString) {
    return { connectionString: ensureSslForSupabase(connectionString), ssl: { rejectUnauthorized: false } };
  }

  const host = env.SUPABASE_DB_HOST || (projectRef ? `db.${projectRef}.supabase.co` : null);
  const port = parseInt(env.SUPABASE_DB_PASSWORD ? env.SUPABASE_DB_PORT || '5432' : env.SUPABASE_DB_PORT || '5432', 10);
  const user = env.SUPABASE_DB_USER || 'postgres';

  if (!host || !password) {
    console.error('Missing database credentials.');
    console.error('Add DATABASE_URL or SUPABASE_DB_PASSWORD to termsintakeform/.env.local');
    console.error('Supabase Dashboard → Project Settings → Database → Connection string');
    process.exit(1);
  }

  return {
    host,
    port,
    user,
    password,
    database: env.SUPABASE_DB_DATABASE || 'postgres',
    ssl: { rejectUnauthorized: false },
  };
}

const migrationsDir = path.join(root, 'supabase', 'migrations');
const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
const client = new pg.Client(buildClientConfig());

async function main() {
  await client.connect();
  console.log('Connected. Applying investor hub migrations to', projectRef || 'postgres');
  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8');
    if (!sql.trim()) continue;
    console.log('Applying', f, '...');
    await client.query(sql);
    console.log('  OK');
  }
  await client.end();
  console.log('Done — investor_applications tables are ready.');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
