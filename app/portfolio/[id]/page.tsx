'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PortfolioPortal } from '@/components/portal/PortfolioPortal';
import { FlowButton } from '@/components/ui/flow-button';

function PortfolioPageInner() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/investor-applications/${id}`, { credentials: 'same-origin' })
      .then(async res => {
        const json = await res.json();
        if (res.status === 401) {
          router.replace('/portal');
          return null;
        }
        return { res, json };
      })
      .then(result => {
        if (!result) return;
        const { res, json } = result;
        if (!res.ok) setError(json.error || 'Failed to load portfolio');
        else setData(json);
      })
      .catch(() => setError('Failed to load portfolio'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0' }}>
        <p style={{ color: 'var(--slate)', fontFamily: 'Inter, sans-serif' }}>Loading your portfolio…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0', padding: '40px' }}>
        <div style={{ textAlign: 'center', maxWidth: '480px' }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '24px', color: 'var(--ink)' }}>Portfolio Not Found</h1>
          <p style={{ color: 'var(--slate)', marginBottom: '24px' }}>{error || 'We could not find this application.'}</p>
          <FlowButton text="Investor Portal login" variant="green" size="md" onClick={() => { window.location.href = '/portal'; }} />
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `
        radial-gradient(900px 420px at 8% -8%, rgba(176,141,87,0.08), transparent 60%),
        radial-gradient(1100px 520px at 100% 0%, rgba(31,111,84,0.06), transparent 55%),
        #F7F5F0
      `,
      padding: '40px 24px',
    }}>
      <PortfolioPortal data={data as Parameters<typeof PortfolioPortal>[0]['data']} />
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0' }}>
        <p style={{ color: 'var(--slate)' }}>Loading…</p>
      </div>
    }>
      <PortfolioPageInner />
    </Suspense>
  );
}
