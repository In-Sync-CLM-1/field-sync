// Field-Sync teaser — v2 "1 main + 3 subsets" (approved storytelling standard).
// Built entirely from surviving walkthrough slices + guest title cards
// (backend parked — no live app, no login).
//   MAIN    — the field on one screen: visits proven, reporting automatic
//   SUBSET 1 — see the field live (map + routes, exceptions flagged)
//   SUBSET 2 — proof, not trust (GPS + time stamp on every visit)
//   SUBSET 3 — reporting does itself (order snapped → office same minute)
// Hook names pain + product first; three numbered chapters; close restates
// main + subsets + per-field-user pricing + demo CTA. Nothing else.
import { ACCT } from './lib/scene.mjs';

const HOOK_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1366px;height:768px;font-family:'Segoe UI',Arial,sans-serif;background:radial-gradient(120% 120% at 20% 0%,#0b2e2c 0%,#082220 55%,#04120f 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff}
  .kicker{font-size:19px;font-weight:700;color:#34d399;letter-spacing:3px;text-transform:uppercase}
  h1{font-size:56px;font-weight:800;letter-spacing:-1.5px;line-height:1.16;max-width:86%;margin-top:22px}
  .sub{font-size:26px;font-weight:400;color:rgba(255,255,255,.78);margin-top:26px;max-width:72%;line-height:1.45}
</style></head><body>
  <div class="kicker">Field-Sync &middot; Field Team Tracking</div>
  <h1>Your agents are in the field.<br>Are they where they say they are?</h1>
  <div class="sub">Field-Sync puts the field on one screen — visits proven, reporting automatic.</div>
</body></html>`;

const CLOSE_HTML = `<!doctype html><html><head><meta charset="utf-8"><style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{width:1366px;height:768px;font-family:'Segoe UI',Arial,sans-serif;background:radial-gradient(120% 120% at 20% 0%,#0b2e2c 0%,#082220 55%,#04120f 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff}
  .kicker{font-size:19px;font-weight:700;color:#34d399;letter-spacing:3px;text-transform:uppercase}
  h1{font-size:52px;font-weight:800;letter-spacing:-1.5px;line-height:1.16;margin-top:16px}
  .grid{display:grid;grid-template-columns:1fr 1fr;margin-top:32px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:16px;overflow:hidden}
  .grid .l{font-size:21px;font-weight:400;color:rgba(255,255,255,.5);padding:13px 26px;text-align:right;display:flex;align-items:center;justify-content:flex-end}
  .grid .r{font-size:21px;font-weight:600;color:#6ee7b7;padding:13px 26px;text-align:left;border-left:1px solid rgba(255,255,255,.15);display:flex;align-items:center}
  .price{font-size:23px;font-weight:600;color:rgba(255,255,255,.92);margin-top:30px}
  .cta{font-size:25px;font-weight:500;color:rgba(255,255,255,.85);margin-top:12px}
</style></head><body>
  <div class="kicker">Field-Sync</div>
  <h1>You see the field.<br>The reporting does itself.</h1>
  <div class="grid">
    <div class="l">"Where&rsquo;s the team?" &mdash; a morning of calls</div><div class="r">Live map &mdash; every rep, every route</div>
    <div class="l">Paper visit reports, taken on trust</div><div class="r">GPS-stamped check-ins, automatic</div>
    <div class="l">Orders relayed at day-end &mdash; if remembered</div><div class="r">In the office inbox the same minute</div>
  </div>
  <div class="price">Priced per field user &middot; workspace live in a minute</div>
  <div class="cta">field.in-sync.co.in &middot; Book a demo &mdash; put your real routes on the map</div>
</body></html>`;

export const SCENES = [

// 0 — hook: pain + product named up front
{
  name: 'f0-hook', account: ACCT.guest,
  narration: "Your agents are in the field. Are they where they say they are? Field-Sync knows — and proves it.",
  beats: async ({ page, D, ready }) => {
    await page.setContent(HOOK_HTML, { waitUntil: 'load' });
    const waitUntil = await ready(300);
    await waitUntil(D);
  },
},

// 1a — SUBSET 1: see the field live (slice: live map)
{
  name: 'f1a-livemap', slice: { src: 's1-livemap-v.mp4', from: 2 },
  narration: "One — see the field, live. Every rep on one map, with the route they've actually travelled.",
},

// 1b — …exceptions flagged as they happen (slice)
{
  name: 'f1b-exception', slice: { src: 's2b-exception-v.mp4', from: 2 },
  narration: "No check-in, no movement? Flagged the moment it happens — your manager steps in.",
},

// 2 — SUBSET 2: proof, not trust (slice: GPS check-in)
{
  name: 'f2-checkin', slice: { src: 's5-checkin-v.mp4', from: 2 },
  narration: "Two — proof, not trust. Every visit is stamped with the exact place and time, automatically.",
},

// 3 — SUBSET 3: reporting does itself (slice: order capture)
{
  name: 'f3-order', slice: { src: 's6-order-v.mp4', from: 3 },
  narration: "Three — reporting does itself. The rep snaps the written order, and it's in the office inbox the same minute.",
},

// 4 — close: restate main + subsets, pricing, demo CTA
{
  name: 'f4-close', account: ACCT.guest,
  narration: "That's Field-Sync: you see the field, visits are proven, reports write themselves. Priced per field user, live in a minute. Book a demo — put your real routes on the map.",
  beats: async ({ page, D, ready }) => {
    await page.setContent(CLOSE_HTML, { waitUntil: 'load' });
    const waitUntil = await ready(300);
    await waitUntil(D);
  },
},

];
