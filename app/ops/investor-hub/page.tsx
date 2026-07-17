'use client';

import { useEffect, useMemo, useState } from 'react';
import { PROGRAM_CONFIGS } from '@/config/loan-programs';
import type { ProgramKey } from '@/config/loan-programs';
import { fmt, toNum } from '@/lib/loan-calculations';

const HUB_OPS_LAUNCH =
  process.env.NEXT_PUBLIC_INTELLIGENCE_HUB_OPS_URL
  ?? 'https://questrockintelligencehub.vercel.app/api/launch?appId=investor-hub-ops';

interface StaffSession {
  email: string;
  fullName: string | null;
  role: string;
  canViewAll: boolean;
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
  assigned_lo?: { depursLo?: number; name?: string } | null;
  property_city?: string;
  property_state?: string;
}

interface ShapeLoOption {
  name: string;
  depursLo: number;
  slug?: string;
  applyUrl?: string;
}

interface UploadedDocument {
  id: string;
  label: string;
  documentType: string | null;
  fileName: string | null;
  uploadedAt: string;
  openUrl: string;
}

interface LenderExportFile {
  name: string;
  openUrl: string;
}

interface LenderExportChecklistItem {
  key?: string;
  label?: string;
  required?: boolean;
  uploaded?: boolean;
  matchedDocumentName?: string;
}

interface LenderExportsData {
  lender: string;
  generatedAt: string;
  includeReo: boolean;
  files: LenderExportFile[];
  checklist: LenderExportChecklistItem[];
  preview?: {
    project?: Record<string, string | number | boolean>;
    budget?: Record<string, string | number | boolean>;
    reo?: Record<string, string | number | boolean>;
  };
}

interface VerificationResult {
  generatedAt: string;
  verdict: 'pass' | 'review' | 'fail';
  summary: string;
  blockers: string[];
  warnings: string[];
  highlights: string[];
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
  const [staffSession, setStaffSession] = useState<StaffSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
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
  const [loCopyHint, setLoCopyHint] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [lenderExports, setLenderExports] = useState<LenderExportsData | null>(null);
  const [lenderLoading, setLenderLoading] = useState(false);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [verificationLoading, setVerificationLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    if (urlError) setAuthError(urlError);

    fetch('/api/admin/session', { credentials: 'same-origin' })
      .then(res => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then(json => setStaffSession(json.user))
      .catch(() => setStaffSession(null))
      .finally(() => setAuthLoading(false));
  }, []);

