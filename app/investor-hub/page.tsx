'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FlowButton } from '@/components/ui/flow-button';
import { LoanProgramStrip } from '@/components/ui/LoanProgramStrip';

/* ──────────────────────────────────────────────────────── */
/*  Inline styles (scoped to this page only)               */
/* ──────────────────────────────────────────────────────── */
const PAGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

.ih-root{
  --ink:#14213D;--ink-soft:#243759;
  --paper:#F7F5F0;--paper-dim:#EFEBE1;
  --ledger-green:#1F6F54;--ledger-green-soft:#E4EFE9;
  --brass:#B08D57;--brass-soft:#F0E6D3;
  --slate:#5B6472;--slate-light:#9AA1AC;
  --clay:#B3492D;--clay-soft:#F7E7E1;
  --line:#DAD4C4;
  background:var(--paper);color:var(--ink);
  font-family:'Inter',sans-serif;-webkit-font-smoothing:antialiased;min-height:100vh;
}
.ih-root *{box-sizing:border-box;}
.ih-root a{color:inherit;text-decoration:none;}
.ih-app{max-width:1180px;margin:0 auto;padding:0 28px 80px;}

/* --- Topbar --- */
.ih-topbar{
  display:flex;align-items:center;justify-content:space-between;
  padding:30px 0 22px;border-bottom:1px solid var(--line);margin-bottom:46px;gap:18px;
}
.ih-wordmark{display:flex;align-items:baseline;gap:10px;white-space:nowrap;}
.ih-mark{font-family:'Fraunces',serif;font-weight:600;font-size:23px;letter-spacing:-0.01em;}
.ih-sub{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--slate);letter-spacing:0.08em;text-transform:uppercase;}
.ih-nav{display:flex;align-items:center;gap:22px;font-size:13px;color:var(--slate);}
.ih-nav a:hover{color:var(--ink);}
.ih-header-cta{
  font-size:12.5px;font-weight:700;background:var(--ink);color:#fff;
  padding:10px 22px;border:1px solid var(--ink);cursor:pointer;
  display:inline-flex;align-items:center;border-radius:999px;
  letter-spacing:0.01em;transition:opacity .15s;
}
.ih-header-cta:hover{opacity:.88;}
.ih-mobile-cta{display:none;}

