'use client';

import { useEffect, useState } from 'react';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';
import { fmt, toNum } from '@/lib/loan-calculations';

const STORAGE_KEY = 'qr-investor-admin-auth';

interface AdminSession {
  email: string;
  password: string;
}

interface AdminApplication {
  id: string;
  status: string;
  loan_program: string;
  deal_stage: string | null;
  borrower: { firstName?: string; lastName?: string; email?: string; phone?: string };
  entity: { borrowingAs?: string; entityName?: string };
  loan_request: { requestedLoanAmount?: string; transactionType?: string };
  calculations: Record<string, number | null>;
  guideline_warnings: string[] | null;
  missing_documents: string[] | null;
  ai_summary: string | null;
  additional_notes: string | null;
  submitted_at: string | null;
  created_at: string;
}

export default function InvestorHubAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<AdminSession | null>(null);
  const [authError, setAuthError] = useState('');
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminApplication | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AdminSession;
        if (parsed.email && parsed.password) {
          setSession(parsed);
          setEmail(parsed.email);
          setPassword(parsed.password);
        }
      }
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetch('/api/admin/investor-applications', {
      headers: {
        'x-admin-email': session.email,
        'x-admin-password': session.password,
      },
    })
      .then(res => {
        if (res.status === 401) {
          sessionStorage.removeItem(STORAGE_KEY);
          setSession(null);
          throw new Error('Session expired');
        }
        return res.json();
      })
      .then(json => setApplications(json.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const res = await fetch('/api/admin/investor-applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const nextSession = { email: email.trim(), password };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
    } else {
      const json = await res.json();
      setAuthError(json.error || 'Invalid email or password');
    }
  };

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#14213D', padding: '24px' }}>
        <form onSubmit={handleLogin} style={{ background: '#fff', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '400px' }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '22px', margin: '0 0 8px', color: 'var(--ink)' }}>QuestRock Ops</h1>
          <p style={{ fontSize: '13px', color: 'var(--slate)', marginBottom: '24px' }}>Investor Hub — staff access only</p>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email address"
            autoComplete="username"
            required
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: '4px', marginBottom: '12px', fontSize: '14px' }}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--line)', borderRadius: '4px', marginBottom: '12px', fontSize: '14px' }}
          />
          {authError && <p style={{ color: 'var(--clay)', fontSize: '13px', margin: '0 0 12px' }}>{authError}</p>}
          <button type="submit" style={{ width: '100%', padding: '12px', background: 'var(--ledger-green)', color: '#fff', border: 'none', borderRadius: '999px', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
            Sign In
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F7F5F0', display: 'flex' }}>
      {/* Sidebar list */}
      <aside style={{ width: '360px', borderRight: '1px solid var(--line)', background: '#fff', overflowY: 'auto', maxHeight: '100vh' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--line)' }}>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '18px', margin: '0 0 4px' }}>Investor Submissions</h1>
          <p style={{ fontSize: '12px', color: 'var(--slate)', margin: 0 }}>{applications.length} total · internal only</p>
        </div>
        {loading && <p style={{ padding: '20px', color: 'var(--slate)', fontSize: '13px' }}>Loading…</p>}
        {applications.map(app => {
          const name = `${app.borrower?.firstName || ''} ${app.borrower?.lastName || ''}`.trim() || 'Unknown';
          const program = PROGRAM_CONFIGS[app.loan_program as ProgramKey]?.shortLabel || app.loan_program;
          const warnings = app.guideline_warnings?.length || 0;
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => setSelected(app)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '16px 20px',
                border: 'none',
                borderBottom: '1px solid var(--paper-dim)',
                background: selected?.id === app.id ? 'var(--ledger-green-soft)' : '#fff',
                cursor: 'pointer',
              }}
            >
              <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', margin: '0 0 4px' }}>{name}</p>
              <p style={{ fontSize: '12px', color: 'var(--slate)', margin: '0 0 4px' }}>{program} · {app.status}</p>
              {warnings > 0 && (
                <span style={{ fontSize: '10px', padding: '2px 8px', background: 'var(--clay-soft)', color: 'var(--clay)', borderRadius: '2px', fontFamily: 'IBM Plex Mono, monospace' }}>
                  {warnings} guideline flag{warnings !== 1 ? 's' : ''}
                </span>
              )}
            </button>
          );
        })}
      </aside>

      {/* Detail panel */}
      <main style={{ flex: 1, padding: '32px', overflowY: 'auto', maxHeight: '100vh' }}>
        {!selected ? (
          <p style={{ color: 'var(--slate)', fontSize: '15px' }}>Select a submission to view details, guideline warnings, and AI summary.</p>
        ) : (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '26px', margin: '0 0 8px' }}>
                {selected.borrower?.firstName} {selected.borrower?.lastName}
              </h2>
              <p style={{ color: 'var(--slate)', margin: 0 }}>
                {selected.borrower?.email} · {selected.borrower?.phone}
              </p>
              <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate-light)', marginTop: '8px' }}>
                ID: {selected.id}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {[
                { label: 'Program', value: PROGRAM_CONFIGS[selected.loan_program as ProgramKey]?.label || selected.loan_program },
                { label: 'Status', value: selected.status },
                { label: 'Loan Amount', value: selected.loan_request?.requestedLoanAmount ? fmt(toNum(selected.loan_request.requestedLoanAmount)) : '—' },
                { label: 'Submitted', value: selected.submitted_at ? new Date(selected.submitted_at).toLocaleDateString() : 'Draft' },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '8px', padding: '14px' }}>
                  <p style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--slate-light)', margin: '0 0 4px', fontFamily: 'IBM Plex Mono, monospace' }}>{label}</p>
                  <p style={{ fontSize: '14px', fontWeight: 600, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {selected.guideline_warnings && selected.guideline_warnings.length > 0 && (
              <div style={{ background: 'var(--clay-soft)', border: '1px solid rgba(179,73,45,0.2)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clay)', margin: '0 0 12px', fontFamily: 'IBM Plex Mono, monospace' }}>Guideline Flags (Internal)</h3>
                {selected.guideline_warnings.map((w, i) => (
                  <p key={i} style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 8px', lineHeight: '1.5' }}>⚠ {w}</p>
                ))}
              </div>
            )}

            {selected.ai_summary && (
              <div style={{ background: 'var(--blue-soft)', border: '1px solid rgba(46,92,138,0.18)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--blue)', margin: '0 0 12px', fontFamily: 'IBM Plex Mono, monospace' }}>AI Summary</h3>
                <p style={{ fontSize: '14px', color: 'var(--ink-soft)', margin: 0, lineHeight: '1.65' }}>{selected.ai_summary}</p>
              </div>
            )}

            {selected.missing_documents && selected.missing_documents.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--slate)', margin: '0 0 12px', fontFamily: 'IBM Plex Mono, monospace' }}>Documents Not Yet Uploaded</h3>
                {selected.missing_documents.map((d, i) => (
                  <p key={i} style={{ fontSize: '13px', color: 'var(--ink-soft)', margin: '0 0 4px' }}>○ {d}</p>
                ))}
              </div>
            )}

            {selected.additional_notes && (
              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '12px', padding: '20px' }}>
                <h3 style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--slate)', margin: '0 0 12px', fontFamily: 'IBM Plex Mono, monospace' }}>Additional Notes</h3>
                <p style={{ fontSize: '14px', color: 'var(--ink-soft)', margin: 0, lineHeight: '1.65' }}>{selected.additional_notes}</p>
              </div>
            )}

            <div style={{ marginTop: '24px' }}>
              <a
                href={`/portfolio/${selected.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: 'var(--blue)', fontWeight: 500 }}
              >
                View customer portfolio page →
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
