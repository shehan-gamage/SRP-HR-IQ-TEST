'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import SubmittedScreen from './SubmittedScreen';

/**
 * Candidate test runtime. Holds no answer key: options arrive pre-shuffled
 * from the server and answers go back as display positions. The countdown here
 * is a courtesy display — the server owns the real deadline and re-derives
 * remaining time on every start, save and submit.
 */

interface PublicItem {
  id: number;
  domainLabel: string;
  stem: string;
  options: string[];
}

interface Payload {
  name: string;
  ref: string;
  position: string;
  items: PublicItem[];
  answers: Record<number, number | null>;
  remainingSec: number;
  durationSec: number;
}

type Phase = 'intro' | 'loading' | 'testing' | 'done' | 'error';

const AUTOSAVE_MS = 10_000;

export default function TestRunner({
  token,
  firstName,
  durationSec,
  extraTime,
  resume,
}: {
  token: string;
  /** Salutations address the candidate by first name only; the in-test header shows the full name. */
  firstName: string;
  durationSec: number;
  extraTime: boolean;
  resume: boolean;
}) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [payload, setPayload] = useState<Payload | null>(null);
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [left, setLeft] = useState(durationSec);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLeftRef = useRef<number | null>(null);

  const post = useCallback(
    (path: string, body: unknown) =>
      fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      }),
    [],
  );

  const submit = useCallback(
    async (mode: 'candidate' | 'timeout') => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setSubmitting(true);
      try {
        await post('/api/sitting/submit', { token, answers: answersRef.current, mode });
      } catch {
        /* the server closes the sitting on its own sweep if this never lands */
      }
      setPhase('done');
    },
    [post, token],
  );

  async function begin() {
    setPhase('loading');
    try {
      const res = await post('/api/sitting/start', { token });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          j.error === 'already_submitted'
            ? 'This test has already been completed.'
            : j.error === 'expired'
              ? 'This invitation has expired. Contact the recruiter who sent it.'
              : 'This link is not valid.',
        );
        setPhase('error');
        return;
      }
      const p = (await res.json()) as Payload;
      setPayload(p);
      setAnswers(p.answers);
      setLeft(p.remainingSec);
      setPhase('testing');
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
      setPhase('error');
    }
  }

  // Countdown. Auto-submits at zero; the server rejects anything later anyway.
  useEffect(() => {
    if (phase !== 'testing') return;
    const id = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          void submit('timeout');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, submit]);

  // Time-remaining toasts at 15, 5 and 1 minute. Crossing detection (prev
  // above the mark, now at or below) stays correct when a throttled timer
  // skips seconds, and stays quiet when a resumed sitting starts below a mark.
  useEffect(() => {
    if (phase !== 'testing') {
      prevLeftRef.current = null;
      return;
    }
    const prev = prevLeftRef.current;
    prevLeftRef.current = left;
    if (prev === null) return;
    const marks: [number, string][] = [
      [900, '15 minutes remaining.'],
      [300, '5 minutes remaining.'],
      [60, '1 minute remaining — the test submits automatically at zero.'],
    ];
    for (const [mark, msg] of marks) {
      if (prev > mark && left <= mark) {
        setToast(msg);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToast(''), 6000);
      }
    }
  }, [left, phase]);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Periodic autosave so a crash or a closed tab loses at most a few answers.
  useEffect(() => {
    if (phase !== 'testing') return;
    const id = setInterval(() => {
      void post('/api/sitting/save', { token, answers: answersRef.current });
    }, AUTOSAVE_MS);
    return () => clearInterval(id);
  }, [phase, post, token]);

  // Warn before navigating away mid-test.
  useEffect(() => {
    if (phase !== 'testing') return;
    const h = (e: BeforeUnloadEvent) => {
      void post('/api/sitting/save', { token, answers: answersRef.current });
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [phase, post, token]);

  function pick(itemId: number, pos: number) {
    setAnswers((a) => ({ ...a, [itemId]: pos }));
    setMissing((m) => m.filter((x) => x !== itemId));
  }

  function onSubmitClick() {
    if (!payload) return;
    const blanks = payload.items.filter((i) => answers[i.id] === null || answers[i.id] === undefined);
    if (blanks.length) {
      setMissing(blanks.map((b) => b.id));
      const ok = window.confirm(
        `${blanks.length} question(s) are unanswered. Unanswered items score zero and there is no penalty for guessing. Submit anyway?`,
      );
      if (!ok) {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document
          .getElementById(`q-${blanks[0].id}`)
          ?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
        return;
      }
    } else if (!window.confirm('Submit the test? Answers cannot be changed after this.')) {
      return;
    }
    void submit('candidate');
  }

  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const clockCls = left <= 60 ? 'clock crit' : left <= 300 ? 'clock warn' : 'clock';
  const answered = payload
    ? payload.items.filter((i) => answers[i.id] !== null && answers[i.id] !== undefined).length
    : 0;

  if (phase === 'error') {
    return (
      <main className="wrap narrow">
        <h1>Test Unavailable</h1>
        <div className="card"><p style={{ margin: 0 }}>{error}</p></div>
      </main>
    );
  }

  if (phase === 'done') return <SubmittedScreen token={token} firstName={firstName} />;

  if (phase === 'intro' || phase === 'loading') {
    const mins = Math.round(durationSec / 60);
    return (
      <main className="wrap narrow">
        <h1>Cognitive Aptitude Assessment</h1>
        <p className="sub">30 questions &middot; {mins} minutes &middot; single attempt</p>

        <div className="card">
          <h2>Before You Begin, {firstName}</h2>
          <ol>
            <li>This test contains <b>30 multiple-choice questions</b>.</li>
            <li>
              You have <b>{mins} minutes</b> in total.
              {extraTime ? ' This includes the 25% extra time granted to you.' : ''}
            </li>
            <li>
              The timer starts when you press <b>Begin</b> and <b>cannot be paused</b>. It keeps
              running even if you close the page, so do not begin until you are ready.
            </li>
            <li>Each question has four options (A&ndash;D). Exactly one is correct.</li>
            <li><b>No calculators, phones, notes or reference material.</b> Rough paper is permitted.</li>
            <li>
              <b>No penalty for a wrong answer.</b> If unsure, choose your best option rather than
              leaving it blank.
            </li>
            <li>Questions get progressively harder. Skip and return later if one delays you.</li>
            <li><b>One attempt only.</b> The test submits automatically when time expires.</li>
            <li>Work alone. Do not copy, photograph or share the questions.</li>
          </ol>
          {resume ? (
            <div className="banner warn">
              You already started this test. Pressing Begin resumes it with the time that remains.
            </div>
          ) : null}
          <button className="primary" onClick={begin} disabled={phase === 'loading'}>
            {phase === 'loading' ? 'Loading…' : resume ? 'Resume Test' : 'Begin Test'}
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <div id="bar">
        <div>
          <b>{payload!.name}</b>
          {payload!.ref ? <span className="note"> {payload!.ref}</span> : null}
        </div>
        <div className="note">{answered} of {payload!.items.length} answered</div>
        <div className={clockCls}>{mm}:{ss}</div>
        <div
          className="progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={payload!.items.length}
          aria-valuenow={answered}
          aria-label="Questions Answered"
        >
          <div
            className="progress-fill"
            style={{ transform: `scaleX(${answered / payload!.items.length})` }}
          />
        </div>
      </div>

      <main className="wrap narrow">
        {/* Always-mounted live region so time-remaining toasts are announced. */}
        <div className="toast-region" role="status" aria-live="assertive">
          {toast ? <div className="toast">{toast}</div> : null}
        </div>

        {payload!.items.map((item, idx) => (
          <div
            key={item.id}
            id={`q-${item.id}`}
            className={`q${missing.includes(item.id) ? ' unanswered' : ''}`}
          >
            <div className="qhead">
              <span className="qnum">{idx + 1}.</span>
              <span className="tag">{item.domainLabel}</span>
            </div>
            <p className="stem" id={`stem-${item.id}`}>{item.stem}</p>
            <fieldset className="opts" aria-labelledby={`stem-${item.id}`}>
              <legend className="sr-only">Question {idx + 1} Options</legend>
              {item.options.map((opt, pos) => (
                <label className="opt" key={pos}>
                  <input
                    type="radio"
                    name={`q-${item.id}`}
                    checked={answers[item.id] === pos}
                    onChange={() => pick(item.id, pos)}
                  />
                  <span className="ltr" aria-hidden="true">{'ABCD'[pos]}</span>
                  <span>{opt}</span>
                </label>
              ))}
            </fieldset>
          </div>
        ))}

        <div className="card">
          <p className="note">
            You may submit early. Once submitted, answers cannot be changed.
          </p>
          <button className="primary" onClick={onSubmitClick} disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Test'}
          </button>
        </div>
      </main>
    </>
  );
}
