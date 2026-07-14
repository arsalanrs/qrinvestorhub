'use client';

import { useEffect, useMemo, useState } from 'react';
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
  shape_lead_id?: string | null;
  archived?: boolean;
  archived_at?: string | null;
  property_city?: string;
  property_state?: string;
}

interface ShapeLoOption {
  name: string;
  depursLo: number;
}

function borrowerName(app: AdminApplication) {
  return `${app.borrower?.firstName || ''} ${app.borrower?.lastName || ''}`.trim() || 'Unknown';
}

function programLabel(key: string) {
  return PROGRAM_CONFIGS[key as ProgramKey]?.shortLabel || key;
}

function statusTone(status: string) {
  const s = status.toLowerCase();
  if (s.includes('submit') || s === 'complete') return { bg: '#ecfdf5', color: '#0f766e' };
  if (s.includes('draft')) return { bg: '#f1f5f9', color: '#64748b' };
  return { bg: '#eff6ff', color: '#1d4ed8' };
}

export default function InvestorHubAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState<AdminSession | null>(null);
  const [authError, setAuthError] = useState('');
  const [applications, setApplications] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<AdminApplication | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('');
  const [daysFilter, setDaysFilter] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [shapeRoster, setShapeRoster] = useState<ShapeLoOption[]>([]);
  const [assignLo, setAssignLo] = useState('');
  const [actionBusy, setActionBusy] = useState('');
  const [actionMessage, setActionMessage] = useState('');

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

  const loadApplications = (activeSession: AdminSession) => {
    setLoading(true);
    const qs = showArchived ? '?includeArchived=1' : '';
    fetch(`/api/admin/investor-applications${qs}`, {
      headers: {
        'x-admin-email': activeSession.email,
        'x-admin-password': activeSession.password,
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
      .then(json => {
        const apps = json.applications || [];
        setApplications(apps);
        setSelected(prev => (prev ? apps.find((a: AdminApplication) => a.id === prev.id) || null : null));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (session) loadApplications(session);
  }, [session, showArchived]);

  useEffect(() => {
    fetch('/api/admin/shape-roster')
      .then(res => res.json())
      .then(json => setShapeRoster(json.roster || []))
      .catch(() => {});
  }, []);

  const adminFetch = async (activeSession: AdminSession, path: string, init?: RequestInit) => {
    const res = await fetch(path, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        'x-admin-email': activeSession.email,
        'x-admin-password': activeSession.password,
        'Content-Type': 'application/json',
      },
    });
    if (res.status === 401) {
      sessionStorage.removeItem(STORAGE_KEY);
      setSession(null);
      throw new Error('Session expired');
    }
    return res;
  };

  const runShapeAction = async (
    action: 'create' | 'sync' | 'delete' | 'assign',
    depursLo?: number,
  ) => {
    if (!session || !selected) return;
    setActionBusy(action);
    setActionMessage('');
    try {
      const res = await adminFetch(session, `/api/admin/investor-applications/${selected.id}`, {
        method: 'POST',
        body: JSON.stringify({ action, depursLo }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Action failed');
      setActionMessage(
        action === 'assign'
          ? `Assigned to ${json.assignedTo || 'LO'}`
          : action === 'delete'
            ? 'Shape lead marked removed'
            : `Shape lead ${json.shapeLeadId}`,
      );
      loadApplications(session);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionBusy('');
    }
  };

  const toggleArchive = async (archived: boolean) => {
    if (!session || !selected) return;
    setActionBusy('archive');
    setActionMessage('');
    try {
      const res = await adminFetch(session, `/api/admin/investor-applications/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ archived }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Archive failed');
      setActionMessage(archived ? 'Application archived' : 'Application restored');
      loadApplications(session);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Archive failed');
    } finally {
      setActionBusy('');
    }
  };

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

  const signOut = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
    setSelected(null);
    setApplications([]);
  };

  const stats = useMemo(() => {
    const submitted = applications.filter(a => a.submitted_at).length;
    const flagged = applications.filter(a => (a.guideline_warnings?.length || 0) > 0).length;
    const drafts = applications.length - submitted;
    return { total: applications.length, submitted, drafts, flagged };
  }, [applications]);

  const stateOptions = useMemo(() => {
    const states = new Set<string>();
    applications.forEach(app => {
      if (app.property_state) states.add(app.property_state.toUpperCase());
    });
    return [...states].sort();
  }, [applications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cityQ = cityFilter.trim().toLowerCase();
    const daysNum = daysFilter === 'all' ? null : Number(daysFilter);
    const cutoff = daysNum
      ? Date.now() - daysNum * 24 * 60 * 60 * 1000
      : null;

    return applications.filter(app => {
      if (statusFilter === 'submitted' && !app.submitted_at) return false;
      if (statusFilter === 'draft' && app.submitted_at) return false;
      if (statusFilter === 'flagged' && !(app.guideline_warnings?.length || 0)) return false;
      if (programFilter !== 'all' && app.loan_program !== programFilter) return false;
      if (stateFilter !== 'all' && (app.property_state || '').toUpperCase() !== stateFilter) return false;
      if (cityQ && !(app.property_city || '').toLowerCase().includes(cityQ)) return false;
      if (cutoff) {
        const ref = app.submitted_at || app.created_at;
        if (!ref || new Date(ref).getTime() < cutoff) return false;
      }
      if (!q) return true;
      const hay = [
        borrowerName(app),
        app.borrower?.email,
        app.borrower?.phone,
        app.id,
        programLabel(app.loan_program),
        app.status,
        app.property_city,
        app.property_state,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [applications, search, statusFilter, programFilter, stateFilter, cityFilter, daysFilter]);

  if (!session) {
    return (
      <div className="admin-login">
        <form onSubmit={handleLogin} className="admin-login-card">
          <h1>QuestRock Ops</h1>
          <p>Investor Hub — staff access only</p>
          <label>
            Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" required />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" required />
          </label>
          {authError && <p className="admin-error">{authError}</p>}
          <button type="submit" className="qr-btn qr-btn-green" style={{ width: '100%', marginTop: 8 }}>
            Sign in
          </button>
        </form>
        <style jsx global>{`
          .admin-login {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #0f172a;
            padding: 24px;
          }
          .admin-login-card {
            background: #fff;
            border-radius: 12px;
            padding: 36px;
            width: 100%;
            max-width: 400px;
            box-shadow: var(--shadow-lg);
          }
          .admin-login-card h1 {
            font-size: 22px;
            font-weight: 700;
            margin: 0 0 6px;
            color: var(--ink);
          }
          .admin-login-card p {
            font-size: 13px;
            color: var(--slate);
            margin: 0 0 24px;
          }
          .admin-login-card label {
            margin-bottom: 14px;
          }
          .admin-error {
            color: #b45309;
            font-size: 13px;
            margin: 0 0 12px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div>
          <h1>Investor Hub</h1>
          <p>Operations dashboard · {session.email}</p>
        </div>
        <div className="admin-topbar-actions">
          <button type="button" className="qr-btn qr-btn-secondary" onClick={() => session && loadApplications(session)}>
            Refresh
          </button>
          <button type="button" className="qr-btn qr-btn-secondary" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className="admin-stats">
        {[
          { label: 'Total applications', value: stats.total },
          { label: 'Submitted', value: stats.submitted },
          { label: 'Drafts', value: stats.drafts },
          { label: 'Guideline flags', value: stats.flagged },
        ].map(item => (
          <div key={item.label} className="admin-stat">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search borrower, email, phone, ID, program…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="admin-search"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="submitted">Submitted</option>
          <option value="draft">Drafts</option>
          <option value="flagged">With flags</option>
        </select>
        <select value={programFilter} onChange={e => setProgramFilter(e.target.value)}>
          <option value="all">All programs</option>
          {Object.entries(PROGRAM_CONFIGS).map(([key, cfg]) => (
            <option key={key} value={key}>
              {cfg.shortLabel}
            </option>
          ))}
        </select>
        <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}>
          <option value="all">All states</option>
          {stateOptions.map(st => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter city…"
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          className="admin-search"
          style={{ flex: '0 1 140px', minWidth: 120 }}
        />
        <select value={daysFilter} onChange={e => setDaysFilter(e.target.value)}>
          <option value="all">All time</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={e => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
        <span className="admin-count">{filtered.length} shown</span>
      </div>

      <div className="admin-layout">
        <section className="admin-table-wrap">
          {loading ? (
            <p className="admin-empty">Loading applications…</p>
          ) : filtered.length === 0 ? (
            <p className="admin-empty">No applications match your filters.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Location</th>
                  <th>Program</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => {
                  const warnings = app.guideline_warnings?.length || 0;
                  const tone = statusTone(app.status);
                  const amount = app.loan_request?.requestedLoanAmount
                    ? fmt(toNum(app.loan_request.requestedLoanAmount))
                    : '—';
                  return (
                    <tr
                      key={app.id}
                      className={`${selected?.id === app.id ? 'selected' : ''}${app.archived ? ' archived' : ''}`}
                      onClick={() => { setSelected(app); setActionMessage(''); setAssignLo(''); }}
                    >
                      <td>
                        <strong>{borrowerName(app)}</strong>
                        <span>{app.borrower?.email || '—'}</span>
                      </td>
                      <td>
                        {[app.property_city, app.property_state].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td>{programLabel(app.loan_program)}</td>
                      <td>{amount}</td>
                      <td>
                        <span className="admin-pill" style={{ background: tone.bg, color: tone.color }}>
                          {app.status}
                        </span>
                      </td>
                      <td>{app.submitted_at ? new Date(app.submitted_at).toLocaleDateString() : 'Draft'}</td>
                      <td>{warnings ? `${warnings} flag${warnings !== 1 ? 's' : ''}` : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <aside className="admin-detail">
          {!selected ? (
            <div className="admin-detail-empty">
              <h2>Select an application</h2>
              <p>Click a row to review borrower details, AI summary, guideline flags, and missing documents.</p>
            </div>
          ) : (
            <>
              <div className="admin-detail-head">
                <h2>
                  {selected.borrower?.firstName} {selected.borrower?.lastName}
                </h2>
                <p>
                  {selected.borrower?.email} · {selected.borrower?.phone}
                </p>
                <code>{selected.id}</code>
              </div>

              <div className="admin-detail-grid">
                {[
                  { label: 'Program', value: programLabel(selected.loan_program) },
                  { label: 'Status', value: selected.status },
                  {
                    label: 'Loan amount',
                    value: selected.loan_request?.requestedLoanAmount
                      ? fmt(toNum(selected.loan_request.requestedLoanAmount))
                      : '—',
                  },
                  {
                    label: 'Submitted',
                    value: selected.submitted_at
                      ? new Date(selected.submitted_at).toLocaleString()
                      : 'Draft',
                  },
                  { label: 'Entity', value: selected.entity?.entityName || selected.entity?.borrowingAs || '—' },
                  { label: 'Deal stage', value: selected.deal_stage || '—' },
                  {
                    label: 'Property',
                    value: [selected.property_city, selected.property_state].filter(Boolean).join(', ') || '—',
                  },
                  { label: 'Shape lead', value: selected.shape_lead_id || 'Not linked' },
                ].map(({ label, value }) => (
                  <div key={label} className="admin-detail-card">
                    <span>{label}</span>
                    <strong>{value}</strong>
                  </div>
                ))}
              </div>

              {selected.guideline_warnings && selected.guideline_warnings.length > 0 && (
                <div className="admin-panel admin-panel-warn">
                  <h3>Guideline flags</h3>
                  {selected.guideline_warnings.map((w, i) => (
                    <p key={i}>{w}</p>
                  ))}
                </div>
              )}

              {selected.ai_summary && (
                <div className="admin-panel admin-panel-info">
                  <h3>AI summary</h3>
                  <p>{selected.ai_summary}</p>
                </div>
              )}

              {selected.missing_documents && selected.missing_documents.length > 0 && (
                <div className="admin-panel">
                  <h3>Missing documents</h3>
                  <ul>
                    {selected.missing_documents.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selected.additional_notes && (
                <div className="admin-panel">
                  <h3>Additional notes</h3>
                  <p>{selected.additional_notes}</p>
                </div>
              )}

              <div className="admin-panel admin-panel-shape">
                <h3>Shape CRM</h3>
                <p className="admin-shape-id">
                  Lead ID: <strong>{selected.shape_lead_id || 'None'}</strong>
                  {selected.archived && <span className="admin-archived-badge">Archived</span>}
                </p>
                <div className="admin-shape-actions">
                  <button
                    type="button"
                    className="qr-btn qr-btn-green"
                    disabled={Boolean(actionBusy)}
                    onClick={() => runShapeAction(selected.shape_lead_id ? 'sync' : 'create')}
                  >
                    {actionBusy === 'create' || actionBusy === 'sync' ? 'Working…' : selected.shape_lead_id ? 'Sync to Shape' : 'Create in Shape'}
                  </button>
                  {selected.shape_lead_id && (
                    <button
                      type="button"
                      className="qr-btn qr-btn-secondary"
                      disabled={Boolean(actionBusy)}
                      onClick={() => {
                        if (window.confirm('Mark this Shape lead as removed (Do Not Contact)?')) {
                          void runShapeAction('delete');
                        }
                      }}
                    >
                      {actionBusy === 'delete' ? 'Removing…' : 'Remove from Shape'}
                    </button>
                  )}
                </div>
                {selected.shape_lead_id && shapeRoster.length > 0 && (
                  <div className="admin-assign-row">
                    <select value={assignLo} onChange={e => setAssignLo(e.target.value)}>
                      <option value="">Assign to LO…</option>
                      {shapeRoster.map(lo => (
                        <option key={lo.depursLo} value={String(lo.depursLo)}>{lo.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="qr-btn qr-btn-secondary"
                      disabled={!assignLo || Boolean(actionBusy)}
                      onClick={() => runShapeAction('assign', Number(assignLo))}
                    >
                      {actionBusy === 'assign' ? 'Assigning…' : 'Assign'}
                    </button>
                  </div>
                )}
              </div>

              <div className="admin-shape-actions" style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  className="qr-btn qr-btn-secondary"
                  disabled={Boolean(actionBusy)}
                  onClick={() => toggleArchive(!selected.archived)}
                >
                  {actionBusy === 'archive' ? 'Saving…' : selected.archived ? 'Restore application' : 'Archive application'}
                </button>
              </div>

              {actionMessage && <p className="admin-action-msg">{actionMessage}</p>}

              <a href={`/portfolio/${selected.id}`} target="_blank" rel="noopener noreferrer" className="admin-link">
                Open customer portfolio →
              </a>
            </>
          )}
        </aside>
      </div>

      <style jsx global>{`
        .admin-shell {
          min-height: 100vh;
          background: var(--paper);
          padding: 24px 28px 40px;
        }
        .admin-topbar {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
        }
        .admin-topbar h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.02em;
        }
        .admin-topbar p {
          margin: 4px 0 0;
          font-size: 13px;
          color: var(--slate);
        }
        .admin-topbar-actions {
          display: flex;
          gap: 8px;
        }
        .admin-stats {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 16px;
        }
        .admin-stat {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          padding: 16px 18px;
          box-shadow: var(--shadow-xs);
        }
        .admin-stat span {
          display: block;
          font-size: 12px;
          color: var(--slate);
          margin-bottom: 6px;
        }
        .admin-stat strong {
          font-size: 24px;
          font-weight: 700;
          color: var(--ink);
        }
        .admin-toolbar {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          align-items: center;
          margin-bottom: 16px;
        }
        .admin-search {
          flex: 1 1 280px;
          min-width: 200px;
        }
        .admin-toolbar select {
          width: auto;
          min-width: 140px;
        }
        .admin-count {
          font-size: 12px;
          color: var(--slate);
          margin-left: auto;
        }
        .admin-check {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--slate);
          white-space: nowrap;
        }
        .admin-check input {
          width: auto;
          margin: 0;
        }
        .admin-layout {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
          gap: 16px;
          align-items: start;
        }
        .admin-table-wrap {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          overflow: auto;
          box-shadow: var(--shadow-sm);
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .admin-table th {
          text-align: left;
          padding: 12px 14px;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--slate);
          border-bottom: 1px solid var(--line);
          background: var(--surface-dim);
        }
        .admin-table td {
          padding: 12px 14px;
          border-bottom: 1px solid var(--line);
          vertical-align: top;
        }
        .admin-table td strong {
          display: block;
          font-size: 14px;
          color: var(--ink);
        }
        .admin-table td span {
          display: block;
          font-size: 12px;
          color: var(--slate);
          margin-top: 2px;
        }
        .admin-table tbody tr {
          cursor: pointer;
          transition: background 0.12s;
        }
        .admin-table tbody tr:hover {
          background: #f8fafc;
        }
        .admin-table tbody tr.selected {
          background: var(--ledger-green-soft);
        }
        .admin-table tbody tr.archived {
          opacity: 0.65;
        }
        .admin-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 600;
        }
        .admin-empty {
          padding: 32px;
          color: var(--slate);
          font-size: 14px;
        }
        .admin-detail {
          background: #fff;
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          padding: 20px;
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 16px;
          max-height: calc(100vh - 48px);
          overflow: auto;
        }
        .admin-detail-empty h2 {
          font-size: 16px;
          margin: 0 0 8px;
        }
        .admin-detail-empty p {
          font-size: 13px;
          color: var(--slate);
          line-height: 1.55;
          margin: 0;
        }
        .admin-detail-head h2 {
          font-size: 20px;
          margin: 0 0 6px;
        }
        .admin-detail-head p {
          margin: 0;
          font-size: 13px;
          color: var(--slate);
        }
        .admin-detail-head code {
          display: inline-block;
          margin-top: 10px;
          font-size: 11px;
          color: var(--slate);
          background: var(--paper-dim);
          padding: 4px 8px;
          border-radius: 4px;
        }
        .admin-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin: 18px 0;
        }
        .admin-detail-card {
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 12px;
          background: var(--surface-dim);
        }
        .admin-detail-card span {
          display: block;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--slate);
          margin-bottom: 4px;
        }
        .admin-detail-card strong {
          font-size: 14px;
          color: var(--ink);
        }
        .admin-panel {
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 14px;
          margin-bottom: 12px;
        }
        .admin-panel h3 {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 10px;
          color: var(--slate);
        }
        .admin-panel p,
        .admin-panel li {
          font-size: 13px;
          line-height: 1.55;
          color: var(--ink-soft);
          margin: 0 0 6px;
        }
        .admin-panel ul {
          margin: 0;
          padding-left: 18px;
        }
        .admin-panel-warn {
          background: #fffbeb;
          border-color: #fde68a;
        }
        .admin-panel-warn h3 {
          color: #b45309;
        }
        .admin-panel-info {
          background: #eff6ff;
          border-color: #bfdbfe;
        }
        .admin-panel-info h3 {
          color: #1d4ed8;
        }
        .admin-link {
          display: inline-block;
          margin-top: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--blue);
          text-decoration: none;
        }
        .admin-panel-shape {
          background: #f8fafc;
        }
        .admin-shape-id {
          font-size: 13px;
          margin: 0 0 12px;
          color: var(--ink-soft);
        }
        .admin-archived-badge {
          display: inline-block;
          margin-left: 8px;
          padding: 2px 8px;
          border-radius: 99px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          background: #fef3c7;
          color: #92400e;
        }
        .admin-shape-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 10px;
        }
        .admin-assign-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          align-items: center;
        }
        .admin-assign-row select {
          flex: 1;
          min-width: 160px;
        }
        .admin-action-msg {
          font-size: 13px;
          color: var(--ledger-green);
          margin: 0 0 12px;
          font-weight: 600;
        }
        @media (max-width: 1100px) {
          .admin-layout {
            grid-template-columns: 1fr;
          }
          .admin-detail {
            position: static;
            max-height: none;
          }
          .admin-stats {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
