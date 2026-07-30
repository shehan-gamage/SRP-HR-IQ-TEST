import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { getDb, CandidateRow, candidateByToken, statusOf } from './db';
import { DOMAINS, EXTRA_TIME_MULTIPLIER, Item, Level, bankFor } from './questions';
import { score as computeScore, Result } from './scoring';

/**
 * Sitting lifecycle and the boundary that keeps the answer key server-side.
 *
 * The clock is authoritative here, not in the browser: `started_at` and
 * `duration_sec` are written when the candidate first opens the test, and
 * every save and the final submit are checked against that deadline. A
 * candidate who edits their client clock, refreshes, or reopens the link on
 * another device gets the same remaining time.
 */

/** Tolerance for network lag and browser auto-submit firing a moment late. */
export const GRACE_SEC = 60;

export interface PublicItem {
  id: number;
  domainLabel: string;
  stem: string;
  /** Options already permuted for this sitting. Index = display position. */
  options: string[];
}

export interface SittingPayload {
  name: string;
  ref: string;
  position: string;
  items: PublicItem[];
  /** Display position per item id, or null where unanswered. */
  answers: Record<number, number | null>;
  remainingSec: number;
  durationSec: number;
}

function shuffled4(): number[] {
  const a = [0, 1, 2, 3];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** display[itemId] = array where element at display position holds canonical index. */
function newDisplayOrder(items: Item[]): Record<number, number[]> {
  const map: Record<number, number[]> = {};
  for (const item of items) map[item.id] = shuffled4();
  return map;
}

export function parseDisplay(c: CandidateRow, items: Item[]): Record<number, number[]> {
  if (!c.display_order) return Object.fromEntries(items.map((i) => [i.id, [0, 1, 2, 3]]));
  return JSON.parse(c.display_order) as Record<number, number[]>;
}

/** Stored answers are canonical option indexes, so scoring survives a reshuffle. */
export function parseAnswers(c: CandidateRow): Record<number, number | null> {
  return JSON.parse(c.answers || '{}') as Record<number, number | null>;
}

export function deadlineOf(c: CandidateRow): number | null {
  return c.started_at ? c.started_at + c.duration_sec * 1000 : null;
}

export function remainingSec(c: CandidateRow, now = Date.now()): number {
  const dl = deadlineOf(c);
  if (dl === null) return c.duration_sec;
  return Math.max(0, Math.round((dl - now) / 1000));
}

export interface NewInvite {
  first: string;
  middle?: string;
  last: string;
  /** Difficulty level; defaults to 'basic'. Sets the item bank and time limit. */
  level?: Level;
  /** SRP group company the candidate is applying to. */
  company?: string;
  position?: string;
  email?: string;
  /**
   * Optional free-text application reference. No longer collected by the
   * invite form; retained so existing records keep rendering and so it can be
   * reinstated without a schema change.
   */
  ref?: string;
  /**
   * 25% extra time as a reasonable adjustment. No longer exposed in the invite
   * form. Still honoured if set — re-add a checkbox to /admin/new to use it.
   */
  extraTime?: boolean;
  validDays?: number;
}

export async function createInvite(input: NewInvite): Promise<CandidateRow> {
  const now = Date.now();
  const validDays = input.validDays && input.validDays > 0 ? input.validDays : 14;
  const bank = bankFor(input.level);
  const duration = Math.round(
    bank.durationSec * (input.extraTime ? EXTRA_TIME_MULTIPLIER : 1),
  );
  const first = input.first.trim();
  const middle = (input.middle ?? '').trim();
  const last = input.last.trim();
  const row = {
    id: randomUUID(),
    token: randomBytes(24).toString('base64url'),
    name: [first, middle, last].filter(Boolean).join(' '),
    first_name: first,
    middle_name: middle,
    last_name: last,
    level: bank.level,
    company: (input.company ?? '').trim(),
    ref: (input.ref ?? '').trim(),
    position: (input.position ?? '').trim(),
    email: (input.email ?? '').trim(),
    extra_time: input.extraTime ? 1 : 0,
    duration_sec: duration,
    created_at: now,
    expires_at: now + validDays * 86_400_000,
  };
  const db = await getDb();
  await db.execute({
    sql: `INSERT INTO candidates
       (id, token, name, first_name, middle_name, last_name, level, company, ref, position, email,
        extra_time, duration_sec, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      row.id, row.token, row.name, row.first_name, row.middle_name, row.last_name,
      row.level, row.company, row.ref, row.position, row.email,
      row.extra_time, row.duration_sec, row.created_at, row.expires_at,
    ],
  });
  return (await candidateByToken(row.token))!;
}

export async function deleteCandidate(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({ sql: 'DELETE FROM candidates WHERE id = ?', args: [id] });
}

export async function markInviteEmailed(id: string): Promise<void> {
  const db = await getDb();
  await db.execute({
    sql: 'UPDATE candidates SET invite_emailed_at = ? WHERE id = ?',
    args: [Date.now(), id],
  });
}

export type PeekState = 'not_found' | 'expired' | 'submitted' | 'pending' | 'in_progress';

export interface Peek {
  state: PeekState;
  name?: string;
  /** For salutations. Falls back to the first word for pre-split records. */
  firstName?: string;
  durationSec?: number;
  extraTime?: boolean;
}

/**
 * Read-only view for the landing page. Deliberately does NOT start the clock:
 * merely opening the link (or a browser prefetching it) must not consume the
 * candidate's time. Only the explicit Begin action calls `openSitting`.
 */
export async function peek(token: string): Promise<Peek> {
  const c = await candidateByToken(token);
  if (!c) return { state: 'not_found' };
  const common = {
    name: c.name,
    firstName: c.first_name || c.name.split(/\s+/)[0],
    durationSec: c.duration_sec,
    extraTime: c.extra_time === 1,
  };
  if (c.submitted_at) return { state: 'submitted', ...common };
  if (c.started_at) {
    if (Date.now() > deadlineOf(c)! + GRACE_SEC * 1000) return { state: 'submitted', ...common };
    return { state: 'in_progress', ...common };
  }
  if (c.expires_at < Date.now()) return { state: 'expired', ...common };
  return { state: 'pending', ...common };
}

export type OpenError = 'not_found' | 'expired' | 'already_submitted';

/**
 * Opens (or resumes) a sitting. First call stamps `started_at` and freezes the
 * option shuffle, so a refresh cannot reroll the paper or the clock.
 */
export async function openSitting(
  token: string,
): Promise<{ payload: SittingPayload } | { error: OpenError }> {
  const c = await candidateByToken(token);
  if (!c) return { error: 'not_found' };
  if (c.submitted_at) return { error: 'already_submitted' };

  const bank = bankFor(c.level);
  const now = Date.now();
  if (!c.started_at && c.expires_at < now) return { error: 'expired' };

  let row = c;
  if (!row.started_at) {
    const display = JSON.stringify(newDisplayOrder(bank.items));
    const db = await getDb();
    await db.execute({
      sql: 'UPDATE candidates SET started_at = ?, display_order = ? WHERE id = ?',
      args: [now, display, row.id],
    });
    row = (await candidateByToken(token))!;
  }

  // Time already gone: close it out rather than serving a dead paper.
  if (remainingSec(row, now) <= 0) {
    await submitSitting(token, 'timeout');
    return { error: 'already_submitted' };
  }

  const display = parseDisplay(row, bank.items);
  const answers = parseAnswers(row);

  const items: PublicItem[] = bank.items.map((item) => {
    const order = display[item.id];
    return {
      id: item.id,
      domainLabel: DOMAINS[item.domain],
      stem: item.stem,
      options: order.map((canonical) => item.options[canonical]),
    };
  });

  // Convert stored canonical answers back to display positions for the UI.
  const displayAnswers: Record<number, number | null> = {};
  for (const item of bank.items) {
    const canonical = answers[item.id];
    displayAnswers[item.id] =
      canonical === null || canonical === undefined ? null : display[item.id].indexOf(canonical);
  }

  return {
    payload: {
      name: row.name,
      ref: row.ref,
      position: row.position,
      items,
      answers: displayAnswers,
      remainingSec: remainingSec(row, now),
      durationSec: row.duration_sec,
    },
  };
}

/** Accepts display positions; stores canonical indexes. */
export async function saveAnswers(
  token: string,
  displayAnswers: Record<string, number | null>,
): Promise<boolean> {
  const c = await candidateByToken(token);
  if (!c || c.submitted_at || !c.started_at) return false;
  if (remainingSec(c) <= 0 && Date.now() > (deadlineOf(c)! + GRACE_SEC * 1000)) return false;

  const items = bankFor(c.level).items;
  const display = parseDisplay(c, items);
  const canonical: Record<number, number | null> = {};
  for (const item of items) {
    const pos = displayAnswers[String(item.id)];
    canonical[item.id] =
      pos === null || pos === undefined || pos < 0 || pos > 3 ? null : display[item.id][pos];
  }
  const db = await getDb();
  await db.execute({
    sql: 'UPDATE candidates SET answers = ? WHERE id = ?',
    args: [JSON.stringify(canonical), c.id],
  });
  return true;
}

export type SubmitMode = 'candidate' | 'timeout' | 'admin';

export async function submitSitting(token: string, mode: SubmitMode): Promise<Result | null> {
  const c = await candidateByToken(token);
  if (!c || c.submitted_at) return null;

  const items = bankFor(c.level).items;
  const answers = parseAnswers(c);
  const display = parseDisplay(c, items);
  const result = computeScore(answers, display, items);

  const db = await getDb();
  await db.execute({
    sql: 'UPDATE candidates SET submitted_at = ?, score = ?, band = ?, submit_mode = ? WHERE id = ?',
    args: [Date.now(), result.score, result.band.slug, mode, c.id],
  });

  return result;
}

/**
 * Close out sittings whose clock ran out while nobody was watching — a
 * candidate who closed the tab would otherwise sit at "in progress" forever.
 * Cheap enough to call on every dashboard load.
 */
export async function sweepExpired(): Promise<number> {
  const now = Date.now();
  const db = await getDb();
  const rs = await db.execute(
    'SELECT * FROM candidates WHERE submitted_at IS NULL AND started_at IS NOT NULL',
  );
  const open = rs.rows as unknown as CandidateRow[];
  let closed = 0;
  for (const c of open) {
    if (now > deadlineOf(c)! + GRACE_SEC * 1000) {
      await submitSitting(c.token, 'timeout');
      closed++;
    }
  }
  return closed;
}

export function resultFor(c: CandidateRow): Result {
  const items = bankFor(c.level).items;
  return computeScore(parseAnswers(c), parseDisplay(c, items), items);
}

export { statusOf };
