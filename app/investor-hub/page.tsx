'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlowButton } from '@/components/ui/flow-button';
import { LoanProgramStrip } from '@/components/ui/LoanProgramStrip';

/* ──────────────────────────────────────────────────────── */
/*  Inline styles (scoped to this page only)               */
/* ──────────────────────────────────────────────────────── */
const PAGE_CSS = `
.ih-root{
  --ink:#0f172a;--ink-soft:#334155;
  --paper:#f8fafc;--paper-dim:#f1f5f9;
  --ledger-green:#0f766e;--ledger-green-soft:#ecfdf5;
  --brass:#92702a;--brass-soft:#fef9ee;
  --slate:#64748b;--slate-light:#94a3b8;
  --clay:#b45309;--clay-soft:#fffbeb;
  --line:#e2e8f0;
  background:var(--paper);color:var(--ink);
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
  -webkit-font-smoothing:antialiased;min-height:100vh;
}
.ih-root *{box-sizing:border-box;}
.ih-root a{color:inherit;text-decoration:none;}
.ih-root a.ih-header-cta,
.ih-root a.ih-header-cta:hover{
  color:#fff !important;
  background:var(--ink);
}
.ih-app{max-width:1140px;margin:0 auto;padding:0 28px 72px;}

/* --- Topbar --- */
.ih-topbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:20px 0;border-bottom:1px solid var(--line);margin-bottom:40px;gap:18px;
}
.ih-wordmark{display:flex;align-items:center;gap:12px;white-space:nowrap;}
.ih-mark{font-weight:700;font-size:18px;letter-spacing:-0.02em;color:var(--ink);}
.ih-sub{font-size:12px;color:var(--slate);font-weight:500;}
.ih-nav{display:flex;align-items:center;gap:24px;font-size:14px;color:var(--slate);font-weight:500;}
.ih-nav a:hover{color:var(--ink);}
.ih-header-cta{
  font-size:14px;font-weight:600;background:var(--ink);color:#fff !important;
  padding:10px 16px;border:1px solid var(--ink);cursor:pointer;
  display:inline-flex;align-items:center;border-radius:8px;
  transition:background .15s;
}
.ih-header-cta:hover{background:#1e293b;color:#fff !important;}
.ih-mobile-cta{display:none;}

/* --- Buttons --- */
.ih-btn-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
.ih-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  font-weight:600;font-size:14px;
  padding:11px 18px;border:1px solid transparent;cursor:pointer;
  border-radius:8px;
  transition:background .15s,border-color .15s,box-shadow .15s;
}
.ih-btn-primary{background:var(--ink);color:#fff;border-color:var(--ink);}
.ih-btn-primary:hover{background:#1e293b;}
.ih-btn-secondary{background:#fff;color:var(--ink);border-color:var(--line);}
.ih-btn-secondary:hover{border-color:#cbd5e1;background:var(--paper-dim);}
.ih-btn-ghost-light{
  background:transparent;color:rgba(248,250,252,.9);
  border-color:rgba(248,250,252,.35);
}
.ih-btn-ghost-light:hover{background:rgba(255,255,255,.08);border-color:rgba(248,250,252,.55);color:#fff;}
.ih-btn-brass{background:var(--ledger-green);color:#fff;border-color:var(--ledger-green);}
.ih-btn-brass:hover{background:#0d6660;}
.ih-kicker{
  display:inline-block;
  font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;
  color:var(--ledger-green);margin-bottom:12px;
}

/* --- Hero --- */
.ih-hero{display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center;margin-bottom:64px;}
.ih-hero h1{
  font-weight:700;font-size:48px;line-height:1.08;
  letter-spacing:-0.03em;margin:0 0 16px;
}
.ih-hero h1 span{color:var(--ledger-green);}
.ih-hero-copy{color:var(--slate);font-size:16px;line-height:1.65;margin:0 0 24px;max-width:54ch;}
.ih-hero-points{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0 0;}
.ih-hero-point{
  display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);
  padding:7px 12px;border-radius:8px;font-size:13px;color:var(--ink-soft);font-weight:500;
}
.ih-dot{width:6px;height:6px;border-radius:50%;background:var(--ledger-green);flex-shrink:0;}

/* --- Ledger --- */
.ih-ledger-wrap{position:relative;}
.ih-ledger-shadow{display:none;}
.ih-ledger{
  position:relative;z-index:1;background:var(--ink);color:#f8fafc;
  overflow:hidden;border-radius:12px;
  box-shadow:0 4px 24px rgba(15,23,42,.12);
  border:1px solid #1e293b;
}
.ih-ledger-head{
  padding:20px 22px 16px;border-bottom:1px solid rgba(255,255,255,.08);
  display:flex;justify-content:space-between;align-items:flex-start;gap:18px;
}
.ih-lt{font-size:17px;font-weight:700;letter-spacing:-0.01em;}
.ih-ls{font-size:11px;color:var(--slate-light);letter-spacing:0.04em;text-transform:uppercase;margin-top:4px;font-weight:600;}
.ih-seal{
  width:52px;height:52px;border-radius:8px;border:1px solid rgba(255,255,255,.15);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  font-size:8px;font-weight:600;color:#94a3b8;text-align:center;line-height:1.2;
  letter-spacing:0.04em;text-transform:uppercase;
}
.ih-ledger-body{padding:18px 22px 8px;}
.ih-lrow{
  display:flex;justify-content:space-between;align-items:baseline;gap:18px;
  padding:10px 0;border-bottom:1px solid rgba(255,255,255,.06);font-size:13px;
}
.ih-lrow:last-child{border-bottom:none;}
.ih-lk{color:#94a3b8;font-weight:500;}
.ih-lv{font-size:13px;font-weight:600;color:#e2e8f0;text-align:right;font-variant-numeric:tabular-nums;}
.ih-lv-hi{font-size:15px;font-weight:700;color:#fff;text-align:right;font-variant-numeric:tabular-nums;}
.ih-lv-pos{font-size:13px;font-weight:600;color:#5eead4;text-align:right;font-variant-numeric:tabular-nums;}
.ih-ledger-note{
  margin:12px 22px 18px;padding:12px 14px;background:rgba(255,255,255,.04);
  border-left:2px solid var(--ledger-green);font-size:12px;line-height:1.55;color:#cbd5e1;
}
.ih-ledger-tabs{display:flex;gap:6px;padding:0 22px 18px;flex-wrap:wrap;}
.ih-ledger-tab{
  font-size:11px;font-weight:600;color:#94a3b8;
  border:1px solid rgba(255,255,255,.1);padding:5px 10px;border-radius:6px;
}
.ih-ledger-tab-active{color:var(--ink);background:#ecfdf5;border-color:#ecfdf5;
  font-size:11px;font-weight:700;
  border-width:1px;border-style:solid;padding:5px 10px;border-radius:6px;}

/* --- Sections --- */
.ih-section{margin:64px 0;}
.ih-section-head{display:flex;justify-content:space-between;gap:28px;align-items:end;margin-bottom:20px;}
.ih-section-title{font-size:32px;line-height:1.15;font-weight:700;letter-spacing:-0.025em;margin:0;}
.ih-section-copy{color:var(--slate);line-height:1.65;margin:0;max-width:52ch;font-size:15px;}

/* --- Flow --- */
.ih-flow{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;}
.ih-flow-card{background:#fff;border:1px solid var(--line);border-radius:12px;padding:22px;}
.ih-flow-icon{
  width:36px;height:36px;border-radius:8px;background:var(--ledger-green-soft);
  display:flex;align-items:center;justify-content:center;color:var(--ledger-green);
  font-size:12px;font-weight:700;margin-bottom:14px;
}
.ih-flow-title{font-size:17px;margin:0 0 8px;font-weight:700;letter-spacing:-0.01em;}
.ih-flow-desc{font-size:14px;line-height:1.6;color:var(--slate);margin:0;}

/* --- Documents --- */
.ih-docs-panel{background:#fff;border:1px solid var(--line);border-radius:12px;padding:28px;}
.ih-docs-panel h2{font-size:26px;line-height:1.2;font-weight:700;letter-spacing:-0.02em;margin:0 0 14px;}
.ih-docs-panel p{color:var(--slate);line-height:1.65;margin:0 0 20px;font-size:14px;}
.ih-doc-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;}
.ih-doc-item{
  border:1px solid var(--line);border-radius:8px;padding:14px 16px;
  font-size:14px;color:var(--ink-soft);line-height:1.45;font-weight:500;
  background:var(--paper-dim);
}
.ih-doc-note{
  margin-top:18px;padding:14px 16px;background:var(--ledger-green-soft);
  border-radius:8px;font-size:13px;line-height:1.55;color:var(--ink-soft);
}

/* --- CTA Band --- */
.ih-cta-band{
  background:var(--ink);color:#f8fafc;padding:36px 32px;border-radius:12px;
  display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center;
}
.ih-cta-band h2{font-size:28px;line-height:1.15;margin:0 0 8px;font-weight:700;letter-spacing:-0.02em;}
.ih-cta-band p{margin:0;color:#94a3b8;line-height:1.6;font-size:15px;max-width:52ch;}

/* --- Footer --- */
.ih-footer{border-top:1px solid var(--line);padding-top:20px;margin-top:56px;display:flex;justify-content:space-between;gap:20px;color:var(--slate);font-size:13px;}
.ih-footer-mono{font-size:11px;font-weight:600;letter-spacing:0.05em;text-transform:uppercase;}

/* --- Responsive --- */
@media(max-width:1080px){
  .ih-hero h1{font-size:42px;}
}
@media(max-width:900px){
  .ih-nav{display:none;}
  .ih-mobile-cta{display:inline-flex;}
  .ih-hero{grid-template-columns:1fr;gap:28px;margin-bottom:48px;}
  .ih-hero h1{font-size:36px;}
  .ih-section-head{display:block;}
  .ih-section-copy{margin-top:10px;}
  .ih-flow{grid-template-columns:1fr;}
  .ih-doc-grid{grid-template-columns:1fr 1fr;}
  .ih-cta-band{grid-template-columns:1fr;padding:28px 22px;}
}
@media(max-width:560px){
  .ih-app{padding:0 18px 48px;}
  .ih-hero h1{font-size:30px;}
  .ih-hero-copy{font-size:15px;}
  .ih-section{margin:48px 0;}
  .ih-section-title{font-size:26px;}
  .ih-doc-grid{grid-template-columns:1fr;}
  .ih-footer{display:block;line-height:1.8;}
}
`;

