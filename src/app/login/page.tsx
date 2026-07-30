import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  checkPassword,
  clearLoginFailures,
  createSession,
  isAuthed,
  loginThrottled,
  recordLoginFailure,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'HR Sign In' };

async function login(formData: FormData) {
  'use server';
  const h = await headers();
  const ip = (h.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim();
  if (loginThrottled(ip)) redirect('/login?e=2');

  const password = String(formData.get('password') ?? '');
  if (!checkPassword(password)) {
    recordLoginFailure(ip);
    redirect(loginThrottled(ip) ? '/login?e=2' : '/login?e=1');
  }
  clearLoginFailures(ip);
  await createSession();
  redirect('/admin');
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (await isAuthed()) redirect('/admin');
  const { e } = await searchParams;

  return (
    <main className="wrap narrow" style={{ paddingTop: '5rem' }}>
      <h1>HR Sign In</h1>
      <p className="sub">Cognitive Aptitude Assessment &mdash; administration</p>
      <div className="card">
        <form action={login}>
          <label className="fld">
            <span>Password</span>
            <input type="password" name="password" autoFocus autoComplete="current-password" required />
          </label>
          {e === '1' ? <p className="err" role="alert">Incorrect password.</p> : null}
          {e === '2' ? (
            <p className="err" role="alert">
              Too many failed attempts. Wait 15 minutes and try again.
            </p>
          ) : null}
          <button className="primary" type="submit">Sign In</button>
        </form>
      </div>
      <p className="note">
        Candidates do not sign in. They receive a single-use link that carries their own token.
      </p>
    </main>
  );
}
