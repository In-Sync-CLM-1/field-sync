import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, BarChart3, ClipboardList, Users, Target, Trophy,
  ArrowRight, Play, Pause, RotateCcw, Clock, Phone, MessageSquare,
  CheckCircle, Camera, FileText, Navigation, TrendingUp, AlertTriangle,
  Search, Plus, Upload, Calendar, Sparkles, Building2, Eye,
} from "lucide-react";

/* ── Timing ─────────────────────────────────────────────── */

const SCENES = [
  { id: "intro", label: "Intro", duration: 5000 },
  { id: "login", label: "Login", duration: 8000 },
  { id: "dashboard", label: "Dashboard", duration: 10000 },
  { id: "leads", label: "Leads", duration: 10000 },
  { id: "planning", label: "Planning", duration: 10000 },
  { id: "map", label: "Routes", duration: 9000 },
  { id: "visit", label: "Visit", duration: 12000 },
  { id: "comms", label: "Call & Chat", duration: 10000 },
  { id: "team", label: "Team Leader", duration: 10000 },
  { id: "branch", label: "Branch", duration: 9000 },
  { id: "hq", label: "Head Office", duration: 10000 },
  { id: "outro", label: "Summary", duration: 5000 },
] as const;

const TOTAL = SCENES.reduce((s, sc) => s + sc.duration, 0);
type SceneId = (typeof SCENES)[number]["id"];

/* ── Helpers ─────────────────────────────────────────────── */

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.5 },
};

const slideUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, delay } },
});

const slideLeft = (delay = 0) => ({
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, delay } },
});

const slideRight = (delay = 0) => ({
  initial: { opacity: 0, x: -30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.45, delay } },
});

/* ── Typewriter ──────────────────────────────────────────── */

function Tw({ text, delay = 0, speed = 35 }: { text: string; delay?: number; speed?: number }) {
  const [s, setS] = useState("");
  useEffect(() => {
    const t = setTimeout(() => {
      let i = 0;
      const iv = setInterval(() => {
        if (i <= text.length) { setS(text.slice(0, i)); i++; } else clearInterval(iv);
      }, speed);
      return () => clearInterval(iv);
    }, delay * 1000);
    return () => clearTimeout(t);
  }, [text, delay, speed]);
  return <>{s}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="inline-block w-0.5 h-3.5 bg-[#01B8AA] ml-0.5 align-middle" /></>;
}

/* ── Animated counter ────────────────────────────────────── */

function AnimVal({ value, delay = 0 }: { value: string; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay * 1000); return () => clearTimeout(t); }, [delay]);
  return <span>{show ? value : "—"}</span>;
}

/* ── Mini bar chart ─────────────────────────────────────── */

function MiniBarChart({ bars, delay = 0, height = 50 }: { bars: { value: number; color: string; label?: string }[]; delay?: number; height?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay * 1000); return () => clearTimeout(t); }, [delay]);
  const max = Math.max(...bars.map(b => b.value));
  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {bars.map((b, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <motion.div
            className="w-full rounded-t"
            style={{ background: b.color }}
            initial={{ height: 0 }}
            animate={{ height: show ? `${(b.value / max) * 100}%` : 0 }}
            transition={{ duration: 0.5, delay: i * 0.06 }}
          />
          {b.label && <span className="text-[7px] text-[#94A3B8] leading-none">{b.label}</span>}
        </div>
      ))}
    </div>
  );
}

/* ── Sparkline ──────────────────────────────────────────── */

function Sparkline({ points, color, delay = 0, w = 60, h = 20 }: { points: number[]; color: string; delay?: number; w?: number; h?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay * 1000); return () => clearTimeout(t); }, [delay]);
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / range) * (h - 4) - 2;
    return `${i === 0 ? "M" : "L"}${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" style={{ opacity: show ? 1 : 0, transition: "opacity 0.5s" }}>
      <path d={path} stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

/* ── Mini donut ─────────────────────────────────────────── */

function MiniDonut({ value, max, color, size = 36, delay = 0 }: { value: number; max: number; color: string; size?: number; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay * 1000); return () => clearTimeout(t); }, [delay]);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = show ? value / max : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth="3" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 0.8, delay: delay }} style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
      <text x={size / 2} y={size / 2 + 3} textAnchor="middle" className="text-[8px] font-bold" fill={color}>{show ? `${Math.round(pct * 100)}%` : ""}</text>
    </svg>
  );
}

/* ── Phone frame ─────────────────────────────────────────── */

function PhoneFrame({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="mx-auto w-[280px] rounded-[28px] border-[3px] border-[#1E293B] overflow-hidden shadow-2xl bg-white relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90px] h-[22px] bg-[#1E293B] rounded-b-[14px] z-10" />
      {title && (
        <div className="pt-[28px] px-3 pb-1 border-b border-[#E2E8F0] bg-[#F8FAFB]">
          <div className="text-[10px] font-semibold text-[#01B8AA] tracking-wider uppercase">{title}</div>
        </div>
      )}
      <div className={`${title ? '' : 'pt-[28px]'} px-3 pb-3 min-h-[380px]`}>
        {children}
      </div>
    </div>
  );
}

/* ── Desktop frame ───────────────────────────────────────── */

function DeskFrame({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xl bg-white">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-[#E2E8F0] bg-[#F8FAFB]">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FCA5A5]" />
          <div className="w-2 h-2 rounded-full bg-[#FDE68A]" />
          <div className="w-2 h-2 rounded-full bg-[#86EFAC]" />
        </div>
        <div className="flex-1 mx-6 text-center text-[9px] text-[#94A3B8] font-mono bg-white border border-[#E2E8F0] rounded px-2 py-0.5">{url}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ── Sidebar mock ────────────────────────────────────────── */

const sidebarItems = [
  { icon: BarChart3, label: "Dashboard" },
  { icon: ClipboardList, label: "Planning" },
  { icon: MapPin, label: "Visits" },
  { icon: Users, label: "Leads" },
  { icon: Navigation, label: "Territory" },
  { icon: Clock, label: "Attendance" },
  { icon: Trophy, label: "Performance" },
];

function MockSidebar({ active }: { active: string }) {
  return (
    <motion.div {...slideRight()} className="w-44 shrink-0 border-r border-[#E2E8F0] bg-[#FAFBFC] flex flex-col">
      <div className="h-10 flex items-center gap-2 px-3 border-b border-[#E2E8F0]">
        <div className="w-6 h-6 rounded-lg bg-[#01B8AA] flex items-center justify-center">
          <MapPin className="h-3 w-3 text-white" />
        </div>
        <span className="text-xs font-bold text-[#0F172A]">Field-Sync</span>
      </div>
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {sidebarItems.map((item) => (
          <div key={item.label} className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10px] font-medium ${item.label === active ? "bg-[#01B8AA]/10 text-[#01B8AA]" : "text-[#94A3B8]"}`}>
            <item.icon className="h-3.5 w-3.5" />
            {item.label}
          </div>
        ))}
      </nav>
      <div className="border-t border-[#E2E8F0] px-3 py-2">
        <div className="text-[9px] text-[#94A3B8]">ravi@acmeinsurance.com</div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   SCENES
   ════════════════════════════════════════════════════════════ */

/* ── Intro ───────────────────────────────────────────────── */