/* --- Buttons --- */
.ih-btn-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center;}
.ih-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  font-family:'Inter',sans-serif;font-weight:700;font-size:13.5px;
  padding:13px 24px;border:1.5px solid transparent;cursor:pointer;
  border-radius:999px;
  transition:opacity .15s, transform .1s, border-color .18s, background .18s, box-shadow .18s;
  letter-spacing:0.01em;
}
.ih-btn:active{transform:scale(0.97);}
.ih-btn-primary{background:var(--ink);color:#fff;border-color:var(--ink);box-shadow:0 2px 10px rgba(20,33,61,.18);}
.ih-btn-primary:hover{opacity:.92;}
.ih-btn-secondary{background:#fff;color:var(--ink);border-color:var(--line);box-shadow:0 1px 4px rgba(20,33,61,.06);}
.ih-btn-secondary:hover{border-color:var(--ink);box-shadow:0 4px 14px rgba(20,33,61,.10);}
.ih-btn-ghost-light{
  background:transparent;color:rgba(247,245,240,.82);
  border-color:rgba(247,245,240,.25);
}
.ih-btn-ghost-light:hover{background:rgba(247,245,240,.08);border-color:rgba(247,245,240,.45);color:#fff;}
.ih-btn-brass{background:var(--brass);color:#fff;border-color:var(--brass);box-shadow:0 2px 12px rgba(176,141,87,.28);}
.ih-btn-brass:hover{opacity:.92;box-shadow:0 4px 18px rgba(176,141,87,.38);}
.ih-program-chip{
  display:inline-flex;align-items:center;font-family:'IBM Plex Mono',monospace;
  font-size:10.5px;letter-spacing:0.07em;text-transform:uppercase;
  color:var(--ledger-green);background:var(--ledger-green-soft);padding:7px 12px;border-radius:20px;
}
.ih-kicker{
  display:inline-flex;align-items:center;gap:8px;font-family:'IBM Plex Mono',monospace;
  font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--brass);margin-bottom:16px;
}
.ih-kicker:before{content:"";width:26px;height:1px;background:var(--brass);display:inline-block;}

/* --- Hero --- */
.ih-hero{display:grid;grid-template-columns:1.08fr .92fr;gap:42px;align-items:center;margin-bottom:70px;}
.ih-hero h1{
  font-family:'Fraunces',serif;font-weight:600;font-size:62px;line-height:1.01;
  letter-spacing:-0.035em;margin:0 0 20px;
}
.ih-hero h1 span{color:var(--ledger-green);}
.ih-hero-copy{color:var(--slate);font-size:17px;line-height:1.7;margin:0 0 28px;}
.ih-hero-points{display:flex;flex-wrap:wrap;gap:10px;margin:24px 0 0;}
.ih-hero-point{
  display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);
  padding:8px 14px;border-radius:999px;font-size:12.5px;color:var(--ink-soft);
  box-shadow:0 1px 3px rgba(20,33,61,.05);
}
.ih-dot{width:7px;height:7px;border-radius:50%;background:var(--ledger-green);flex-shrink:0;}

/* --- Ledger --- */
.ih-ledger-wrap{position:relative;}
.ih-ledger-shadow{
  position:absolute;inset:28px -14px -14px 28px;
  border:1px solid var(--line);background:var(--paper-dim);z-index:0;
  pointer-events:none;
}
.ih-ledger{
  position:relative;z-index:1;background:var(--ink);color:var(--paper);
  overflow:hidden;box-shadow:0 1px 2px rgba(20,33,61,.06), 0 12px 36px rgba(20,33,61,.08);
}
.ih-ledger-head{
  padding:24px 26px 18px;border-bottom:1px dashed rgba(247,245,240,.25);
  display:flex;justify-content:space-between;align-items:flex-start;gap:18px;
}
.ih-lt{font-family:'Fraunces',serif;font-size:20px;font-weight:600;}
.ih-ls{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:var(--brass);letter-spacing:.08em;text-transform:uppercase;margin-top:4px;}
.ih-seal{
  width:58px;height:58px;border-radius:50%;border:1.5px solid var(--brass);
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  font-family:'IBM Plex Mono',monospace;font-size:9px;color:var(--brass);text-align:center;line-height:1.15;
}
.ih-ledger-body{padding:24px 26px 10px;}
.ih-lrow{
  display:flex;justify-content:space-between;align-items:baseline;gap:18px;
  padding:11px 0;border-bottom:1px dashed rgba(247,245,240,.14);font-size:12.5px;
}
.ih-lrow:last-child{border-bottom:none;}
.ih-lk{color:rgba(247,245,240,.62);}
.ih-lv{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:500;color:var(--paper);text-align:right;}
.ih-lv-hi{font-family:'IBM Plex Mono',monospace;font-size:16px;font-weight:600;color:#fff;text-align:right;}
.ih-lv-pos{font-family:'IBM Plex Mono',monospace;font-size:13px;font-weight:500;color:#8FD9BD;text-align:right;}
.ih-ledger-note{
  margin:16px 26px 24px;padding:12px 14px;background:rgba(247,245,240,.06);
  border-left:2px solid var(--brass);font-size:12px;line-height:1.55;color:rgba(247,245,240,.85);
}
.ih-ledger-tabs{display:flex;gap:7px;padding:0 26px 22px;flex-wrap:wrap;}
.ih-ledger-tab{
  font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:rgba(247,245,240,.72);
  border:1px solid rgba(247,245,240,.16);padding:6px 9px;border-radius:18px;
}
.ih-ledger-tab-active{color:var(--ink);background:var(--brass-soft);border-color:var(--brass-soft);
  font-family:'IBM Plex Mono',monospace;font-size:10.5px;
  border-width:1px;border-style:solid;padding:6px 9px;border-radius:18px;}

/* --- Sections --- */
.ih-section{margin:76px 0;}
.ih-section-head{display:flex;justify-content:space-between;gap:28px;align-items:end;margin-bottom:24px;}
.ih-section-title{font-family:'Fraunces',serif;font-size:37px;line-height:1.12;font-weight:600;letter-spacing:-.02em;margin:0;}
.ih-section-copy{color:var(--slate);line-height:1.65;margin:0;max-width:52ch;font-size:14.5px;}

/* --- Loan Cards --- */
.ih-loan-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;}
.ih-loan-card{
  background:#fff;border:1px solid var(--line);padding:20px 18px;min-height:210px;
  box-shadow:0 1px 2px rgba(20,33,61,.05), 0 8px 24px rgba(20,33,61,.05);
  display:flex;flex-direction:column;
  transition:transform .15s, border-color .15s, box-shadow .15s;cursor:pointer;
}
.ih-loan-card:hover{transform:translateY(-2px);border-color:var(--brass);box-shadow:0 1px 2px rgba(20,33,61,.06), 0 12px 36px rgba(20,33,61,.08);}
.ih-loan-num{font-family:'IBM Plex Mono',monospace;color:var(--brass);font-size:11px;margin-bottom:16px;}
.ih-loan-title{font-family:'Fraunces',serif;font-size:20px;line-height:1.18;margin:0 0 10px;font-weight:600;}
.ih-loan-desc{font-size:12.5px;color:var(--slate);line-height:1.55;margin:0 0 18px;}
.ih-card-link{margin-top:auto;font-size:12.5px;font-weight:800;color:var(--ledger-green);}

/* --- Flow --- */
.ih-flow{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;}
.ih-flow-card{background:#fff;border:1px solid var(--line);box-shadow:0 1px 2px rgba(20,33,61,.05), 0 8px 24px rgba(20,33,61,.05);padding:24px;}
.ih-flow-icon{
  width:42px;height:42px;border-radius:50%;border:1px solid var(--brass);
  display:flex;align-items:center;justify-content:center;color:var(--brass);
  font-family:'IBM Plex Mono',monospace;font-size:12px;margin-bottom:18px;
}
.ih-flow-title{font-family:'Fraunces',serif;font-size:21px;margin:0 0 8px;font-weight:600;}
.ih-flow-desc{font-size:13px;line-height:1.65;color:var(--slate);margin:0;}

/* --- Split --- */
.ih-split{display:grid;grid-template-columns:.9fr 1.1fr;gap:28px;align-items:stretch;}
.ih-panel{background:#fff;border:1px solid var(--line);box-shadow:0 1px 2px rgba(20,33,61,.05), 0 8px 24px rgba(20,33,61,.05);padding:30px;}
.ih-panel-dark{background:var(--ink);color:#fff;border:1px solid var(--line);box-shadow:0 1px 2px rgba(20,33,61,.05), 0 8px 24px rgba(20,33,61,.05);padding:30px;}
.ih-panel h2,.ih-panel-dark h2{font-family:'Fraunces',serif;font-size:32px;line-height:1.15;font-weight:600;letter-spacing:-.02em;margin:0 0 16px;}
.ih-panel p{color:var(--slate);line-height:1.65;margin:0 0 18px;font-size:14px;}
.ih-panel-dark p{color:rgba(247,245,240,.72);line-height:1.65;margin:0 0 18px;font-size:14px;}
.ih-checklist{display:grid;gap:12px;margin-top:18px;}
.ih-check{display:flex;gap:10px;align-items:flex-start;font-size:13px;color:var(--ink-soft);line-height:1.55;}
.ih-check::before{content:"✓";font-weight:800;color:var(--ledger-green);flex-shrink:0;}
.ih-doc-stack{display:grid;gap:9px;margin-top:20px;}
.ih-doc-row{
  display:flex;justify-content:space-between;gap:16px;align-items:center;
  border:1px solid rgba(247,245,240,.16);padding:12px 14px;font-size:12.5px;color:rgba(247,245,240,.86);
}
.ih-doc-status{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#8FD9BD;flex-shrink:0;}
.ih-doc-missing{font-family:'IBM Plex Mono',monospace;font-size:10.5px;color:#E8A184;flex-shrink:0;}

/* --- CTA Band --- */
.ih-cta-band{
  background:var(--ink);color:var(--paper);padding:46px;
  display:grid;grid-template-columns:1fr auto;gap:30px;align-items:center;
  box-shadow:0 1px 2px rgba(20,33,61,.06), 0 12px 36px rgba(20,33,61,.08);
}
.ih-cta-band h2{font-family:'Fraunces',serif;font-size:38px;line-height:1.1;margin:0 0 10px;font-weight:600;}
.ih-cta-band p{margin:0;color:rgba(247,245,240,.72);line-height:1.6;font-size:14.5px;}

/* --- Footer --- */
.ih-footer{border-top:1px solid var(--line);padding-top:24px;margin-top:64px;display:flex;justify-content:space-between;gap:20px;color:var(--slate);font-size:12px;}
.ih-footer-mono{font-family:'IBM Plex Mono',monospace;text-transform:uppercase;letter-spacing:.06em;}

/* --- Responsive --- */
@media(max-width:1080px){
  .ih-hero h1{font-size:54px;}
  .ih-loan-grid{grid-template-columns:repeat(3,1fr);}
}
@media(max-width:900px){
  .ih-nav{display:none;}
  .ih-mobile-cta{display:inline-flex;}
  .ih-hero{grid-template-columns:1fr;gap:34px;margin-bottom:54px;}
  .ih-hero h1{font-size:46px;}
  .ih-section-head{display:block;}
  .ih-section-copy{margin-top:12px;}
  .ih-loan-grid{grid-template-columns:1fr 1fr;}
  .ih-flow{grid-template-columns:1fr;}
  .ih-split{grid-template-columns:1fr;}
  .ih-cta-band{grid-template-columns:1fr;padding:34px 26px;}
}
@media(max-width:560px){
  .ih-app{padding:0 18px 60px;}
  .ih-hero h1{font-size:38px;}
  .ih-hero-copy{font-size:15.5px;}
  .ih-loan-grid{grid-template-columns:1fr;}
  .ih-section{margin:58px 0;}
  .ih-section-title{font-size:31px;}
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
            <Link href="/investor-hub/apply" className="ih-header-cta">Start Intake</Link>
          </nav>

          <Link href="/investor-hub/apply" className="ih-header-cta ih-mobile-cta">Start</Link>
        </header>

        <main>

          {/* ── Hero ── */}
          <section className="ih-hero">
            <div>
              <div className="ih-kicker">Private capital for investors</div>
              <h1>
                Investor loan intake, built for <span>speed and clarity.</span>
              </h1>
              <p className="ih-hero-copy">
                Submit your scenario once. QuestRock's Investor Hub guides you through the right loan flow, builds a live Loan Ledger, collects documents, and routes the file to the right team for review.
              </p>
              <div className="ih-btn-row">
                <FlowButton
                  text="Start Investor Intake"
                  variant="dark"
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
                  'Live LTV / DSCR snapshot',
                  'Upload docs as you go',
                  'CRM + LendingPad ready',
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
                    <div className="ih-ls">Live intake preview</div>
                  </div>
                  <div className="ih-seal">READY FOR<br />TERM SHEET</div>
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
                  Key fields captured. Missing documents can be uploaded now or added after submission.
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
                <h2 className="ih-section-title">Choose the intake path that fits the deal.</h2>
              </div>
              <p className="ih-section-copy">
                Each program has its own guided flow, document checklist, and Loan Ledger calculations, so investors do not have to fight through irrelevant fields.
              </p>
            </div>

            <LoanProgramStrip />
          </section>

          {/* ── How It Works ── */}
          <section className="ih-section" id="process">
            <div className="ih-section-head">
              <div>
                <div className="ih-kicker">How it works</div>
                <h2 className="ih-section-title">From scenario to review-ready file.</h2>
              </div>
              <p className="ih-section-copy">
                The hub is designed to reduce back-and-forth. Borrowers enter the scenario, the portal structures the numbers, and QuestRock receives a clean internal summary.
              </p>
            </div>
            <div className="ih-flow">
              {[
                { n: '01', title: 'Select the loan path',    body: 'Borrowers choose Portfolio, Bridge, Construction, DSCR, or Rehab, then only see the questions relevant to that program.' },
                { n: '02', title: 'Build the Loan Ledger',   body: 'The portal calculates LTV, LTC, ARV percentage, cash-out, portfolio totals, or DSCR based on the selected loan type.' },
                { n: '03', title: 'Submit to QuestRock',     body: 'The application, documents, missing items, and AI-generated summary route to the internal team for fast review.' },
              ].map(({ n, title, body }) => (
                <div key={n} className="ih-flow-card">
                  <div className="ih-flow-icon">{n}</div>
                  <div className="ih-flow-title">{title}</div>
                  <p className="ih-flow-desc">{body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Split Feature ── */}
          <section className="ih-section ih-split" id="documents">
            <div className="ih-panel">
              <div className="ih-kicker">Built for underwriting</div>
              <h2>Collect the right data before the first call.</h2>
              <p>
                The Investor Hub turns loose borrower scenarios into structured loan files with property details, entity info, investor experience, liquidity, and document status.
              </p>
              <div className="ih-checklist">
                {[
                  'Property or portfolio builder with rent, taxes, insurance, HOA, mortgage balances, and occupancy.',
                  'Program-specific branches for Bridge exit strategy, DSCR income, construction budgets, and rehab ARV.',
                  'Friendly guideline warnings without hard-declining the borrower too early.',
                  'AI summary prepared for QuestRock\'s internal review team.',
                ].map((item, i) => (
                  <div key={i} className="ih-check">{item}</div>
                ))}
              </div>
            </div>

            <div className="ih-panel-dark">
              <span className="ih-program-chip">Document checklist</span>
              <h2 style={{ marginTop: 18 }}>Upload now, complete later.</h2>
              <p>
                Borrowers can submit with missing documents, but the hub clearly shows what is still needed before underwriting.
              </p>
              <div className="ih-doc-stack">
                {[
                  { label: 'Purchase contract',   status: 'UPLOADED', missing: false },
                  { label: 'Mortgage statement',  status: 'UPLOADED', missing: false },
                  { label: 'Scope of work',       status: 'MISSING',  missing: true },
                  { label: 'Proof of liquidity',  status: 'REQUESTED', missing: true },
                  { label: 'Entity documents',    status: 'UPLOADED', missing: false },
                ].map(({ label, status, missing }) => (
                  <div key={label} className="ih-doc-row">
                    <span>{label}</span>
                    <span className={missing ? 'ih-doc-missing' : 'ih-doc-status'}>{status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA Band ── */}
          <section className="ih-cta-band">
            <div>
              <h2>Ready to structure your investor loan?</h2>
              <p>
                Start the guided intake and QuestRock will receive a cleaner file with the numbers, documents, and next steps already organized.
              </p>
            </div>
            <div className="ih-btn-row">
              <FlowButton
                text="Start Investor Intake"
                variant="brass"
                size="lg"
                onClick={() => router.push('/investor-hub/apply')}
              />
              <a href="#programs" className="ih-btn ih-btn-ghost-light">Choose Program</a>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer className="ih-footer">
          <div>© QuestRock Home Loans. Investor Hub intake experience.</div>
          <div className="ih-footer-mono">Business purpose loans only</div>
        </footer>

      </div>
    </div>
  );
}
