/**
 * Confirmation shown after a sitting closes — reached both straight after the
 * candidate submits and when they revisit a spent link.
 *
 * No score, tier or item feedback on this screen. The receipt PDF carries the
 * final score, the sub-domain profile and a question-level review; the tier
 * and hiring recommendation remain HR-only.
 */
export default function SubmittedScreen({
  token,
  firstName,
  revisit = false,
}: {
  token: string;
  firstName?: string;
  revisit?: boolean;
}) {
  return (
    <main className="success-wrap">
      <div className="success-card">
        <div className="success-mark" aria-hidden="true">
          <svg viewBox="0 0 52 52" role="presentation">
            <path d="M14 27.5 L22 35.5 L38 18" />
          </svg>
        </div>

        <h1>Submission Successful</h1>

        <p>
          {firstName ? `Thank you, ${firstName}. ` : 'Thank you. '}
          {revisit
            ? 'This assessment has already been submitted and your responses are on record.'
            : 'Your responses have been received and recorded.'}
        </p>
        <p>
          Your final score and a question-by-question review are included in your receipt. The
          recruitment team will contact you about the next step.
        </p>

        <div className="actions">
          <a className="btn primary" href={`/t/${token}/receipt`} download>
            Download Receipt (PDF)
          </a>
        </div>

        <p className="note" style={{ marginTop: '1.25rem', marginBottom: 0 }}>
          The receipt confirms your submission and shows your final score, sub-domain profile and
          per-question review. You may now close this window.
        </p>
      </div>
    </main>
  );
}
