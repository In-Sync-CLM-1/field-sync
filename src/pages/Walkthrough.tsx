import { useEffect, useState } from 'react';

const styles = `
*,*::before,*::after{box-sizing:border-box}
.wt{
  --teal:#01B8AA;--gold:#F59E0B;--red:#EF4444;--blue:#3B82F6;--purple:#8B5CF6;--green:#16A34A;
  --text:#0F172A;--muted:#475569;--dim:#94A3B8;--border:#E2E8F0;--bg:#FFFFFF;
  --font:'DM Sans',sans-serif;--serif:'Playfair Display',Georgia,serif;--mono:'JetBrains Mono',monospace;
  font-family:var(--font);color:var(--text);line-height:1.6;overflow-x:hidden;
  margin:0;padding:0;min-height:100vh;background:var(--bg);
}

/* ── Layout ── */
.wt-wrap{max-width:1100px;margin:0 auto;padding:0 24px}
.wt-step{padding:80px 0;position:relative}
.wt-step:nth-child(even){background:#F8FAFB}
.wt-step-num{position:absolute;top:32px;left:24px;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--teal),#059669);box-shadow:0 2px 8px rgba(1,184,170,0.3)}
@media(min-width:1200px){.wt-step-num{left:max(24px, calc((100vw - 1100px)/2 - 60px))}}
@media(max-width:768px){.wt-step{padding:48px 0}.wt-step-num{width:28px;height:28px;font-size:11px;top:16px;left:12px}}

.wt-split{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center}
.wt-split.rev{direction:rtl}.wt-split.rev>*{direction:ltr}
@media(max-width:768px){.wt-split,.wt-split.rev{grid-template-columns:1fr;gap:24px}}

/* ── Typography ── */
.wt-label{font-size:11px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:var(--teal);margin-bottom:10px}
.wt-h2{font-family:var(--serif);font-size:clamp(22px,3.5vw,32px);font-weight:800;line-height:1.15;margin:0 0 12px;color:var(--text)}
.wt-p{font-size:14px;color:var(--muted);line-height:1.7;margin:0 0 16px}
.wt-bullets{list-style:none;padding:0;margin:0}
.wt-bullets li{display:flex;align-items:flex-start;gap:8px;padding:5px 0;font-size:13px;color:var(--muted)}
.wt-bullets li::before{content:'';width:16px;height:16px;border-radius:50%;background:#F0FDFA;flex-shrink:0;margin-top:3px;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2301B8AA' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center}

/* ── Phone Mockup ── */
.wt-phone{width:280px;margin:0 auto;border-radius:28px;border:3px solid #1E293B;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.12),0 4px 16px rgba(0,0,0,0.06);background:#fff;position:relative}
.wt-phone::before{content:'';position:absolute;top:0;left:50%;transform:translateX(-50%);width:90px;height:22px;background:#1E293B;border-radius:0 0 14px 14px;z-index:10}
.wt-phone-screen{padding:32px 14px 14px;min-height:400px;background:var(--bg)}
@media(max-width:600px){.wt-phone{width:260px}}

/* ── Desktop Mockup ── */
.wt-desk{border-radius:14px;border:1px solid var(--border);overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08)}
.wt-desk-bar{padding:8px 12px;border-bottom:1px solid var(--border);background:#F8FAFB;display:flex;align-items:center;gap:6px}
.wt-desk-dot{width:7px;height:7px;border-radius:50%}
.wt-desk-url{flex:1;text-align:center;font-size:10px;color:var(--dim);font-family:var(--mono);background:#fff;border:1px solid var(--border);border-radius:4px;padding:2px 8px;margin:0 24px}
.wt-desk-body{padding:16px;background:#fff}

/* ── UI Atoms ── */
.wt-kpi{display:flex;flex-direction:column;align-items:center;padding:8px;border-radius:10px;background:#F8FAFB;border:1px solid var(--border);text-align:center;gap:2px}
.wt-kpi-val{font-size:18px;font-weight:800;line-height:1}
.wt-kpi-lbl{font-size:8px;text-transform:uppercase;letter-spacing:1px;color:var(--dim)}
.wt-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:999px;font-size:10px;font-weight:600}
.wt-input{font-size:12px;padding:6px 10px;border-radius:6px;background:#F8FAFB;border:1px solid var(--border);color:var(--text);width:100%;font-family:var(--font)}
.wt-btn{display:inline-flex;align-items:center;justify-content:center;gap:4px;padding:8px 14px;border-radius:8px;font-size:12px;font-weight:600;border:none;cursor:default;font-family:var(--font)}
.wt-btn-teal{background:var(--teal);color:#fff}
.wt-btn-outline{background:transparent;border:1px solid var(--border);color:var(--text)}
.wt-btn-red{background:#FEF2F2;color:var(--red)}
.wt-row{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F1F5F9}
.wt-row:last-child{border-bottom:none}
.wt-avatar{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:#fff;flex-shrink:0}
.wt-bar{height:5px;border-radius:3px;background:#F1F5F9;overflow:hidden;width:100%}
.wt-bar>div{height:100%;border-radius:3px}
.wt-divider{height:1px;background:var(--border);margin:10px 0}
.wt-field{margin-bottom:10px}
.wt-field label{display:block;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:var(--dim);font-weight:600;margin-bottom:3px}

/* ── Tabs ── */
.wt-tabs{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;padding:16px 0}
.wt-tab{display:flex;align-items:center;gap:6px;padding:10px 20px;border-radius:12px;font-size:13px;font-weight:600;border:2px solid var(--border);background:#fff;cursor:pointer;transition:all .25s;color:var(--muted);font-family:var(--font)}
.wt-tab:hover{border-color:rgba(1,184,170,0.4);color:var(--text)}
.wt-tab.on{border-color:var(--teal);background:#F0FDFA;color:var(--teal);box-shadow:0 2px 12px rgba(1,184,170,0.1)}
@media(max-width:600px){.wt-tab{padding:8px 14px;font-size:12px}}

/* ── Role section header ── */
.wt-role-hdr{display:flex;align-items:center;gap:14px;margin-bottom:40px;padding:20px;border-radius:16px;background:linear-gradient(135deg,#F0FDFA 0%,#F8FAFB 100%);border:1px solid #D1FAE5}
.wt-role-ico{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:26px;background:#fff;border:1px solid var(--border)}
.wt-role-hdr h2{font-family:var(--serif);font-size:clamp(20px,3vw,28px);font-weight:800;margin:0;color:var(--text)}
.wt-role-hdr p{font-size:13px;color:var(--muted);margin:2px 0 0}

/* ── Section connector line ── */
.wt-connector{width:2px;height:40px;background:linear-gradient(180deg,var(--teal),rgba(1,184,170,0.1));margin:0 auto}
@media(max-width:768px){.wt-connector{height:24px}}

/* ── Animation ── */
.wt-a{opacity:0;transform:translateY(20px);transition:all .6s ease}
.wt-a.vis{opacity:1;transform:translateY(0)}

@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}

/* ── Embedded compact ── */
.wt.embed .wt-step{padding:48px 0}
.wt.embed .wt-role-hdr{margin-bottom:24px;padding:14px}
@media(max-width:768px){.wt.embed .wt-step{padding:32px 0}}
`;

