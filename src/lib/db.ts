import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

/**
 * SQLite via Node's built-in driver — no native compilation, no external
 * database process. The file lives on your server; candidate data never
 * leaves the machine.
 */

const DB_PATH = resolve(process.env.DB_PATH ?? './data/hriq.sqlite');

function open(): DatabaseSync {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  // Concurrent writers (autosaves, dashboard sweeps) should queue, not throw.
  db.exec('PRAGMA busy_timeout = 5000');
  // WAL lets the dashboard read while a candidate is writing autosaves.
  // Harmless to retry: it is a no-op once the file is already in WAL mode.
  try {
    db.exec('PRAGMA journal_mode = WAL');
  } catch {
    /* another process holds the lock mid-switch; the existing mode still works */
  }
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
      id            TEXT PRIMARY KEY,
      token         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL,
      first_name    TEXT NOT NULL DEFAULT '',
      middle_name   TEXT NOT NULL DEFAULT '',
      last_name     TEXT NOT NULL DEFAULT '',
      level         TEXT NOT NULL DEFAULT 'basic',
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
      notes         TEXT NOT NULL DEFAULT ''
    );
    CREATE INDEX IF NOT EXISTS idx_candidates_created ON candidates(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_candidates_token   ON candidates(token);
  `);
  // Lightweight migrations for databases created before these columns existed.
  // `name` stays the composed display name; the parts allow structured export.
  const cols = new Set(
    (db.prepare('PRAGMA table_info(candidates)').all() as { name: string }[]).map((c) => c.name),
  );
  for (const ddl of [
    'invite_emailed_at INTEGER',
    "first_name TEXT NOT NULL DEFAULT ''",
    "middle_name TEXT NOT NULL DEFAULT ''",
    "last_name TEXT NOT NULL DEFAULT ''",
    "level TEXT NOT NULL DEFAULT 'basic'",
  ]) {
    if (!cols.has(ddl.split(' ')[0])) db.exec(`ALTER TABLE candidates ADD COLUMN ${ddl}`);
  }
  return db;
}

/**
 * Lazy, memoised connection.
 *
 * Deliberately NOT opened at module scope: `next build` imports every route in
 * several worker processes at once to collect page data, and each one would
 * race to create the file and switch it to WAL — which fails with
 * SQLITE_BUSY ("database is locked"). Opening on first query means importing a
 * module is free and only real requests touch the file. The memo also survives
 * dev-mode hot reload, which re-evaluates modules.
 */
const g = globalThis as unknown as { __hriqDb?: DatabaseSync };

export function getDb(): DatabaseSync {
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

export function allCandidates(): CandidateRow[] {
  return getDb()
    .prepare('SELECT * FROM candidates ORDER BY created_at DESC')
    .all() as unknown as CandidateRow[];
}

export function candidateById(id: string): CandidateRow | null {
  return (getDb().prepare('SELECT * FROM candidates WHERE id = ?').get(id) as unknown as CandidateRow) ?? null;
}

export function candidateByToken(token: string): CandidateRow | null {
  return (getDb().prepare('SELECT * FROM candidates WHERE token = ?').get(token) as unknown as CandidateRow) ?? null;
}
