import Link from 'next/link';
import { redirect } from 'next/navigation';
import { destroySession, requireAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function logout() {
  'use server';
  await destroySession();
  redirect('/login');
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <nav className="top noprint">
        <div>
          <span className="brand">Aptitude Assessment</span>
        </div>
        <div className="row">
          <Link href="/admin">Candidates</Link>
          <Link href="/admin/new">New Invite</Link>
          <Link href="/admin/guide">Scoring Guide</Link>
          <form action={logout}>
            <button className="ghost btn-sm" type="submit">
              Sign Out
            </button>
          </form>
        </div>
      </nav>
      <main>{children}</main>
    </>
  );
}
