import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, MapPin, Users, BarChart3,
  Calendar, Eye, Activity, Download, Share2, CheckCircle,
  AlertTriangle, Clock, TrendingUp, Zap, Shield,
  ClipboardList, Target, Bell,
} from "lucide-react";

/* ── Timing ─────────────────────────────────────────────── */

const SCENES = [
  { id: "start",     label: "Start",        duration: 4000 },
  { id: "dashboard", label: "Dashboard",    duration: 10000 },
  { id: "plan",      label: "Plan",         duration: 8000 },
  { id: "tracking",  label: "Live Tracking", duration: 8000 },
  { id: "team",      label: "Team Activity", duration: 8000 },
  { id: "reports",   label: "Reports",      duration: 6000 },
  { id: "end",       label: "End",          duration: 4000 },
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
  return <>{s}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="inline-block w-0.5 h-4 bg-violet-500 ml-0.5 align-middle" /></>;
}

/* ── Animated counter ────────────────────────────────────── */

function AnimVal({ value, delay = 0 }: { value: string; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay * 1000); return () => clearTimeout(t); }, [delay]);
  return <span>{show ? value : "\u2014"}</span>;
}

/* ── Sparkline ───────────────────────────────────────────── */

function Sparkline({ points, color, delay = 0, w = 80, h = 28 }: { points: number[]; color: string; delay?: number; w?: number; h?: number }) {
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

/* ── MiniBarChart ────────────────────────────────────────── */

function MiniBarChart({ bars, delay = 0, height = 70 }: { bars: { value: number; color: string; label?: string }[]; delay?: number; height?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay * 1000); return () => clearTimeout(t); }, [delay]);
  const max = Math.max(...bars.map(b => b.value));
  return (
    <div className="flex items-end gap-1" style={{ height }}>
      {bars.map((b, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
          <motion.div className="w-full rounded-t" style={{ background: b.color }}
            initial={{ height: 0 }} animate={{ height: show ? `${(b.value / max) * 100}%` : 0 }}
            transition={{ duration: 0.5, delay: i * 0.06 }} />
          {b.label && <span className="text-xs text-[#94A3B8] leading-none">{b.label}</span>}
        </div>
      ))}
    </div>
  );
}

/* ── MiniDonut ───────────────────────────────────────────── */

function MiniDonut({ value, max, color, size = 44, delay = 0 }: { value: number; max: number; color: string; size?: number; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay * 1000); return () => clearTimeout(t); }, [delay]);
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = show ? value / max : 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth="3" />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
        strokeDasharray={circ} initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ * (1 - pct) }}
        transition={{ duration: 0.8, delay }} style={{ transform: "rotate(-90deg)", transformOrigin: "center" }} />
      <text x={size / 2} y={size / 2 + 3} textAnchor="middle" className="text-[13px] font-bold" fill={color}>{show ? `${Math.round(pct * 100)}%` : ""}</text>
    </svg>
  );
}

/* ── MultiDonut (for reports scene) ──────────────────────── */