type Tab = 'agent' | 'team' | 'branch' | 'hq';

/* ═══════ PHONE SCREEN MOCKUPS ═══════ */

function PhoneLogin() {
  return (
    <div className="wt-phone">
      <div className="wt-phone-screen">
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ width: 40, height: 40, margin: '0 auto 8px', borderRadius: 10, background: 'linear-gradient(135deg,#01B8AA,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 16 }}>F</div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Welcome Back</div>
          <div style={{ fontSize: 11, color: 'var(--dim)' }}>Sign in to Field-Sync</div>
        </div>
        <div className="wt-field"><label>Email</label><div className="wt-input">agent@acmeinsurance.com</div></div>
        <div className="wt-field"><label>Password</label><div className="wt-input" style={{ color: 'var(--dim)' }}>{'••••••••'}</div></div>
        <div className="wt-field"><label>Organization</label><div className="wt-input">Acme Insurance Pvt. Ltd.</div></div>
        <div style={{ textAlign: 'right', marginBottom: 12 }}><span style={{ fontSize: 10, color: 'var(--teal)' }}>Forgot password?</span></div>
        <div className="wt-btn wt-btn-teal" style={{ width: '100%', justifyContent: 'center', padding: 10 }}>Sign In</div>
        <div style={{ textAlign: 'center', marginTop: 10, fontSize: 9, color: 'var(--dim)' }}>No credit card &middot; Cancel anytime &middot; Full features</div>
      </div>
    </div>
  );
}

function PhoneDashboard() {
  return (
    <div className="wt-phone">
      <div className="wt-phone-screen">
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 2 }}>Dashboard</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Welcome back, Ravi!</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
          <div className="wt-kpi"><div className="wt-kpi-val" style={{ color: 'var(--teal)' }}>5/8</div><div className="wt-kpi-lbl">Visits Today</div></div>
          <div className="wt-kpi"><div className="wt-kpi-val" style={{ color: 'var(--gold)' }}>00:42</div><div className="wt-kpi-lbl">Active Visit</div></div>
          <div className="wt-kpi"><div className="wt-kpi-val" style={{ color: 'var(--blue)' }}>12</div><div className="wt-kpi-lbl">This Week</div></div>
          <div className="wt-kpi"><div className="wt-kpi-val" style={{ color: 'var(--red)' }}>3</div><div className="wt-kpi-lbl">Overdue</div></div>
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Today's Pipeline</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
          {[{ l: 'Planned', n: 8, c: 'var(--blue)' }, { l: 'Visited', n: 5, c: 'var(--green)' }, { l: 'Pending', n: 2, c: 'var(--gold)' }, { l: 'Follow-up', n: 3, c: 'var(--red)' }].map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: 'center', padding: '6px 2px', borderRadius: 6, background: `${s.c}10`, border: `1px solid ${s.c}25` }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: s.c }}>{s.n}</div>
              <div style={{ fontSize: 7, color: 'var(--dim)', textTransform: 'uppercase' }}>{s.l}</div>
            </div>
          ))}
        </div>
        <div className="wt-btn wt-btn-teal" style={{ width: '100%', justifyContent: 'center', padding: 10, marginBottom: 8 }}>Start Visit</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div className="wt-btn wt-btn-outline" style={{ justifyContent: 'center', fontSize: 10 }}>All Visits</div>
          <div className="wt-btn wt-btn-outline" style={{ justifyContent: 'center', fontSize: 10 }}>Daily Plan</div>
        </div>
      </div>
    </div>
  );
}

