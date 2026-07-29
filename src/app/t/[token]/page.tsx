import { peek } from '@/lib/sitting';
import TestRunner from '@/components/TestRunner';
import SubmittedScreen from '@/components/SubmittedScreen';

export const dynamic = 'force-dynamic';

export default async function TestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const p = await peek(token);

  if (p.state === 'not_found') {
    return (
      <main className="wrap narrow">
        <h1>Link Not Valid</h1>
        <div className="card">
          <p style={{ margin: 0 }}>
            This test link is not recognised. Check that you copied the whole link from your
            invitation email, or contact the recruiter who sent it.
          </p>
        </div>
      </main>
    );
  }

  if (p.state === 'expired') {
    return (
      <main className="wrap narrow">
        <h1>Invitation Expired</h1>
        <div className="card">
          <p style={{ margin: 0 }}>
            This invitation is no longer valid. Contact the recruiter who sent it if you still wish
            to sit the assessment.
          </p>
        </div>
      </main>
    );
  }

  if (p.state === 'submitted') {
    return <SubmittedScreen token={token} firstName={p.firstName} revisit />;
  }

  return (
    <TestRunner
      token={token}
      firstName={p.firstName!}
      durationSec={p.durationSec!}
      extraTime={Boolean(p.extraTime)}
      resume={p.state === 'in_progress'}
    />
  );
}