function MultiDonut({ segments, size = 80, delay = 0 }: { segments: { value: number; color: string; label: string }[]; size?: number; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay * 1000); return () => clearTimeout(t); }, [delay]);
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-4">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F1F5F9" strokeWidth="5" />
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dashOffset = circ * (1 - (show ? pct : 0));
          const rotation = -90 + (offset / total) * 360;
          offset += seg.value;
          return (
            <motion.circle
              key={i}
              cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={seg.color} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.8, delay: delay + i * 0.15 }}
              style={{ transform: `rotate(${rotation}deg)`, transformOrigin: "center" }}
            />
          );
        })}
      </svg>
      <div className="space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="text-[13px] text-[#64748B]">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── DeskFrame ───────────────────────────────────────────── */

function DeskFrame({ children, url }: { children: React.ReactNode; url: string }) {
  return (
    <div className="w-full rounded-xl border-[3px] border-[#1e293b] overflow-hidden shadow-2xl bg-white flex flex-col" style={{ aspectRatio: '16/9', boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}>
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-[#e2e8f0] bg-[#f1f5f9] shrink-0">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#fca5a5]" />
          <div className="w-3 h-3 rounded-full bg-[#fde68a]" />
          <div className="w-3 h-3 rounded-full bg-[#86efac]" />
        </div>
        <div className="flex-1 mx-4 text-center text-sm text-[#94a3b8] font-mono bg-white border border-[#e2e8f0] rounded px-3 py-1">{url}</div>
      </div>
      <div className="flex flex-1 min-h-0">{children}</div>
    </div>
  );
}

/* ── MockSidebar ─────────────────────────────────────────── */

type NavItem = "Dashboard" | "Today" | "Plan" | "Customers" | "Visits" | "Team";

const NAV_ITEMS: { label: NavItem; icon: typeof BarChart3 }[] = [
  { label: "Dashboard", icon: BarChart3 },
  { label: "Today",     icon: Clock },
  { label: "Plan",      icon: Calendar },
  { label: "Customers", icon: Users },
  { label: "Visits",    icon: MapPin },
  { label: "Team",      icon: Activity },
];

function MockSidebar({ active }: { active: NavItem }) {
  return (
    <div className="w-[180px] shrink-0 bg-[#F8FAFC] border-r border-[#E2E8F0] flex flex-col py-4 px-3">
      {/* Logo */}
      <div className="flex items-center gap-2 px-3 mb-5">
        <div className="w-7 h-7 rounded bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center">
          <MapPin className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-bold text-[#0F172A] tracking-tight">Field-Sync</span>
      </div>
      {/* Nav items */}
      <div className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = item.label === active;
          return (
            <div
              key={item.label}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-violet-50 text-violet-700 border-l-2 border-violet-500"
                  : "text-[#64748B] hover:bg-[#F1F5F9]"
              }`}
            >
              <item.icon className={`h-4 w-4 ${isActive ? "text-violet-500" : "text-[#94A3B8]"}`} />
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SCENES
   ════════════════════════════════════════════════════════════ */

/* ── Start ───────────────────────────────────────────────── */

function SceneStart() {
  const todayStats = [
    { label: "Planned Visits", value: "20", icon: MapPin, color: "#6366F1", bg: "#EEF2FF" },
    { label: "Agents on Duty", value: "8/10", icon: Users, color: "#16a34a", bg: "#F0FDF4" },
    { label: "Pending Orders", value: "5", icon: Target, color: "#7C3AED", bg: "#F5F3FF" },
    { label: "Collections Due", value: "\u20B91.5L", icon: TrendingUp, color: "#D97706", bg: "#FFFBEB" },
  ];

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <DeskFrame url="app.fieldsync.io/dashboard">
        <div className="flex w-full">
          <MockSidebar active="Dashboard" />
          <div className="flex-1 flex flex-col items-center justify-center py-8 px-8">
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
              className="mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-2xl shadow-violet-500/30"
            >
              <BarChart3 className="h-8 w-8 text-white" />
            </motion.div>

            <motion.div {...slideUp(0.3)} className="text-xl font-extrabold tracking-tight text-[#0F172A]">
              <Tw text="Good morning, Priya" delay={0.5} speed={40} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.6, duration: 0.4 }}
              className="mt-2.5 flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-[15px] font-medium text-violet-600"
            >
              <Shield className="h-4 w-4" /> Sales Manager
            </motion.div>

            <motion.div {...slideUp(2)} className="mt-2.5 text-base text-[#94A3B8] flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-violet-400" />
              <AnimVal value="18 Mar 2026" delay={2.2} />
            </motion.div>

            {/* Today's Summary Preview */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.5, duration: 0.5 }}
              className="mt-6 grid grid-cols-4 gap-3 w-full max-w-[520px]"
            >
              {todayStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.7 + i * 0.15 }}
                  className="rounded-lg border border-[#E2E8F0] p-3 text-center"
                  style={{ background: stat.bg }}
                >
                  <stat.icon className="h-5 w-5 mx-auto mb-1.5" style={{ color: stat.color }} />
                  <div className="text-lg font-bold text-[#0F172A]">{stat.value}</div>
                  <div className="text-xs font-medium mt-0.5" style={{ color: stat.color }}>{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </DeskFrame>
    </motion.div>
  );
}

/* ── Dashboard ───────────────────────────────────────────── */

function SceneDashboard() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2800),
      setTimeout(() => setStep(3), 4500),
      setTimeout(() => setStep(4), 6500),
      setTimeout(() => setStep(5), 8200),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const kpis = [
    { label: "On Duty", value: "8/10", color: "#16a34a", bg: "#F0FDF4", sparkData: [3, 5, 7, 6, 8, 8], delay: 0 },
    { label: "Visits Today", value: "14/20", color: "#6366F1", bg: "#EEF2FF", sparkData: [4, 8, 10, 12, 11, 14], delay: 0.1 },
    { label: "Orders", value: "\u20B91.2L", color: "#7C3AED", bg: "#F5F3FF", sparkData: [10, 20, 35, 50, 80, 120], delay: 0.2 },
    { label: "Collections", value: "\u20B948K", color: "#D97706", bg: "#FFFBEB", sparkData: [5, 12, 18, 25, 38, 48], delay: 0.3 },
  ];

  const agents = [
    { name: "Raj", status: "Active", dot: "#16a34a", location: "Acme Corp" },
    { name: "Amit", status: "In Transit", dot: "#EAB308", location: "En route" },
    { name: "Sneha", status: "Active", dot: "#16a34a", location: "Nova Traders" },
    { name: "Vikram", status: "Not Started", dot: "#94A3B8", location: "\u2014" },
    { name: "Priti", status: "Active", dot: "#16a34a", location: "Star Ind." },
  ];

  const feed = [
    { text: "Raj checked in at Acme Corp", time: "10:02 AM", icon: MapPin, color: "#16a34a" },
    { text: "Priti captured order \u20B924,500", time: "10:15 AM", icon: TrendingUp, color: "#7C3AED" },
    { text: "Amit added 2 customers via card scan", time: "10:30 AM", icon: Users, color: "#3B82F6" },
  ];

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <DeskFrame url="app.fieldsync.io/dashboard">
        <div className="flex w-full">
          <MockSidebar active="Dashboard" />
          <div className="flex-1 p-4 overflow-hidden">
            {/* Header */}
            <motion.div {...slideUp(0)} className="flex items-center justify-between mb-3">
              <div>
                <div className="text-base font-bold text-[#0F172A]">Dashboard</div>
                <div className="text-[13px] text-[#94A3B8]">18 Mar 2026 &middot; 10:30 AM</div>
              </div>
              <div className="flex items-center gap-1.5">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[13px] text-green-600 font-medium">Live</span>
              </div>
            </motion.div>

            {/* KPI Row */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-3 mb-3">
                  {kpis.map((kpi, i) => (
                    <motion.div
                      key={kpi.label}
                      {...slideUp(kpi.delay)}
                      className="rounded-lg p-3 border border-[#E2E8F0]"
                      style={{ background: kpi.bg }}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: kpi.color }}>{kpi.label}</div>
                      <div className="text-lg font-bold text-[#0F172A] mt-0.5"><AnimVal value={kpi.value} delay={0.5 + kpi.delay} /></div>
                      <Sparkline points={kpi.sparkData} color={kpi.color} delay={0.8 + kpi.delay} w={70} h={20} />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              {/* Left column */}
              <div className="flex-1 space-y-2">
                {/* Team status grid */}
                <AnimatePresence>
                  {step >= 2 && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-[#E2E8F0] p-3">
                      <div className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">Team Status</div>
                      <div className="space-y-1.5">
                        {agents.map((a, i) => (
                          <motion.div key={a.name} {...slideLeft(i * 0.08)} className="flex items-center gap-2 text-[13px]">
                            <motion.div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: a.dot }}
                              animate={a.dot === "#16a34a" ? { scale: [1, 1.3, 1] } : {}}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            <span className="font-medium text-[#0F172A] w-14">{a.name}</span>
                            <span className="text-[#94A3B8] truncate">{a.location}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Progress bar */}
                <AnimatePresence>
                  {step >= 3 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-[#E2E8F0] p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Today's Progress</span>
                        <span className="text-sm font-bold text-violet-600">70%</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
                          initial={{ width: 0 }}
                          animate={{ width: "70%" }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Mini bar chart */}
                <AnimatePresence>
                  {step >= 5 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-[#E2E8F0] p-3">
                      <div className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider mb-1.5">Visits by Agent (This Week)</div>
                      <MiniBarChart
                        bars={[
                          { value: 12, color: "#7C3AED", label: "Raj" },
                          { value: 9, color: "#6366F1", label: "Amit" },
                          { value: 11, color: "#8B5CF6", label: "Sneha" },
                          { value: 8, color: "#A78BFA", label: "Vikram" },
                          { value: 10, color: "#C4B5FD", label: "Priti" },
                        ]}
                        delay={0.2}
                        height={55}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Right column — Activity feed */}
              <AnimatePresence>
                {step >= 4 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-[200px] shrink-0 rounded-lg border border-[#E2E8F0] p-3"
                  >
                    <div className="flex items-center gap-1.5 mb-2.5">
                      <Bell className="h-3.5 w-3.5 text-violet-500" />
                      <span className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Activity</span>
                    </div>
                    <div className="space-y-3">
                      {feed.map((f, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.25 }}
                          className="flex gap-2"
                        >
                          <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5" style={{ background: `${f.color}15` }}>
                            <f.icon className="h-3 w-3" style={{ color: f.color }} />
                          </div>
                          <div>
                            <div className="text-xs text-[#0F172A] leading-tight">{f.text}</div>
                            <div className="text-[11px] text-[#94A3B8]">{f.time}</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </DeskFrame>
    </motion.div>
  );
}

/* ── Plan ─────────────────────────────────────────────────── */

function ScenePlan() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3800),
      setTimeout(() => setStep(4), 5500),
      setTimeout(() => setStep(5), 7000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const days = ["M", "T", "W", "T", "F", "S"];
  const todayIdx = 2; // Wednesday

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <DeskFrame url="app.fieldsync.io/plan">
        <div className="flex w-full">
          <MockSidebar active="Plan" />
          <div className="flex-1 p-4 overflow-hidden">
            {/* Header */}
            <motion.div {...slideUp(0)} className="flex items-center justify-between mb-3">
              <div>
                <div className="text-base font-bold text-[#0F172A]">Visit Planner</div>
                <div className="text-[13px] text-[#94A3B8]">Assign visits to your team</div>
              </div>
            </motion.div>

            {/* Calendar date selector */}
            <motion.div {...slideUp(0.1)} className="flex gap-1.5 mb-4">
              {days.map((d, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center py-2 rounded-lg text-[13px] font-semibold ${
                    i === todayIdx
                      ? "bg-violet-500 text-white"
                      : "bg-[#F1F5F9] text-[#94A3B8]"
                  }`}
                >
                  {d}
                  <div className={`text-xs mt-0.5 ${i === todayIdx ? "text-violet-100" : "text-[#CBD5E1]"}`}>{16 + i}</div>
                </div>
              ))}
            </motion.div>

            <div className="flex gap-3">
              {/* Assign visits panel */}
              <AnimatePresence>
                {step >= 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-[160px] shrink-0 rounded-lg border border-[#E2E8F0] p-3"
                  >
                    <div className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">Customers</div>
                    <div className="space-y-1.5">
                      {["Acme Corp", "Nova Traders", "Star Ind.", "Zen Retail", "Prime Stores", "Metro Dist."].map((c, i) => (
                        <motion.div
                          key={c}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`text-[13px] px-2.5 py-1.5 rounded border border-[#E2E8F0] bg-white font-medium text-[#0F172A] ${
                            (step >= 2 && c === "Acme Corp") || (step >= 3 && c === "Nova Traders")
                              ? "opacity-40"
                              : ""
                          }`}
                        >
                          {c}
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Schedule column */}
              <div className="flex-1 space-y-2.5">
                <div className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Raj's Schedule</div>

                {/* Existing visit */}
                <div className="rounded-lg border border-[#E2E8F0] p-2.5 flex items-center gap-2">
                  <div className="w-1.5 h-8 rounded-full bg-violet-400" />
                  <div>
                    <div className="text-[13px] font-medium text-[#0F172A]">Zen Retail</div>
                    <div className="text-xs text-[#94A3B8]">9:00 AM</div>
                  </div>
                </div>

                {/* Drag animation — Acme Corp */}
                <AnimatePresence>
                  {step >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: -60, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                      className="rounded-lg border-2 border-violet-300 border-dashed p-2.5 flex items-center gap-2 bg-violet-50"
                    >
                      <div className="w-1.5 h-8 rounded-full bg-violet-500" />
                      <div>
                        <div className="text-[13px] font-medium text-violet-700">Acme Corp</div>
                        <div className="text-xs text-violet-400">10:00 AM</div>
                      </div>
                      <CheckCircle className="h-4 w-4 text-violet-500 ml-auto" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Drag animation — Nova Traders */}
                <AnimatePresence>
                  {step >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: -60, scale: 0.9 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
                      className="rounded-lg border-2 border-violet-300 border-dashed p-2.5 flex items-center gap-2 bg-violet-50"
                    >
                      <div className="w-1.5 h-8 rounded-full bg-indigo-500" />
                      <div>
                        <div className="text-[13px] font-medium text-violet-700">Nova Traders</div>
                        <div className="text-xs text-violet-400">12:30 PM</div>
                      </div>
                      <CheckCircle className="h-4 w-4 text-violet-500 ml-auto" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Assignment count */}
                <AnimatePresence>
                  {step >= 4 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-3 space-y-1.5">
                      <div className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider">Assignments</div>
                      {[
                        { name: "Raj", count: 3, color: "#7C3AED" },
                        { name: "Amit", count: 4, color: "#6366F1" },
                        { name: "Sneha", count: 2, color: "#8B5CF6" },
                      ].map((a) => (
                        <div key={a.name} className="flex items-center justify-between text-[13px]">
                          <span className="text-[#0F172A] font-medium">{a.name}</span>
                          <span className="font-bold" style={{ color: a.color }}>{a.count} visits</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Plan published */}
                <AnimatePresence>
                  {step >= 5 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 px-3 py-2"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-semibold text-green-700">Plan Published</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </DeskFrame>
    </motion.div>
  );
}

/* ── Live Tracking ───────────────────────────────────────── */

function SceneTracking() {
  const [step, setStep] = useState(0);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => { setStep(3); setExpanded(true); }, 4500),
      setTimeout(() => setStep(4), 6500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <DeskFrame url="app.fieldsync.io/tracking">
        <div className="flex w-full">
          <MockSidebar active="Visits" />
          <div className="flex-1 p-4 overflow-hidden">
            {/* Header */}
            <motion.div {...slideUp(0)} className="flex items-center justify-between mb-3">
              <div>
                <div className="text-base font-bold text-[#0F172A]">Live Tracking</div>
                <div className="text-[13px] text-[#94A3B8]">Real-time field visibility</div>
              </div>
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-violet-500" />
                <span className="text-[13px] text-violet-600 font-medium">Live View</span>
              </div>
            </motion.div>

            <div className="flex gap-3">
              {/* Map area */}
              <AnimatePresence>
                {step >= 1 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 rounded-lg bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] border border-[#BAE6FD] relative overflow-hidden"
                    style={{ minHeight: 240 }}
                  >
                    {/* Grid lines */}
                    <div className="absolute inset-0 opacity-20">
                      {[...Array(6)].map((_, i) => (
                        <div key={`h-${i}`} className="absolute w-full border-t border-[#93C5FD]" style={{ top: `${(i + 1) * 16.6}%` }} />
                      ))}
                      {[...Array(6)].map((_, i) => (
                        <div key={`v-${i}`} className="absolute h-full border-l border-[#93C5FD]" style={{ left: `${(i + 1) * 16.6}%` }} />
                      ))}
                    </div>

                    {/* Road lines */}
                    <div className="absolute top-[30%] left-0 right-0 h-[1px] bg-[#94A3B8]/30" />
                    <div className="absolute top-[60%] left-0 right-0 h-[1px] bg-[#94A3B8]/30" />
                    <div className="absolute left-[40%] top-0 bottom-0 w-[1px] bg-[#94A3B8]/30" />
                    <div className="absolute left-[70%] top-0 bottom-0 w-[1px] bg-[#94A3B8]/30" />

                    {/* Agent dots */}
                    {/* Raj — checked in (green pulsing) */}
                    <motion.div
                      className="absolute"
                      style={{ top: "25%", left: "35%" }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/50"
                      />
                      <div className="absolute -top-4 left-4 text-xs font-bold text-green-700 bg-white/80 rounded px-1.5 py-0.5 whitespace-nowrap">Raj</div>
                    </motion.div>

                    {/* Amit — moving (blue) */}
                    <motion.div
                      className="absolute"
                      initial={{ top: "55%", left: "20%" }}
                      animate={{ top: "45%", left: "60%" }}
                      transition={{ duration: 4, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
                    >
                      <div className="w-4 h-4 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                      <div className="absolute -top-4 left-4 text-xs font-bold text-blue-700 bg-white/80 rounded px-1.5 py-0.5 whitespace-nowrap">Amit</div>
                    </motion.div>

                    {/* Sneha — completed (gray) */}
                    <motion.div
                      className="absolute"
                      style={{ top: "70%", left: "65%" }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="w-4 h-4 rounded-full bg-gray-400 shadow-lg shadow-gray-400/30" />
                      <div className="absolute -top-4 left-4 text-xs font-bold text-gray-600 bg-white/80 rounded px-1.5 py-0.5 whitespace-nowrap">Sneha</div>
                    </motion.div>

                    {/* Priti — checked in (green) */}
                    <motion.div
                      className="absolute"
                      style={{ top: "40%", left: "75%" }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        className="w-4 h-4 rounded-full bg-green-500 shadow-lg shadow-green-500/50"
                      />
                      <div className="absolute -top-4 left-4 text-xs font-bold text-green-700 bg-white/80 rounded px-1.5 py-0.5 whitespace-nowrap">Priti</div>
                    </motion.div>

                    {/* Map label */}
                    <div className="absolute bottom-2 left-2 text-xs text-[#94A3B8] font-mono">Delhi NCR Region</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Agent cards */}
              <AnimatePresence>
                {step >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="w-[180px] shrink-0 space-y-2"
                  >
                    {/* Raj card */}
                    <motion.div
                      {...slideLeft(0)}
                      className={`rounded-lg border p-2.5 transition-all cursor-pointer ${
                        expanded ? "border-violet-300 bg-violet-50" : "border-[#E2E8F0] bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <motion.div
                          animate={{ scale: [1, 1.3, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-green-500"
                        />
                        <span className="text-[13px] font-bold text-[#0F172A]">Raj</span>
                      </div>
                      <div className="text-xs text-[#64748B]">At Acme Corp</div>
                      <div className="text-[11px] text-[#94A3B8]">Checked in 10:02 AM</div>

                      {/* Expanded detail */}
                      <AnimatePresence>
                        {expanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-2 pt-2 border-t border-violet-200 space-y-1 overflow-hidden"
                          >
                            <div className="flex justify-between text-xs">
                              <span className="text-[#94A3B8]">Duration</span>
                              <span className="font-semibold text-[#0F172A]">42 min</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-[#94A3B8]">GPS</span>
                              <span className="font-semibold text-green-600">Verified</span>
                            </div>
                            <div className="flex justify-between text-xs">
                              <span className="text-[#94A3B8]">Notes</span>
                              <span className="font-medium text-[#0F172A]">Follow-up</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>

                    {/* Amit card */}
                    <motion.div {...slideLeft(0.15)} className="rounded-lg border border-[#E2E8F0] bg-white p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <motion.div
                          animate={{ x: [-1, 1, -1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="w-2 h-2 rounded-full bg-blue-500"
                        />
                        <span className="text-[13px] font-bold text-[#0F172A]">Amit</span>
                      </div>
                      <div className="text-xs text-[#64748B]">En route to Star Ind.</div>
                      <div className="text-[11px] text-[#94A3B8]">ETA 10 min</div>
                    </motion.div>

                    {/* Sneha card */}
                    <motion.div {...slideLeft(0.3)} className="rounded-lg border border-[#E2E8F0] bg-white p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        <span className="text-[13px] font-bold text-[#0F172A]">Sneha</span>
                      </div>
                      <div className="text-xs text-[#64748B]">Checked out from Nova</div>
                      <div className="text-[11px] text-green-600">Completed</div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* New event notification */}
            <AnimatePresence>
              {step >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="mt-3 flex items-center gap-2.5 rounded-lg bg-violet-50 border border-violet-200 px-3 py-2"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.5, repeat: 3 }}
                    className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center shrink-0"
                  >
                    <Zap className="h-3.5 w-3.5 text-white" />
                  </motion.div>
                  <div>
                    <div className="text-[13px] font-semibold text-violet-700">Raj just captured order</div>
                    <div className="text-sm font-bold text-violet-900">{"\u20B9"}24,500</div>
                  </div>
                  <div className="text-xs text-violet-400 ml-auto">Just now</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DeskFrame>
    </motion.div>
  );
}

/* ── Team Activity ───────────────────────────────────────── */

function SceneTeam() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 600),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 5000),
      setTimeout(() => setStep(4), 6800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const perf = [
    { name: "Raj",   visits: "3/3", orders: "\u20B924.5K", adherence: 100, color: "#16a34a" },
    { name: "Amit",  visits: "2/4", orders: "\u20B90",     adherence: 50,  color: "#EAB308" },
    { name: "Sneha", visits: "2/2", orders: "\u20B98K",    adherence: 100, color: "#16a34a" },
  ];

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <DeskFrame url="app.fieldsync.io/team">
        <div className="flex w-full">
          <MockSidebar active="Team" />
          <div className="flex-1 p-4 overflow-hidden">
            {/* Header */}
            <motion.div {...slideUp(0)} className="flex items-center justify-between mb-3">
              <div>
                <div className="text-base font-bold text-[#0F172A]">Team Activity</div>
                <div className="text-[13px] text-[#94A3B8]">Monitor your field team</div>
              </div>
            </motion.div>

            {/* Attendance overview */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { label: "Punched In", value: "8", icon: CheckCircle, color: "#16a34a", bg: "#F0FDF4" },
                    { label: "On Leave", value: "1", icon: Clock, color: "#6366F1", bg: "#EEF2FF" },
                    { label: "Not Started", value: "1", icon: AlertTriangle, color: "#EAB308", bg: "#FFFBEB" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.label}
                      {...slideUp(i * 0.1)}
                      className="rounded-lg p-3 border border-[#E2E8F0] text-center"
                      style={{ background: item.bg }}
                    >
                      <item.icon className="h-5 w-5 mx-auto mb-1" style={{ color: item.color }} />
                      <div className="text-lg font-bold text-[#0F172A]">{item.value}</div>
                      <div className="text-xs font-medium" style={{ color: item.color }}>{item.label}</div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Performance table */}
            <AnimatePresence>
              {step >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-[#E2E8F0] overflow-hidden mb-2"
                >
                  {/* Table header */}
                  <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    {["Agent", "Visits", "Orders", "Adherence"].map((h) => (
                      <div key={h} className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{h}</div>
                    ))}
                  </div>
                  {/* Table rows */}
                  {perf.map((p, i) => (
                    <motion.div
                      key={p.name}
                      initial={{ opacity: 0, x: 15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.15 }}
                      className="grid grid-cols-4 gap-2 px-3 py-2 border-b border-[#F1F5F9] last:border-0 items-center"
                    >
                      <div className="text-[13px] font-semibold text-[#0F172A]">{p.name}</div>
                      <div className="text-[13px] text-[#64748B]">{p.visits}</div>
                      <div className="text-[13px] font-medium text-[#0F172A]">{p.orders}</div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex-1 h-2 rounded-full bg-[#F1F5F9] overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ background: p.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${p.adherence}%` }}
                            transition={{ duration: 0.6, delay: i * 0.15 }}
                          />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: p.color }}>{p.adherence}%</span>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Amit behind plan alert */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="flex items-center gap-2.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 mb-2"
                >
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </motion.div>
                  <div>
                    <div className="text-[13px] font-semibold text-amber-700">Amit is behind plan</div>
                    <div className="text-xs text-amber-600">2 of 4 visits remaining, 0 orders captured</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collection summary */}
            <AnimatePresence>
              {step >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between rounded-lg bg-violet-50 border border-violet-200 px-4 py-2.5"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-violet-500" />
                    <span className="text-[13px] font-semibold text-violet-700">Collection Today</span>
                  </div>
                  <span className="text-[15px] font-bold text-violet-700">{"\u20B9"}48,200</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DeskFrame>
    </motion.div>
  );
}

/* ── Reports ─────────────────────────────────────────────── */

function SceneReports() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 600),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3800),
      setTimeout(() => setStep(4), 5000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const summary = [
    { label: "Team Visits", value: "14/20", sub: "70% completed", color: "#6366F1", icon: MapPin },
    { label: "Orders Captured", value: "\u20B91.2L", sub: "8 orders", color: "#7C3AED", icon: TrendingUp },
    { label: "Collections", value: "\u20B948.2K", sub: "6 receipts", color: "#D97706", icon: Target },
    { label: "New Customers", value: "5", sub: "3 card scans", color: "#16a34a", icon: Users },
  ];

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <DeskFrame url="app.fieldsync.io/reports">
        <div className="flex w-full">
          <MockSidebar active="Dashboard" />
          <div className="flex-1 p-4 overflow-hidden">
            {/* Header */}
            <motion.div {...slideUp(0)} className="flex items-center justify-between mb-3">
              <div>
                <div className="text-base font-bold text-[#0F172A]">End of Day Report</div>
                <div className="text-[13px] text-[#94A3B8]">18 Mar 2026 &middot; Summary</div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 border border-green-200">
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                <span className="text-xs text-green-700 font-semibold">All synced</span>
              </div>
            </motion.div>

            {/* Summary grid */}
            <AnimatePresence>
              {step >= 1 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-3 mb-3">
                  {summary.map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.12 }}
                      className="rounded-lg border border-[#E2E8F0] p-3 flex items-start gap-3"
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${s.color}15` }}>
                        <s.icon className="h-4 w-4" style={{ color: s.color }} />
                      </div>
                      <div>
                        <div className="text-xs text-[#94A3B8] font-semibold uppercase tracking-wider">{s.label}</div>
                        <div className="text-[15px] font-bold text-[#0F172A]">{s.value}</div>
                        <div className="text-xs text-[#94A3B8]">{s.sub}</div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Donut chart */}
            <AnimatePresence>
              {step >= 2 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-[#E2E8F0] p-3 mb-2">
                  <div className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wider mb-2">Visit Completion by Agent</div>
                  <MultiDonut
                    segments={[
                      { value: 3, color: "#7C3AED", label: "Raj (3/3)" },
                      { value: 2, color: "#EAB308", label: "Amit (2/4)" },
                      { value: 2, color: "#6366F1", label: "Sneha (2/2)" },
                      { value: 7, color: "#A78BFA", label: "Others (7/11)" },
                    ]}
                    size={64}
                    delay={0.2}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <AnimatePresence>
              {step >= 3 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 mb-2">
                  <motion.div
                    {...slideRight(0)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-violet-500 text-white text-[13px] font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" /> Download Report
                  </motion.div>
                  <motion.div
                    {...slideLeft(0.1)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-500 text-white text-[13px] font-semibold"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Share on WhatsApp
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tagline */}
            <AnimatePresence>
              {step >= 4 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]"
                >
                  <div className="text-[13px] text-[#64748B] font-medium">All data synced from field — <span className="text-violet-600 font-semibold">no manual reporting needed</span></div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DeskFrame>
    </motion.div>
  );
}

/* ── End ──────────────────────────────────────────────────── */

function SceneEnd() {
  const summaryStats = [
    { label: "Visits Completed", value: "14", icon: MapPin, color: "#6366F1", bg: "#EEF2FF" },
    { label: "Orders Captured", value: "8", icon: TrendingUp, color: "#7C3AED", bg: "#F5F3FF" },
    { label: "Collections", value: "\u20B948K", icon: Target, color: "#D97706", bg: "#FFFBEB" },
    { label: "New Customers", value: "5", icon: Users, color: "#16a34a", bg: "#F0FDF4" },
  ];

  const features = [
    { text: "Live GPS tracking", icon: MapPin, color: "#16a34a" },
    { text: "Structured visit plans", icon: ClipboardList, color: "#6366F1" },
    { text: "Real-time order & collection capture", icon: TrendingUp, color: "#7C3AED" },
    { text: "Zero end-of-day reporting", icon: Zap, color: "#D97706" },
  ];

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <DeskFrame url="app.fieldsync.io">
        <div className="flex w-full">
          <MockSidebar active="Dashboard" />
          <div className="flex-1 flex flex-col items-center justify-center py-4 px-8">
            <motion.div {...slideUp(0)} className="text-lg font-extrabold text-[#0F172A] mb-4 text-center">
              Everything a manager needs.
            </motion.div>

            {/* Summary stat cards */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-4 gap-3 w-full max-w-[520px] mb-4"
            >
              {summaryStats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.12 }}
                  className="rounded-lg border border-[#E2E8F0] p-3 text-center"
                  style={{ background: stat.bg }}
                >
                  <stat.icon className="h-5 w-5 mx-auto mb-1" style={{ color: stat.color }} />
                  <div className="text-lg font-bold text-[#0F172A]">{stat.value}</div>
                  <div className="text-xs font-medium" style={{ color: stat.color }}>{stat.label}</div>
                </motion.div>
              ))}
            </motion.div>

            <div className="grid grid-cols-2 gap-2.5 w-full max-w-[520px] mb-5">
              {features.map((f, i) => (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + i * 0.15 }}
                  className="flex items-center gap-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] px-3 py-2"
                >
                  <div className="w-7 h-7 rounded flex items-center justify-center shrink-0" style={{ background: `${f.color}15` }}>
                    <f.icon className="h-4 w-4" style={{ color: f.color }} />
                  </div>
                  <span className="text-sm font-medium text-[#0F172A]">{f.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1.5, type: "spring", stiffness: 200 }}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-violet-500 to-violet-600 text-white text-[15px] font-bold shadow-lg shadow-violet-500/30"
            >
              Start your 14-day free trial
            </motion.div>
          </div>
        </div>
      </DeskFrame>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN WALKTHROUGH
   ════════════════════════════════════════════════════════════ */

export default function ManagerWalkthrough() {
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
    switch (currentScene.id as SceneId) {
      case "start":     return <SceneStart />;
      case "dashboard": return <SceneDashboard />;
      case "plan":      return <ScenePlan />;
      case "tracking":  return <SceneTracking />;
      case "team":      return <SceneTeam />;
      case "reports":   return <SceneReports />;
      case "end":       return <SceneEnd />;
    }
  };

  return (
    <div className="flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-2 py-1.5 shrink-0">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <BarChart3 className="h-3.5 w-3.5" />
          <span className="font-medium">Manager Day Walkthrough</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="mr-3 hidden items-center gap-1 sm:flex">
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setSceneIndex(i); setElapsed(0); setPlaying(true); }}
                className={`rounded-full px-2 py-0.5 text-sm font-medium transition-colors border-none cursor-pointer ${
                  i === sceneIndex
                    ? "bg-violet-500 text-white"
                    : i < sceneIndex
                      ? "bg-violet-100 text-violet-600"
                      : "bg-[#F1F5F9] text-[#94A3B8]"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setPlaying(!playing)}
            className="rounded-lg bg-[#F1F5F9] p-1.5 text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] border-none cursor-pointer"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={restart}
            className="rounded-lg bg-[#F1F5F9] p-1.5 text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#0F172A] border-none cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress */}
      <div className="h-0.5 bg-[#E2E8F0] shrink-0">
        <motion.div className="h-full bg-violet-500" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
      </div>

      {/* Scene viewport */}
      <div className="overflow-hidden relative py-4">
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <motion.div key={currentScene.id}>
              {renderScene()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
