import { useEffect } from 'react';

const walkthroughStyles = `
*,*::before,*::after{box-sizing:border-box}
.wt-root{
  --bg:#FFFFFF;--card:#FFFFFF;--border:#E2E8F0;
  --teal:#01B8AA;--gold:#F59E0B;--coral:#EF4444;--cyan:#8AD4EB;--purple:#8B5CF6;
  --text:#0F172A;--muted:#475569;--dim:#94A3B8;
  --font:'DM Sans',sans-serif;--serif:'Playfair Display',Georgia,serif;
  font-family:var(--font);background:var(--bg);color:var(--text);line-height:1.6;overflow-x:hidden;
  margin:0;padding:0;min-height:100vh;
}
.wt-root a{color:var(--teal);text-decoration:none}
.wt-container{max-width:1140px;margin:0 auto;padding:0 24px}
.wt-section{padding:100px 0}
@media(max-width:768px){.wt-section{padding:60px 0}}
.wt-section-label{font-size:13px;font-weight:600;letter-spacing:2.5px;text-transform:uppercase;color:var(--teal);display:inline-block;margin-bottom:16px}
.wt-section-title{font-family:var(--serif);font-size:clamp(30px,5vw,44px);font-weight:800;line-height:1.15;margin-bottom:18px;color:var(--text)}
.wt-section-sub{font-size:17px;color:var(--muted);max-width:600px;margin:0 auto;line-height:1.65}
.wt-text-center{text-align:center}
.wt-grid{display:grid;gap:24px}
.wt-grid-2{grid-template-columns:repeat(2,1fr)}
.wt-grid-3{grid-template-columns:repeat(3,1fr)}
@media(max-width:900px){.wt-grid-3{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.wt-grid-2,.wt-grid-3{grid-template-columns:1fr}}

.wt-card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:32px;position:relative;overflow:hidden;transition:all .35s ease;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.03)}
.wt-card:hover{transform:translateY(-4px);border-color:rgba(1,184,170,0.4);box-shadow:0 8px 30px rgba(1,184,170,0.08),0 4px 12px rgba(0,0,0,0.04)}
.wt-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--teal);opacity:0;transition:opacity .3s}
.wt-card:hover::before{opacity:1}
.wt-card-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:20px}
.wt-card h3{font-size:17px;font-weight:700;margin-bottom:8px;color:var(--text)}
.wt-card p{font-size:14px;color:var(--muted);line-height:1.65}

.wt-tag{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid}
.wt-tag-teal{color:var(--teal);border-color:rgba(1,184,170,0.3);background:#F0FDFA}
.wt-tag-new{color:#fff;background:var(--teal);border-color:var(--teal);font-size:11px;letter-spacing:1px;text-transform:uppercase}

.wt-hero{min-height:100vh;display:flex;align-items:center;padding-top:60px;position:relative}
.wt-hero-bg{position:absolute;inset:0;background:linear-gradient(180deg,#F0FDFA 0%,#FFFFFF 60%,#FFFFFF 100%)}
.wt-hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(1,184,170,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(1,184,170,0.06) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,black 20%,transparent 70%);-webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,black 20%,transparent 70%)}
.wt-hero h1{font-family:var(--serif);font-size:clamp(36px,5.5vw,58px);font-weight:900;line-height:1.1;margin-bottom:20px;color:var(--text)}
.wt-hero h1 span{color:var(--teal)}
.wt-hero .wt-lead{font-size:18px;color:var(--muted);max-width:520px;line-height:1.7;margin:0 auto 36px}

.wt-nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:16px 0;transition:all .3s;background:rgba(255,255,255,0.8);backdrop-filter:blur(12px)}
.wt-nav.scrolled{padding:10px 0;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);box-shadow:0 1px 8px rgba(0,0,0,0.06)}
.wt-nav-inner{display:flex;align-items:center;justify-content:space-between}
.wt-nav-brand{font-size:18px;font-weight:700;display:flex;align-items:center;gap:8px;color:var(--text)}
.wt-nav-brand span{color:var(--teal)}
.wt-nav-links{display:flex;align-items:center;gap:28px;list-style:none;margin:0;padding:0}
.wt-nav-links a{color:var(--muted);font-size:14px;font-weight:500;transition:color .2s}
.wt-nav-links a:hover{color:var(--text)}
@media(max-width:768px){.wt-nav-links{display:none}}

.wt-workflow{display:flex;align-items:flex-start;gap:0;position:relative;justify-content:center;flex-wrap:wrap}
.wt-workflow-step{flex:1;min-width:200px;max-width:260px;text-align:center;position:relative;padding:0 16px}
.wt-workflow-num{width:52px;height:52px;border-radius:50%;border:2px solid var(--teal);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:var(--teal);margin:0 auto 16px;background:#FFFFFF;box-shadow:0 0 20px rgba(1,184,170,0.12),0 2px 8px rgba(0,0,0,0.04);position:relative;z-index:2}
.wt-workflow-step h4{font-size:15px;font-weight:700;margin-bottom:6px;color:var(--text)}
.wt-workflow-step p{font-size:13px;color:var(--muted);line-height:1.5}
.wt-workflow-line{position:absolute;top:26px;left:16%;right:16%;height:2px;background:linear-gradient(90deg,var(--teal),rgba(1,184,170,0.15),var(--teal));opacity:.3;z-index:1}
@media(max-width:600px){.wt-workflow-line{display:none}}

.wt-mockup{background:#FFFFFF;border:1px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.06),0 1px 4px rgba(0,0,0,0.03)}
.wt-mockup-header{padding:12px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;background:#F8FAFB}
.wt-mockup-dot{width:8px;height:8px;border-radius:50%}
.wt-mockup-body{padding:20px}
.wt-mockup-field{display:flex;flex-direction:column;gap:4px;margin-bottom:14px}
.wt-mockup-field label{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1px;font-weight:600}
.wt-mockup-field .wt-value{font-size:14px;padding:8px 12px;border-radius:8px;background:#F8FAFB;border:1px solid var(--border);color:var(--text)}
.wt-mockup-btn{display:inline-flex;align-items:center;gap:6px;padding:10px 20px;border-radius:10px;font-size:13px;font-weight:600;border:none;cursor:default}
.wt-mockup-btn-primary{background:var(--teal);color:#FFFFFF}
.wt-mockup-btn-outline{background:transparent;border:1px solid var(--border);color:var(--text)}
.wt-mockup-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600}
.wt-mockup-row{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #F1F5F9}
.wt-mockup-row:last-child{border-bottom:none}

.wt-feature-row{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.wt-feature-row.wt-reverse{direction:rtl}
.wt-feature-row.wt-reverse>*{direction:ltr}
@media(max-width:768px){.wt-feature-row,.wt-feature-row.wt-reverse{grid-template-columns:1fr;gap:32px}}
.wt-feature-text h3{font-family:var(--serif);font-size:clamp(24px,3.5vw,34px);font-weight:800;line-height:1.2;margin-bottom:16px;color:var(--text)}
.wt-feature-text p{font-size:15px;color:var(--muted);line-height:1.7;margin-bottom:20px}
.wt-feature-list{list-style:none;padding:0;margin:0}
.wt-feature-list li{display:flex;align-items:flex-start;gap:10px;padding:8px 0;font-size:14px;color:var(--muted)}
.wt-feature-list li::before{content:'';width:20px;height:20px;border-radius:50%;background:#F0FDFA;flex-shrink:0;margin-top:2px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2301B8AA' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center}

.wt-divider{height:1px;background:#E2E8F0}
.wt-toc{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:36px}
.wt-toc a{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:999px;font-size:13px;font-weight:600;color:var(--muted);border:1px solid var(--border);background:#FFFFFF;transition:all .2s;box-shadow:0 1px 3px rgba(0,0,0,0.03)}
.wt-toc a:hover{color:var(--teal);border-color:var(--teal);background:#F0FDFA}

.wt-stat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:40px}
@media(max-width:600px){.wt-stat-grid{grid-template-columns:repeat(2,1fr)}}
.wt-stat-card{background:#FFFFFF;border:1px solid var(--border);border-radius:14px;padding:20px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.04)}
.wt-stat-card .wt-num{font-size:32px;font-weight:800;color:var(--teal);line-height:1}
.wt-stat-card .wt-label{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:1.5px;margin-top:6px}

.wt-anim{opacity:0;transform:translateY(24px);transition:all .7s ease}
.wt-anim.wt-visible{opacity:1;transform:translateY(0)}

.wt-scroll-hint{position:absolute;bottom:40px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px}
.wt-scroll-hint span{font-size:12px;color:var(--dim);letter-spacing:2px;text-transform:uppercase}
.wt-scroll-arrow{width:24px;height:24px;border:2px solid var(--teal);border-radius:50%;display:flex;align-items:center;justify-content:center;animation:wtFloat 2s ease-in-out infinite}
.wt-scroll-arrow::after{content:'';width:6px;height:6px;border-right:2px solid var(--teal);border-bottom:2px solid var(--teal);transform:rotate(45deg) translateY(-2px)}

@keyframes wtFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes wtFadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes wtPulse{0%,100%{opacity:1}50%{opacity:.5}}
`;