function PhoneLeads() {
  return (
    <div className="wt-phone">
      <div className="wt-phone-screen">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal)' }}>Prospects</div>
            <div style={{ fontSize: 10, color: 'var(--dim)' }}>28 prospects</div>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <div className="wt-btn wt-btn-teal" style={{ padding: '5px 10px', fontSize: 10 }}>+ Add</div>
            <div className="wt-btn wt-btn-outline" style={{ padding: '5px 8px', fontSize: 10 }}>Upload</div>
          </div>
        </div>
        <div className="wt-input" style={{ marginBottom: 8, fontSize: 10, color: 'var(--dim)' }}>Search by name, proposal no., location...</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 10, overflowX: 'auto' }}>
          {[{ l: 'All (28)', on: true }, { l: 'Lead' }, { l: 'Quote' }, { l: 'Won' }].map((f, i) => (
            <span key={i} className="wt-badge" style={{ background: f.on ? '#F0FDFA' : '#F8FAFB', color: f.on ? 'var(--teal)' : 'var(--dim)', border: `1px solid ${f.on ? 'var(--teal)' : 'var(--border)'}`, whiteSpace: 'nowrap' }}>{f.l}</span>
          ))}
        </div>
        {[
          { init: 'AS', name: 'Anil Sharma', detail: 'Health · \u20B915,000/yr', status: 'Quote', bg: 'var(--teal)', sc: 'var(--gold)', sb: '#FFFBEB', loc: 'Dwarka, Delhi' },
          { init: 'PP', name: 'Priya Patel', detail: 'Life · \u20B925,000/yr', status: 'Lead', bg: 'var(--gold)', sc: 'var(--blue)', sb: '#EFF6FF', loc: 'Janakpuri' },
          { init: 'RG', name: 'Rajesh Gupta', detail: 'Motor · \u20B98,500/yr', status: 'Won', bg: 'var(--red)', sc: 'var(--green)', sb: '#F0FDF4', loc: 'Rohini' },
        ].map((l, i) => (
          <div key={i} className="wt-row" style={{ gap: 8 }}>
            <div className="wt-avatar" style={{ background: l.bg }}>{l.init}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600 }}>{l.name}</div>
              <div style={{ fontSize: 9, color: 'var(--dim)' }}>{l.detail} &middot; {l.loc}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span className="wt-badge" style={{ background: l.sb, color: l.sc }}>{l.status}</span>
              <div style={{ display: 'flex', gap: 3 }}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: '#F0FDFA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--teal)' }}>&#9742;</div>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--green)' }}>&#9993;</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhonePlanning() {
  return (
    <div className="wt-phone">
      <div className="wt-phone-screen">
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--teal)', marginBottom: 2 }}>Daily Planning</div>
        <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
          <span className="wt-badge" style={{ background: '#FFFBEB', color: 'var(--gold)' }}>Draft</span>
          <span style={{ fontSize: 10, color: 'var(--dim)' }}>09 Mar 2026</span>
        </div>

        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Target vs Achievement</div>
        {[
          { m: 'Prospects', t: '10', a: '7', p: 70, c: 'var(--teal)' },
          { m: 'Quotes', t: '5', a: '3', p: 60, c: 'var(--gold)' },
          { m: 'Sales', t: '2', a: '1', p: 50, c: 'var(--purple)' },
        ].map((r, i) => (
          <div key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 }}>
              <span style={{ fontWeight: 600 }}>{r.m}</span>
              <span style={{ color: 'var(--dim)' }}>{r.a}/{r.t} ({r.p}%)</span>
            </div>
            <div className="wt-bar"><div style={{ width: `${r.p}%`, background: r.c }} /></div>
          </div>
        ))}

        <div className="wt-divider" />
        <div className="wt-field"><label>Markets for Prospects</label><div className="wt-input" style={{ fontSize: 10 }}>Main Market, Sector 5</div></div>
        <div className="wt-field"><label>Markets for Quotes</label><div className="wt-input" style={{ fontSize: 10 }}>Industrial Area, Block B</div></div>

        <div className="wt-btn wt-btn-teal" style={{ width: '100%', justifyContent: 'center', padding: 10, marginTop: 4 }}>Save Plan</div>
      </div>
    </div>
  );
}

function PhoneVisitActive() {
  return (
    <div className="wt-phone">
      <div className="wt-phone-screen">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Anil Sharma</div>
            <div style={{ fontSize: 10, color: 'var(--dim)' }}>Meeting &middot; Health Insurance</div>
          </div>
          <span className="wt-badge" style={{ background: '#FEF3C7', color: '#D97706' }}>IN PROGRESS</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <div style={{ flex: 1, padding: 8, borderRadius: 8, background: '#F0FDFA', border: '1px solid #D1FAE5' }}>
            <div style={{ fontSize: 8, color: 'var(--dim)', textTransform: 'uppercase' }}>Check-in</div>
            <div style={{ fontSize: 11, fontWeight: 600 }}>10:32 AM</div>
            <div style={{ fontSize: 8, color: 'var(--dim)', fontFamily: 'var(--mono)' }}>28.6139, 77.2090</div>
          </div>
          <div style={{ flex: 1, padding: 8, borderRadius: 8, background: '#F8FAFB', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 8, color: 'var(--dim)', textTransform: 'uppercase' }}>Duration</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)' }}>00:42:15</div>
            <div style={{ fontSize: 8, color: 'var(--dim)' }}>Running...</div>
          </div>
        </div>

        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Checklist (2/3)</div>
        <div style={{ marginBottom: 8 }}>
          {['Presented quote', 'Collected documents'].map((c, i) => (
            <div key={i} style={{ fontSize: 11, padding: '3px 0', display: 'flex', gap: 6, alignItems: 'center' }}><span style={{ color: 'var(--teal)', fontSize: 13 }}>&#10003;</span> {c}</div>
          ))}
          <div style={{ fontSize: 11, padding: '3px 0', display: 'flex', gap: 6, alignItems: 'center', color: 'var(--dim)' }}>&#9744; Customer signed</div>
        </div>

        <div className="wt-field"><label>Visit Notes</label><div className="wt-input" style={{ fontSize: 10, minHeight: 36 }}>Customer interested in ₹15L term plan. Needs spouse details. Follow up Thursday.</div></div>

        <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
          {[{ e: '\uD83D\uDCF7', bg: '#F0FDFA' }, { e: '\uD83D\uDCC4', bg: '#FFFBEB' }, { e: '\uD83C\uDFE0', bg: '#FEF2F2' }].map((p, i) => (
            <div key={i} style={{ width: 36, height: 36, borderRadius: 6, background: p.bg, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>{p.e}</div>
          ))}
          <div style={{ width: 36, height: 36, borderRadius: 6, background: '#F8FAFB', border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'var(--dim)' }}>+</div>
        </div>

        <div className="wt-btn wt-btn-teal" style={{ width: '100%', justifyContent: 'center', padding: 10 }}>&#10003; Complete Visit</div>
      </div>
    </div>
  );
}

function PhoneCallWhatsApp() {
  return (
    <div className="wt-phone">
      <div className="wt-phone-screen">
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>Anil Sharma</div>
        <div style={{ fontSize: 10, color: 'var(--dim)', marginBottom: 12 }}>Health Insurance &middot; Quote Given</div>

        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Quick Actions</div>

        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <div style={{ flex: 1, padding: 12, borderRadius: 10, background: '#F0FDFA', border: '1px solid #D1FAE5', textAlign: 'center', cursor: 'default' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>&#9742;</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--teal)' }}>Call</div>
            <div style={{ fontSize: 9, color: 'var(--dim)' }}>98765 43210</div>
          </div>
          <div style={{ flex: 1, padding: 12, borderRadius: 10, background: '#F0FDF4', border: '1px solid #BBF7D0', textAlign: 'center', cursor: 'default' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>&#128172;</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--green)' }}>WhatsApp</div>
            <div style={{ fontSize: 9, color: 'var(--dim)' }}>98765 43210</div>
          </div>
          <div style={{ flex: 1, padding: 12, borderRadius: 10, background: '#F8FAFB', border: '1px solid var(--border)', textAlign: 'center', cursor: 'default' }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>&#128221;</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>Add Note</div>
            <div style={{ fontSize: 9, color: 'var(--dim)' }}>Log activity</div>
          </div>
        </div>

        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 }}>Activity Timeline</div>
        {[
          { icon: '&#9742;', text: 'Called Anil — discussed premium options', time: '2:30 PM today', c: 'var(--teal)' },
          { icon: '&#128172;', text: 'WhatsApp: Sent brochure PDF', time: 'Yesterday 4:15 PM', c: 'var(--green)' },
          { icon: '&#128205;', text: 'Visit completed — quote presented', time: '07 Mar, 11:00 AM', c: 'var(--blue)' },
        ].map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderLeft: `2px solid ${a.c}`, paddingLeft: 10, marginLeft: 6, marginBottom: 2 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: a.text }} />
              <div style={{ fontSize: 9, color: 'var(--dim)' }}>{a.time}</div>
            </div>
          </div>
        ))}

        <div className="wt-btn wt-btn-teal" style={{ width: '100%', justifyContent: 'center', padding: 10, marginTop: 10 }}>Start Visit</div>
      </div>
    </div>
  );
}