function SceneIntro() {
  return (
    <motion.div {...fade} className="flex h-full flex-col items-center justify-center relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 h-[400px] w-[400px] rounded-full bg-[#01B8AA]/10 blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 h-[300px] w-[300px] rounded-full bg-[#059669]/8 blur-[100px]" />
      </div>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, type: "spring" }}
        className="relative mb-6 h-20 w-20 rounded-2xl bg-gradient-to-br from-[#01B8AA] to-[#059669] flex items-center justify-center shadow-2xl shadow-[#01B8AA]/30">
        <MapPin className="h-10 w-10 text-white" />
      </motion.div>
      <motion.h1 {...slideUp(0.3)} className="relative text-4xl font-extrabold tracking-tight text-[#0F172A]">Field-Sync</motion.h1>
      <motion.p {...slideUp(0.6)} className="relative mt-2 text-base text-[#64748B]">Complete Field Force Management Platform</motion.p>
      <motion.div {...slideUp(1.2)} className="relative mt-6 flex items-center gap-4">
        {[
          { icon: MapPin, label: "GPS-Verified Visits" },
          { icon: Target, label: "Daily Targets" },
          { icon: BarChart3, label: "Live Analytics" },
        ].map((p, i) => (
          <motion.div key={p.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.4 + i * 0.2 }}
            className="flex items-center gap-1.5 rounded-full border border-[#01B8AA]/20 bg-[#01B8AA]/5 px-3 py-1.5 text-[10px] font-medium text-[#01B8AA]">
            <p.icon className="h-3 w-3" /> {p.label}
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ── Login ────────────────────────────────────────────────── */

function SceneLogin() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3800),
      setTimeout(() => setStep(4), 5200),
      setTimeout(() => setStep(5), 6500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full items-center justify-center relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/3 h-[300px] w-[300px] rounded-full bg-[#01B8AA]/8 blur-[100px]" />
      </div>
      <PhoneFrame>
        <div className="pt-4 text-center mb-4">
          <motion.div {...slideUp(0.2)} className="w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-[#01B8AA] to-[#059669] flex items-center justify-center mb-2">
            <MapPin className="h-5 w-5 text-white" />
          </motion.div>
          <motion.div {...slideUp(0.3)} className="text-sm font-bold text-[#0F172A]">Welcome Back</motion.div>
          <motion.div {...slideUp(0.35)} className="text-[10px] text-[#94A3B8]">Sign in to Field-Sync</motion.div>
        </div>

        <motion.div {...slideUp(0.4)} className="mb-2.5">
          <div className="text-[8px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Email</div>
          <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#F8FAFB] border border-[#E2E8F0]">
            {step >= 1 ? <Tw text="ravi.kumar@acmeinsurance.com" delay={0} speed={25} /> : <span className="text-[#94A3B8]">agent@company.com</span>}
          </div>
        </motion.div>

        <motion.div {...slideUp(0.5)} className="mb-2.5">
          <div className="text-[8px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Password</div>
          <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-[#F8FAFB] border border-[#E2E8F0] text-[#94A3B8]">
            {step >= 2 ? "••••••••" : ""}
          </div>
        </motion.div>

        <AnimatePresence>
          {step >= 3 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-3">
              <div className="text-[8px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Organization</div>
              <div className="text-[11px] px-2.5 py-1.5 rounded-lg border border-[#01B8AA]/30 bg-[#01B8AA]/5 font-medium text-[#0F172A]">
                Acme Insurance Pvt. Ltd.
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 4 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-[#01B8AA] to-[#059669] text-white text-xs font-semibold text-center shadow-lg shadow-[#01B8AA]/30">
              Sign In
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 flex flex-col items-center gap-2">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-[#01B8AA] border-t-transparent rounded-full" />
              <div className="text-[10px] text-[#01B8AA] font-medium">Signing in...</div>
            </motion.div>
          )}
        </AnimatePresence>
      </PhoneFrame>
    </motion.div>
  );
}

/* ── Dashboard ───────────────────────────────────────────── */

function SceneDashboard() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 600),
      setTimeout(() => setStep(2), 2000),
      setTimeout(() => setStep(3), 3500),
      setTimeout(() => setStep(4), 5500),
      setTimeout(() => setStep(5), 7500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Dashboard" />
      <div className="flex-1 overflow-hidden p-4">
        <motion.div {...slideUp(0)} className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[9px] font-bold text-[#01B8AA] uppercase tracking-wider">Dashboard</div>
            <div className="text-lg font-bold text-[#0F172A]">Welcome back, Ravi!</div>
          </div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
            className="text-[9px] font-semibold text-[#94A3B8] bg-[#F8FAFB] px-2.5 py-1 rounded-full border border-[#E2E8F0]">
            Today &middot; 09 Mar 2026
          </motion.div>
        </motion.div>

        {/* KPIs with sparklines */}
        <div className="grid grid-cols-4 gap-2.5 mb-3">
          {[
            { label: "Visits Today", value: "5/8", icon: MapPin, color: "#01B8AA", delay: 0.15, spark: [2, 4, 3, 6, 5, 7, 5] },
            { label: "This Week", value: "23", icon: TrendingUp, color: "#3B82F6", delay: 0.25, spark: [12, 15, 14, 18, 20, 22, 23] },
            { label: "Active Visit", value: "00:42", icon: Clock, color: "#F59E0B", delay: 0.35, spark: [30, 25, 35, 40, 38, 42] },
            { label: "Overdue", value: "3", icon: AlertTriangle, color: "#EF4444", delay: 0.45, spark: [5, 4, 6, 3, 4, 3] },
          ].map((k) => (
            <motion.div key={k.label} {...slideUp(k.delay)} className="relative rounded-xl border border-[#E2E8F0] bg-white p-2.5 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: k.color }} />
              <div className="flex items-start justify-between mb-1">
                <div>
                  <div className="text-[7px] font-semibold text-[#94A3B8] uppercase tracking-wider">{k.label}</div>
                  <div className="text-lg font-bold leading-tight" style={{ color: k.color }}><AnimVal value={k.value} delay={k.delay + 0.3} /></div>
                </div>
                <div className="rounded-lg p-1" style={{ background: `${k.color}10` }}><k.icon className="h-3 w-3" style={{ color: k.color }} /></div>
              </div>
              <Sparkline points={k.spark} color={k.color} delay={k.delay + 0.5} w={80} h={16} />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {/* Left column — pipeline + weekly chart */}
          <div className="col-span-3 space-y-2.5">
            {/* Pipeline funnel */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-3">
                  <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Today's Pipeline</div>
                  <div className="flex gap-1.5 items-end mb-2">
                    {[
                      { l: "Planned", n: 8, c: "#3B82F6" }, { l: "In Progress", n: 2, c: "#F59E0B" },
                      { l: "Visited", n: 5, c: "#16A34A" }, { l: "Follow-up", n: 3, c: "#EF4444" },
                    ].map((s, i) => (
                      <motion.div key={s.l} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                        className="flex-1 rounded-lg py-2 text-center relative overflow-hidden" style={{ background: `${s.c}08`, border: `1px solid ${s.c}20` }}>
                        <div className="text-base font-bold" style={{ color: s.c }}>{s.n}</div>
                        <div className="text-[7px] text-[#94A3B8] uppercase font-medium">{s.l}</div>
                        <div className="absolute bottom-0 inset-x-0 h-[2px]" style={{ background: s.c, opacity: 0.5 }} />
                      </motion.div>
                    ))}
                  </div>
                  {/* Progress bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-[#F1F5F9] overflow-hidden flex">
                      <motion.div className="h-full bg-[#16A34A]" initial={{ width: 0 }} animate={{ width: "62.5%" }} transition={{ duration: 0.8 }} />
                      <motion.div className="h-full bg-[#F59E0B]" initial={{ width: 0 }} animate={{ width: "25%" }} transition={{ duration: 0.6, delay: 0.3 }} />
                      <motion.div className="h-full bg-[#EF4444]" initial={{ width: 0 }} animate={{ width: "12.5%" }} transition={{ duration: 0.4, delay: 0.5 }} />
                    </div>
                    <span className="text-[9px] font-bold text-[#16A34A]">63%</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Weekly performance chart */}
            <AnimatePresence>
              {step >= 2 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider">This Week</div>
                    <div className="flex gap-3">
                      <span className="flex items-center gap-1 text-[8px] text-[#94A3B8]"><span className="w-1.5 h-1.5 rounded-full bg-[#01B8AA]" />Visits</span>
                      <span className="flex items-center gap-1 text-[8px] text-[#94A3B8]"><span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />Target</span>
                    </div>
                  </div>
                  <MiniBarChart delay={0.3} height={55} bars={[
                    { value: 6, color: "#01B8AA", label: "Mon" }, { value: 5, color: "#01B8AA", label: "Tue" },
                    { value: 7, color: "#01B8AA", label: "Wed" }, { value: 4, color: "#01B8AA", label: "Thu" },
                    { value: 5, color: "#01B8AA", label: "Fri" }, { value: 2, color: "#E2E8F0", label: "Sat" },
                  ]} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right column — actions + follow-ups + activity */}
          <div className="col-span-2 space-y-2.5">
            {/* Quick actions */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                  <div className="w-full py-2 rounded-lg bg-gradient-to-r from-[#01B8AA] to-[#059669] text-white text-[10px] font-semibold text-center flex items-center justify-center gap-1 shadow-lg shadow-[#01B8AA]/20">
                    <MapPin className="h-3 w-3" /> Start Visit
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="py-1.5 rounded-lg border border-[#E2E8F0] text-[9px] font-medium text-[#64748B] text-center flex items-center justify-center gap-1">
                      <Plus className="h-2.5 w-2.5" /> New Lead
                    </div>
                    <div className="py-1.5 rounded-lg border border-[#E2E8F0] text-[9px] font-medium text-[#64748B] text-center flex items-center justify-center gap-1">
                      <Calendar className="h-2.5 w-2.5" /> Plan
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Follow-ups with donut */}
            <AnimatePresence>
              {step >= 4 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] bg-white p-2.5">
                  <div className="text-[9px] font-semibold text-[#EF4444] mb-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Follow-ups (3)</div>
                  {[
                    { name: "Anil Sharma", date: "Overdue · 07 Mar", color: "#EF4444" },
                    { name: "Priya Patel", date: "Today · 3:00 PM", color: "#F59E0B" },
                    { name: "Suresh Reddy", date: "Tomorrow", color: "#3B82F6" },
                  ].map((f, i) => (
                    <motion.div key={f.name} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
                      className="flex items-center justify-between py-1 border-b border-[#F1F5F9] last:border-0">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1 h-5 rounded-full" style={{ background: f.color }} />
                        <div><div className="text-[10px] font-medium text-[#0F172A]">{f.name}</div><div className="text-[8px]" style={{ color: f.color }}>{f.date}</div></div>
                      </div>
                      <Phone className="h-3 w-3 text-[#01B8AA]" />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live activity feed */}
            <AnimatePresence>
              {step >= 5 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] bg-white p-2.5">
                  <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Recent Activity</div>
                  {[
                    { t: "Check-in at TechVista Ltd", time: "10:32 AM", c: "#16A34A" },
                    { t: "Call logged — Anil Sharma", time: "9:45 AM", c: "#3B82F6" },
                    { t: "Lead added — Green Energy Co", time: "9:15 AM", c: "#01B8AA" },
                  ].map((a, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.15 }}
                      className="flex items-start gap-1.5 py-1 text-[9px]">
                      <div className="w-1 h-1 rounded-full mt-1 shrink-0" style={{ background: a.c }} />
                      <div className="flex-1 text-[#475569] leading-snug">{a.t}</div>
                      <span className="text-[#CBD5E1] text-[8px] shrink-0">{a.time}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Leads ────────────────────────────────────────────────── */

function SceneLeads() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 4000),
      setTimeout(() => setStep(4), 6000),
      setTimeout(() => setStep(5), 8000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Leads" />
      <div className="flex-1 overflow-hidden p-4">
        <motion.div {...slideUp(0)} className="flex items-center justify-between mb-3">
          <div>
            <div className="text-lg font-bold text-[#01B8AA]">Prospects</div>
            <div className="text-[10px] text-[#94A3B8]">28 prospects</div>
          </div>
          <div className="flex gap-2">
            <motion.div {...slideLeft(0.3)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#01B8AA] text-white text-[10px] font-semibold">
              <Plus className="h-3 w-3" /> Add Lead
            </motion.div>
            <motion.div {...slideLeft(0.4)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] text-[10px] font-medium text-[#64748B]">
              <Upload className="h-3 w-3" /> CSV Upload
            </motion.div>
          </div>
        </motion.div>

        {/* Search typing */}
        <motion.div {...slideUp(0.2)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFB] mb-2.5">
          <Search className="h-3.5 w-3.5 text-[#94A3B8]" />
          <span className="text-[10px]">
            {step >= 1 ? <Tw text="Anil Sharma" delay={0} speed={50} /> : <span className="text-[#94A3B8]">Search by name, proposal no., location...</span>}
          </span>
        </motion.div>

        {/* Filter chips */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-1.5 mb-3">
              {[{ l: "All (28)", on: false }, { l: "Quote", on: true }, { l: "Lead", on: false }, { l: "Won", on: false }].map((f, i) => (
                <motion.span key={f.l} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                  className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${f.on ? "bg-[#01B8AA]/10 text-[#01B8AA] border-[#01B8AA]/30" : "bg-[#F8FAFB] text-[#94A3B8] border-[#E2E8F0]"}`}>{f.l}</motion.span>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lead cards appear */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
              {[
                { init: "AS", name: "Anil Sharma", detail: "Health · ₹15,000/yr · Dwarka", status: "Quote", bg: "#01B8AA", sc: "#D97706", sb: "#FFFBEB" },
                { init: "PP", name: "Priya Patel", detail: "Life · ₹25,000/yr · Janakpuri", status: "Lead", bg: "#F59E0B", sc: "#3B82F6", sb: "#EFF6FF" },
                { init: "RG", name: "Rajesh Gupta", detail: "Motor · ₹8,500/yr · Rohini", status: "Won", bg: "#EF4444", sc: "#16A34A", sb: "#F0FDF4" },
              ].map((l, i) => (
                <motion.div key={l.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${i === 0 && step >= 4 ? "border-[#01B8AA]/30 bg-[#01B8AA]/5" : "border-[#E2E8F0] bg-white"}`}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white" style={{ background: l.bg }}>{l.init}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold text-[#0F172A]">{l.name}</div>
                    <div className="text-[9px] text-[#94A3B8]">{l.detail}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold" style={{ background: l.sb, color: l.sc }}>{l.status}</span>
                    <div className="flex gap-1">
                      <div className="w-5 h-5 rounded bg-[#01B8AA]/10 flex items-center justify-center"><Phone className="h-2.5 w-2.5 text-[#01B8AA]" /></div>
                      <div className="w-5 h-5 rounded bg-[#16A34A]/10 flex items-center justify-center"><MessageSquare className="h-2.5 w-2.5 text-[#16A34A]" /></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap call on first lead */}
        <AnimatePresence>
          {step >= 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#01B8AA]/10 border border-[#01B8AA]/20">
              <Phone className="h-3.5 w-3.5 text-[#01B8AA]" />
              <span className="text-[10px] font-medium text-[#01B8AA]">Calling Anil Sharma — 98765 43210...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Planning ─────────────────────────────────────────────── */

function ScenePlanning() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 5000),
      setTimeout(() => setStep(4), 7000),
      setTimeout(() => setStep(5), 8500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const targets = [
    { m: "Prospects", val: step >= 2 ? "10" : "", pct: step >= 4 ? 70 : 0, actual: "7", c: "#01B8AA" },
    { m: "Quotes", val: step >= 2 ? "5" : "", pct: step >= 4 ? 60 : 0, actual: "3", c: "#F59E0B" },
    { m: "Sales", val: step >= 2 ? "2" : "", pct: step >= 4 ? 50 : 0, actual: "1", c: "#8B5CF6" },
  ];

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Planning" />
      <div className="flex-1 overflow-hidden p-4">
        <motion.div {...slideUp(0)} className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#01B8AA]" />
            <div className="text-lg font-bold text-[#01B8AA]">Daily Planning</div>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {step >= 1 && (
                <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#FFFBEB] text-[#D97706]">Draft</motion.span>
              )}
            </AnimatePresence>
            <span className="text-[10px] text-[#94A3B8]"><Calendar className="h-3 w-3 inline mr-1" />09 Mar 2026</span>
          </div>
        </motion.div>

        {/* Targets */}
        <motion.div {...slideUp(0.2)} className="rounded-xl border border-[#E2E8F0] bg-white p-3 mb-3">
          <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Target vs Achievement</div>
          {targets.map((r, i) => (
            <div key={r.m} className="mb-2.5 last:mb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-semibold text-[#0F172A]">{r.m}</span>
                <div className="flex items-center gap-2">
                  <AnimatePresence>
                    {step >= 2 && (
                      <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }}
                        className="px-2 py-0.5 rounded border border-[#E2E8F0] text-[10px] text-[#0F172A] font-mono bg-[#F8FAFB]">
                        {r.val}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {step >= 4 && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] text-[#94A3B8]">
                        {r.actual}/{r.val} ({r.pct}%)
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ background: r.c }}
                  initial={{ width: "0%" }} animate={{ width: `${r.pct}%` }} transition={{ duration: 0.8, delay: i * 0.15 }} />
              </div>
            </div>
          ))}
        </motion.div>

        {/* Markets typing */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] bg-white p-3 mb-3">
              <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Markets to Visit</div>
              <div className="mb-2">
                <div className="text-[8px] font-semibold text-[#94A3B8] mb-1">For Prospects</div>
                <div className="text-[10px] px-2.5 py-1.5 rounded-lg bg-[#F8FAFB] border border-[#E2E8F0]">
                  <Tw text="Main Market, Sector 5, Industrial Area" delay={0} speed={30} />
                </div>
              </div>
              <div>
                <div className="text-[8px] font-semibold text-[#94A3B8] mb-1">For Quotes</div>
                <div className="text-[10px] px-2.5 py-1.5 rounded-lg bg-[#F8FAFB] border border-[#E2E8F0]">
                  {step >= 4 ? <Tw text="Block B, Sector 12" delay={0} speed={30} /> : ""}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <AnimatePresence>
          {step >= 5 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="w-full py-2 rounded-lg bg-gradient-to-r from-[#01B8AA] to-[#059669] text-white text-xs font-semibold text-center flex items-center justify-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> Save Plan
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Map / Routes ─────────────────────────────────────────── */

function SceneMap() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 4500),
      setTimeout(() => setStep(4), 6500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const pins = [
    { x: 15, y: 70, n: "1", c: "#16A34A", name: "Sharma" },
    { x: 35, y: 35, n: "2", c: "#16A34A", name: "Patel" },
    { x: 55, y: 55, n: "3", c: "#F59E0B", name: "Gupta" },
    { x: 75, y: 25, n: "4", c: "#3B82F6", name: "Kumar" },
    { x: 85, y: 60, n: "5", c: "#3B82F6", name: "Joshi" },
  ];

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Territory" />
      <div className="flex-1 overflow-hidden flex flex-col">
        <motion.div {...slideUp(0)} className="flex items-center justify-between p-3 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-[#01B8AA]" />
            <span className="text-sm font-bold text-[#0F172A]">Visit Map</span>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence>
              {step >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-7 h-4 rounded-full bg-[#01B8AA] relative"><div className="absolute right-0.5 top-0.5 w-3 h-3 rounded-full bg-white" /></div>
                  <span className="text-[#64748B]">Routes</span>
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-[9px] bg-[#F8FAFB] px-2 py-0.5 rounded-full text-[#94A3B8] border border-[#E2E8F0]">5 visits</span>
          </div>
        </motion.div>

        {/* Map area */}
        <div className="flex-1 relative" style={{ background: "linear-gradient(135deg, #E0F7FA 0%, #F0FDFA 40%, #F0F9FF 100%)" }}>
          {/* Route line draws in */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.svg initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 w-full h-full">
                <motion.polyline
                  points={pins.map(p => `${p.x}%,${p.y}%`).join(" ")}
                  fill="none" stroke="#01B8AA" strokeWidth="2" strokeDasharray="6,3"
                  initial={{ pathLength: 0, opacity: 0.5 }} animate={{ pathLength: 1, opacity: 0.6 }} transition={{ duration: 1.5, ease: "easeOut" }}
                />
              </motion.svg>
            )}
          </AnimatePresence>

          {/* Pins drop in */}
          {pins.map((p, i) => (
            <AnimatePresence key={p.n}>
              {step >= 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: i * 0.15, type: "spring", stiffness: 300, damping: 20 }}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)" }}
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow-md"
                    style={{ background: p.c, border: "2px solid white" }}>{p.n}</div>
                  <div className="text-[7px] font-semibold text-[#0F172A] mt-0.5 bg-white/80 px-1 rounded">{p.name}</div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}

          {/* Distance badge */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-3 right-3 bg-white rounded-lg px-3 py-1.5 shadow-md border border-[#E2E8F0]">
                <div className="text-[8px] text-[#94A3B8]">Total Route</div>
                <div className="text-sm font-bold text-[#01B8AA]">47.3 km</div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigate button */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-[#01B8AA] text-white px-3 py-1.5 rounded-lg text-[10px] font-semibold shadow-lg">
                <Navigation className="h-3 w-3" /> Navigate to Gupta
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Visit (meeting) ──────────────────────────────────────── */

function SceneVisit() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 4500),
      setTimeout(() => setStep(4), 6500),
      setTimeout(() => setStep(5), 8500),
      setTimeout(() => setStep(6), 10500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full items-center justify-center gap-6">
      <PhoneFrame title="Visit Detail">
        <div className="pt-2">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="text-sm font-bold text-[#0F172A]">Anil Sharma</div>
              <div className="text-[9px] text-[#94A3B8]">Meeting &middot; Health Insurance</div>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold bg-[#FEF3C7] text-[#D97706]">IN PROGRESS</span>
          </div>

          {/* Check-in info */}
          <motion.div {...slideUp(0.2)} className="flex gap-2 mb-2">
            <div className="flex-1 p-2 rounded-lg bg-[#F0FDFA] border border-[#D1FAE5]">
              <div className="text-[7px] text-[#94A3B8] uppercase">Check-in</div>
              <div className="text-[10px] font-semibold">10:32 AM</div>
              <div className="text-[7px] text-[#94A3B8] font-mono">28.6139, 77.2090</div>
            </div>
            <div className="flex-1 p-2 rounded-lg bg-[#F8FAFB] border border-[#E2E8F0]">
              <div className="text-[7px] text-[#94A3B8] uppercase">Duration</div>
              <div className="text-[10px] font-semibold text-[#01B8AA]">
                {step >= 1 ? <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>00:42:15</motion.span> : "00:00:00"}
              </div>
              <div className="text-[7px] text-[#94A3B8]">Running...</div>
            </div>
          </motion.div>

          {/* Checklist items check one by one */}
          <div className="text-[8px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Checklist</div>
          <div className="mb-2 space-y-1">
            {[
              { text: "Presented quote", done: step >= 2 },
              { text: "Collected documents", done: step >= 3 },
              { text: "Customer signed", done: step >= 5 },
            ].map((c, i) => (
              <motion.div key={c.text} className="flex items-center gap-1.5 text-[10px]"
                animate={c.done ? { x: [0, 3, 0] } : {}} transition={{ duration: 0.2 }}>
                {c.done
                  ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[#01B8AA] text-xs">&#10003;</motion.span>
                  : <span className="text-[#94A3B8]">&#9744;</span>}
                <span className={c.done ? "text-[#0F172A]" : "text-[#94A3B8]"}>{c.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Notes typing */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="text-[8px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Visit Notes</div>
                <div className="text-[9px] p-2 rounded-lg bg-[#F8FAFB] border border-[#E2E8F0] min-h-[32px]">
                  <Tw text="Customer interested in ₹15L term plan. Needs spouse details. Follow up Thursday." delay={0} speed={20} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Photos */}
          <AnimatePresence>
            {step >= 5 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-2">
                <div className="text-[8px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Photos (3)</div>
                <div className="flex gap-1.5">
                  {[{ e: "📷", bg: "#F0FDFA" }, { e: "📄", bg: "#FFFBEB" }, { e: "🏠", bg: "#FEF2F2" }].map((p, i) => (
                    <motion.div key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.12, type: "spring" }}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-sm border border-[#E2E8F0]" style={{ background: p.bg }}>{p.e}</motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Complete */}
          <AnimatePresence>
            {step >= 6 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="mt-2 w-full py-2 rounded-lg bg-gradient-to-r from-[#01B8AA] to-[#059669] text-white text-[11px] font-semibold text-center flex items-center justify-center gap-1">
                <CheckCircle className="h-3.5 w-3.5" /> Complete Visit
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhoneFrame>
    </motion.div>
  );
}

/* ── Call & WhatsApp ───────────────────────────────────────── */

function SceneComms() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 4500),
      setTimeout(() => setStep(4), 6000),
      setTimeout(() => setStep(5), 8000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full items-center justify-center gap-6">
      <PhoneFrame title="Lead Detail">
        <div className="pt-2">
          <motion.div {...slideUp(0.1)} className="mb-3">
            <div className="text-sm font-bold text-[#0F172A]">Anil Sharma</div>
            <div className="text-[9px] text-[#94A3B8]">Health Insurance &middot; Quote Given &middot; ₹15,000/yr</div>
          </motion.div>

          {/* Action buttons */}
          <motion.div {...slideUp(0.3)} className="flex gap-2 mb-3">
            {[
              { icon: Phone, label: "Call", sub: "98765 43210", bg: "#F0FDFA", bc: "#D1FAE5", c: "#01B8AA" },
              { icon: MessageSquare, label: "WhatsApp", sub: "98765 43210", bg: "#F0FDF4", bc: "#BBF7D0", c: "#16A34A" },
              { icon: FileText, label: "Add Note", sub: "Log activity", bg: "#F8FAFB", bc: "#E2E8F0", c: "#64748B" },
            ].map((a, i) => (
              <motion.div key={a.label}
                animate={step === 1 && i === 0 ? { scale: [1, 0.95, 1.05, 1], borderColor: ["#D1FAE5", "#01B8AA", "#D1FAE5"] } : step === 2 && i === 1 ? { scale: [1, 0.95, 1.05, 1], borderColor: ["#BBF7D0", "#16A34A", "#BBF7D0"] } : {}}
                transition={{ duration: 0.4 }}
                className="flex-1 p-2.5 rounded-xl text-center border"
                style={{ background: a.bg, borderColor: a.bc }}>
                <a.icon className="h-5 w-5 mx-auto mb-1" style={{ color: a.c }} />
                <div className="text-[10px] font-semibold" style={{ color: a.c }}>{a.label}</div>
                <div className="text-[8px] text-[#94A3B8]">{a.sub}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Calling indicator */}
          <AnimatePresence>
            {step >= 1 && step < 2 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#01B8AA]/10 border border-[#01B8AA]/20 mb-2">
                <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }}>
                  <Phone className="h-3.5 w-3.5 text-[#01B8AA]" />
                </motion.div>
                <span className="text-[10px] font-medium text-[#01B8AA]">Calling 98765 43210...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* WhatsApp opening */}
          <AnimatePresence>
            {step >= 2 && step < 3 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#16A34A]/10 border border-[#16A34A]/20 mb-2">
                <MessageSquare className="h-3.5 w-3.5 text-[#16A34A]" />
                <span className="text-[10px] font-medium text-[#16A34A]">Opening WhatsApp...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Activity timeline builds */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-[8px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Activity Timeline</div>
                {[
                  { text: "Called Anil — discussed premium options", time: "Just now", c: "#01B8AA", show: step >= 3 },
                  { text: "WhatsApp: Sent brochure PDF", time: "Just now", c: "#16A34A", show: step >= 4 },
                  { text: "Visit completed — quote presented", time: "07 Mar", c: "#3B82F6", show: step >= 5 },
                  { text: "Lead created from CSV upload", time: "05 Mar", c: "#8B5CF6", show: step >= 5 },
                ].filter(a => a.show).map((a, i) => (
                  <motion.div key={a.text} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex gap-2 pb-2 ml-1.5" style={{ borderLeft: `2px solid ${a.c}`, paddingLeft: 10 }}>
                    <div>
                      <div className="text-[10px] text-[#0F172A]">{a.text}</div>
                      <div className="text-[8px] text-[#94A3B8]">{a.time}</div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhoneFrame>
    </motion.div>
  );
}

/* ── Team Leader ──────────────────────────────────────────── */

function SceneTeam() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 5000),
      setTimeout(() => setStep(4), 7500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Dashboard" />
      <div className="flex-1 overflow-hidden p-4">
        <motion.div {...slideUp(0)} className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[9px] font-bold text-[#01B8AA] uppercase tracking-wider flex items-center gap-1"><Users className="h-3 w-3" /> Team Leader View</div>
            <div className="text-lg font-bold text-[#0F172A]">Team — Delhi West</div>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-[8px] font-semibold text-white bg-[#16A34A] px-2 py-0.5 rounded-full">8 of 10 active</motion.div>
        </motion.div>

        {/* KPIs with donuts */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: "Visits", value: "32", icon: MapPin, color: "#01B8AA", delay: 0.1, donutVal: 32, donutMax: 45 },
            { label: "Attendance", value: "87%", icon: Clock, color: "#16A34A", delay: 0.2, donutVal: 87, donutMax: 100 },
            { label: "Plan Done", value: "72%", icon: CheckCircle, color: "#F59E0B", delay: 0.3, donutVal: 72, donutMax: 100 },
            { label: "Conversions", value: "18", icon: Target, color: "#8B5CF6", delay: 0.4, donutVal: 18, donutMax: 30 },
          ].map((k) => (
            <motion.div key={k.label} {...slideUp(k.delay)} className="rounded-xl border border-[#E2E8F0] p-2 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: k.color }} />
              <div className="flex items-center gap-1.5">
                <MiniDonut value={k.donutVal} max={k.donutMax} color={k.color} size={32} delay={k.delay + 0.3} />
                <div>
                  <div className="text-sm font-bold leading-tight" style={{ color: k.color }}><AnimVal value={k.value} delay={k.delay + 0.3} /></div>
                  <div className="text-[7px] text-[#94A3B8] uppercase font-medium">{k.label}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {/* Left — targets + chart */}
          <div className="col-span-3 space-y-2.5">
            {/* Target vs Achievement */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-3">
                  <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Target vs Achievement</div>
                  {[
                    { m: "Prospects", t: 50, a: 38, c: "#01B8AA" },
                    { m: "Quotes Sent", t: 25, a: 18, c: "#3B82F6" },
                    { m: "Sales Closed", t: 10, a: 7, c: "#8B5CF6" },
                    { m: "Revenue (₹L)", t: 15, a: 10.8, c: "#16A34A" },
                  ].map((r, i) => (
                    <div key={r.m} className="mb-2 last:mb-0">
                      <div className="flex justify-between text-[9px] mb-0.5">
                        <span className="font-semibold text-[#0F172A]">{r.m}</span>
                        <span className="text-[#94A3B8]">{r.a}/{r.t} <span className="font-bold" style={{ color: r.c }}>({Math.round(r.a / r.t * 100)}%)</span></span>
                      </div>
                      <div className="h-2 rounded-full bg-[#F1F5F9] overflow-hidden relative">
                        <motion.div className="h-full rounded-full" style={{ background: r.c }} initial={{ width: "0%" }} animate={{ width: `${Math.round(r.a / r.t * 100)}%` }} transition={{ duration: 0.8, delay: i * 0.12 }} />
                        <div className="absolute top-0 h-full border-r-2 border-dashed" style={{ left: "100%", borderColor: `${r.c}40` }} />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Weekly team chart */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-3">
                  <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Team Weekly Trend</div>
                  <MiniBarChart delay={0.2} height={45} bars={[
                    { value: 28, color: "#01B8AA", label: "W1" }, { value: 35, color: "#01B8AA", label: "W2" },
                    { value: 30, color: "#01B8AA", label: "W3" }, { value: 32, color: "#3B82F6", label: "W4" },
                  ]} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — leaderboard + live map */}
          <div className="col-span-2 space-y-2.5">
            {/* Leaderboard */}
            <AnimatePresence>
              {step >= 2 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-2.5">
                  <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Top Performers</div>
                  {[
                    { rank: 1, n: "Ravi Kumar", v: 8, s: "₹4.2L", badge: "Gold", bc: "#D97706", bb: "#FFFBEB" },
                    { rank: 2, n: "Meera Singh", v: 7, s: "₹3.8L", badge: "Silver", bc: "#0EA5E9", bb: "#F0F9FF" },
                    { rank: 3, n: "Amit Verma", v: 6, s: "₹2.9L", badge: "Bronze", bc: "#8B5CF6", bb: "#FAF5FF" },
                  ].map((p, i) => (
                    <motion.div key={p.n} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
                      className="flex items-center gap-2 py-1.5 border-b border-[#F1F5F9] last:border-0">
                      <span className="text-[10px] font-bold w-4 text-center" style={{ color: p.bc }}>#{p.rank}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold text-[#0F172A] truncate">{p.n}</div>
                        <div className="text-[8px] text-[#94A3B8]">{p.v} visits · {p.s}</div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded-full text-[7px] font-bold shrink-0" style={{ background: p.bb, color: p.bc }}>{p.badge}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Live location */}
            <AnimatePresence>
              {step >= 4 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-2.5 bg-[#F0FDF9]">
                  <div className="text-[9px] font-semibold text-[#01B8AA] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                    Live Locations
                  </div>
                  {[
                    { n: "Ravi K.", loc: "TechVista, Dwarka", t: "2m ago" },
                    { n: "Meera S.", loc: "GreenTech, Janakpuri", t: "5m ago" },
                    { n: "Amit V.", loc: "In transit...", t: "1m ago" },
                  ].map((a, i) => (
                    <motion.div key={a.n} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-1.5 py-1 text-[9px]">
                      <MapPin className="h-2.5 w-2.5 text-[#01B8AA] mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0"><span className="font-semibold text-[#0F172A]">{a.n}</span> <span className="text-[#64748B]">{a.loc}</span></div>
                      <span className="text-[7px] text-[#94A3B8] shrink-0">{a.t}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Branch ───────────────────────────────────────────────── */

function SceneBranch() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 5000),
      setTimeout(() => setStep(4), 7000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Performance" />
      <div className="flex-1 overflow-hidden p-4">
        <motion.div {...slideUp(0)} className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[9px] font-bold text-[#8B5CF6] uppercase tracking-wider flex items-center gap-1"><Building2 className="h-3 w-3" /> Branch Manager View</div>
            <div className="text-lg font-bold text-[#0F172A]">Delhi West — Branch Analytics</div>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-[8px] font-semibold text-white bg-[#8B5CF6] px-2 py-0.5 rounded-full">3 Teams · 22 Agents</motion.div>
        </motion.div>

        {/* KPIs with sparklines */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: "Visits MTD", value: "156", color: "#01B8AA", delay: 0.1, spark: [80, 95, 110, 125, 140, 156] },
            { label: "Sales", value: "₹12.4L", color: "#16A34A", delay: 0.2, spark: [4, 6.2, 8.1, 9.5, 11, 12.4] },
            { label: "Attendance", value: "91%", color: "#3B82F6", delay: 0.3, spark: [85, 88, 90, 87, 92, 91] },
            { label: "Conversion", value: "24%", color: "#F59E0B", delay: 0.4, spark: [18, 20, 19, 22, 23, 24] },
          ].map((k) => (
            <motion.div key={k.label} {...slideUp(k.delay)} className="rounded-xl border border-[#E2E8F0] p-2 relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: k.color }} />
              <div className="text-[7px] font-semibold text-[#94A3B8] uppercase tracking-wider">{k.label}</div>
              <div className="flex items-end justify-between">
                <div className="text-base font-bold leading-tight" style={{ color: k.color }}><AnimVal value={k.value} delay={k.delay + 0.3} /></div>
                <Sparkline points={k.spark} color={k.color} delay={k.delay + 0.5} w={50} h={16} />
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {/* Left — team comparison + chart */}
          <div className="col-span-3 space-y-2.5">
            {/* Team comparison */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-3">
                  <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Team Performance</div>
                  <div className="text-[7px] grid grid-cols-7 gap-1 py-1 text-[#94A3B8] font-semibold border-b border-[#E2E8F0]">
                    <div className="col-span-2">Team</div><div className="text-center">Visits</div><div className="text-center">Sales</div><div className="text-center">Conv.</div><div className="text-center">Attend.</div><div className="text-center">Score</div>
                  </div>
                  {[
                    { n: "Team Alpha", v: 58, s: "₹4.8L", conv: "28%", att: "94%", score: 92, c: "#16A34A" },
                    { n: "Team Beta", v: 52, s: "₹4.2L", conv: "24%", att: "90%", score: 85, c: "#01B8AA" },
                    { n: "Team Gamma", v: 46, s: "₹3.4L", conv: "20%", att: "88%", score: 72, c: "#F59E0B" },
                  ].map((t, i) => (
                    <motion.div key={t.n} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                      className="text-[9px] grid grid-cols-7 gap-1 py-1.5 border-b border-[#F1F5F9] last:border-0 items-center">
                      <div className="col-span-2 font-semibold text-[#0F172A] flex items-center gap-1">
                        <div className="w-1 h-4 rounded-full" style={{ background: t.c }} />{t.n}
                      </div>
                      <div className="text-center text-[#64748B]">{t.v}</div>
                      <div className="text-center text-[#64748B]">{t.s}</div>
                      <div className="text-center text-[#64748B]">{t.conv}</div>
                      <div className="text-center text-[#64748B]">{t.att}</div>
                      <div className="text-center">
                        <span className="px-1 py-0.5 rounded text-[8px] font-bold" style={{ background: `${t.c}15`, color: t.c }}>{t.score}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Monthly trend chart */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider">Monthly Sales Trend</div>
                    <span className="text-[8px] text-[#16A34A] font-bold flex items-center gap-0.5"><TrendingUp className="h-2.5 w-2.5" /> +18%</span>
                  </div>
                  <MiniBarChart delay={0.2} height={50} bars={[
                    { value: 8.2, color: "#01B8AA20", label: "Oct" }, { value: 9.5, color: "#01B8AA40", label: "Nov" },
                    { value: 10.1, color: "#01B8AA60", label: "Dec" }, { value: 9.8, color: "#01B8AA80", label: "Jan" },
                    { value: 11.2, color: "#01B8AAC0", label: "Feb" }, { value: 12.4, color: "#01B8AA", label: "Mar" },
                  ]} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — agent table + alerts */}
          <div className="col-span-2 space-y-2.5">
            {/* Top agents */}
            <AnimatePresence>
              {step >= 2 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-2.5">
                  <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1.5">Agent Leaderboard</div>
                  {[
                    { r: 1, n: "Ravi Kumar", v: "18/20", s: "₹4.2L", bc: "#D97706", bb: "#FFFBEB", badge: "Gold" },
                    { r: 2, n: "Meera Singh", v: "15/20", s: "₹3.8L", bc: "#0EA5E9", bb: "#F0F9FF", badge: "Silver" },
                    { r: 3, n: "Amit Verma", v: "12/20", s: "₹2.9L", bc: "#8B5CF6", bb: "#FAF5FF", badge: "Bronze" },
                    { r: 4, n: "Neha Joshi", v: "8/20", s: "₹1.5L", bc: "#94A3B8", bb: "#F8FAFB", badge: "—" },
                  ].map((a, i) => (
                    <motion.div key={a.n} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-1.5 py-1 border-b border-[#F1F5F9] last:border-0">
                      <span className="text-[9px] font-bold w-3 text-center" style={{ color: a.bc }}>#{a.r}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-semibold text-[#0F172A] truncate">{a.n}</div>
                        <div className="text-[7px] text-[#94A3B8]">{a.v} visits · {a.s}</div>
                      </div>
                      <span className="px-1 py-0.5 rounded-full text-[7px] font-bold shrink-0" style={{ background: a.bb, color: a.bc }}>{a.badge}</span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Alerts & insights */}
            <AnimatePresence>
              {step >= 4 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                  <div className="rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-2.5">
                    <div className="text-[9px] font-semibold text-[#16A34A] flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Best week this quarter</div>
                    <div className="text-[8px] text-[#64748B] mt-0.5">58 visits this week — 22% above branch average</div>
                  </div>
                  <div className="rounded-xl border border-[#FEF3C7] bg-[#FFFBEB] p-2.5">
                    <div className="text-[9px] font-semibold text-[#D97706] flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> 3 agents below target</div>
                    <div className="text-[8px] text-[#64748B] mt-0.5">Neha, Suresh, and Pooja need coaching</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── HQ / Head Office ─────────────────────────────────────── */

function SceneHQ() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 5000),
      setTimeout(() => setStep(4), 7500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Dashboard" />
      <div className="flex-1 overflow-hidden p-4">
        <motion.div {...slideUp(0)} className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[9px] font-bold text-[#01B8AA] uppercase tracking-wider flex items-center gap-1"><Eye className="h-3 w-3" /> Head Office</div>
            <div className="text-lg font-bold text-[#0F172A]">Organization Overview</div>
          </div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-[8px] font-semibold text-white bg-[#0F172A] px-2 py-0.5 rounded-full">4 Branches · 50 Agents</motion.div>
        </motion.div>

        {/* Top KPIs with donuts */}
        <div className="grid grid-cols-5 gap-2 mb-3">
          {[
            { label: "Total Visits", value: "1,248", color: "#01B8AA", delay: 0.1, dv: 1248, dm: 1600 },
            { label: "Revenue", value: "₹56.6L", color: "#16A34A", delay: 0.15, dv: 56.6, dm: 75 },
            { label: "Active", value: "42/50", color: "#3B82F6", delay: 0.2, dv: 42, dm: 50 },
            { label: "Attendance", value: "89%", color: "#F59E0B", delay: 0.25, dv: 89, dm: 100 },
            { label: "Plan Done", value: "76%", color: "#8B5CF6", delay: 0.3, dv: 76, dm: 100 },
          ].map((k) => (
            <motion.div key={k.label} {...slideUp(k.delay)} className="rounded-xl border border-[#E2E8F0] p-2 relative overflow-hidden text-center">
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: k.color }} />
              <MiniDonut value={k.dv} max={k.dm} color={k.color} size={30} delay={k.delay + 0.3} />
              <div className="text-xs font-bold leading-tight mt-0.5" style={{ color: k.color }}><AnimVal value={k.value} delay={k.delay + 0.3} /></div>
              <div className="text-[7px] text-[#94A3B8] uppercase font-medium">{k.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-5 gap-2.5">
          {/* Left — branch comparison table */}
          <div className="col-span-3 space-y-2.5">
            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-3">
                  <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Branch Performance</div>
                  <div className="text-[7px] grid grid-cols-8 gap-1 py-1 text-[#94A3B8] font-semibold border-b border-[#E2E8F0]">
                    <div className="col-span-2">Branch</div><div className="text-center">Agents</div><div className="text-center">Visits</div><div className="text-center">Sales</div><div className="text-center">Conv.</div><div className="text-center">Attend.</div><div className="text-center">Score</div>
                  </div>
                  {[
                    { n: "Delhi West", a: 12, v: 156, s: "₹18.5L", conv: "28%", att: "94%", score: 92, c: "#16A34A" },
                    { n: "Mumbai Central", a: 15, v: 198, s: "₹22.1L", conv: "24%", att: "90%", score: 88, c: "#01B8AA" },
                    { n: "Bangalore East", a: 16, v: 145, s: "₹9.8L", conv: "18%", att: "86%", score: 74, c: "#F59E0B" },
                    { n: "Chennai South", a: 7, v: 62, s: "₹6.2L", conv: "14%", att: "72%", score: 45, c: "#EF4444" },
                  ].map((b, i) => (
                    <motion.div key={b.n} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
                      className="text-[9px] grid grid-cols-8 gap-1 py-1.5 border-b border-[#F1F5F9] last:border-0 items-center">
                      <div className="col-span-2 font-semibold text-[#0F172A] flex items-center gap-1">
                        <div className="w-1 h-4 rounded-full" style={{ background: b.c }} />{b.n}
                      </div>
                      <div className="text-center text-[#64748B]">{b.a}</div>
                      <div className="text-center text-[#64748B]">{b.v}</div>
                      <div className="text-center text-[#64748B]">{b.s}</div>
                      <div className="text-center text-[#64748B]">{b.conv}</div>
                      <div className="text-center text-[#64748B]">{b.att}</div>
                      <div className="text-center">
                        <span className="px-1 py-0.5 rounded text-[8px] font-bold" style={{ background: `${b.c}15`, color: b.c }}>{b.score}</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quarterly revenue chart */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider">Quarterly Revenue (₹L)</div>
                    <span className="text-[8px] text-[#16A34A] font-bold flex items-center gap-0.5"><TrendingUp className="h-2.5 w-2.5" /> +24% YoY</span>
                  </div>
                  <MiniBarChart delay={0.2} height={50} bars={[
                    { value: 32, color: "#01B8AA40", label: "Q1'25" }, { value: 38, color: "#01B8AA60", label: "Q2'25" },
                    { value: 41, color: "#01B8AA80", label: "Q3'25" }, { value: 45, color: "#01B8AAA0", label: "Q4'25" },
                    { value: 50, color: "#01B8AAD0", label: "Q1'26" }, { value: 56.6, color: "#01B8AA", label: "Q2'26" },
                  ]} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right — summary stats + alerts */}
          <div className="col-span-2 space-y-2.5">
            {/* Key metrics grid */}
            <AnimatePresence>
              {step >= 2 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-1.5">
                  {[
                    { v: "₹56.6L", l: "Total Revenue", c: "#16A34A", icon: TrendingUp },
                    { v: "74%", l: "Avg Achievement", c: "#01B8AA", icon: Target },
                    { v: "561", l: "Visits/Month", c: "#3B82F6", icon: MapPin },
                    { v: "22%", l: "Conversion Rate", c: "#8B5CF6", icon: Sparkles },
                  ].map((k, i) => (
                    <motion.div key={k.l} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                      className="rounded-xl border border-[#E2E8F0] p-2 text-center">
                      <k.icon className="h-3 w-3 mx-auto mb-0.5" style={{ color: k.c }} />
                      <div className="text-sm font-bold" style={{ color: k.c }}>{k.v}</div>
                      <div className="text-[7px] text-[#94A3B8] uppercase">{k.l}</div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Alerts */}
            <AnimatePresence>
              {step >= 4 && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-1.5">
                  <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-2.5">
                    <div className="text-[9px] font-semibold text-[#EF4444] flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Critical Alert</div>
                    <div className="text-[8px] text-[#64748B] mt-0.5">Chennai South: 45% attendance — below threshold. 3 agents inactive for 2+ days.</div>
                  </div>
                  <div className="rounded-xl border border-[#DCFCE7] bg-[#F0FDF4] p-2.5">
                    <div className="text-[9px] font-semibold text-[#16A34A] flex items-center gap-1"><Trophy className="h-3 w-3" /> Top Branch</div>
                    <div className="text-[8px] text-[#64748B] mt-0.5">Delhi West: 92 score, 28% conversion — highest this quarter.</div>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="flex-1 py-1.5 rounded-lg bg-[#0F172A] text-[9px] font-semibold text-white text-center flex items-center justify-center gap-1">
                      <FileText className="h-2.5 w-2.5" /> Export Report
                    </div>
                    <div className="flex-1 py-1.5 rounded-lg border border-[#E2E8F0] text-[9px] font-semibold text-[#64748B] text-center flex items-center justify-center gap-1">
                      <Users className="h-2.5 w-2.5" /> Manage
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Outro ────────────────────────────────────────────────── */

function SceneOutro() {
  return (
    <motion.div {...fade} className="flex h-full flex-col items-center justify-center relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/3 h-[500px] w-[500px] rounded-full bg-[#01B8AA]/10 blur-[120px]" />
      </div>
      <motion.h2 {...slideUp(0.2)} className="relative text-3xl font-extrabold tracking-tight text-[#0F172A]">
        From field to HQ — <span className="text-[#01B8AA]">one platform.</span>
      </motion.h2>
      <motion.div {...slideUp(0.6)} className="relative mt-6 grid grid-cols-4 gap-4">
        {[
          { icon: MapPin, title: "GPS Visits", desc: "Every visit verified" },
          { icon: Target, title: "Daily Planning", desc: "Targets & tracking" },
          { icon: Trophy, title: "Performance", desc: "Badges & leaderboards" },
          { icon: BarChart3, title: "Analytics", desc: "Org-wide insights" },
        ].map((p, i) => (
          <motion.div key={p.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.15 }}
            className="relative rounded-xl border border-[#E2E8F0] bg-white p-4 text-center">
            <div className="mx-auto mb-2 w-9 h-9 rounded-xl bg-[#01B8AA]/10 flex items-center justify-center">
              <p.icon className="h-4 w-4 text-[#01B8AA]" />
            </div>
            <div className="text-xs font-bold text-[#0F172A]">{p.title}</div>
            <div className="text-[9px] text-[#94A3B8] mt-0.5">{p.desc}</div>
          </motion.div>
        ))}
      </motion.div>
      <motion.p {...slideUp(1.6)} className="relative mt-6 text-sm text-[#94A3B8]">
        Start your 14-day free trial &middot; No credit card required
      </motion.p>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN WALKTHROUGH
   ════════════════════════════════════════════════════════════ */

export default function Walkthrough() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  const currentScene = SCENES[sceneIndex];

  // Auto-advance scenes
  useEffect(() => {
    if (!playing) return;
    const timer = setTimeout(() => {
      if (sceneIndex < SCENES.length - 1) setSceneIndex((i) => i + 1);
      else { setSceneIndex(0); setElapsed(0); }
    }, currentScene.duration);
    return () => clearTimeout(timer);
  }, [sceneIndex, playing, currentScene.duration]);

  // Elapsed ticker
  useEffect(() => {
    if (!playing) return;
    const iv = setInterval(() => setElapsed((e) => e + 100), 100);
    return () => clearInterval(iv);
  }, [playing]);

  useEffect(() => { setElapsed(0); }, [sceneIndex]);

  const totalElapsed = SCENES.slice(0, sceneIndex).reduce((s, sc) => s + sc.duration, 0) + elapsed;
  const progress = Math.min((totalElapsed / TOTAL) * 100, 100);

  const restart = useCallback(() => { setSceneIndex(0); setElapsed(0); setPlaying(true); }, []);

  const renderScene = () => {
    switch (currentScene.id) {
      case "intro": return <SceneIntro />;
      case "login": return <SceneLogin />;
      case "dashboard": return <SceneDashboard />;
      case "leads": return <SceneLeads />;
      case "planning": return <ScenePlanning />;
      case "map": return <SceneMap />;
      case "visit": return <SceneVisit />;
      case "comms": return <SceneComms />;
      case "team": return <SceneTeam />;
      case "branch": return <SceneBranch />;
      case "hq": return <SceneHQ />;
      case "outro": return <SceneOutro />;
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#0B1A1E]" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-1.5">
        <div className="flex items-center gap-2 text-xs text-white/50">
          <MapPin className="h-3.5 w-3.5" />
          <span className="font-medium">Field-Sync Walkthrough</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="mr-3 hidden items-center gap-1 sm:flex">
            {SCENES.map((s, i) => (
              <button key={s.id} onClick={() => { setSceneIndex(i); setElapsed(0); setPlaying(true); }}
                className={`rounded-full px-2 py-0.5 text-[9px] font-medium transition-colors border-none cursor-pointer ${
                  i === sceneIndex ? "bg-[#01B8AA] text-white" : i < sceneIndex ? "bg-white/15 text-white/50" : "bg-white/5 text-white/25"
                }`}>
                {s.label}
              </button>
            ))}
          </div>
          <button onClick={() => setPlaying(!playing)}
            className="rounded-lg bg-white/10 p-1.5 text-white/50 hover:bg-white/20 hover:text-white border-none cursor-pointer">
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button onClick={restart} className="rounded-lg bg-white/10 p-1.5 text-white/50 hover:bg-white/20 hover:text-white border-none cursor-pointer">
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="h-0.5 bg-white/5">
        <motion.div className="h-full bg-[#01B8AA]" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
      </div>

      {/* Scene viewport */}
      <div className="flex-1 overflow-hidden bg-white">
        <div className="mx-auto h-full max-w-5xl">
          <AnimatePresence mode="wait">
            <motion.div key={currentScene.id} className="h-full">
              {renderScene()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
