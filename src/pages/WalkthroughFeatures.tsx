import { useEffect, useState } from 'react';

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
.wt-grid-4{grid-template-columns:repeat(4,1fr)}
@media(max-width:900px){.wt-grid-3,.wt-grid-4{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.wt-grid-2,.wt-grid-3,.wt-grid-4{grid-template-columns:1fr}}

.wt-card{background:var(--card);border:1px solid var(--border);border-radius:18px;padding:32px;position:relative;overflow:hidden;transition:all .35s ease;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.03)}
.wt-card:hover{transform:translateY(-4px);border-color:rgba(1,184,170,0.4);box-shadow:0 8px 30px rgba(1,184,170,0.08),0 4px 12px rgba(0,0,0,0.04)}
.wt-card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px;background:var(--teal);opacity:0;transition:opacity .3s}
.wt-card:hover::before{opacity:1}
.wt-card-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;margin-bottom:20px}
.wt-card h3{font-size:17px;font-weight:700;margin-bottom:8px;color:var(--text)}
.wt-card p{font-size:14px;color:var(--muted);line-height:1.65}

.wt-tag{display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid}
.wt-tag-teal{color:var(--teal);border-color:rgba(1,184,170,0.3);background:#F0FDFA}

.wt-hero{min-height:100vh;display:flex;align-items:center;padding-top:60px;position:relative}
.wt-hero-bg{position:absolute;inset:0;background:linear-gradient(180deg,#F0FDFA 0%,#FFFFFF 60%,#FFFFFF 100%)}
.wt-hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(1,184,170,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(1,184,170,0.06) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,black 20%,transparent 70%);-webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 40%,black 20%,transparent 70%)}
.wt-hero h1{font-family:var(--serif);font-size:clamp(36px,5.5vw,58px);font-weight:900;line-height:1.1;margin-bottom:20px;color:var(--text)}
.wt-hero h1 span{color:var(--teal)}
.wt-hero .wt-lead{font-size:18px;color:var(--muted);max-width:560px;line-height:1.7;margin:0 auto 36px}

.wt-nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:16px 0;transition:all .3s;background:rgba(255,255,255,0.8);backdrop-filter:blur(12px)}
.wt-nav.scrolled{padding:10px 0;background:rgba(255,255,255,0.95);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);box-shadow:0 1px 8px rgba(0,0,0,0.06)}
.wt-nav-inner{display:flex;align-items:center;justify-content:space-between}
.wt-nav-brand{font-size:18px;font-weight:700;display:flex;align-items:center;gap:8px;color:var(--text)}
.wt-nav-brand span{color:var(--teal)}
.wt-nav-links{display:flex;align-items:center;gap:6px;list-style:none;margin:0;padding:0}
.wt-nav-links button{color:var(--muted);font-size:14px;font-weight:500;transition:all .2s;background:none;border:none;cursor:pointer;padding:8px 16px;border-radius:999px;font-family:var(--font)}
.wt-nav-links button:hover{color:var(--text);background:#F1F5F9}
.wt-nav-links button.wt-active{color:var(--teal);background:#F0FDFA;font-weight:600}
@media(max-width:768px){.wt-nav-links{display:none}}

.wt-role-tabs{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.wt-role-tab{display:flex;align-items:center;gap:8px;padding:14px 28px;border-radius:14px;font-size:15px;font-weight:600;border:2px solid var(--border);background:#FFFFFF;cursor:pointer;transition:all .3s;color:var(--muted);font-family:var(--font)}
.wt-role-tab:hover{border-color:rgba(1,184,170,0.4);color:var(--text)}
.wt-role-tab.active{border-color:var(--teal);background:#F0FDFA;color:var(--teal);box-shadow:0 4px 16px rgba(1,184,170,0.12)}
.wt-role-tab .wt-tab-icon{font-size:20px}
@media(max-width:600px){.wt-role-tab{padding:10px 18px;font-size:13px}.wt-role-tab .wt-tab-icon{font-size:16px}}

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

.wt-role-header{display:flex;align-items:center;gap:16px;margin-bottom:48px}
.wt-role-icon{width:64px;height:64px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:32px}
.wt-role-header h2{font-family:var(--serif);font-size:clamp(28px,4vw,40px);font-weight:800;line-height:1.15;color:var(--text);margin:0}
.wt-role-header p{font-size:15px;color:var(--muted);margin:4px 0 0}

@keyframes wtFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
@keyframes wtFadeInUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
@keyframes wtPulse{0%,100%{opacity:1}50%{opacity:.5}}

/* Embedded / iframe mode — compact spacing */
.wt-root.wt-embedded .wt-section{padding:60px 0}
.wt-root.wt-embedded .wt-role-header{margin-bottom:32px}
.wt-root.wt-embedded .wt-role-header h2{font-size:clamp(22px,3.5vw,32px)}
.wt-root.wt-embedded .wt-section-title{font-size:clamp(24px,4vw,34px)}
@media(max-width:768px){.wt-root.wt-embedded .wt-section{padding:40px 0}}
`;

type RoleTab = 'agent' | 'team' | 'branch' | 'hq';

export default function WalkthroughFeatures() {
  const [activeRole, setActiveRole] = useState<RoleTab>('agent');
  const isEmbedded = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800;900&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('wt-visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.wt-anim').forEach((el) => observer.observe(el));

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

  // Re-observe animations when role changes
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add('wt-visible');
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    // Small delay to let React render new elements
    const timer = setTimeout(() => {
      document.querySelectorAll('.wt-anim:not(.wt-visible)').forEach((el) => observer.observe(el));
    }, 50);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [activeRole]);

  const scrollToRole = (role: RoleTab) => {
    setActiveRole(role);
    document.getElementById('wt-roles')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <style>{walkthroughStyles}</style>
      <div className={`wt-root${isEmbedded ? ' wt-embedded' : ''}`}>

        {!isEmbedded && (
          <>
            {/* NAV */}
            <nav className="wt-nav" id="wt-nav">
              <div className="wt-container wt-nav-inner">
                <div className="wt-nav-brand">&#9670; In-Sync <span>Field-Sync</span></div>
                <ul className="wt-nav-links">
                  <li><button className={activeRole === 'agent' ? 'wt-active' : ''} onClick={() => scrollToRole('agent')}>Agent</button></li>
                  <li><button className={activeRole === 'team' ? 'wt-active' : ''} onClick={() => scrollToRole('team')}>Team</button></li>
                  <li><button className={activeRole === 'branch' ? 'wt-active' : ''} onClick={() => scrollToRole('branch')}>Branch</button></li>
                  <li><button className={activeRole === 'hq' ? 'wt-active' : ''} onClick={() => scrollToRole('hq')}>HQ</button></li>
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
                    How <span>Field-Sync</span><br />Works For You
                  </h1>
                  <p className="wt-lead" style={{ animation: 'wtFadeInUp .6s ease .2s both' }}>
                    See exactly how each role uses Field-Sync day to day &mdash; from the field agent on the ground to the HQ admin overseeing everything.
                  </p>
                  <div className="wt-role-tabs" style={{ animation: 'wtFadeInUp .6s ease .3s both' }}>
                    {[
                      { key: 'agent' as RoleTab, icon: '\uD83C\uDFC3', label: 'Agent' },
                      { key: 'team' as RoleTab, icon: '\uD83D\uDC65', label: 'Team Manager' },
                      { key: 'branch' as RoleTab, icon: '\uD83C\uDFE2', label: 'Branch' },
                      { key: 'hq' as RoleTab, icon: '\uD83C\uDF10', label: 'HQ Admin' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        className={`wt-role-tab ${activeRole === tab.key ? 'active' : ''}`}
                        onClick={() => scrollToRole(tab.key)}
                      >
                        <span className="wt-tab-icon">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="wt-scroll-hint">
                <span>Scroll</span>
                <div className="wt-scroll-arrow" />
              </div>
            </section>

            <div className="wt-divider" />
          </>
        )}

        {/* Sticky role tabs when embedded */}
        {isEmbedded && (
          <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '12px 0' }}>
            <div className="wt-container" style={{ display: 'flex', justifyContent: 'center' }}>
              <div className="wt-role-tabs">
                {[
                  { key: 'agent' as RoleTab, icon: '\uD83C\uDFC3', label: 'Agent' },
                  { key: 'team' as RoleTab, icon: '\uD83D\uDC65', label: 'Team Manager' },
                  { key: 'branch' as RoleTab, icon: '\uD83C\uDFE2', label: 'Branch' },
                  { key: 'hq' as RoleTab, icon: '\uD83C\uDF10', label: 'HQ Admin' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    className={`wt-role-tab ${activeRole === tab.key ? 'active' : ''}`}
                    onClick={() => { setActiveRole(tab.key); document.getElementById('wt-roles')?.scrollIntoView({ behavior: 'smooth' }); }}
                  >
                    <span className="wt-tab-icon">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ROLE CONTENT */}
        <div id="wt-roles">

          {/* ─── AGENT ─── */}
          {activeRole === 'agent' && (
            <>
              {/* Agent: Daily Workflow */}
              <section className="wt-section" style={{ background: '#F8FAFB' }}>
                <div className="wt-container">
                  <div className="wt-role-header wt-anim">
                    <div className="wt-role-icon" style={{ background: '#F0FDFA' }}>{'\uD83C\uDFC3'}</div>
                    <div>
                      <h2>Field Agent</h2>
                      <p>Your day-to-day workflow in the field</p>
                    </div>
                  </div>

                  {/* Daily Workflow Steps */}
                  <div className="wt-anim">
                    <h3 className="wt-text-center" style={{ fontSize: 18, marginBottom: 32, color: 'var(--muted)' }}>A Day in the Life</h3>
                    <div className="wt-workflow" style={{ position: 'relative' }}>
                      <div className="wt-workflow-line" />
                      {[
                        { n: '1', e: '\u23F0', t: 'Punch In', d: 'Start your day with GPS-verified attendance. Your location is recorded automatically.' },
                        { n: '2', e: '\uD83D\uDCCB', t: 'Plan Your Day', d: 'Set targets for prospects, quotes, and sales. List markets to visit.' },
                        { n: '3', e: '\uD83D\uDCCD', t: 'Visit Clients', d: 'Check in at each client location. Take photos, fill checklists, book orders.' },
                        { n: '4', e: '\uD83D\uDCCA', t: 'Review & Close', d: 'Submit reimbursements, update leads, and punch out for the day.' },
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

              {/* Agent: Dashboard */}
              <div className="wt-divider" />
              <section className="wt-section">
                <div className="wt-container">
                  <div className="wt-feature-row">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">Dashboard</span>
                      <h3>Your Personal Command Centre</h3>
                      <p>See everything that matters at a glance &mdash; today's visits, active sessions, overdue follow-ups, and your performance metrics.</p>
                      <ul className="wt-feature-list">
                        <li>Today's visits completed vs planned</li>
                        <li>Active visit with live duration timer</li>
                        <li>Overdue follow-ups with quick call buttons</li>
                        <li>Weekly visit trend chart</li>
                        <li>Setup checklist for new agents</li>
                      </ul>
                    </div>
                    <div className="wt-anim">
                      <div className="wt-mockup">
                        <div className="wt-mockup-header">
                          <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>My Dashboard</span>
                        </div>
                        <div className="wt-mockup-body">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                            {[
                              { v: '5/8', l: 'Visits Today', c: 'var(--teal)', bg: '#F0FDFA' },
                              { v: '00:42', l: 'Active Visit', c: '#D97706', bg: '#FFFBEB' },
                              { v: '3', l: 'Follow-ups', c: 'var(--coral)', bg: '#FEF2F2' },
                            ].map((s, i) => (
                              <div key={i} style={{ textAlign: 'center', padding: 10, borderRadius: 10, background: s.bg, border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 22, fontWeight: 800, color: s.c }}>{s.v}</div>
                                <div style={{ fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase' }}>{s.l}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Recent Visits</div>
                          {[
                            { name: 'Anil Sharma', time: '10:30 AM', status: 'Completed', sColor: '#16A34A', sBg: '#F0FDF4' },
                            { name: 'Priya Patel', time: '11:45 AM', status: 'In Progress', sColor: '#D97706', sBg: '#FFFBEB' },
                            { name: 'Rajesh Gupta', time: '2:00 PM', status: 'Scheduled', sColor: '#3B82F6', sBg: '#EFF6FF' },
                          ].map((v, i) => (
                            <div key={i} className="wt-mockup-row">
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{v.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--dim)' }}>{v.time}</div>
                              </div>
                              <span className="wt-mockup-badge" style={{ background: v.sBg, color: v.sColor }}>{v.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Agent: Daily Planning */}
              <div className="wt-divider" />
              <section className="wt-section" style={{ background: '#F8FAFB' }}>
                <div className="wt-container">
                  <div className="wt-feature-row wt-reverse">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">Daily Planning</span>
                      <h3>Set Targets, Track Progress</h3>
                      <p>Every morning, plan your day by setting targets for prospects, quotes, and sales. Specify which markets you'll visit and which customers you plan to close.</p>
                      <ul className="wt-feature-list">
                        <li>Set daily targets for prospects, quotes, and policies</li>
                        <li>List markets to visit for the day</li>
                        <li>Enroll planned policies with customer details</li>
                        <li>Track target vs achievement in real time</li>
                        <li>Works offline &mdash; syncs when connected</li>
                      </ul>
                    </div>
                    <div className="wt-anim">
                      <div className="wt-mockup">
                        <div className="wt-mockup-header">
                          <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>Daily Plan</span>
                        </div>
                        <div className="wt-mockup-body">
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text)' }}>Today's Targets</div>
                          {[
                            { label: 'Prospects', target: '10', actual: '7', pct: 70, color: 'var(--teal)' },
                            { label: 'Quotes', target: '5', actual: '3', pct: 60, color: 'var(--gold)' },
                            { label: 'Policies', target: '2', actual: '1', pct: 50, color: 'var(--purple)' },
                          ].map((t, i) => (
                            <div key={i} style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{t.label}</span>
                                <span style={{ color: 'var(--dim)' }}>{t.actual}/{t.target}</span>
                              </div>
                              <div style={{ height: 6, borderRadius: 3, background: '#F1F5F9', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${t.pct}%`, borderRadius: 3, background: t.color, transition: 'width .5s' }} />
                              </div>
                            </div>
                          ))}
                          <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Markets</div>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                            {['Dwarka', 'Janakpuri', 'Rohini'].map((m, i) => (
                              <span key={i} className="wt-mockup-badge" style={{ background: '#F0FDFA', color: 'var(--teal)' }}>{m}</span>
                            ))}
                          </div>
                          <div className="wt-mockup-btn wt-mockup-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Submit Plan</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Agent: Visits */}
              <div className="wt-divider" />
              <section className="wt-section">
                <div className="wt-container">
                  <div className="wt-feature-row">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">Visit Management</span>
                      <h3>GPS-Verified Visits with Photos & Checklists</h3>
                      <p>Check in at each client with automatic GPS capture. Take photos, fill checklists, book orders, collect payments &mdash; all during the visit.</p>
                      <ul className="wt-feature-list">
                        <li>Auto GPS capture at check-in and check-out</li>
                        <li>Photo capture with categories (selfie, document, property)</li>
                        <li>Customizable checklists per organization</li>
                        <li>Book sales orders and collect payments during visits</li>
                        <li>Visit calendar with scheduling and rescheduling</li>
                        <li>Navigate to client location via Google Maps</li>
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
                          <div style={{ fontSize: 12, color: 'var(--dim)', marginBottom: 16 }}>Meeting &middot; Health Insurance</div>
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
                          <div className="wt-mockup-btn wt-mockup-btn-primary" style={{ width: '100%', justifyContent: 'center' }}>&#10003; Complete Visit</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Agent: Leads */}
              <div className="wt-divider" />
              <section className="wt-section" style={{ background: '#F8FAFB' }}>
                <div className="wt-container">
                  <div className="wt-feature-row wt-reverse">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">Lead Management</span>
                      <h3>Track Every Prospect Through the Pipeline</h3>
                      <p>Manage your entire prospect pipeline. Log calls, schedule follow-ups, and track each lead from first contact to conversion.</p>
                      <ul className="wt-feature-list">
                        <li>Pipeline stages: New, Contacted, Interested, Proposal, Enrolled</li>
                        <li>Quick call and WhatsApp buttons for instant contact</li>
                        <li>Follow-up scheduling with overdue alerts</li>
                        <li>Bulk lead upload via CSV</li>
                        <li>Activity timeline for every interaction</li>
                      </ul>
                    </div>
                    <div className="wt-anim">
                      <div className="wt-mockup">
                        <div className="wt-mockup-header">
                          <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>My Leads</span>
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

              {/* Agent: Attendance & Reimbursements */}
              <div className="wt-divider" />
              <section className="wt-section">
                <div className="wt-container">
                  <div className="wt-feature-row">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">Attendance & Travel</span>
                      <h3>Punch In, Track Distance, Claim Expenses</h3>
                      <p>GPS-verified attendance with live session timer. Submit travel reimbursements with auto-calculated distance from your visit locations.</p>
                      <ul className="wt-feature-list">
                        <li>Punch in/out with GPS and timestamp</li>
                        <li>Live session timer throughout the day</li>
                        <li>Monthly attendance summary and calendar</li>
                        <li>Auto-calculate travel distance from visit check-ins</li>
                        <li>Submit reimbursement claims with route summary</li>
                        <li>Track claim status: Submitted, Recommended, Approved</li>
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

              {/* Agent: Territory Map */}
              <div className="wt-divider" />
              <section className="wt-section" style={{ background: '#F8FAFB' }}>
                <div className="wt-container wt-text-center">
                  <div className="wt-anim">
                    <span className="wt-section-label">Territory Map</span>
                    <h2 className="wt-section-title">Your Territory at a Glance</h2>
                    <p className="wt-section-sub">Interactive map showing your assigned leads, today's visits, route history, and nearby business opportunities.</p>
                  </div>
                  <div className="wt-grid wt-grid-4" style={{ marginTop: 48 }}>
                    {[
                      { icon: '\uD83D\uDCCD', title: 'Lead Pins', desc: 'All your leads plotted on the map with status colours' },
                      { icon: '\uD83D\uDDFA', title: 'Route History', desc: 'Replay your path from the day with timestamps' },
                      { icon: '\uD83D\uDCF1', title: 'Navigate', desc: 'One-tap navigation to any lead via Google Maps' },
                      { icon: '\uD83C\uDFEA', title: 'Nearby Places', desc: 'Discover nearby businesses for cold-calling' },
                    ].map((f, i) => (
                      <div key={i} className="wt-card wt-anim" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                        <h3>{f.title}</h3>
                        <p>{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ─── TEAM MANAGER ─── */}
          {activeRole === 'team' && (
            <>
              {/* Team: Dashboard */}
              <section className="wt-section" style={{ background: '#F8FAFB' }}>
                <div className="wt-container">
                  <div className="wt-role-header wt-anim">
                    <div className="wt-role-icon" style={{ background: '#FFFBEB' }}>{'\uD83D\uDC65'}</div>
                    <div>
                      <h2>Team Manager</h2>
                      <p>Monitor, coach, and optimise your team's performance</p>
                    </div>
                  </div>

                  <div className="wt-feature-row">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">Team Dashboard</span>
                      <h3>Real-Time Team Performance</h3>
                      <p>Your dashboard aggregates everything across your team &mdash; visits, attendance, targets, and sales performance in one view.</p>
                      <ul className="wt-feature-list">
                        <li>Total team visits today and active agent count</li>
                        <li>Attendance rate across the team</li>
                        <li>Target vs achievement for prospects, quotes, and sales</li>
                        <li>30-day sales trend and visits by day of week</li>
                        <li>Leaderboard with Gold/Silver/Bronze badges</li>
                        <li>Individual performance table with incentive calculations</li>
                      </ul>
                    </div>
                    <div className="wt-anim">
                      <div className="wt-mockup">
                        <div className="wt-mockup-header">
                          <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>Team Dashboard</span>
                        </div>
                        <div className="wt-mockup-body">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
                            {[
                              { v: '32', l: 'Visits', c: 'var(--teal)' },
                              { v: '8/10', l: 'Active', c: '#3B82F6' },
                              { v: '87%', l: 'Attendance', c: '#16A34A' },
                              { v: '72%', l: 'Plan Done', c: 'var(--gold)' },
                            ].map((s, i) => (
                              <div key={i} style={{ textAlign: 'center', padding: 8, borderRadius: 8, background: '#F8FAFB', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.v}</div>
                                <div style={{ fontSize: 8, color: 'var(--dim)', textTransform: 'uppercase' }}>{s.l}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Top Performers</div>
                          {[
                            { e: '\uD83C\uDFC6', name: 'Ravi Kumar', d: '18 deals \u00B7 \u20B94.2L', badge: 'Gold', bg: '#FFFBEB', c: '#D97706' },
                            { e: '\uD83E\uDD48', name: 'Meera Singh', d: '15 deals \u00B7 \u20B93.8L', badge: 'Silver', bg: '#F0F9FF', c: '#0EA5E9' },
                            { e: '\uD83E\uDD49', name: 'Amit Verma', d: '12 deals \u00B7 \u20B92.9L', badge: 'Bronze', bg: '#FAF5FF', c: 'var(--purple)' },
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

              {/* Team: Plan Review */}
              <div className="wt-divider" />
              <section className="wt-section">
                <div className="wt-container">
                  <div className="wt-feature-row wt-reverse">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">Plan Review</span>
                      <h3>Review and Correct Team Plans</h3>
                      <p>See every team member's daily plan side by side. Review their targets, correct if needed, and track aggregated team performance.</p>
                      <ul className="wt-feature-list">
                        <li>View all team members' plans for any date</li>
                        <li>Edit and correct individual targets</li>
                        <li>Aggregated team prospects, quotes, and policies</li>
                        <li>Team incentive toppers for the month</li>
                        <li>Full audit trail of plan changes</li>
                      </ul>
                    </div>
                    <div className="wt-anim">
                      <div className="wt-mockup">
                        <div className="wt-mockup-header">
                          <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>Team Plans &middot; 09 Mar 2026</span>
                        </div>
                        <div className="wt-mockup-body">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                            {[
                              { v: '45', l: 'Prospects', pct: '78%', c: 'var(--teal)' },
                              { v: '22', l: 'Quotes', pct: '65%', c: 'var(--gold)' },
                              { v: '8', l: 'Policies', pct: '53%', c: 'var(--purple)' },
                            ].map((s, i) => (
                              <div key={i} style={{ textAlign: 'center', padding: 10, borderRadius: 10, background: '#F8FAFB', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                                <div style={{ fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase' }}>{s.l}</div>
                                <div style={{ fontSize: 10, color: s.c, fontWeight: 600 }}>{s.pct}</div>
                              </div>
                            ))}
                          </div>
                          {[
                            { name: 'Ravi Kumar', p: '12', q: '5', s: '2', done: true },
                            { name: 'Meera Singh', p: '10', q: '4', s: '1', done: true },
                            { name: 'Amit Verma', p: '8', q: '3', s: '0', done: false },
                          ].map((m, i) => (
                            <div key={i} className="wt-mockup-row">
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{m.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--dim)' }}>P:{m.p} Q:{m.q} S:{m.s}</div>
                              </div>
                              <span className="wt-mockup-badge" style={{ background: m.done ? '#F0FDF4' : '#FFFBEB', color: m.done ? '#16A34A' : '#D97706' }}>{m.done ? 'Submitted' : 'Pending'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Team: Live Tracking & Reimbursements */}
              <div className="wt-divider" />
              <section className="wt-section" style={{ background: '#F8FAFB' }}>
                <div className="wt-container">
                  <div className="wt-feature-row">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">Team Oversight</span>
                      <h3>Live Tracking & Reimbursement Approvals</h3>
                      <p>Monitor your team's real-time location on the territory map. Review and recommend reimbursement claims before they go to HQ.</p>
                      <ul className="wt-feature-list">
                        <li>Live agent positions on territory map</li>
                        <li>Route replay to verify agent movements</li>
                        <li>Route deviation alerts (5 km threshold)</li>
                        <li>Review team reimbursement claims</li>
                        <li>Bulk recommend claims with optional remarks</li>
                        <li>Team attendance tracking and compliance</li>
                      </ul>
                    </div>
                    <div className="wt-anim">
                      <div className="wt-mockup">
                        <div className="wt-mockup-header">
                          <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>Team Claims</span>
                          <span className="wt-mockup-badge" style={{ background: '#FFFBEB', color: '#D97706' }}>5 Pending</span>
                        </div>
                        <div className="wt-mockup-body" style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, background: '#F8FAFB', marginBottom: 12, border: '1px solid var(--border)' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, flex: 1, color: 'var(--text)' }}>2 selected</span>
                            <div className="wt-mockup-btn wt-mockup-btn-primary" style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6 }}>Recommend</div>
                          </div>
                          {[
                            { name: 'Ravi Kumar', date: '08 Mar', km: '52.1', amt: '\u20B9442.85' },
                            { name: 'Meera Singh', date: '08 Mar', km: '38.7', amt: '\u20B9328.95' },
                            { name: 'Amit Verma', date: '07 Mar', km: '61.4', amt: '\u20B9521.90' },
                          ].map((r, i) => (
                            <div key={i} className="wt-mockup-row" style={{ padding: '8px 0' }}>
                              <input type="checkbox" defaultChecked={i < 2} readOnly style={{ accentColor: 'var(--teal)' }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--dim)' }}>{r.date} &middot; {r.km} km</div>
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal)' }}>{r.amt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ─── BRANCH ─── */}
          {activeRole === 'branch' && (
            <>
              <section className="wt-section" style={{ background: '#F8FAFB' }}>
                <div className="wt-container">
                  <div className="wt-role-header wt-anim">
                    <div className="wt-role-icon" style={{ background: '#FAF5FF' }}>{'\uD83C\uDFE2'}</div>
                    <div>
                      <h2>Branch Manager</h2>
                      <p>Oversee branch operations, manage teams, and drive performance</p>
                    </div>
                  </div>

                  <div className="wt-feature-row">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">Branch Analytics</span>
                      <h3>Complete Branch Performance View</h3>
                      <p>Drill into branch-level KPIs, compare agent performance, view visit distribution, and identify top performers across your branch.</p>
                      <ul className="wt-feature-list">
                        <li>Branch-level KPIs: visits, sales, attendance</li>
                        <li>Agent-wise target vs actual comparison</li>
                        <li>Visit status distribution (completed, in progress, cancelled)</li>
                        <li>Sales trend charts for the branch</li>
                        <li>Performance badges and incentive tracking</li>
                        <li>Agent detail sheets with full metrics</li>
                      </ul>
                    </div>
                    <div className="wt-anim">
                      <div className="wt-mockup">
                        <div className="wt-mockup-header">
                          <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>Branch: Delhi West</span>
                        </div>
                        <div className="wt-mockup-body">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
                            {[
                              { v: '156', l: 'Visits MTD', c: 'var(--teal)' },
                              { v: '\u20B912.4L', l: 'Sales', c: '#16A34A' },
                              { v: '91%', l: 'Attendance', c: '#3B82F6' },
                            ].map((s, i) => (
                              <div key={i} style={{ textAlign: 'center', padding: 10, borderRadius: 10, background: '#F8FAFB', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</div>
                                <div style={{ fontSize: 9, color: 'var(--dim)', textTransform: 'uppercase' }}>{s.l}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Agent Performance</div>
                          {[
                            { name: 'Ravi Kumar', target: '20', actual: '18', pct: '90%', c: '#16A34A' },
                            { name: 'Meera Singh', target: '20', actual: '15', pct: '75%', c: 'var(--gold)' },
                            { name: 'Amit Verma', target: '20', actual: '12', pct: '60%', c: 'var(--coral)' },
                          ].map((a, i) => (
                            <div key={i} className="wt-mockup-row">
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{a.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--dim)' }}>Target: {a.target} &middot; Actual: {a.actual}</div>
                              </div>
                              <span className="wt-mockup-badge" style={{ background: i === 0 ? '#F0FDF4' : i === 1 ? '#FFFBEB' : '#FEF2F2', color: a.c }}>{a.pct}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Branch: Team & Territory Management */}
              <div className="wt-divider" />
              <section className="wt-section">
                <div className="wt-container">
                  <div className="wt-feature-row wt-reverse">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">Team & Territory</span>
                      <h3>Manage Your Branch Operations</h3>
                      <p>View your team hierarchy, track all agents on the territory map, and manage leads across the branch.</p>
                      <ul className="wt-feature-list">
                        <li>Team hierarchy with reporting structure</li>
                        <li>Territory map with all branch agents</li>
                        <li>Live agent tracking during work hours</li>
                        <li>Branch-level lead management</li>
                        <li>Attendance compliance monitoring</li>
                        <li>Route deviation detection and alerts</li>
                      </ul>
                    </div>
                    <div className="wt-anim">
                      <div className="wt-mockup">
                        <div className="wt-mockup-header">
                          <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>Territory Map</span>
                          <span className="wt-mockup-badge" style={{ background: '#F0FDFA', color: 'var(--teal)' }}>8 Live</span>
                        </div>
                        <div className="wt-mockup-body" style={{ padding: 0 }}>
                          <div style={{ height: 200, background: 'linear-gradient(135deg, #F0FDFA 0%, #E0F7FA 50%, #F0F9FF 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                            <div style={{ fontSize: 12, color: 'var(--dim)' }}>Interactive Territory Map</div>
                            {/* Agent pins */}
                            {[
                              { left: '25%', top: '30%', color: 'var(--teal)' },
                              { left: '60%', top: '45%', color: 'var(--gold)' },
                              { left: '40%', top: '65%', color: 'var(--teal)' },
                              { left: '75%', top: '25%', color: 'var(--coral)' },
                              { left: '35%', top: '40%', color: 'var(--teal)' },
                            ].map((pin, i) => (
                              <div key={i} style={{ position: 'absolute', left: pin.left, top: pin.top, width: 12, height: 12, borderRadius: '50%', background: pin.color, border: '2px solid #FFFFFF', boxShadow: `0 0 8px ${pin.color}40` }} />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Branch: Performance Board */}
              <div className="wt-divider" />
              <section className="wt-section" style={{ background: '#F8FAFB' }}>
                <div className="wt-container wt-text-center">
                  <div className="wt-anim">
                    <span className="wt-section-label">Performance & Incentives</span>
                    <h2 className="wt-section-title">Motivate with Visibility</h2>
                    <p className="wt-section-sub">Performance leaderboards, milestone badges, and incentive tracking keep the branch competitive and motivated.</p>
                  </div>
                  <div className="wt-grid wt-grid-3" style={{ marginTop: 48 }}>
                    {[
                      { icon: '\uD83C\uDFC6', title: 'Leaderboard', desc: 'Top performers ranked by sales, visits, and conversion rates with Gold/Silver/Bronze badges' },
                      { icon: '\uD83D\uDCB0', title: 'Incentive Tracking', desc: 'Monthly incentive calculations per agent with automatic tracking against targets' },
                      { icon: '\uD83D\uDCC8', title: 'Trend Analysis', desc: '30-day sales trends, visits by day of week, and target achievement over time' },
                    ].map((f, i) => (
                      <div key={i} className="wt-card wt-anim" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                        <h3>{f.title}</h3>
                        <p>{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

          {/* ─── HQ ADMIN ─── */}
          {activeRole === 'hq' && (
            <>
              <section className="wt-section" style={{ background: '#F8FAFB' }}>
                <div className="wt-container">
                  <div className="wt-role-header wt-anim">
                    <div className="wt-role-icon" style={{ background: '#F0FDFA' }}>{'\uD83C\uDF10'}</div>
                    <div>
                      <h2>HQ Admin</h2>
                      <p>Full organisation visibility and control</p>
                    </div>
                  </div>

                  <div className="wt-feature-row">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">Organisation Dashboard</span>
                      <h3>Org-Wide KPIs at a Glance</h3>
                      <p>See the big picture &mdash; total visits, active agents, attendance rates, and plan achievement across every branch in the organisation.</p>
                      <ul className="wt-feature-list">
                        <li>Organisation-wide visit and agent counts</li>
                        <li>Branch-wise performance comparison</li>
                        <li>Sales target vs actual across all branches</li>
                        <li>Multi-branch radar chart comparison</li>
                        <li>Daily sales trend per branch</li>
                        <li>Low attendance alerts for branches below 50%</li>
                      </ul>
                    </div>
                    <div className="wt-anim">
                      <div className="wt-mockup">
                        <div className="wt-mockup-header">
                          <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>HQ Dashboard</span>
                        </div>
                        <div className="wt-mockup-body">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
                            {[
                              { v: '248', l: 'Visits', c: 'var(--teal)' },
                              { v: '42', l: 'Agents', c: '#3B82F6' },
                              { v: '89%', l: 'Attendance', c: '#16A34A' },
                              { v: '76%', l: 'Plan Done', c: 'var(--gold)' },
                            ].map((s, i) => (
                              <div key={i} style={{ textAlign: 'center', padding: 8, borderRadius: 8, background: '#F8FAFB', border: '1px solid var(--border)' }}>
                                <div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</div>
                                <div style={{ fontSize: 8, color: 'var(--dim)', textTransform: 'uppercase' }}>{s.l}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>Branch Performance</div>
                          {[
                            { name: 'Delhi West', agents: '12', sales: '\u20B918.5L', pct: '92%', c: '#16A34A' },
                            { name: 'Mumbai Central', agents: '15', sales: '\u20B922.1L', pct: '88%', c: 'var(--teal)' },
                            { name: 'Bangalore East', agents: '8', sales: '\u20B99.8L', pct: '74%', c: 'var(--gold)' },
                          ].map((b, i) => (
                            <div key={i} className="wt-mockup-row">
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{b.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--dim)' }}>{b.agents} agents &middot; {b.sales}</div>
                              </div>
                              <span className="wt-mockup-badge" style={{ background: i === 0 ? '#F0FDF4' : i === 1 ? '#F0FDFA' : '#FFFBEB', color: b.c }}>{b.pct}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* HQ: User & Branch Management */}
              <div className="wt-divider" />
              <section className="wt-section">
                <div className="wt-container">
                  <div className="wt-feature-row wt-reverse">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">User & Branch Management</span>
                      <h3>Build Your Organisation Structure</h3>
                      <p>Create branches, add users with roles, set up reporting hierarchies, and manage the entire org structure from one place.</p>
                      <ul className="wt-feature-list">
                        <li>Create and manage branches with location details</li>
                        <li>Add users with roles: Agent, Manager, Admin</li>
                        <li>Assign agents to branches and managers</li>
                        <li>Org chart with full reporting hierarchy</li>
                        <li>Bulk user import via CSV</li>
                        <li>Reset passwords and deactivate users</li>
                      </ul>
                    </div>
                    <div className="wt-anim">
                      <div className="wt-mockup">
                        <div className="wt-mockup-header">
                          <div className="wt-mockup-dot" style={{ background: 'var(--coral)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--gold)' }} />
                          <div className="wt-mockup-dot" style={{ background: 'var(--teal)' }} />
                          <span style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--dim)' }}>User Management</span>
                        </div>
                        <div className="wt-mockup-body">
                          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                            <div className="wt-mockup-btn wt-mockup-btn-primary" style={{ padding: '8px 14px', fontSize: 12 }}>+ Add User</div>
                            <div className="wt-mockup-btn wt-mockup-btn-outline" style={{ padding: '8px 14px', fontSize: 12 }}>Import CSV</div>
                          </div>
                          {[
                            { init: 'RK', name: 'Ravi Kumar', role: 'Sales Officer', branch: 'Delhi West', bg: 'var(--teal)' },
                            { init: 'MS', name: 'Meera Singh', role: 'Branch Manager', branch: 'Mumbai Central', bg: 'var(--gold)' },
                            { init: 'AV', name: 'Amit Verma', role: 'Sales Officer', branch: 'Bangalore East', bg: 'var(--purple)' },
                          ].map((u, i) => (
                            <div key={i} className="wt-mockup-row">
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{u.init}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--dim)' }}>{u.role} &middot; {u.branch}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* HQ: Reimbursement Approval */}
              <div className="wt-divider" />
              <section className="wt-section" style={{ background: '#F8FAFB' }}>
                <div className="wt-container">
                  <div className="wt-feature-row">
                    <div className="wt-feature-text wt-anim">
                      <span className="wt-section-label">Reimbursement Approval</span>
                      <h3>Approve or Reject Claims Org-Wide</h3>
                      <p>Final authority on all reimbursement claims across the organisation. Filter by status, bulk approve or reject with reasons.</p>
                      <ul className="wt-feature-list">
                        <li>View all claims across all branches</li>
                        <li>Filter: Recommended, Submitted, Approved, Rejected</li>
                        <li>Summary: pending count and total approved amount</li>
                        <li>Bulk approve or reject with optional reason</li>
                        <li>Full audit trail with timestamps</li>
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
                            { name: 'Ravi Kumar', branch: 'Delhi West', km: '52.1', amt: '\u20B9442.85' },
                            { name: 'Meera Singh', branch: 'Mumbai', km: '38.7', amt: '\u20B9328.95' },
                            { name: 'Amit Verma', branch: 'Bangalore', km: '61.4', amt: '\u20B9521.90' },
                          ].map((r, i) => (
                            <div key={i} className="wt-mockup-row" style={{ padding: '8px 0' }}>
                              <input type="checkbox" defaultChecked readOnly style={{ accentColor: 'var(--teal)' }} />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{r.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--dim)' }}>{r.branch} &middot; {r.km} km</div>
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--teal)' }}>{r.amt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* HQ: Settings & Admin */}
              <div className="wt-divider" />
              <section className="wt-section">
                <div className="wt-container wt-text-center">
                  <div className="wt-anim">
                    <span className="wt-section-label">Administration</span>
                    <h2 className="wt-section-title">Full Control Over Your Organisation</h2>
                    <p className="wt-section-sub">Configure settings, manage subscriptions, monitor sync status, and access org-wide analytics.</p>
                  </div>
                  <div className="wt-grid wt-grid-4" style={{ marginTop: 48 }}>
                    {[
                      { icon: '\u2699', title: 'Org Settings', desc: 'Configure notification emails, reimbursement rates, timezone, and service integrations' },
                      { icon: '\uD83D\uDCB3', title: 'Subscription & Billing', desc: 'Manage your plan, view invoices, and handle billing with Razorpay integration' },
                      { icon: '\uD83D\uDCC8', title: 'Analytics Hub', desc: 'Deep analytics with AI insights, performance reviews, and org-wide trend analysis' },
                      { icon: '\uD83D\uDD04', title: 'Sync Monitor', desc: 'Track data sync health, offline queue status, and resolve sync issues across the org' },
                    ].map((f, i) => (
                      <div key={i} className="wt-card wt-anim" style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                        <h3>{f.title}</h3>
                        <p>{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            </>
          )}

        </div>

        {/* REIMBURSEMENT WORKFLOW (always visible) */}
        <div className="wt-divider" />
        <section className="wt-section" style={{ background: '#FFFDF7' }}>
          <div className="wt-container">
            <div className="wt-text-center wt-anim" style={{ marginBottom: 48 }}>
              <span className="wt-section-label">Approval Workflow</span>
              <h2 className="wt-section-title">How Approvals Flow<br />Across Roles</h2>
              <p className="wt-section-sub">From agent submission to HQ approval &mdash; a clear, auditable three-step workflow for reimbursements, plans, and more.</p>
            </div>
            <div className="wt-anim">
              <div className="wt-workflow" style={{ position: 'relative' }}>
                <div className="wt-workflow-line" />
                {[
                  { n: '1', e: '\uD83C\uDFC3', t: 'Agent Submits', d: 'Agent creates a daily plan, submits a reimbursement claim, or books a sales order during a visit' },
                  { n: '2', e: '\uD83D\uDC65', t: 'Manager Reviews', d: 'Team manager reviews plans, recommends reimbursement claims, and monitors team progress' },
                  { n: '3', e: '\uD83C\uDFE2', t: 'Branch Oversees', d: 'Branch manager tracks branch-wide KPIs, agent performance, and ensures compliance' },
                  { n: '4', e: '\uD83C\uDF10', t: 'HQ Approves', d: 'HQ admin approves or rejects claims, manages org settings, and views cross-branch analytics' },
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

        {/* FOOTER */}
        {!isEmbedded && (
          <>
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
          </>
        )}

      </div>
    </>
  );
}