function PhoneRouteMap() {
  return (
    <div className="wt-phone">
      <div className="wt-phone-screen" style={{ padding: '32px 0 0' }}>
        <div style={{ padding: '0 14px', marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>Visit Map</div>
          <span className="wt-badge" style={{ background: '#F0FDFA', color: 'var(--teal)' }}>5 visits</span>
        </div>
        <div style={{ height: 240, background: 'linear-gradient(135deg, #E0F7FA 0%, #F0FDFA 50%, #F0F9FF 100%)', position: 'relative', overflow: 'hidden' }}>
          {/* Route line */}
          <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
            <polyline points="60,180 100,120 160,140 200,80 240,100" fill="none" stroke="#01B8AA" strokeWidth="2" strokeDasharray="6,3" opacity="0.6" />
          </svg>
          {/* Visit pins */}
          {[
            { x: 60, y: 180, n: '1', c: 'var(--green)' },
            { x: 100, y: 120, n: '2', c: 'var(--green)' },
            { x: 160, y: 140, n: '3', c: 'var(--green)' },
            { x: 200, y: 80, n: '4', c: 'var(--gold)' },
            { x: 240, y: 100, n: '5', c: 'var(--blue)' },
          ].map((p, i) => (
            <div key={i} style={{ position: 'absolute', left: p.x - 10, top: p.y - 10, width: 20, height: 20, borderRadius: '50%', background: p.c, border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff' }}>{p.n}</div>
          ))}
          <div style={{ position: 'absolute', bottom: 6, right: 6, background: '#fff', borderRadius: 6, padding: '3px 8px', fontSize: 9, color: 'var(--dim)', border: '1px solid var(--border)' }}>Route &middot; 47.3 km</div>
        </div>
        <div style={{ padding: '8px 14px' }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Today's Route</div>
          {['Office → Sharma (Dwarka)', 'Patel (Janakpuri)', 'Gupta (Rohini) → Office'].map((r, i) => (
            <div key={i} style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 0' }}>{i > 0 ? '→ ' : ''}{r}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════ DESKTOP MOCKUPS ═══════ */

function DeskTeamDashboard() {
  return (
    <div className="wt-desk">
      <div className="wt-desk-bar">
        <div className="wt-desk-dot" style={{ background: 'var(--red)' }} />
        <div className="wt-desk-dot" style={{ background: 'var(--gold)' }} />
        <div className="wt-desk-dot" style={{ background: 'var(--green)' }} />
        <div className="wt-desk-url">Team Dashboard</div>
      </div>
      <div className="wt-desk-body">
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 2 }}>Team</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Team Dashboard</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
          {[
            { v: '32', l: 'Team Visits', c: 'var(--teal)' },
            { v: '8/10', l: 'Active', c: 'var(--blue)' },
            { v: '87%', l: 'Attendance', c: 'var(--green)' },
            { v: '72%', l: 'Plan Done', c: 'var(--gold)' },
          ].map((k, i) => (
            <div key={i} className="wt-kpi"><div className="wt-kpi-val" style={{ color: k.c, fontSize: 16 }}>{k.v}</div><div className="wt-kpi-lbl">{k.l}</div></div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Target vs Achievement</div>
            {[{ m: 'Prospects', t: 50, a: 38, c: 'var(--teal)' }, { m: 'Quotes', t: 25, a: 18, c: 'var(--gold)' }, { m: 'Sales', t: 10, a: 7, c: 'var(--purple)' }].map((r, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                  <span style={{ fontWeight: 600 }}>{r.m}</span><span style={{ color: 'var(--dim)' }}>{r.a}/{r.t} ({Math.round(r.a / r.t * 100)}%)</span>
                </div>
                <div className="wt-bar"><div style={{ width: `${Math.round(r.a / r.t * 100)}%`, background: r.c }} /></div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Top Performers</div>
            {[
              { e: '\uD83C\uDFC6', n: 'Ravi Kumar', d: '18 sales · \u20B94.2L', bg: '#FFFBEB', c: '#D97706' },
              { e: '\uD83E\uDD48', n: 'Meera Singh', d: '15 sales · \u20B93.8L', bg: '#F0F9FF', c: '#0EA5E9' },
              { e: '\uD83E\uDD49', n: 'Amit Verma', d: '12 sales · \u20B92.9L', bg: '#FAF5FF', c: 'var(--purple)' },
            ].map((p, i) => (
              <div key={i} className="wt-row" style={{ padding: '5px 0' }}>
                <span style={{ fontSize: 14 }}>{p.e}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{p.n}</div>
                  <div style={{ fontSize: 9, color: 'var(--dim)' }}>{p.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeskBranchView() {
  return (
    <div className="wt-desk">
      <div className="wt-desk-bar">
        <div className="wt-desk-dot" style={{ background: 'var(--red)' }} />
        <div className="wt-desk-dot" style={{ background: 'var(--gold)' }} />
        <div className="wt-desk-dot" style={{ background: 'var(--green)' }} />
        <div className="wt-desk-url">Branch Analytics &middot; Delhi West</div>
      </div>
      <div className="wt-desk-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
          {[
            { v: '156', l: 'Visits MTD', c: 'var(--teal)' },
            { v: '\u20B912.4L', l: 'Sales', c: 'var(--green)' },
            { v: '91%', l: 'Attendance', c: 'var(--blue)' },
          ].map((k, i) => (
            <div key={i} className="wt-kpi"><div className="wt-kpi-val" style={{ color: k.c, fontSize: 16 }}>{k.v}</div><div className="wt-kpi-lbl">{k.l}</div></div>
          ))}
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Agent Performance</div>
        <div style={{ fontSize: 9, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 4, padding: '4px 0', color: 'var(--dim)', fontWeight: 600, borderBottom: '1px solid var(--border)' }}>
          <div>Officer</div><div style={{ textAlign: 'center' }}>Prospects</div><div style={{ textAlign: 'center' }}>Quotes</div><div style={{ textAlign: 'center' }}>Sales</div><div style={{ textAlign: 'center' }}>Badge</div>
        </div>
        {[
          { n: 'Ravi Kumar', p: '18/20', q: '8/10', s: '5/5', badge: 'Gold', bc: '#D97706', bb: '#FFFBEB' },
          { n: 'Meera Singh', p: '15/20', q: '7/10', s: '3/5', badge: 'Silver', bc: '#0EA5E9', bb: '#F0F9FF' },
          { n: 'Amit Verma', p: '12/20', q: '5/10', s: '2/5', badge: 'Bronze', bc: 'var(--purple)', bb: '#FAF5FF' },
        ].map((a, i) => (
          <div key={i} style={{ fontSize: 10, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 4, padding: '6px 0', borderBottom: '1px solid #F1F5F9', alignItems: 'center' }}>
            <div style={{ fontWeight: 600 }}>{a.n}</div>
            <div style={{ textAlign: 'center', color: 'var(--muted)' }}>{a.p}</div>
            <div style={{ textAlign: 'center', color: 'var(--muted)' }}>{a.q}</div>
            <div style={{ textAlign: 'center', color: 'var(--muted)' }}>{a.s}</div>
            <div style={{ textAlign: 'center' }}><span className="wt-badge" style={{ background: a.bb, color: a.bc }}>{a.badge}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeskHQDashboard() {
  return (
    <div className="wt-desk">
      <div className="wt-desk-bar">
        <div className="wt-desk-dot" style={{ background: 'var(--red)' }} />
        <div className="wt-desk-dot" style={{ background: 'var(--gold)' }} />
        <div className="wt-desk-dot" style={{ background: 'var(--green)' }} />
        <div className="wt-desk-url">HQ &middot; Organization Dashboard</div>
      </div>
      <div className="wt-desk-body">
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 2 }}>Head Office</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>Organization Dashboard</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
          {[
            { v: '248', l: 'Visits', c: 'var(--teal)' },
            { v: '42/50', l: 'Active Agents', c: 'var(--blue)' },
            { v: '89%', l: 'Attendance', c: 'var(--green)' },
            { v: '76%', l: 'Plan Done', c: 'var(--gold)' },
          ].map((k, i) => (
            <div key={i} className="wt-kpi"><div className="wt-kpi-val" style={{ color: k.c, fontSize: 14 }}>{k.v}</div><div className="wt-kpi-lbl">{k.l}</div></div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Branch Performance</div>
            {[
              { n: 'Delhi West', agents: '12', sales: '\u20B918.5L', pct: 92, c: 'var(--green)' },
              { n: 'Mumbai Central', agents: '15', sales: '\u20B922.1L', pct: 88, c: 'var(--teal)' },
              { n: 'Bangalore East', agents: '8', sales: '\u20B99.8L', pct: 74, c: 'var(--gold)' },
              { n: 'Chennai South', agents: '7', sales: '\u20B96.2L', pct: 45, c: 'var(--red)' },
            ].map((b, i) => (
              <div key={i} className="wt-row" style={{ padding: '4px 0' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600 }}>{b.n}</div>
                  <div style={{ fontSize: 9, color: 'var(--dim)' }}>{b.agents} agents &middot; {b.sales}</div>
                </div>
                <span className="wt-badge" style={{ background: `${b.c}15`, color: b.c }}>{b.pct}%</span>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--dim)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Org KPIs</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { v: '\u20B950.6L', l: 'Total Sales' },
                { v: '74%', l: 'Avg Achievement' },
                { v: '1,248', l: 'Total Visits' },
                { v: '89%', l: 'Attendance' },
              ].map((k, i) => (
                <div key={i} className="wt-kpi" style={{ padding: 6 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--teal)' }}>{k.v}</div>
                  <div className="wt-kpi-lbl">{k.l}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, padding: 6, borderRadius: 8, border: '1px solid #FECACA', background: '#FEF2F2' }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--red)', marginBottom: 2 }}>Low Attendance Alert</div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>Chennai South: 45% attendance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════ MAIN COMPONENT ═══════ */

export default function Walkthrough() {
  const [tab, setTab] = useState<Tab>('agent');
  const isEmbed = typeof window !== 'undefined' && window.self !== window.top;

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800;900&family=JetBrains+Mono:wght@400;500&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  // Observe animations
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('vis'); }),
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    const t = setTimeout(() => { document.querySelectorAll('.wt-a').forEach((el) => obs.observe(el)); }, 60);
    return () => { clearTimeout(t); obs.disconnect(); };
  }, [tab]);

  const pick = (t: Tab) => { setTab(t); document.getElementById('wt-content')?.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <>
      <style>{styles}</style>
      <div className={`wt${isEmbed ? ' embed' : ''}`}>

        {/* ── Sticky Tabs ── */}
        <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}>
          <div className="wt-wrap wt-tabs">
            {([
              { key: 'agent' as Tab, icon: '\uD83C\uDFC3', label: 'Agent Flow' },
              { key: 'team' as Tab, icon: '\uD83D\uDC65', label: 'Team Leader' },
              { key: 'branch' as Tab, icon: '\uD83C\uDFE2', label: 'Branch' },
              { key: 'hq' as Tab, icon: '\uD83C\uDF10', label: 'Head Office' },
            ]).map((t) => (
              <button key={t.key} className={`wt-tab${tab === t.key ? ' on' : ''}`} onClick={() => pick(t.key)}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div id="wt-content">

          {/* ═══ AGENT FLOW ═══ */}
          {tab === 'agent' && (
            <>
              {/* 1. Login */}
              <div className="wt-step">
                <div className="wt-step-num">1</div>
                <div className="wt-wrap">
                  <div className="wt-split">
                    <div className="wt-a">
                      <div className="wt-label">Step 1</div>
                      <div className="wt-h2">Agent Login</div>
                      <div className="wt-p">Agents sign in with their email, password, and select their organisation. Role-based access is pre-configured &mdash; they see only what they need.</div>
                      <ul className="wt-bullets">
                        <li>Email + password + organisation selector</li>
                        <li>Secure OTP verification via WhatsApp &amp; email</li>
                        <li>Auto-redirect to role-specific dashboard</li>
                        <li>Forgot password with email reset link</li>
                      </ul>
                    </div>
                    <div className="wt-a"><PhoneLogin /></div>
                  </div>
                </div>
              </div>

              <div className="wt-connector" />

              {/* 2. Dashboard */}
              <div className="wt-step">
                <div className="wt-step-num">2</div>
                <div className="wt-wrap">
                  <div className="wt-split rev">
                    <div className="wt-a">
                      <div className="wt-label">Step 2</div>
                      <div className="wt-h2">Agent Dashboard</div>
                      <div className="wt-p">The home screen shows everything at a glance &mdash; today's visits vs planned, active visit timer, overdue follow-ups, and quick-action buttons.</div>
                      <ul className="wt-bullets">
                        <li>KPI cards: Visits Today, Active Visit, Weekly Total, Overdue</li>
                        <li>Pipeline: Planned → Visited → Pending → Follow-up</li>
                        <li>Quick actions: Start Visit, All Visits, Daily Plan, Leads</li>
                        <li>Follow-ups due with one-tap call buttons</li>
                      </ul>
                    </div>
                    <div className="wt-a"><PhoneDashboard /></div>
                  </div>
                </div>
              </div>

              <div className="wt-connector" />

              {/* 3. Leads */}
              <div className="wt-step">
                <div className="wt-step-num">3</div>
                <div className="wt-wrap">
                  <div className="wt-split">
                    <div className="wt-a">
                      <div className="wt-label">Step 3</div>
                      <div className="wt-h2">Adding &amp; Uploading Leads</div>
                      <div className="wt-p">Browse all prospects with search and status filters. Add leads one by one or bulk upload via CSV. Each lead has category, premium, location, and follow-up date.</div>
                      <ul className="wt-bullets">
                        <li>Search by name, proposal number, customer ID, or location</li>
                        <li>Filter by status: Lead, Quote, Won, Lost</li>
                        <li>Add lead with name, mobile, category, premium, location</li>
                        <li>Capture GPS location on the spot</li>
                        <li>Bulk upload leads from CSV file</li>
                      </ul>
                    </div>
                    <div className="wt-a"><PhoneLeads /></div>
                  </div>
                </div>
              </div>

              <div className="wt-connector" />

              {/* 4. Daily Planning */}
              <div className="wt-step">
                <div className="wt-step-num">4</div>
                <div className="wt-wrap">
                  <div className="wt-split rev">
                    <div className="wt-a">
                      <div className="wt-label">Step 4</div>
                      <div className="wt-h2">Making Daily Plans</div>
                      <div className="wt-p">Every morning, agents set their targets for prospects, quotes, and sales. They list the markets they'll cover and planned policies. Progress is tracked in real time.</div>
                      <ul className="wt-bullets">
                        <li>Set daily targets: Prospects, Quotes, Sales</li>
                        <li>Specify markets to visit for prospects and quotes</li>
                        <li>Enroll planned policies with customer details</li>
                        <li>Live progress bars: target vs actual percentage</li>
                        <li>Works offline &mdash; syncs when back online</li>
                      </ul>
                    </div>
                    <div className="wt-a"><PhonePlanning /></div>
                  </div>
                </div>
              </div>

              <div className="wt-connector" />

              {/* 5. Route & Map */}
              <div className="wt-step">
                <div className="wt-step-num">5</div>
                <div className="wt-wrap">
                  <div className="wt-split">
                    <div className="wt-a">
                      <div className="wt-label">Step 5</div>
                      <div className="wt-h2">Routes &amp; Territory Map</div>
                      <div className="wt-p">View all visits on an interactive map with numbered pins and route lines. Optimise visit sequence, navigate to leads via Google Maps, and track total distance.</div>
                      <ul className="wt-bullets">
                        <li>Interactive map with numbered visit pins</li>
                        <li>Route lines connecting visits chronologically</li>
                        <li>One-tap navigation to any lead via Google Maps</li>
                        <li>Filter by date range to see visit history</li>
                        <li>Nearby places discovery for cold-calling</li>
                      </ul>
                    </div>
                    <div className="wt-a"><PhoneRouteMap /></div>
                  </div>
                </div>
              </div>

              <div className="wt-connector" />

              {/* 6. Visit / Meeting */}
              <div className="wt-step">
                <div className="wt-step-num">6</div>
                <div className="wt-wrap">
                  <div className="wt-split rev">
                    <div className="wt-a">
                      <div className="wt-label">Step 6</div>
                      <div className="wt-h2">Starting a Meeting &amp; Saving Notes</div>
                      <div className="wt-p">Check in at the client with automatic GPS capture. A live timer runs while you work. Fill checklists, capture photos, type visit notes, and book orders — all on one screen.</div>
                      <ul className="wt-bullets">
                        <li>GPS auto-captured at check-in with coordinates</li>
                        <li>Live duration timer runs throughout the visit</li>
                        <li>Customisable checklist to track steps completed</li>
                        <li>Visit notes textarea for meeting summary</li>
                        <li>Photo capture: selfie, document, property</li>
                        <li>Complete visit with check-out GPS and timestamp</li>
                      </ul>
                    </div>
                    <div className="wt-a"><PhoneVisitActive /></div>
                  </div>
                </div>
              </div>

              <div className="wt-connector" />

              {/* 7. Call & WhatsApp */}
              <div className="wt-step">
                <div className="wt-step-num">7</div>
                <div className="wt-wrap">
                  <div className="wt-split">
                    <div className="wt-a">
                      <div className="wt-label">Step 7</div>
                      <div className="wt-h2">Making a Call &amp; Sending WhatsApp</div>
                      <div className="wt-p">From any lead's detail page, tap to call or WhatsApp directly. Every interaction is logged to the activity timeline &mdash; creating a full communication history.</div>
                      <ul className="wt-bullets">
                        <li>One-tap Call button dials the lead's number</li>
                        <li>One-tap WhatsApp opens chat with the lead</li>
                        <li>Add Note to log call outcomes and follow-ups</li>
                        <li>Activity timeline shows calls, messages, and visits</li>
                        <li>Start Visit button right from the lead page</li>
                      </ul>
                    </div>
                    <div className="wt-a"><PhoneCallWhatsApp /></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ═══ TEAM LEADER ═══ */}
          {tab === 'team' && (
            <>
              <div className="wt-step">
                <div className="wt-wrap">
                  <div className="wt-role-hdr wt-a">
                    <div className="wt-role-ico">{'\uD83D\uDC65'}</div>
                    <div><h2>What the Team Leader Sees</h2><p>Real-time visibility into your team's visits, targets, attendance, and performance rankings</p></div>
                  </div>
                  <div className="wt-split">
                    <div className="wt-a">
                      <div className="wt-h2">Team Dashboard &amp; Performance</div>
                      <div className="wt-p">The team leader's dashboard aggregates everything across their direct reports &mdash; total visits, active agents, attendance rates, and target achievement in one view.</div>
                      <ul className="wt-bullets">
                        <li>KPIs: Team Visits, Active Agents, Attendance Rate, Plan Completion</li>
                        <li>Visit pipeline: Completed, In Progress, Cancelled, Total</li>
                        <li>Target vs Achievement bars for Prospects, Quotes, Sales</li>
                        <li>Top performers with Gold / Silver / Bronze badges</li>
                        <li>30-day sales trend and visits by day of week charts</li>
                        <li>Individual agent performance table with incentive calculations</li>
                      </ul>
                    </div>
                    <div className="wt-a"><DeskTeamDashboard /></div>
                  </div>
                </div>
              </div>

              <div className="wt-connector" />

              <div className="wt-step">
                <div className="wt-wrap">
                  <div className="wt-split rev">
                    <div className="wt-a">
                      <div className="wt-h2">Plan Review &amp; Team Oversight</div>
                      <div className="wt-p">Review every agent's daily plan side-by-side. Correct targets, monitor live locations on the territory map, and recommend reimbursement claims before they go to HQ.</div>
                      <ul className="wt-bullets">
                        <li>View all team members' plans for any date</li>
                        <li>Edit and correct individual agent targets</li>
                        <li>Aggregated team prospects, quotes, and policies</li>
                        <li>Live agent positions on territory map with route replay</li>
                        <li>Route deviation alerts (5 km threshold)</li>
                        <li>Review and bulk-recommend reimbursement claims</li>
                      </ul>
                    </div>
                    <div className="wt-a">
                      <div className="wt-desk">
                        <div className="wt-desk-bar">
                          <div className="wt-desk-dot" style={{ background: 'var(--red)' }} />
                          <div className="wt-desk-dot" style={{ background: 'var(--gold)' }} />
                          <div className="wt-desk-dot" style={{ background: 'var(--green)' }} />
                          <div className="wt-desk-url">Team Plans &middot; 09 Mar 2026</div>
                        </div>
                        <div className="wt-desk-body">
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 10 }}>
                            {[{ v: '45', l: 'Prospects', p: '78%', c: 'var(--teal)' }, { v: '22', l: 'Quotes', p: '65%', c: 'var(--gold)' }, { v: '8', l: 'Policies', p: '53%', c: 'var(--purple)' }].map((s, i) => (
                              <div key={i} className="wt-kpi"><div className="wt-kpi-val" style={{ color: s.c, fontSize: 16 }}>{s.v}</div><div className="wt-kpi-lbl">{s.l} ({s.p})</div></div>
                            ))}
                          </div>
                          {[
                            { n: 'Ravi Kumar', p: '12', q: '5', s: '2', done: true },
                            { n: 'Meera Singh', p: '10', q: '4', s: '1', done: true },
                            { n: 'Amit Verma', p: '8', q: '3', s: '0', done: false },
                            { n: 'Neha Joshi', p: '—', q: '—', s: '—', done: false },
                          ].map((m, i) => (
                            <div key={i} className="wt-row" style={{ padding: '5px 0' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 600 }}>{m.n}</div>
                                <div style={{ fontSize: 9, color: 'var(--dim)' }}>P:{m.p} Q:{m.q} S:{m.s}</div>
                              </div>
                              <span className="wt-badge" style={{ background: m.done ? '#F0FDF4' : '#FFFBEB', color: m.done ? 'var(--green)' : 'var(--gold)' }}>{m.done ? 'Submitted' : 'Pending'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ═══ BRANCH ═══ */}
          {tab === 'branch' && (
            <div className="wt-step">
              <div className="wt-wrap">
                <div className="wt-role-hdr wt-a">
                  <div className="wt-role-ico">{'\uD83C\uDFE2'}</div>
                  <div><h2>What the Branch Manager Sees</h2><p>Branch-level KPIs, agent-wise performance comparison, incentives, and territory oversight</p></div>
                </div>
                <div className="wt-split">
                  <div className="wt-a">
                    <div className="wt-h2">Branch Analytics &amp; Performance</div>
                    <div className="wt-p">Drill into the branch &mdash; compare every agent's targets vs actuals, track sales trends, monitor attendance compliance, and identify top performers with milestone badges.</div>
                    <ul className="wt-bullets">
                      <li>Branch KPIs: Visits MTD, Total Sales, Attendance Rate</li>
                      <li>Agent performance table: Prospects, Quotes, Sales with % achievement</li>
                      <li>Gold / Silver / Bronze milestone badges per agent</li>
                      <li>Monthly incentive calculations and leaderboard</li>
                      <li>Team territory map with live agent tracking</li>
                      <li>Reimbursement recommendation and bulk actions</li>
                      <li>Visit status distribution and sales trend charts</li>
                    </ul>
                  </div>
                  <div className="wt-a"><DeskBranchView /></div>
                </div>
              </div>
            </div>
          )}

          {/* ═══ HEAD OFFICE ═══ */}
          {tab === 'hq' && (
            <>
              <div className="wt-step">
                <div className="wt-wrap">
                  <div className="wt-role-hdr wt-a">
                    <div className="wt-role-ico">{'\uD83C\uDF10'}</div>
                    <div><h2>What Head Office Sees</h2><p>Organisation-wide visibility &mdash; every branch, every agent, every metric in one place</p></div>
                  </div>
                  <div className="wt-split">
                    <div className="wt-a">
                      <div className="wt-h2">Organisation Dashboard</div>
                      <div className="wt-p">The HQ dashboard gives a bird's-eye view across all branches &mdash; total visits, active agents, attendance rates, and plan achievement. Drill into any branch for detailed analytics.</div>
                      <ul className="wt-bullets">
                        <li>Org KPIs: Visits, Active Agents, Attendance, Plan Achievement</li>
                        <li>Branch-wise performance table with sales and achievement %</li>
                        <li>Multi-branch radar chart comparison</li>
                        <li>Daily sales trend per branch (line chart)</li>
                        <li>Low attendance alerts for branches below 50%</li>
                        <li>Drill down: click any branch for detailed agent-level analytics</li>
                      </ul>
                    </div>
                    <div className="wt-a"><DeskHQDashboard /></div>
                  </div>
                </div>
              </div>

              <div className="wt-connector" />

              <div className="wt-step">
                <div className="wt-wrap">
                  <div className="wt-split rev">
                    <div className="wt-a">
                      <div className="wt-h2">Admin Controls</div>
                      <div className="wt-p">Full control over users, branches, settings, billing, and approvals. Manage the entire organisation structure and monitor data sync health.</div>
                      <ul className="wt-bullets">
                        <li>User management: create, edit, assign roles and branches</li>
                        <li>Branch management: create, edit, activate/deactivate</li>
                        <li>Org chart with full reporting hierarchy</li>
                        <li>Bulk reimbursement approval / rejection with reasons</li>
                        <li>Organisation settings: notification emails, reimbursement rates</li>
                        <li>Subscription &amp; billing with Razorpay integration</li>
                        <li>Sync monitoring and offline queue status</li>
                      </ul>
                    </div>
                    <div className="wt-a">
                      <div className="wt-desk">
                        <div className="wt-desk-bar">
                          <div className="wt-desk-dot" style={{ background: 'var(--red)' }} />
                          <div className="wt-desk-dot" style={{ background: 'var(--gold)' }} />
                          <div className="wt-desk-dot" style={{ background: 'var(--green)' }} />
                          <div className="wt-desk-url">Admin &middot; User Management</div>
                        </div>
                        <div className="wt-desk-body">
                          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                            <div className="wt-btn wt-btn-teal" style={{ fontSize: 10 }}>+ Add User</div>
                            <div className="wt-btn wt-btn-outline" style={{ fontSize: 10 }}>Import CSV</div>
                            <div className="wt-btn wt-btn-outline" style={{ fontSize: 10 }}>Manage Branches</div>
                          </div>
                          {[
                            { init: 'RK', n: 'Ravi Kumar', role: 'Sales Officer', branch: 'Delhi West', bg: 'var(--teal)' },
                            { init: 'MS', n: 'Meera Singh', role: 'Branch Manager', branch: 'Mumbai Central', bg: 'var(--gold)' },
                            { init: 'AV', n: 'Amit Verma', role: 'Sales Officer', branch: 'Bangalore East', bg: 'var(--purple)' },
                            { init: 'NJ', n: 'Neha Joshi', role: 'Admin', branch: 'Head Office', bg: 'var(--blue)' },
                          ].map((u, i) => (
                            <div key={i} className="wt-row" style={{ padding: '5px 0' }}>
                              <div className="wt-avatar" style={{ background: u.bg }}>{u.init}</div>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 11, fontWeight: 600 }}>{u.n}</div>
                                <div style={{ fontSize: 9, color: 'var(--dim)' }}>{u.role} &middot; {u.branch}</div>
                              </div>
                              <div className="wt-btn wt-btn-outline" style={{ fontSize: 9, padding: '4px 8px' }}>Edit</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </>
  );
}