/* ──────────────────────────────────────────────────────── */
/*  Page component                                          */
/* ──────────────────────────────────────────────────────── */
export default function InvestorHubPage() {
  const router = useRouter();
  return (
    <div className="ih-root">
      <style>{PAGE_CSS}</style>

      <div className="ih-app">

        {/* ── Topbar ── */}
        <header className="ih-topbar">
          <Link href="/investor-hub" className="ih-wordmark">
            <div className="ih-mark">QuestRock</div>
            <div className="ih-sub">Investor Hub</div>
          </Link>

          <nav className="ih-nav">
            <a href="#programs">Loan Programs</a>
            <a href="#process">How It Works</a>
            <a href="#documents">Documents</a>
            <Link href="/portal">My Portal</Link>
            <Link href="/investor-hub/apply" className="ih-header-cta">Start Intake</Link>
          </nav>

          <Link href="/investor-hub/apply" className="ih-header-cta ih-mobile-cta">Start</Link>
        </header>

        <main>

          {/* ── Hero ── */}
          <section className="ih-hero">
            <div>
              <div className="ih-kicker">Investor financing</div>
              <h1>
                Apply for your investor loan in <span>one guided flow.</span>
              </h1>
              <p className="ih-hero-copy">
                Tell us about your deal, property, and loan goals. The intake walks you through the right questions for your program and shows estimated LTV, DSCR, and other key numbers as you go.
              </p>
              <div className="ih-btn-row">
              <FlowButton
                text="Start Investor Intake"
                variant="green"
                size="md"
                onClick={() => router.push('/investor-hub/apply')}
              />
                <a href="#programs" className="ih-btn ih-btn-secondary">
                  View Loan Programs
                </a>
              </div>
              <div className="ih-hero-points">
                {[
                  'Step-by-step intake',
                  'Live LTV / DSCR estimates',
                  'Upload documents as you go',
                  'Save progress and return later',
                ].map(t => (
                  <div key={t} className="ih-hero-point">
                    <span className="ih-dot" />
                    {t}
                  </div>
                ))}
              </div>
            </div>

            {/* Ledger Preview */}
            <aside className="ih-ledger-wrap">
              <div className="ih-ledger-shadow" />
              <div className="ih-ledger">
                <div className="ih-ledger-head">
                  <div>
                    <div className="ih-lt">Loan Ledger</div>
                    <div className="ih-ls">Updates as you enter details</div>
                  </div>
                  <div className="ih-seal">YOUR<br />ESTIMATE</div>
                </div>
                <div className="ih-ledger-body">
                  {[
                    { k: 'Selected program',         v: 'DSCR Rental', type: 'hi' },
                    { k: 'Estimated property value', v: '$850,000',     type: 'hi' },
                    { k: 'Requested loan amount',    v: '$595,000',     type: 'hi' },
                    { k: 'Estimated LTV',            v: '70.0%',        type: 'reg' },
                    { k: 'Estimated monthly rent',   v: '$6,800',       type: 'reg' },
                    { k: 'Estimated DSCR',           v: '1.24x',        type: 'pos' },
                  ].map(({ k, v, type }) => (
                    <div key={k} className="ih-lrow">
                      <span className="ih-lk">{k}</span>
                      <span className={type === 'hi' ? 'ih-lv-hi' : type === 'pos' ? 'ih-lv-pos' : 'ih-lv'}>
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="ih-ledger-note">
                  Estimates update as you complete each section. Final terms depend on full review and documentation.
                </div>
                <div className="ih-ledger-tabs">
                  <span className="ih-ledger-tab-active">DSCR</span>
                  {['Bridge', 'Rehab', 'Portfolio', 'Construction'].map(t => (
                    <span key={t} className="ih-ledger-tab">{t}</span>
                  ))}
                </div>
              </div>
            </aside>
          </section>

          {/* ── Loan Programs ── */}
          <section className="ih-section" id="programs">
            <div className="ih-section-head">
              <div>
                <div className="ih-kicker">Loan programs</div>
                <h2 className="ih-section-title">Choose the program that fits your deal.</h2>
              </div>
              <p className="ih-section-copy">
                Each loan type has its own guided questions and calculations, so you only answer what applies to your scenario.
              </p>
            </div>

            <LoanProgramStrip />
          </section>

          {/* ── How It Works ── */}
          <section className="ih-section" id="process">
            <div className="ih-section-head">
              <div>
                <div className="ih-kicker">How it works</div>
                <h2 className="ih-section-title">Three steps to submit your application.</h2>
              </div>
              <p className="ih-section-copy">
                Most applicants finish in one sitting. You can also save your progress and come back when you have more details or documents ready.
              </p>
            </div>
            <div className="ih-flow">
              {[
                { n: '01', title: 'Choose your loan program', body: 'Select Portfolio, Bridge, Construction, DSCR, or Rehab. You will only see questions relevant to that program.' },
                { n: '02', title: 'Enter your deal details', body: 'Add property information, loan amount, entity details, and experience. See estimated LTV, DSCR, or other metrics update as you go.' },
                { n: '03', title: 'Submit your application', body: 'Review your entries, upload any documents you have on hand, and submit. Our team will follow up with next steps.' },
              ].map(({ n, title, body }) => (
                <div key={n} className="ih-flow-card">
                  <div className="ih-flow-icon">{n}</div>
                  <div className="ih-flow-title">{title}</div>
                  <p className="ih-flow-desc">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Documents ── */}
          <section className="ih-section" id="documents">
            <div className="ih-docs-panel">
              <div className="ih-kicker">Documents</div>
              <h2>Upload what you have now — add the rest later.</h2>
              <p>
                Required documents depend on your loan program and transaction type. The intake will show a checklist for your scenario. You can submit without every file and send remaining items when your team requests them.
              </p>
              <div className="ih-doc-grid">
                {[
                  'Purchase contract or PSA',
                  'Mortgage statement',
                  'Scope of work (rehab)',
                  'Proof of liquidity',
                  'Entity documents',
                  'Rent roll (portfolio / DSCR)',
                ].map(label => (
                  <div key={label} className="ih-doc-item">{label}</div>
                ))}
              </div>
              <div className="ih-doc-note">
                Exact requirements vary by program. You will see which documents apply to your application inside the intake form.
              </div>
            </div>
          </section>

          {/* ── CTA Band ── */}
          <section className="ih-cta-band">
            <div>
              <h2>Ready to get started?</h2>
              <p>
                Begin your application today. Our investor lending team will review your scenario and reach out with next steps.
              </p>
            </div>
            <div className="ih-btn-row">
              <FlowButton
                text="Start Investor Intake"
                variant="green"
                size="lg"
                onClick={() => router.push('/investor-hub/apply')}
              />
              <a href="#programs" className="ih-btn ih-btn-ghost-light">Choose Program</a>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="ih-footer">
          <div>© QuestRock Home Loans. All rights reserved.</div>
          <div className="ih-footer-mono">Business purpose loans only</div>
        </footer>

      </div>
    </div>
  );
}