  const loadApplications = () => {
    setLoading(true);
    const qs = showArchived ? '?includeArchived=1' : '';
    fetch(`/api/admin/investor-applications${qs}`, { credentials: 'same-origin' })
      .then(res => {
        if (res.status === 401) {
          setStaffSession(null);
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
    if (staffSession) loadApplications();
  }, [staffSession, showArchived]);

  useEffect(() => {
    fetch('/api/admin/shape-roster')
      .then(res => res.json())
      .then(json => setShapeRoster(json.roster || []))
      .catch(() => {});
  }, []);

  const adminFetch = async (path: string, init?: RequestInit) => {
    const res = await fetch(path, {
      ...init,
      credentials: 'same-origin',
      headers: {
        ...(init?.headers || {}),
        'Content-Type': 'application/json',
      },
    });
    if (res.status === 401) {
      setStaffSession(null);
      throw new Error('Session expired');
    }
    return res;
  };

  useEffect(() => {
    if (!staffSession || !selected) {
      setUploadedDocs([]);
      return;
    }
    setDocsLoading(true);
    adminFetch(`/api/admin/investor-applications/${selected.id}/documents`)
      .then(res => res.json())
      .then(json => setUploadedDocs(json.documents || []))
      .catch(() => setUploadedDocs([]))
      .finally(() => setDocsLoading(false));
  }, [selected?.id, staffSession]);

  useEffect(() => {
    if (!staffSession || !selected) {
      setLenderExports(null);
      return;
    }
    setLenderLoading(true);
    adminFetch(`/api/admin/investor-applications/${selected.id}/lender-exports`)
      .then(res => res.json())
      .then(json => setLenderExports((json.exports || null) as LenderExportsData | null))
      .catch(() => setLenderExports(null))
      .finally(() => setLenderLoading(false));
  }, [selected?.id, staffSession]);

  useEffect(() => {
    if (!staffSession || !selected) {
      setVerification(null);
      return;
    }
    setVerificationLoading(true);
    adminFetch(`/api/admin/investor-applications/${selected.id}/verify`)
      .then(res => res.json())
      .then(json => setVerification((json.verification || null) as VerificationResult | null))
      .catch(() => setVerification(null))
      .finally(() => setVerificationLoading(false));
  }, [selected?.id, staffSession]);

  const runShapeAction = async (
    action: 'create' | 'sync' | 'delete' | 'assign',
    depursLo?: number,
  ) => {
    if (!staffSession || !selected) return;
    setActionBusy(action);
    setActionMessage('');
    try {
      const res = await adminFetch(`/api/admin/investor-applications/${selected.id}`, {
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
      loadApplications();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionBusy('');
    }
  };

  const toggleArchive = async (archived: boolean) => {
    if (!staffSession || !selected) return;
    setActionBusy('archive');
    setActionMessage('');
    try {
      const res = await adminFetch(`/api/admin/investor-applications/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ archived }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Archive failed');
      setActionMessage(archived ? 'Application archived' : 'Application restored');
      loadApplications();
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Archive failed');
    } finally {
      setActionBusy('');
    }
  };

  const openCustomerPortal = async () => {
    if (!staffSession || !selected) return;
    if (!selected.borrower?.email) {
      setActionMessage('Borrower email is missing — cannot open portal');
      return;
    }
    setActionBusy('portal-link');
    setActionMessage('');
    try {
      const res = await adminFetch(`/api/admin/investor-applications/${selected.id}`, {
        method: 'POST',
        body: JSON.stringify({ action: 'portal-link' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Could not open portal');
      window.open(json.loginUrl, '_blank', 'noopener,noreferrer');
      setActionMessage('Opened customer portal in a new tab (link expires in ~30 minutes).');
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Could not open portal');
    } finally {
      setActionBusy('');
    }
  };

  const runVerificationBot = async () => {
    if (!staffSession || !selected) return;
    if (selected.status !== 'submitted') {
      setActionMessage('Verification bot is available only for submitted applications.');
      return;
    }
    setActionBusy('verify');
    setActionMessage('');
    setVerificationLoading(true);
    try {
      const res = await adminFetch(`/api/admin/investor-applications/${selected.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Verification failed');
      setVerification((json.verification || null) as VerificationResult | null);
      setActionMessage('Verification bot completed.');
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setActionBusy('');
      setVerificationLoading(false);
    }
  };

  const regenerateLenderPackage = async () => {
    if (!staffSession || !selected) return;
    setActionBusy('regen-lender');
    setActionMessage('');
    setLenderLoading(true);
    try {
      const res = await adminFetch(`/api/admin/investor-applications/${selected.id}/lender-exports`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to regenerate lender package');
      setLenderExports((json.exports || null) as LenderExportsData | null);
      setActionMessage('Lender package regenerated.');
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : 'Failed to regenerate lender package');
    } finally {
      setActionBusy('');
      setLenderLoading(false);
    }
  };

  const signOut = async () => {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    setStaffSession(null);
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

  if (authLoading) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <p>Loading…</p>
        </div>
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
        `}</style>
      </div>
    );
  }

  if (!staffSession) {
    return (
      <div className="admin-login">
        <div className="admin-login-card">
          <h1>QuestRock Ops</h1>
          <p>Investor Hub ops uses your Intelligence Hub login — no separate password.</p>
          {authError && <p className="admin-error">{authError}</p>}
          <a href={HUB_OPS_LAUNCH} className="qr-btn qr-btn-green hub-signin-btn">
            Sign in via Intelligence Hub
          </a>
          <p className="admin-login-hint">
            Executives and managers see all intakes. Loan officers see applications assigned to them.
          </p>
        </div>
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
            max-width: 420px;
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
            margin: 0 0 16px;
          }
          .admin-login-hint {
            font-size: 12px !important;
            margin-top: 14px !important;
            margin-bottom: 0 !important;
          }
          .hub-signin-btn {
            display: block;
            width: 100%;
            text-align: center;
            text-decoration: none;
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
          <p>Operations dashboard · {staffSession.fullName || staffSession.email} · {staffSession.role}{staffSession.canViewAll ? ' · all intakes' : ' · your assigned intakes'}</p>
        </div>
        <div className="admin-topbar-actions">
          <button type="button" className="qr-btn qr-btn-secondary" onClick={() => loadApplications()}>
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
                  { label: 'Assigned LO', value: selected.assigned_lo?.name || '—' },
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

              <div className="admin-panel admin-panel-info">
                <h3>Verification Bot (Ops)</h3>
                {selected.status !== 'submitted' ? (
                  <p>Available only for submitted applications.</p>
                ) : (
                  <>
                    <div className="admin-shape-actions" style={{ marginBottom: 10 }}>
                      <button
                        type="button"
                        className="qr-btn qr-btn-secondary"
                        disabled={Boolean(actionBusy)}
                        onClick={() => { void runVerificationBot(); }}
                      >
                        {actionBusy === 'verify' ? 'Running…' : 'Run verification bot'}
                      </button>
                    </div>
                    {verificationLoading ? (
                      <p>Running checks…</p>
                    ) : !verification ? (
                      <p>No verification run yet.</p>
                    ) : (
                      <>
                        <p><strong>Verdict:</strong> {verification.verdict}</p>
                        <p>{verification.summary}</p>
                        {verification.blockers?.length > 0 && (
                          <>
                            <p><strong>Blockers</strong></p>
                            <ul>
                              {verification.blockers.map((b, i) => <li key={i}>{b}</li>)}
                            </ul>
                          </>
                        )}
                        {verification.warnings?.length > 0 && (
                          <>
                            <p><strong>Warnings</strong></p>
                            <ul>
                              {verification.warnings.map((w, i) => <li key={i}>{w}</li>)}
                            </ul>
                          </>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

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

              <div className="admin-panel admin-panel-docs">
                <h3>Uploaded documents</h3>
                {docsLoading ? (
                  <p>Loading files…</p>
                ) : uploadedDocs.length === 0 ? (
                  <p>No files uploaded with this application.</p>
                ) : (
                  <ul className="admin-doc-list">
                    {uploadedDocs.map(doc => (
                      <li key={doc.id}>
                        <a
                          href={doc.openUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="admin-doc-link"
                        >
                          {doc.fileName || doc.label}
                        </a>
                        {doc.documentType && (
                          <span className="admin-doc-type">{doc.documentType.replace(/_/g, ' ')}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {selected.loan_program === 'construction' && (
                <div className="admin-panel admin-panel-docs">
                  <h3>Park Place lender package</h3>
                  {lenderLoading ? (
                    <p>Generating / loading export files…</p>
                  ) : !lenderExports ? (
                    <>
                      <p>No lender export package generated yet for this submission.</p>
                      <div className="admin-shape-actions" style={{ marginTop: 10 }}>
                        <button
                          type="button"
                          className="qr-btn qr-btn-secondary"
                          disabled={Boolean(actionBusy)}
                          onClick={() => void regenerateLenderPackage()}
                        >
                          {actionBusy === 'regen-lender' ? 'Generating…' : 'Generate lender package now'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p style={{ marginBottom: 10 }}>
                        Generated: {new Date(lenderExports.generatedAt).toLocaleString()}
                      </p>
                      <div className="admin-shape-actions" style={{ marginBottom: 10 }}>
                        <button
                          type="button"
                          className="qr-btn qr-btn-secondary"
                          disabled={Boolean(actionBusy)}
                          onClick={() => void regenerateLenderPackage()}
                        >
                          {actionBusy === 'regen-lender' ? 'Regenerating…' : 'Regenerate lender package'}
                        </button>
                      </div>
                      <ul className="admin-doc-list">
                        {lenderExports.files.map(file => (
                          <li key={file.name}>
                            <a
                              href={file.openUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="admin-doc-link"
                            >
                              {file.name}
                            </a>
                          </li>
                        ))}
                      </ul>
                      {lenderExports.checklist?.length > 0 && (
                        <div style={{ marginTop: 10 }}>
                          <p style={{ marginBottom: 6 }}>Checklist status:</p>
                          <ul className="admin-doc-list">
                            {lenderExports.checklist.map((item, idx) => (
                              <li key={`${item.key || idx}`}>
                                <span>
                                  {item.uploaded ? '✓' : '○'} {item.label || item.key}
                                  {item.required === false ? ' (not required)' : ''}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {lenderExports.preview && (
                        <div style={{ marginTop: 12 }}>
                          <p style={{ marginBottom: 6 }}>Filled values preview:</p>
                          {lenderExports.preview.project && (
                            <div style={{ marginBottom: 8 }}>
                              <p style={{ marginBottom: 4 }}><strong>Project details</strong></p>
                              <ul className="admin-doc-list">
                                {Object.entries(lenderExports.preview.project).map(([key, value]) => (
                                  <li key={`project-${key}`}>
                                    <span>{key}: {String(value ?? '')}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {lenderExports.preview.budget && (
                            <div style={{ marginBottom: 8 }}>
                              <p style={{ marginBottom: 4 }}><strong>Budget summary</strong></p>
                              <ul className="admin-doc-list">
                                {Object.entries(lenderExports.preview.budget).map(([key, value]) => (
                                  <li key={`budget-${key}`}>
                                    <span>{key}: {String(value ?? '')}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {lenderExports.preview.reo && (
                            <div>
                              <p style={{ marginBottom: 4 }}><strong>REO summary</strong></p>
                              <ul className="admin-doc-list">
                                {Object.entries(lenderExports.preview.reo).map(([key, value]) => (
                                  <li key={`reo-${key}`}>
                                    <span>{key}: {String(value ?? '')}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
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

              <div className="admin-portal-actions">
                <button
                  type="button"
                  className="qr-btn qr-btn-secondary"
                  disabled={Boolean(actionBusy) || !selected.borrower?.email}
                  onClick={() => void openCustomerPortal()}
                >
                  {actionBusy === 'portal-link' ? 'Opening…' : 'Open customer portal'}
                </button>
                <a
                  href="/investor-hub/apply"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-link"
                >
                  New intake form →
                </a>
              </div>
            </>
          )}
        </aside>
      </div>

      {shapeRoster.length > 0 && (
        <section className="admin-lo-links">
          <h2>Loan officer referral links</h2>
          <p>Share each LO&apos;s unique intake link — the form pre-selects them and Shape receives their assignment on submit.</p>
          <div className="admin-lo-links-grid">
            {shapeRoster.map(lo => {
              const link = lo.applyUrl || `/investor-hub/apply?lo=${lo.slug || lo.depursLo}`;
              const absoluteLink = link.startsWith('http')
                ? link
                : `${window.location.origin}${link}`;
              return (
                <div key={lo.depursLo} className="admin-lo-link-card">
                  <strong>{lo.name}</strong>
                  <code>{absoluteLink}</code>
                  <button
                    type="button"
                    className="qr-btn qr-btn-secondary"
                    onClick={() => {
                      void navigator.clipboard.writeText(absoluteLink);
                      setLoCopyHint(`Copied link for ${lo.name}`);
                    }}
                  >
                    Copy link
                  </button>
                </div>
              );
            })}
          </div>
          {loCopyHint && <p className="admin-action-msg">{loCopyHint}</p>}
        </section>
      )}

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
        .admin-panel-docs {
          background: #f8fafc;
        }
        .admin-doc-list {
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .admin-doc-list li {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 8px;
          padding: 8px 0;
          border-bottom: 1px solid var(--line);
        }
        .admin-doc-list li:last-child {
          border-bottom: none;
        }
        .admin-doc-link {
          font-size: 13px;
          font-weight: 600;
          color: var(--blue);
          text-decoration: none;
        }
        .admin-doc-link:hover {
          text-decoration: underline;
        }
        .admin-doc-type {
          font-size: 11px;
          color: var(--slate);
          text-transform: capitalize;
        }
        .admin-link {
          display: inline-block;
          margin-top: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--blue);
          text-decoration: none;
        }
        .admin-portal-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-top: 8px;
        }
        .admin-lo-links {
          margin-top: 28px;
          padding: 20px 22px;
          background: #fff;
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
        }
        .admin-lo-links h2 {
          margin: 0 0 6px;
          font-size: 18px;
        }
        .admin-lo-links > p {
          margin: 0 0 16px;
          font-size: 13px;
          color: var(--slate);
        }
        .admin-lo-links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 12px;
        }
        .admin-lo-link-card {
          border: 1px solid var(--line);
          border-radius: var(--radius);
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .admin-lo-link-card strong {
          font-size: 14px;
        }
        .admin-lo-link-card code {
          font-size: 11px;
          word-break: break-all;
          color: var(--slate);
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
