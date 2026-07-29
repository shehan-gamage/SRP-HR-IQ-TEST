import { DOMAINS, DomainCode, Item } from './questions';

export interface Band {
  min: number;
  name: string;
  slug: 'strong' | 'suitable' | 'borderline' | 'not-recommended';
  recommendation: string;
}

/**
 * Rational cut-offs, not empirical norms. Re-norm against your own applicant
 * distribution once ~50 candidates have sat the test (see README).
 */
export const BANDS: Band[] = [
  {
    min: 25, name: 'Strong', slug: 'strong',
    recommendation:
      'High general reasoning ability. Advance to interview; suitable for analytical or fast-ramp roles.',
  },
  {
    min: 19, name: 'Suitable', slug: 'suitable',
    recommendation: 'Solid reasoning ability at the required standard. Advance to interview.',
  },
  {
    min: 13, name: 'Borderline', slug: 'borderline',
    recommendation:
      'Meets some requirements. Advance only if other evidence (experience, technical test, referees) is strong, and record the reason.',
  },
  {
    min: 0, name: 'Not Recommended', slug: 'not-recommended',
    recommendation: 'Below the standard required for this role on this measure.',
  },
];

/** Shortlist threshold. Change here and every screen follows. */
export const CUTOFF = 19;

export function bandFor(score: number): Band {
  return BANDS.find((b) => score >= b.min)!;
}

export interface DomainScore {
  code: DomainCode;
  label: string;
  correct: number;
  total: number;
  pct: number;
}

export interface ScoredItem {
  itemId: number;
  domain: DomainCode;
  /** Canonical index the candidate chose, or null if left blank. */
  given: number | null;
  /** Letter as the candidate saw it, accounting for the shuffle. */
  givenLetter: string;
  correctLetter: string;
  correct: boolean;
}

export interface Result {
  score: number;
  total: number;
  pct: number;
  band: Band;
  meetsCutoff: boolean;
  domains: DomainScore[];
  items: ScoredItem[];
}

/**
 * @param answers   canonical option index per item id (null = unanswered)
 * @param display   per-item display order: display[itemId][displayPos] = canonical index
 * @param bankItems the item bank the candidate sat (differs per difficulty level)
 */
export function score(
  answers: Record<number, number | null>,
  display: Record<number, number[]>,
  bankItems: Item[],
): Result {
  const items: ScoredItem[] = bankItems.map((item) => {
    const given = answers[item.id] ?? null;
    const order = display[item.id] ?? [0, 1, 2, 3];
    const letterOf = (canonical: number) => {
      const pos = order.indexOf(canonical);
      return pos === -1 ? '?' : 'ABCD'[pos];
    };
    return {
      itemId: item.id,
      domain: item.domain,
      given,
      givenLetter: given === null ? '—' : letterOf(given),
      correctLetter: letterOf(item.answer),
      correct: given === item.answer,
    };
  });

  const raw = items.filter((i) => i.correct).length;
  const total = bankItems.length;

  const domains: DomainScore[] = (Object.keys(DOMAINS) as DomainCode[]).map((code) => {
    const inDomain = items.filter((i) => i.domain === code);
    const correct = inDomain.filter((i) => i.correct).length;
    return {
      code,
      label: DOMAINS[code],
      correct,
      total: inDomain.length,
      pct: inDomain.length ? Math.round((correct / inDomain.length) * 100) : 0,
    };
  });

  return {
    score: raw,
    total,
    pct: Math.round((raw / total) * 100),
    band: bandFor(raw),
    meetsCutoff: raw >= CUTOFF,
    domains,
    items,
  };
}
