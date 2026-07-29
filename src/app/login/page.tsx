import { redirect } from 'next/navigation';
import { checkPassword, createSession, isAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'HR Sign In' };

async function login(formData: FormData) {
  'use server';
  const password = String(formData.get('password') ?? '');
  if (!checkPassword(password)) redirect('/login?e=1');
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
          {e ? <p className="err" role="alert">Incorrect password.</p> : null}
          <button className="primary" type="submit">Sign In</button>
        </form>
      </div>
      <p className="note">
        Candidates do not sign in. They receive a single-use link that carries their own token.
      </p>
    </main>
  );
}
