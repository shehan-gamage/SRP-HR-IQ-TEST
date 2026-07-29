import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import SubmitButton from '@/components/SubmitButton';
import { createInvite, markInviteEmailed } from '@/lib/sitting';
import { mailConfigured, sendInviteEmail } from '@/lib/mail';
import { requireAdmin } from '@/lib/auth';
import { BANKS, LEVELS, Level } from '@/lib/questions';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'New Invite' };

async function create(formData: FormData) {
  'use server';
  await requireAdmin();
  const first = String(formData.get('first') ?? '').trim();
  const middle = String(formData.get('middle') ?? '').trim();
  const last = String(formData.get('last') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const sendNow = formData.get('sendNow') === 'on';
  const rawLevel = String(formData.get('level') ?? 'basic');
  const level: Level = (LEVELS as string[]).includes(rawLevel) ? (rawLevel as Level) : 'basic';
  if (!first || !last) redirect('/admin/new?e=1');
  if (sendNow && !email) redirect('/admin/new?e=2');

  const c = await createInvite({
    first,
    middle,
    last,
    level,
    position: String(formData.get('position') ?? ''),
    email,
    validDays: Number(formData.get('validDays') ?? 14),
  });

  let mail = '';
  if (sendNow && email) {
    // Build the link on the host HR is using, so LAN invites stay reachable.
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
    const proto = h.get('x-forwarded-proto') ?? 'http';
    const outcome = await sendInviteEmail(c, `${proto}://${host}/t/${c.token}`);
    if (outcome === 'sent') await markInviteEmailed(c.id);
    mail = `&mail=${outcome}`;
  }
  redirect(`/admin/c/${c.id}?new=1${mail}`);
}

export default async function NewInvite({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  return (
    <div className="wrap narrow">
      <h1>New Invite</h1>
      <p className="sub">Creates a single-use test link and emails it to the candidate.</p>

      <div className="card">
        <form action={create}>
          <div className="row" style={{ alignItems: 'flex-end' }}>
            <label className="fld" style={{ flex: '1 1 140px' }}>
              <span>First Name (Required)</span>
              <input type="text" name="first" autoFocus autoComplete="off" required />
            </label>
            <label className="fld" style={{ flex: '1 1 140px' }}>
              <span>Middle Name (Optional)</span>
              <input type="text" name="middle" autoComplete="off" />
            </label>
            <label className="fld" style={{ flex: '1 1 140px' }}>
              <span>Last Name (Required)</span>
              <input type="text" name="last" autoComplete="off" required />
            </label>
          </div>
          <label className="fld">
            <span>Position Applied For</span>
            <input type="text" name="position" autoComplete="off" />
          </label>
          <div style={{ margin: '.75rem 0' }}>
            <span style={{ display: 'block', fontSize: '.85rem', color: 'var(--muted)', marginBottom: '.25rem' }}>
              Assessment Difficulty
            </span>
            <div className="lvl-cards">
              {LEVELS.map((l) => (
                <label className="lvl-card" key={l}>
                  <input type="radio" name="level" value={l} defaultChecked={l === 'basic'} />
                  <span className={`lvl lvl-${l}`}>{BANKS[l].name}</span>
                  <span className="note">
                    {BANKS[l].items.length} items · {Math.round(BANKS[l].durationSec / 60)} minutes
                  </span>
                </label>
              ))}
            </div>
          </div>
          <label className="fld">
            <span>Candidate Email</span>
            <input type="email" name="email" autoComplete="off" />
          </label>
          <label className="fld">
            <span>Link Valid for (Days)</span>
            <input type="number" name="validDays" defaultValue={14} min={1} max={365} />
          </label>
          <label className="check">
            <input type="checkbox" name="sendNow" defaultChecked />
            <span>Email the Assessment Link to the Candidate Now</span>
          </label>
          {!mailConfigured ? (
            <p className="note">
              Email sending is not configured (set SMTP_USER / SMTP_PASS in .env.local).
              The invite will still be created; copy the link manually.
            </p>
          ) : null}
          {e === '1' ? <p className="err" role="alert">First and last name are required.</p> : null}
          {e === '2' ? (
            <p className="err" role="alert">An email address is required to send the invite.</p>
          ) : null}
          <div className="row" style={{ marginTop: '1rem' }}>
            <SubmitButton className="primary" pendingLabel="Creating Invite…">
              Create Invite
            </SubmitButton>
            <Link className="btn ghost" href="/admin">Cancel</Link>
          </div>
        </form>
      </div>

      <p className="note">
        The link works once: it opens the test, starts the clock on first open, and stops working
        after submission. Send it only to the candidate it names.
      </p>
    </div>
  );
}