export default function Walkthrough() {
  useEffect(() => {
    // Load Google Fonts
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800;900&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Scroll animation observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('wt-visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.wt-anim').forEach((el) => observer.observe(el));

    // Nav scroll effect
    const onScroll = () => {
      document.getElementById('wt-nav')?.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
      document.head.removeChild(link);
    };
  }, []);

  return (
    <>
      <style>{walkthroughStyles}</style>
      <div className="wt-root">

        {/* NAV */}
        <nav className="wt-nav" id="wt-nav">
          <div className="wt-container wt-nav-inner">
            <div className="wt-nav-brand">&#9670; In-Sync <span>Field-Sync</span></div>
            <ul className="wt-nav-links">
              <li><a href="#wt-overview">Overview</a></li>
              <li><a href="#wt-core">Features</a></li>
              <li><a href="#wt-orders">Orders</a></li>
              <li><a href="#wt-reimbursements">Reimbursements</a></li>
              <li><a href="#wt-analytics">Analytics</a></li>
              <li><a href="#wt-roles">Roles</a></li>
            </ul>
          </div>
        </nav>

        {/* HERO */}
        <section className="wt-hero">
          <div className="wt-hero-bg" />
          <div className="wt-hero-grid" />
          <div className="wt-container" style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
              <div className="wt-tag wt-tag-teal" style={{ marginBottom: 28, animation: 'wtFadeInUp .6s ease both' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)', animation: 'wtPulse 2s infinite' }} />
                Product Walkthrough
              </div>
              <h1 style={{ animation: 'wtFadeInUp .6s ease .1s both' }}>
                Your Complete<br /><span>Field Force Platform</span>
              </h1>
              <p className="wt-lead" style={{ animation: 'wtFadeInUp .6s ease .2s both' }}>
                From GPS-verified visits and daily planning to sales orders, payment collection, and travel reimbursements — everything your field team needs in one app.
              </p>
              <div className="wt-toc" style={{ animation: 'wtFadeInUp .6s ease .3s both' }}>
                <a href="#wt-visits">&#128205; Visits</a>
                <a href="#wt-leads">&#128100; Leads</a>
                <a href="#wt-orders">&#128722; Orders</a>
                <a href="#wt-reimbursements">&#128663; Reimbursements</a>
                <a href="#wt-attendance">&#9201; Attendance</a>
                <a href="#wt-analytics">&#128200; Analytics</a>
                <a href="#wt-settings">&#9881; Settings</a>
              </div>
            </div>
          </div>
          <div className="wt-scroll-hint">
            <span>Scroll</span>
            <div className="wt-scroll-arrow" />
          </div>
        </section>

        {/* OVERVIEW */}
        <div className="wt-divider" />
        <section className="wt-section" id="wt-overview" style={{ background: '#F8FAFB' }}>
          <div className="wt-container wt-text-center">
            <span className="wt-section-label">Platform Overview</span>
            <h2 className="wt-section-title">One Platform. Every Field Operation.</h2>
            <p className="wt-section-sub">In-Sync Field-Sync covers every aspect of field force management — built for Indian sales teams with offline-first architecture.</p>
            <div className="wt-stat-grid">
              {[
                { num: '15+', label: 'Modules' },
                { num: '3', label: 'Role Tiers' },
                { num: '100%', label: 'Offline Capable', color: 'var(--gold)' },
                { num: '\u20B999', label: 'Per User / Month' },
              ].map((s, i) => (
                <div key={i} className="wt-stat-card wt-anim">
                  <div className="wt-num" style={s.color ? { color: s.color } : undefined}>{s.num}</div>
                  <div className="wt-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CORE FEATURES */}
        <div className="wt-divider" />
        <section className="wt-section" id="wt-core">
          <div className="wt-container wt-text-center">
            <span className="wt-section-label">Core Features</span>
            <h2 className="wt-section-title">Everything Your Field Team Needs</h2>
            <p className="wt-section-sub">Purpose-built modules for visit tracking, lead management, daily planning, attendance, territory mapping, and more.</p>
            <div className="wt-grid wt-grid-3" style={{ marginTop: 48 }}>
              {[
                { icon: '\uD83D\uDCCD', bg: '#F0FDFA', title: 'GPS-Verified Visits', desc: 'Every visit is timestamped and GPS-verified. Check-in, capture photos, fill checklists, and check-out with precise coordinates.' },
                { icon: '\uD83D\uDC64', bg: '#FEF2F2', title: 'Lead Management', desc: 'Full prospect pipeline from New to Enrolled. Track calls, WhatsApp messages, visits, and follow-ups with activity timeline.' },
                { icon: '\uD83D\uDCCB', bg: '#FFFBEB', title: 'Daily Planning', desc: 'Agents set daily targets for prospects, quotes, and policies. Managers review and correct plans with full audit trail.' },
                { icon: '\u23F1', bg: '#F0F9FF', title: 'Attendance Tracking', desc: 'Punch in/out with GPS. Real-time timer, location history throughout the day, and monthly attendance summary.' },
                { icon: '\uD83C\uDF10', bg: '#FAF5FF', title: 'Territory Maps', desc: 'Interactive Mapbox maps with live agent markers, nearby places, route replay, and route deviation detection.' },
                { icon: '\uD83D\uDCC8', bg: '#F0FDFA', title: 'Analytics & Performance', desc: 'Branch analytics with milestone badges, performance leaderboard, AI insights, and org-wide KPI dashboards.' },
                { icon: '\uD83D\uDCF1', bg: '#FFFBEB', title: 'Offline-First PWA', desc: 'Works without internet using IndexedDB. Service worker for offline access. Background sync with conflict resolution.' },
                { icon: '\uD83D\uDC65', bg: '#FEF2F2', title: 'Team & Branch Management', desc: 'Org chart with reporting hierarchy, branch CRUD, team performance aggregates, and incentive leaderboard.' },
                { icon: '\uD83D\uDCB3', bg: '#F0F9FF', title: 'Subscription & Billing', desc: 'Multi-tier plans with Razorpay integration, trial tracking, invoice history, and subscription gating.' },
              ].map((f, i) => (
                <div key={i} className="wt-card wt-anim">
                  <div className="wt-card-icon" style={{ background: f.bg }}>{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VISITS */}
        <div className="wt-divider" />
        <section className="wt-section" id="wt-visits" style={{ background: '#F8FAFB' }}>
          <div className="wt-container">
            <div className="wt-feature-row">
              <div className="wt-feature-text wt-anim">
                <span className="wt-section-label">Visit Management</span>
                <h3>GPS-Verified Visits with Photos & Checklists</h3>
                <p>Field agents check in to visits with automatic GPS capture. During the visit, they can capture photos, fill checklists, add notes, book sales orders, and collect payments — all before checking out.</p>
                <ul className="wt-feature-list">
                  <li>Auto GPS capture at check-in and check-out</li>
                  <li>Photo capture with categories (selfie, document, property)</li>
                  <li>Customizable checklist templates per organization</li>
                  <li>Visit calendar and scheduling with rescheduling/cancellation</li>
                  <li>Route optimization for daily visit sequence</li>
                  <li>Route replay to visualize the agent's actual path</li>
                </ul>
              </div>
              <div className="wt-anim">
                <div className="wt-mockup">
                  <div className="wt-mockup-header">
                    <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>Visit Detail</span>
                    <span className="wt-mockup-badge" style={{ background: '#FEF3C7', color: '#D97706' }}>IN PROGRESS</span>
                  </div>
                  <div className="wt-mockup-body">
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>Anil Sharma</div>
                    <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 16 }}>Meeting · Health Insurance</div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                      <div style={{ flex: 1, padding: 10, borderRadius: 10, background: '#F0FDFA', border: '1px solid #D1FAE5' }}>
                        <div style={{ fontSize: 10, color: 'var(--dim)' }}>CHECK-IN</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>10:32 AM</div>
                        <div style={{ fontSize: 10, color: 'var(--dim)', fontFamily: "'JetBrains Mono'" }}>28.6139, 77.2090</div>
                      </div>
                      <div style={{ flex: 1, padding: 10, borderRadius: 10, background: '#F8FAFB', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10, color: 'var(--dim)' }}>DURATION</div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--teal)' }}>00:42:15</div>
                        <div style={{ fontSize: 10, color: 'var(--dim)' }}>Running...</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Checklist (2/3)</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)' }}><span style={{ color: 'var(--teal)' }}>&#10003;</span> Presented quote</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text)' }}><span style={{ color: 'var(--teal)' }}>&#10003;</span> Collected documents</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--dim)' }}>&#9744; Customer signed</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Photos (3)</div>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                      {[{ e: '\uD83D\uDCF7', bg: '#F0FDFA' }, { e: '\uD83D\uDCC4', bg: '#FFFBEB' }, { e: '\uD83C\uDFE0', bg: '#FEF2F2' }].map((p, i) => (
                        <div key={i} style={{ width: 48, height: 48, borderRadius: 8, background: p.bg, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{p.e}</div>
                      ))}
                    </div>
                    <div className="wt-mockup-btn wt-mockup-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>&#10003; Complete Visit</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* LEADS */}
        <div className="wt-divider" />
        <section className="wt-section" id="wt-leads">
          <div className="wt-container">
            <div className="wt-feature-row wt-reverse">
              <div className="wt-feature-text wt-anim">
                <span className="wt-section-label">Lead Management</span>
                <h3>Full Prospect Pipeline with Activity Timeline</h3>
                <p>Track every lead from first contact to enrollment. Log calls, WhatsApp conversations, visits, notes, and status changes.</p>
                <ul className="wt-feature-list">
                  <li>Pipeline: New → Contacted → Interested → Proposal → Enrolled</li>
                  <li>Bulk lead upload via CSV/Excel</li>
                  <li>Activity timeline with call logs, messages, and visit records</li>
                  <li>Lead assignment and disposition management</li>
                  <li>Insurance-specific fields: policy type, premium, proposal number</li>
                  <li>Auto location capture on first visit</li>
                </ul>
              </div>
              <div className="wt-anim">
                <div className="wt-mockup">
                  <div className="wt-mockup-header">
                    <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>Lead Pipeline</span>
                  </div>
                  <div className="wt-mockup-body">
                    <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                      <span className="wt-mockup-badge" style={{ background: '#EFF6FF', color: '#3B82F6' }}>New (12)</span>
                      <span className="wt-mockup-badge" style={{ background: '#F0FDFA', color: 'var(--teal)' }}>Contacted (8)</span>
                      <span className="wt-mockup-badge" style={{ background: '#FFFBEB', color: '#D97706' }}>Interested (5)</span>
                      <span className="wt-mockup-badge" style={{ background: '#F0FDF4', color: '#16A34A' }}>Enrolled (3)</span>
                    </div>
                    {[
                      { init: 'AS', name: 'Anil Sharma', detail: 'Health \u00B7 \u20B915,000/yr', status: 'Interested', bg: 'var(--teal)', sBg: '#FFFBEB', sColor: '#D97706' },
                      { init: 'PP', name: 'Priya Patel', detail: 'Life \u00B7 \u20B925,000/yr', status: 'Contacted', bg: 'var(--gold)', sBg: '#F0FDFA', sColor: 'var(--teal)' },
                      { init: 'RG', name: 'Rajesh Gupta', detail: 'Motor \u00B7 \u20B98,500/yr', status: 'New', bg: 'var(--coral)', sBg: '#EFF6FF', sColor: '#3B82F6' },
                    ].map((l, i) => (
                      <div key={i} className="wt-mockup-row">
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: l.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{l.init}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{l.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--dim)' }}>{l.detail}</div>
                        </div>
                        <span className="wt-mockup-badge" style={{ background: l.sBg, color: l.sColor }}>{l.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ORDERS & COLLECTIONS */}
        <div className="wt-divider" />
        <section className="wt-section" id="wt-orders" style={{ background: '#F8FAFB' }}>
          <div className="wt-container">
            <div className="wt-text-center" style={{ marginBottom: 48 }}>
              <div style={{ marginBottom: 12 }}><span className="wt-tag wt-tag-new">New Feature</span></div>
              <span className="wt-section-label">Sales Orders & Payment Collection</span>
              <h2 className="wt-section-title">Book Orders & Collect Payments<br />During Field Visits</h2>
              <p className="wt-section-sub">Field agents can now take sales orders or collect payments right from the visit detail screen. Submissions are automatically emailed to the configured notification address.</p>
            </div>

            <div className="wt-feature-row">
              <div className="wt-anim">
                <div className="wt-mockup">
                  <div className="wt-mockup-header">
                    <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>Orders & Collections</span>
                  </div>
                  <div className="wt-mockup-body">
                    <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <div style={{ flex: 1, padding: 8, textAlign: 'center', fontSize: 12, fontWeight: 600, background: 'var(--teal)', color: '#FFFFFF' }}>\uD83D\uDCE6 Sales Order</div>
                      <div style={{ flex: 1, padding: 8, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--muted)', background: '#F8FAFB' }}>\uD83D\uDCB0 Collect Payment</div>
                    </div>
                    <div className="wt-mockup-field"><label>Product / Service Name</label><div className="wt-value">Life Insurance - Term Plan</div></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="wt-mockup-field"><label>Quantity</label><div className="wt-value">1</div></div>
                      <div className="wt-mockup-field"><label>Unit Price (\u20B9)</label><div className="wt-value">25,000.00</div></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: '#F0FDFA', border: '1px solid #D1FAE5', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Total Amount</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--teal)' }}>\u20B925,000.00</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="wt-mockup-field"><label>Customer Name</label><div className="wt-value">Anil Sharma</div></div>
                      <div className="wt-mockup-field"><label>Phone</label><div className="wt-value">98765 43210</div></div>
                    </div>
                    <div className="wt-mockup-btn wt-mockup-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>&#10003; Submit Order</div>
                  </div>
                </div>
              </div>
              <div className="wt-feature-text wt-anim">
                <h3>Sales Orders</h3>
                <p>During an active visit, agents can book sales orders with product details, quantity, and pricing. The total is auto-calculated and the order details are emailed instantly.</p>
                <ul className="wt-feature-list">
                  <li>Product/service name, description, quantity, and unit price</li>
                  <li>Auto-calculated total amount</li>
                  <li>Customer name and phone pre-filled from lead</li>
                  <li>Optional remarks for special instructions</li>
                </ul>
                <div style={{ height: 24 }} />
                <h3>Payment Collection</h3>
                <p>Collect payments in the field with support for multiple payment modes. Reference numbers are tracked for reconciliation.</p>
                <ul className="wt-feature-list">
                  <li>Support for Cash, Cheque, UPI, Bank Transfer, Online</li>
                  <li>Payment reference number tracking</li>
                  <li>Instant email notification to configured address</li>
                  <li>History of all collections on the visit record</li>
                </ul>
              </div>
            </div>

            {/* Workflow */}
            <div className="wt-anim" style={{ marginTop: 64 }}>
              <h3 className="wt-text-center" style={{ fontSize: 18, marginBottom: 32, color: 'var(--muted)' }}>How the Email Notification Works</h3>
              <div className="wt-workflow" style={{ position: 'relative' }}>
                <div className="wt-workflow-line" />
                {[
                  { n: '1', e: '\uD83D\uDCDD', t: 'Agent Submits', d: 'Agent fills in order or payment details during an active visit and hits Submit' },
                  { n: '2', e: '\uD83D\uDCBE', t: 'Saved to Database', d: 'Record is saved with visit, lead, and agent details linked together' },
                  { n: '3', e: '\uD83D\uDCE7', t: 'Email Sent', d: 'Formatted email with full details is sent to the notification email configured in Settings' },
                  { n: '4', e: '\u2705', t: 'Confirmed', d: 'Record is marked as emailed. Visible on the visit detail page with "Emailed" badge' },
                ].map((s, i) => (
                  <div key={i} className="wt-workflow-step">
                    <div className="wt-workflow-num">{s.n}</div>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{s.e}</div>
                    <h4>{s.t}</h4>
                    <p>{s.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* TRAVEL REIMBURSEMENTS */}
        <div className="wt-divider" />
        <section className="wt-section" id="wt-reimbursements" style={{ background: '#FFFDF7' }}>
          <div className="wt-container">
            <div className="wt-text-center" style={{ marginBottom: 48 }}>
              <div style={{ marginBottom: 12 }}><span className="wt-tag wt-tag-new">New Feature</span></div>
              <span className="wt-section-label">Travel Reimbursements</span>
              <h2 className="wt-section-title">Flat-Rate Per-KM<br />Reimbursement Workflow</h2>
              <p className="wt-section-sub">Agents claim travel expenses based on distance. Auto-calculate from GPS data or enter manually. Claims flow through manager recommendation to HQ approval — with bulk actions.</p>
            </div>

            {/* Workflow */}
            <div className="wt-anim" style={{ marginBottom: 64 }}>
              <h3 className="wt-text-center" style={{ fontSize: 18, marginBottom: 32, color: 'var(--muted)' }}>Approval Workflow</h3>
              <div className="wt-workflow" style={{ position: 'relative' }}>
                <div className="wt-workflow-line" />
                {[
                  { n: '1', e: '\uD83D\uDC64', t: 'Agent Submits', d: 'Agent enters distance (or auto-calculates from GPS) and submits claim', tag: 'Submitted', tagClass: 'wt-tag-teal' },
                  { n: '2', e: '\uD83D\uDCBC', t: 'Manager Recommends', d: 'Branch manager reviews and recommends with optional remarks', tag: 'Recommended', tagStyle: { color: '#D97706', borderColor: 'rgba(245,158,11,0.3)', background: '#FFFBEB' } },
                  { n: '3', e: '\uD83C\uDFE2', t: 'HQ Approves / Rejects', d: 'Admin reviews and approves or rejects with reason. Supports bulk actions', badges: true },
                ].map((s, i) => (
                  <div key={i} className="wt-workflow-step">
                    <div className="wt-workflow-num" style={i === 0 ? { borderColor: '#3B82F6', color: '#3B82F6', boxShadow: '0 0 20px rgba(59,130,246,0.12)' } : i === 1 ? { borderColor: 'var(--gold)', color: 'var(--gold)', boxShadow: '0 0 20px rgba(245,158,11,0.12)' } : undefined}>{s.n}</div>
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{s.e}</div>
                    <h4>{s.t}</h4>
                    <p>{s.d}</p>
                    {s.tag && <div className="wt-tag" style={{ marginTop: 8, fontSize: 10, ...(s.tagStyle || { color: 'var(--teal)', borderColor: 'rgba(1,184,170,0.3)', background: '#F0FDFA' }) }}>{s.tag}</div>}
                    {s.badges && (
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 8 }}>
                        <span className="wt-mockup-badge" style={{ background: '#F0FDF4', color: '#16A34A', fontSize: 10 }}>Approved</span>
                        <span className="wt-mockup-badge" style={{ background: '#FEF2F2', color: 'var(--coral)', fontSize: 10 }}>Rejected</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Agent claim form */}
            <div className="wt-feature-row">
              <div className="wt-feature-text wt-anim">
                <h3>Agent: Submit Claims</h3>
                <p>Agents see their past claims and can submit new ones. The "Auto Calculate" button computes total distance from all GPS-verified visit check-in points using the Haversine formula.</p>
                <ul className="wt-feature-list">
                  <li>Select date and enter or auto-calculate distance</li>
                  <li>Amount auto-calculated: distance (km) x rate per km</li>
                  <li>Add route summary (e.g. "Office → Client A → Client B")</li>
                  <li>View all past claims with status badges</li>
                  <li>One claim per day (duplicate prevention)</li>
                </ul>
              </div>
              <div className="wt-anim">
                <div className="wt-mockup">
                  <div className="wt-mockup-header">
                    <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>New Reimbursement Claim</span>
                  </div>
                  <div className="wt-mockup-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div className="wt-mockup-field"><label>Claim Date</label><div className="wt-value">08 Mar 2026</div></div>
                      <div className="wt-mockup-field"><label>Rate per KM</label><div className="wt-value" style={{ color: 'var(--dim)' }}>\u20B9 8.50</div></div>
                    </div>
                    <div className="wt-mockup-field">
                      <label>Distance Travelled (KM)</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <div className="wt-value" style={{ flex: 1 }}>47.3</div>
                        <div className="wt-mockup-btn wt-mockup-btn-outline" style={{ padding: '8px 12px', fontSize: 11 }}>\uD83D\uDDFA Auto Calculate</div>
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--teal)', marginTop: 4 }}>\uD83D\uDCCD Calculated from 6 visit check-in locations</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderRadius: 10, background: '#F0FDFA', border: '1px solid #D1FAE5', marginBottom: 14 }}>
                      <span style={{ fontSize: 13, color: 'var(--text)' }}>47.3 km x \u20B98.50/km</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--teal)' }}>\u20B9402.05</span>
                    </div>
                    <div className="wt-mockup-field"><label>Route Summary</label><div className="wt-value" style={{ fontSize: 12, color: 'var(--muted)' }}>Office → Sharma (Dwarka) → Patel (Janakpuri) → Gupta (Rohini) → Office</div></div>
                    <div className="wt-mockup-btn wt-mockup-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>\uD83D\uDE97 Submit Claim</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin bulk approval */}
            <div style={{ marginTop: 64 }}>
              <div className="wt-feature-row wt-reverse">
                <div className="wt-feature-text wt-anim">
                  <h3>Manager: Review & Recommend</h3>
                  <p>Branch managers see all submitted claims from their direct reports. They can review each claim, add remarks, and recommend individually or use <strong>bulk recommend</strong> for efficiency.</p>
                  <ul className="wt-feature-list">
                    <li>See all team claims with agent name, distance, and amount</li>
                    <li>Select multiple claims with checkboxes</li>
                    <li>Bulk recommend with one click</li>
                    <li>Add optional remarks for HQ context</li>
                  </ul>
                  <div style={{ height: 24 }} />
                  <h3>HQ Admin: Approve or Reject</h3>
                  <p>Admins see all claims across the organization. Filter by status, select multiple, and perform <strong>bulk approve</strong> or <strong>bulk reject</strong> with optional rejection reasons.</p>
                  <ul className="wt-feature-list">
                    <li>Filter: Recommended, Submitted, Approved, Rejected, All</li>
                    <li>Summary cards: pending count and total approved amount</li>
                    <li>Bulk approve / bulk reject with reason</li>
                    <li>Full audit trail: who recommended, who approved, timestamps</li>
                  </ul>
                </div>
                <div className="wt-anim">
                  <div className="wt-mockup">
                    <div className="wt-mockup-header">
                      <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                      <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                      <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                      <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>HQ Approval Queue</span>
                      <span className="wt-mockup-badge" style={{ background: '#FEF2F2', color: 'var(--coral)' }}>4 Pending</span>
                    </div>
                    <div className="wt-mockup-body" style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                        <span className="wt-mockup-badge" style={{ background: 'var(--teal)', color: '#FFFFFF' }}>Recommended</span>
                        <span className="wt-mockup-badge" style={{ background: '#F1F5F9', color: 'var(--muted)' }}>Submitted</span>
                        <span className="wt-mockup-badge" style={{ background: '#F1F5F9', color: 'var(--muted)' }}>All</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#F8FAFB', marginBottom: 12, border: '1px solid var(--border)' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, flex: 1, color: 'var(--text)' }}>3 selected</span>
                        <div className="wt-mockup-btn wt-mockup-btn-primary" style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6 }}>&#10003; Approve All</div>
                        <div className="wt-mockup-btn" style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, background: '#FEF2F2', color: 'var(--coral)' }}>&#10007; Reject All</div>
                      </div>
                      {[
                        { name: 'Ravi Kumar', date: '07 Mar', km: '52.1', amt: '\u20B9442.85' },
                        { name: 'Meera Singh', date: '07 Mar', km: '38.7', amt: '\u20B9328.95' },
                        { name: 'Amit Verma', date: '06 Mar', km: '61.4', amt: '\u20B9521.90' },
                      ].map((r, i) => (
                        <div key={i} className="wt-mockup-row" style={{ padding: '8px 0' }}>
                          <input type="checkbox" defaultChecked style={{ accentColor: 'var(--teal)' }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.name}</div>
                            <div style={{ fontSize: 11, color: 'var(--dim)' }}>{r.date} \u00B7 {r.km} km \u00B7 \u20B98.50/km</div>
                          </div>
                          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal)' }}>{r.amt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ATTENDANCE */}
        <div className="wt-divider" />
        <section className="wt-section" id="wt-attendance">
          <div className="wt-container">
            <div className="wt-feature-row">
              <div className="wt-feature-text wt-anim">
                <span className="wt-section-label">Attendance & Location</span>
                <h3>GPS Punch-In with Live Tracking</h3>
                <p>Agents punch in at the start of their day. GPS location is captured and tracked throughout. Managers see the team's live positions on a territory map.</p>
                <ul className="wt-feature-list">
                  <li>Punch in/out with automatic GPS and timestamp</li>
                  <li>Real-time attendance timer showing session duration</li>
                  <li>Location tracked every 2 minutes during active shift</li>
                  <li>Route deviation detection (5 km threshold, alerts managers)</li>
                  <li>Route replay with speed control and progress slider</li>
                  <li>Monthly summary with days present, total hours, averages</li>
                </ul>
              </div>
              <div className="wt-anim">
                <div className="wt-mockup">
                  <div className="wt-mockup-header">
                    <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>Attendance</span>
                  </div>
                  <div className="wt-mockup-body" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 4 }}>ACTIVE SESSION</div>
                    <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--teal)', fontFamily: "'JetBrains Mono'", marginBottom: 4 }}>04:32:17</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 20 }}>Punched in at 09:15 AM</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'left', marginBottom: 16 }}>
                      <div style={{ padding: 10, borderRadius: 10, background: '#F0FDFA', border: '1px solid #D1FAE5' }}>
                        <div style={{ fontSize: 10, color: 'var(--dim)' }}>LOCATION</div>
                        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono'", color: 'var(--text)' }}>28.6139, 77.2090</div>
                      </div>
                      <div style={{ padding: 10, borderRadius: 10, background: '#F0FDFA', border: '1px solid #D1FAE5' }}>
                        <div style={{ fontSize: 10, color: 'var(--dim)' }}>VISITS TODAY</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--teal)' }}>5</div>
                      </div>
                    </div>
                    <div className="wt-mockup-btn" style={{ width: '100%', justifyContent: 'center', background: '#FEF2F2', color: 'var(--coral)', fontWeight: 600 }}>Punch Out</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ANALYTICS */}
        <div className="wt-divider" />
        <section className="wt-section" id="wt-analytics" style={{ background: '#F8FAFB' }}>
          <div className="wt-container">
            <div className="wt-feature-row wt-reverse">
              <div className="wt-feature-text wt-anim">
                <span className="wt-section-label">Analytics & Performance</span>
                <h3>Org-Wide Insights at a Glance</h3>
                <p>Multi-level analytics from individual agent performance to branch comparisons and org-wide trends. Gamification with milestone badges keeps teams motivated.</p>
                <ul className="wt-feature-list">
                  <li>Role-based dashboards: Agent, Manager, HQ Admin</li>
                  <li>Branch analytics with Gold/Silver/Bronze milestone badges</li>
                  <li>Performance leaderboard with top 10 rankings</li>
                  <li>Policy trends with line and bar charts</li>
                  <li>AI-powered insights tab</li>
                  <li>Territory map view with employee performance overlay</li>
                </ul>
              </div>
              <div className="wt-anim">
                <div className="wt-mockup">
                  <div className="wt-mockup-header">
                    <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>Performance Board</span>
                  </div>
                  <div className="wt-mockup-body">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                      {[
                        { v: '89%', l: 'Visit Rate', c: 'var(--teal)', bg: '#F0FDFA' },
                        { v: '42', l: 'Deals MTD', c: '#D97706', bg: '#FFFBEB' },
                        { v: '7', l: 'Overdue', c: 'var(--coral)', bg: '#FEF2F2' },
                      ].map((s, i) => (
                        <div key={i} style={{ textAlign: 'center', padding: 10, borderRadius: 10, background: s.bg, border: '1px solid var(--border)' }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
                          <div style={{ fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase' }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Top Performers</div>
                    {[
                      { e: '\uD83C\uDFC6', name: 'Ravi Kumar', d: '18 deals \u00B7 \u20B94.2L', badge: '\uD83C\uDFC6 Gold', bg: '#FFFBEB', c: '#D97706' },
                      { e: '\uD83E\uDD48', name: 'Meera Singh', d: '15 deals \u00B7 \u20B93.8L', badge: '\uD83E\uDD48 Silver', bg: '#F0F9FF', c: '#0EA5E9' },
                      { e: '\uD83E\uDD49', name: 'Amit Verma', d: '12 deals \u00B7 \u20B92.9L', badge: '\uD83E\uDD49 Bronze', bg: '#FAF5FF', c: 'var(--purple)' },
                    ].map((p, i) => (
                      <div key={i} className="wt-mockup-row">
                        <span style={{ fontSize: 16 }}>{p.e}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--dim)' }}>{p.d}</div>
                        </div>
                        <span className="wt-mockup-badge" style={{ background: p.bg, color: p.c }}>{p.badge}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SETTINGS */}
        <div className="wt-divider" />
        <section className="wt-section" id="wt-settings">
          <div className="wt-container">
            <div className="wt-feature-row">
              <div className="wt-feature-text wt-anim">
                <span className="wt-section-label">Organization Settings</span>
                <h3>Configure Notifications & Rates</h3>
                <p>Admins configure organization-wide settings including the notification email for orders/collections and the flat rate per kilometer for travel reimbursements.</p>
                <ul className="wt-feature-list">
                  <li><strong>Notification Email</strong> — Where sales orders and payment collection reports are sent</li>
                  <li><strong>Rate per KM</strong> — Flat rate used to calculate travel reimbursement amounts</li>
                  <li>Settings saved to organization profile, accessible from sidebar</li>
                  <li>Only visible to Admin, Super Admin, and Platform Admin roles</li>
                </ul>
              </div>
              <div className="wt-anim">
                <div className="wt-mockup">
                  <div className="wt-mockup-header">
                    <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                    <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                    <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>Organization Settings</span>
                  </div>
                  <div className="wt-mockup-body">
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}>\uD83D\uDCE7 Email Notifications</div>
                    <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 12 }}>Where orders and collections are emailed</div>
                    <div className="wt-mockup-field"><label>Notification Email</label><div className="wt-value">orders@acmeinsurance.com</div></div>
                    <div style={{ height: 16, borderBottom: '1px solid var(--border)', marginBottom: 16 }} />
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text)' }}>\uD83D\uDE97 Travel Reimbursement</div>
                    <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 12 }}>Flat rate for distance-based claims</div>
                    <div className="wt-mockup-field"><label>Rate per Kilometer (\u20B9)</label><div className="wt-value">8.50</div></div>
                    <div className="wt-mockup-btn wt-mockup-btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>\uD83D\uDCBE Save All Settings</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROLES */}
        <div className="wt-divider" />
        <section className="wt-section" id="wt-roles" style={{ background: '#F8FAFB' }}>
          <div className="wt-container wt-text-center">
            <span className="wt-section-label">Role-Based Access</span>
            <h2 className="wt-section-title">Every Role Gets the Right View</h2>
            <p className="wt-section-sub">Three tiers of access ensure everyone sees exactly what they need — no more, no less.</p>
            <div className="wt-grid wt-grid-3" style={{ marginTop: 48 }}>
              {[
                {
                  emoji: '\uD83C\uDFC3', role: 'Sales Officer / Field Agent', title: 'Plan, Visit, Close',
                  color: 'var(--teal)', borderColor: undefined,
                  items: ['Dashboard with personal metrics', 'Daily planning with targets', 'Visit management with photos', 'Orders & payment collection', 'Travel reimbursement claims', 'Attendance & territory map'],
                },
                {
                  emoji: '\uD83D\uDCCB', role: 'Branch Manager', title: 'Coach & Optimize',
                  color: '#D97706', borderColor: 'rgba(245,158,11,0.3)',
                  items: ['Everything in Sales Officer +', 'Team dashboard with aggregates', 'Plan correction with audit trail', 'Reimbursement recommendation', 'Team attendance & live tracking', 'Route deviation alerts'],
                },
                {
                  emoji: '\uD83C\uDFE2', role: 'Admin / HQ', title: 'Full Org Visibility',
                  color: 'var(--teal)', borderColor: 'rgba(1,184,170,0.3)',
                  items: ['Everything in Manager +', 'Org-wide analytics & KPIs', 'User & branch management', 'Bulk reimbursement approvals', 'Organization settings & billing', 'Subscription management'],
                },
              ].map((r, i) => (
                <div key={i} className="wt-card wt-anim" style={{ textAlign: 'center', borderColor: r.borderColor }}>
                  <div style={{ fontSize: 44, marginBottom: 12 }}>{r.emoji}</div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px', color: r.color, fontWeight: 600, marginBottom: 6 }}>{r.role}</div>
                  <h3>{r.title}</h3>
                  <ul style={{ listStyle: 'none', textAlign: 'left', marginTop: 16, padding: 0 }}>
                    {r.items.map((item, j) => (
                      <li key={j} style={{ padding: '6px 0', fontSize: 13, color: 'var(--muted)', borderBottom: j < r.items.length - 1 ? '1px solid #F1F5F9' : 'none', display: 'flex', gap: 8 }}>
                        <span style={{ color: r.color }}>&#10003;</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <div className="wt-divider" />
        <footer style={{ padding: '40px 0', textAlign: 'center', background: '#FFFFFF' }}>
          <div className="wt-container">
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
              &#9670; In-Sync <span style={{ color: 'var(--teal)' }}>Field-Sync</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--dim)', marginBottom: 16 }}>The complete field force management platform</p>
            <p style={{ fontSize: 12, color: 'var(--dim)' }}>&copy; 2026 In-Sync Field-Sync by ECR Technical Innovations Pvt. Ltd.</p>
          </div>
        </footer>

      </div>
    </>
  );
}
