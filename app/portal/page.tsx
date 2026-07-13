'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';
import { FlowButton } from '@/components/ui/flow-button';
import { createClient } from '@/lib/supabase/client';

type AppSummary = {
  id: string;
  status: string;
  loanProgram: string | null;
  submittedAt: string | null;
  borrowerName: string;
  requestedLoanAmount: string | null;
};

function PortalDashboardInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [inputEmail, setInputEmail] = useState('');
  const [apps, setApps] = useState<AppSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingLink, setSendingLink] = useState(false);
  const [error, setError] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [noApps, setNoApps] = useState(false);

  const loadApps = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/portal/applications', { credentials: 'same-origin' });
      if (res.status === 401) {
        setEmail('');
        setApps([]);
        return;
      }
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setApps(json.applications || []);
      setEmail(json.email || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load applications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const authError = searchParams.get('error');
    if (authError) setError(decodeURIComponent(authError));
    if (searchParams.get('checkEmail') === '1') setLinkSent(true);

    void (async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email) {
        setEmail(session.user.email);
      }
      await loadApps();
    })();
  }, [searchParams, loadApps]);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    const em = inputEmail.trim();
    if (!em) return;

    setSendingLink(true);
    setError('');
    setLinkSent(false);
    setNoApps(false);

    try {
      const res = await fetch('/api/portal/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not send link');

      if (json.reason === 'no_applications') {
        setNoApps(true);
        return;
      }

      setLinkSent(true);
      setInputEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send sign-in link');
    } finally {
      setSendingLink(false);
    }
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setEmail('');
    setApps([]);
    setInputEmail('');
    setLinkSent(false);
    setNoApps(false);
  }

  if (!email && !loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ maxWidth: '420px', width: '100%', background: '#fff', border: '1px solid var(--line)', borderRadius: '20px', padding: '36px' }}>
          <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--slate-light)', fontFamily: 'IBM Plex Mono, monospace' }}>Investor Portal</p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '26px', margin: '8px 0 12px' }}>Sign in securely</h1>
          <p style={{ fontSize: '14px', color: 'var(--slate)', marginBottom: '24px' }}>
            We&apos;ll email you a one-time sign-in link. Use the same email from your QuestRock investor application.
          </p>

          {linkSent ? (
            <div style={{ background: 'rgba(31,111,84,0.08)', border: '1px solid rgba(31,111,84,0.2)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--ink)' }}>
                Check your inbox for the sign-in link. It expires shortly — open it on this device.
              </p>
            </div>
          ) : null}

          {noApps ? (
            <div style={{ background: 'var(--paper-dim)', borderRadius: '12px', padding: '16px', marginBottom: '16px' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--slate)' }}>
                No submitted applications found for that email yet.
              </p>
            </div>
          ) : null}

          <form onSubmit={handleMagicLink}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Work email</label>
            <input
              type="email"
              required
              value={inputEmail}
              onChange={e => setInputEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}
            />
            {error && <p style={{ color: 'var(--clay)', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}
            <button type="submit" disabled={sendingLink} style={{ width: '100%', padding: '12px', background: 'var(--ledger-green)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
              {sendingLink ? 'Sending link…' : 'Email me a sign-in link'}
            </button>
          </form>
          <p style={{ marginTop: '20px', fontSize: '13px', textAlign: 'center' }}>
            <Link href="/investor-hub" style={{ color: 'var(--ledger-green)' }}>← Back to Investor Hub</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F0', padding: '40px 24px' }}>
      <div style={{ maxWidth: '720px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--slate-light)', fontFamily: 'IBM Plex Mono, monospace' }}>Investor Portal</p>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '28px', margin: '8px 0 4px' }}>Your applications</h1>
            <p style={{ color: 'var(--slate)', margin: 0, fontSize: '14px' }}>{email}</p>
          </div>
          <button type="button" onClick={signOut} style={{ background: 'none', border: 'none', color: 'var(--slate)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}>
            Sign out
          </button>
        </div>

        {loading && <p style={{ color: 'var(--slate)' }}>Loading…</p>}
        {error && <p style={{ color: 'var(--clay)' }}>{error}</p>}

        {!loading && apps.length === 0 && (
          <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <p style={{ color: 'var(--slate)', marginBottom: '16px' }}>No applications found for this account yet.</p>
            <FlowButton text="Start an application" variant="green" size="md" onClick={() => { window.location.href = '/investor-hub/apply'; }} />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {apps.map(app => {
            const programLabel = app.loanProgram
              ? (PROGRAM_CONFIGS[app.loanProgram as ProgramKey]?.label || app.loanProgram)
              : 'Investor loan';
            return (
              <Link
                key={app.id}
                href={`/portfolio/${app.id}`}
                style={{
                  display: 'block', background: '#fff', border: '1px solid var(--line)', borderRadius: '14px',
                  padding: '20px', textDecoration: 'none', color: 'inherit',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: '16px' }}>{programLabel}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--slate)' }}>
                      {app.borrowerName} · Status: {app.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                  <span style={{ fontSize: '13px', color: 'var(--ledger-green)', fontWeight: 600 }}>Open portfolio →</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div style={{ marginTop: '28px' }}>
          <FlowButton text="New application" variant="green" size="md" onClick={() => { window.location.href = '/investor-hub/apply'; }} />
        </div>
      </div>
    </div>
  );
}

export default function PortalDashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F7F5F0' }}>
        <p style={{ color: 'var(--slate)' }}>Loading…</p>
      </div>
    }>
      <PortalDashboardInner />
    </Suspense>
  );
}
