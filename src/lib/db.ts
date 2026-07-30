import { createClient, type Client } from '@libsql/client';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * SQLite via libsql. Two modes, same schema and SQL dialect:
 *
 * - Local (default): a plain SQLite file at DB_PATH (./data/hriq.sqlite), as
 *   before — dev machines and self-hosted office servers need no external
 *   service and candidate data never leaves the machine.
 * - Hosted: set TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN) and the same code
 *   talks to a Turso/libsql server instead. Required on serverless hosts
 *   (Vercel) where the filesystem is ephemeral and a local file cannot
 *   persist between requests.
 */

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;
/* Forward slashes keep the file: URL valid on Windows. */
const LOCAL_PATH = (process.env.DB_PATH ?? 'data/hriq.sqlite').replace(/\\/g, '/');

async function open(): Promise<Client> {
  let client: Client;
  if (TURSO_URL) {
    client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  } else {
    mkdirSync(dirname(resolve(LOCAL_PATH)), { recursive: true });
    client = createClient({ url: `file:${LOCAL_PATH}` });
  }

  await client.execute(`
    CREATE TABLE IF NOT EXISTS candidates (
      id            TEXT PRIMARY KEY,
      token         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      first_name    TEXT NOT NULL DEFAULT '',
      middle_name   TEXT NOT NULL DEFAULT '',
      last_name     TEXT NOT NULL DEFAULT '',
      level         TEXT NOT NULL DEFAULT 'basic',
      company       TEXT NOT NULL DEFAULT '',
      ref           TEXT NOT NULL,
      position      TEXT NOT NULL DEFAULT '',
      email         TEXT NOT NULL DEFAULT '',
      extra_time    INTEGER NOT NULL DEFAULT 0,
      duration_sec  INTEGER NOT NULL,
      created_at    INTEGER NOT NULL,
      expires_at    INTEGER NOT NULL,
      started_at    INTEGER,
      submitted_at  INTEGER,
      display_order TEXT,
      answers       TEXT NOT NULL DEFAULT '{}',
      score         INTEGER,
      band          TEXT,
      submit_mode   TEXT,
      notes         TEXT NOT NULL DEFAULT '',
      invite_emailed_at INTEGER
    )
  `);
  await client.execute('CREATE INDEX IF NOT EXISTS idx_candidates_created ON candidates(created_at DESC)');
  await client.execute('CREATE INDEX IF NOT EXISTS idx_candidates_token ON candidates(token)');

  // Lightweight migrations for databases created before these columns existed.
  const info = await client.execute("SELECT name FROM pragma_table_info('candidates')");
  const cols = new Set(info.rows.map((r) => String(r.name)));
  for (const ddl of [
    'invite_emailed_at INTEGER',
    "first_name TEXT NOT NULL DEFAULT ''",
    "middle_name TEXT NOT NULL DEFAULT ''",
    "last_name TEXT NOT NULL DEFAULT ''",
    "level TEXT NOT NULL DEFAULT 'basic'",
    "company TEXT NOT NULL DEFAULT ''",
  ]) {
    if (!cols.has(ddl.split(' ')[0])) {
      await client.execute(`ALTER TABLE candidates ADD COLUMN ${ddl}`);
    }
  }
  return client;
}

/**
 * Lazy, memoised connection (as a promise: opening runs the migrations).
 *
 * Deliberately NOT opened at module scope: `next build` imports every route in
 * several worker processes at once to collect page data, and each one would
 * race to create/migrate the database. Opening on first query means importing
 * a module is free and only real requests touch the store. The memo also
 * survives dev-mode hot reload, which re-evaluates modules.
 */
const g = globalThis as unknown as { __hriqDb?: Promise<Client> };

export function getDb(): Promise<Client> {
  return (g.__hriqDb ??= open());
}

export interface CandidateRow {
  id: string;
  token: string;
  name: string;
  first_name: string;
  middle_name: string;
  last_name: string;
  /** Difficulty level: 'basic' | 'advanced' | 'expert'. Legacy rows are 'basic'. */
  level: string;
  /** SRP group company the candidate applied to. Empty on legacy rows. */
  company: string;
  ref: string;
  position: string;
  email: string;
  extra_time: number;
  duration_sec: number;
  created_at: number;
  expires_at: number;
  started_at: number | null;
  submitted_at: number | null;
  display_order: string | null;
  answers: string;
  score: number | null;
  band: string | null;
  submit_mode: string | null;
  notes: string;
  invite_emailed_at: number | null;
}

export type Status = 'pending' | 'in_progress' | 'submitted' | 'expired';

export function statusOf(c: CandidateRow, now = Date.now()): Status {
  if (c.submitted_at) return 'submitted';
  if (c.started_at) return 'in_progress';
  if (c.expires_at < now) return 'expired';
  return 'pending';
}

export async function allCandidates(): Promise<CandidateRow[]> {
  const db = await getDb();
  const rs = await db.execute('SELECT * FROM candidates ORDER BY created_at DESC');
  return rs.rows as unknown as CandidateRow[];
}

export async function candidateById(id: string): Promise<CandidateRow | null> {
  const db = await getDb();
  const rs = await db.execute({ sql: 'SELECT * FROM candidates WHERE id = ?', args: [id] });
  return (rs.rows[0] as unknown as CandidateRow) ?? null;
}

export async function candidateByToken(token: string): Promise<CandidateRow | null> {
  const db = await getDb();
  const rs = await db.execute({ sql: 'SELECT * FROM candidates WHERE token = ?', args: [token] });
  return (rs.rows[0] as unknown as CandidateRow) ?? null;
}
