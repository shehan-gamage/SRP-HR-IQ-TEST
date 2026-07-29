import { BANDS, CUTOFF } from '@/lib/scoring';
import { DOMAINS, DomainCode, ITEMS, TOTAL_ITEMS } from '@/lib/questions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Scoring Guide' };

export default function Guide() {
  const codes = Object.keys(DOMAINS) as DomainCode[];

  return (
    <div className="wrap narrow">
      <h1>Scoring &amp; Interpretation Guide</h1>
      <p className="sub">Administration reference. Not visible to candidates.</p>

      <div className="card">
        <h2>Scoring</h2>
        <p>
          One point per correct answer, zero for incorrect, blank or unanswered.{' '}
          <b>No negative marking</b> — guessing is not penalised, which keeps risk tolerance from
          confounding ability. Maximum score {TOTAL_ITEMS}.
        </p>
        <table>
          <thead><tr><th>Domain</th><th className="right">Items</th></tr></thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c}>
                <td>{DOMAINS[c]}</td>
                <td className="right">{ITEMS.filter((i) => i.domain === c).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Interpretation Bands</h2>
        <table>
          <thead>
            <tr><th>Score</th><th>Tier</th><th>Recommendation</th></tr>
          </thead>
          <tbody>
            {BANDS.map((b, i) => {
              const upper = i === 0 ? TOTAL_ITEMS : BANDS[i - 1].min - 1;
              return (
                <tr key={b.slug}>
                  <td>{b.min}&ndash;{upper}</td>
                  <td><span className={`tier t-${b.slug}`}>{b.name}</span></td>
                  <td className="note">{b.recommendation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="note">
          Where two candidates tie, break the tie on the sub-domains most relevant to the role, not
          on completion speed.
        </p>
      </div>

      <div className="card">
        <h2>Cut-off</h2>
        <p>
          Shortlist threshold: <b>{CUTOFF} / {TOTAL_ITEMS}</b>. Treat 13&ndash;18 as a discretionary
          band — admit only where the hiring manager documents a reason. Below 13, do not advance.
        </p>
        <p className="note">
          Adjust to your applicant flow: raise to 22 if volume is high, lower to 16 for a thin pool
          or a junior-training role. Do not raise above 25 — item ceiling effects make
          discrimination unreliable there. The threshold lives in <span className="mono">src/lib/scoring.ts</span>;
          change it there and every screen follows.
        </p>
      </div>

      <div className="card">
        <h2>Administration</h2>
        <ol>
          <li>Three difficulty levels — <b>Basic</b>, <b>Advanced</b> and <b>Expert</b> — share the
            same structure: 30 items, five per domain, 30 minutes, scored on the same bands.
            Difficulty comes from the items alone. Choose the level when creating the invite;
            interpret scores against the level sat.</li>
          <li>Time limit is enforced by the server. A candidate who refreshes, changes their device
            clock, or reopens the link resumes with the same remaining time.</li>
          <li>Option order (A&ndash;D) is shuffled per sitting, so answer letters are not comparable
            between candidates and a shared answer string is worthless.</li>
          <li>One attempt per invite. The link stops working on submission.</li>
          <li>No calculators, phones or reference material. Rough paper is permitted.</li>
          <li>Candidates who declare a disability affecting reading or writing speed get 25% extra
            time — set the flag when creating the invite. Interpret against the same bands.</li>
          <li>Candidates receive their score, sub-domain profile and a question-level review on
            their receipt. The tier and hiring recommendation remain internal — communicate
            outcomes as a tier, not an &ldquo;IQ&rdquo; figure.</li>
        </ol>
      </div>
    </div>
  );
}
