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

        {/* KPIs animate in one by one */}
        <div className="grid grid-cols-4 gap-2.5 mb-3">
          {[
            { label: "Visits Today", value: "5/8", sub: "8 planned", icon: MapPin, color: "#01B8AA", delay: 0.15 },
            { label: "This Week", value: "23", sub: "18 last week", icon: TrendingUp, color: "#3B82F6", delay: 0.25 },
            { label: "Active Visit", value: "00:42", sub: "In progress", icon: Clock, color: "#F59E0B", delay: 0.35 },
            { label: "Overdue", value: "3", sub: "Need attention", icon: AlertTriangle, color: "#EF4444", delay: 0.45 },
          ].map((k) => (
            <motion.div key={k.label} {...slideUp(k.delay)} className="relative rounded-xl border border-[#E2E8F0] bg-white p-3 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: k.color }} />
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[8px] font-semibold text-[#94A3B8] uppercase tracking-wider">{k.label}</div>
                  <div className="text-xl font-bold mt-0.5" style={{ color: k.color }}><AnimVal value={k.value} delay={k.delay + 0.3} /></div>
                </div>
                <div className="rounded-lg bg-[#F8FAFB] p-1"><k.icon className="h-3.5 w-3.5 text-[#94A3B8]" /></div>
              </div>
              <AnimatePresence>
                {step >= 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1 text-[9px] text-[#94A3B8]">{k.sub}</motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Pipeline animates */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 mb-3">
              {[
                { l: "Planned", n: 8, c: "#3B82F6" }, { l: "Visited", n: 5, c: "#16A34A" },
                { l: "Pending", n: 2, c: "#F59E0B" }, { l: "Follow-up", n: 3, c: "#EF4444" },
              ].map((s, i) => (
                <motion.div key={s.l} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.12 }}
                  className="flex-1 text-center py-2 rounded-lg" style={{ background: `${s.c}10`, border: `1px solid ${s.c}25` }}>
                  <div className="text-lg font-bold" style={{ color: s.c }}>{s.n}</div>
                  <div className="text-[8px] text-[#94A3B8] uppercase">{s.l}</div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick actions */}
        <AnimatePresence>
          {step >= 3 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
              <div className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#01B8AA] to-[#059669] text-white text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-lg shadow-[#01B8AA]/20 mb-2">
                <MapPin className="h-3.5 w-3.5" /> Start Visit
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Follow-ups */}
        <AnimatePresence>
          {step >= 4 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] bg-white p-3">
              <div className="text-[9px] font-semibold text-[#EF4444] mb-2 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Follow-ups Due (3)</div>
              {[
                { name: "Anil Sharma", date: "Overdue · 07 Mar" },
                { name: "Priya Patel", date: "Today" },
              ].map((f, i) => (
                <motion.div key={f.name} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                  className="flex items-center justify-between py-1.5 border-b border-[#F1F5F9] last:border-0">
                  <div><div className="text-[11px] font-medium text-[#0F172A]">{f.name}</div><div className="text-[9px] text-[#EF4444]">{f.date}</div></div>
                  <div className="w-6 h-6 rounded-lg bg-[#01B8AA]/10 flex items-center justify-center"><Phone className="h-3 w-3 text-[#01B8AA]" /></div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
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
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 5500),
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
            <div className="text-[9px] font-bold text-[#01B8AA] uppercase tracking-wider flex items-center gap-1"><Users className="h-3 w-3" /> Team</div>
            <div className="text-lg font-bold text-[#0F172A]">Team Dashboard</div>
          </div>
        </motion.div>

        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: "Team Visits", value: "32", icon: MapPin, color: "#01B8AA", delay: 0.1 },
            { label: "Active", value: "8/10", icon: Users, color: "#3B82F6", delay: 0.2 },
            { label: "Attendance", value: "87%", icon: Clock, color: "#16A34A", delay: 0.3 },
            { label: "Plan Done", value: "72%", icon: CheckCircle, color: "#F59E0B", delay: 0.4 },
          ].map((k) => (
            <motion.div key={k.label} {...slideUp(k.delay)} className="rounded-xl border border-[#E2E8F0] p-2.5 text-center relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: k.color }} />
              <k.icon className="h-3.5 w-3.5 mx-auto mb-1 text-[#94A3B8]" />
              <div className="text-lg font-bold" style={{ color: k.color }}><AnimVal value={k.value} delay={k.delay + 0.3} /></div>
              <div className="text-[8px] text-[#94A3B8] uppercase">{k.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Target bars animate */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-3 mb-3">
              <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Target vs Achievement</div>
              {[{ m: "Prospects", t: 50, a: 38, c: "#01B8AA" }, { m: "Quotes", t: 25, a: 18, c: "#F59E0B" }, { m: "Sales", t: 10, a: 7, c: "#8B5CF6" }].map((r, i) => (
                <div key={r.m} className="mb-2 last:mb-0">
                  <div className="flex justify-between text-[10px] mb-1"><span className="font-semibold">{r.m}</span><span className="text-[#94A3B8]">{r.a}/{r.t} ({Math.round(r.a / r.t * 100)}%)</span></div>
                  <div className="h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ background: r.c }} initial={{ width: "0%" }} animate={{ width: `${Math.round(r.a / r.t * 100)}%` }} transition={{ duration: 0.8, delay: i * 0.15 }} />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Leaderboard */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-3">
              <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Top Performers</div>
              {[
                { e: "🏆", n: "Ravi Kumar", d: "18 sales · ₹4.2L", badge: "Gold", bc: "#D97706", bb: "#FFFBEB" },
                { e: "🥈", n: "Meera Singh", d: "15 sales · ₹3.8L", badge: "Silver", bc: "#0EA5E9", bb: "#F0F9FF" },
                { e: "🥉", n: "Amit Verma", d: "12 sales · ₹2.9L", badge: "Bronze", bc: "#8B5CF6", bb: "#FAF5FF" },
              ].map((p, i) => (
                <motion.div key={p.n} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                  className="flex items-center gap-2.5 py-1.5 border-b border-[#F1F5F9] last:border-0">
                  <span className="text-sm">{p.e}</span>
                  <div className="flex-1"><div className="text-[11px] font-semibold">{p.n}</div><div className="text-[9px] text-[#94A3B8]">{p.d}</div></div>
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold" style={{ background: p.bb, color: p.bc }}>{p.badge}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── Branch ───────────────────────────────────────────────── */

function SceneBranch() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 3500),
      setTimeout(() => setStep(3), 6000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Performance" />
      <div className="flex-1 overflow-hidden p-4">
        <motion.div {...slideUp(0)} className="flex items-center justify-between mb-3">
          <div>
            <div className="text-[9px] font-bold text-[#8B5CF6] uppercase tracking-wider flex items-center gap-1"><Building2 className="h-3 w-3" /> Branch</div>
            <div className="text-lg font-bold text-[#0F172A]">Delhi West — Branch Analytics</div>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-2.5 mb-3">
          {[
            { label: "Visits MTD", value: "156", color: "#01B8AA", delay: 0.15 },
            { label: "Total Sales", value: "₹12.4L", color: "#16A34A", delay: 0.25 },
            { label: "Attendance", value: "91%", color: "#3B82F6", delay: 0.35 },
          ].map((k) => (
            <motion.div key={k.label} {...slideUp(k.delay)} className="rounded-xl border border-[#E2E8F0] p-3 text-center relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: k.color }} />
              <div className="text-xl font-bold" style={{ color: k.color }}><AnimVal value={k.value} delay={k.delay + 0.3} /></div>
              <div className="text-[8px] text-[#94A3B8] uppercase">{k.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Agent table appears row by row */}
        <AnimatePresence>
          {step >= 1 && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-3">
              <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Agent Performance</div>
              <div className="text-[8px] grid grid-cols-6 gap-1 py-1 text-[#94A3B8] font-semibold border-b border-[#E2E8F0]">
                <div className="col-span-2">Officer</div><div className="text-center">Prospects</div><div className="text-center">Quotes</div><div className="text-center">Sales</div><div className="text-center">Badge</div>
              </div>
              {[
                { n: "Ravi Kumar", p: "18/20", q: "8/10", s: "5/5", badge: "Gold", bc: "#D97706", bb: "#FFFBEB" },
                { n: "Meera Singh", p: "15/20", q: "7/10", s: "3/5", badge: "Silver", bc: "#0EA5E9", bb: "#F0F9FF" },
                { n: "Amit Verma", p: "12/20", q: "5/10", s: "2/5", badge: "Bronze", bc: "#8B5CF6", bb: "#FAF5FF" },
                { n: "Neha Joshi", p: "8/20", q: "3/10", s: "1/5", badge: "—", bc: "#94A3B8", bb: "#F8FAFB" },
              ].map((a, i) => (
                <motion.div key={a.n} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.2 }}
                  className="text-[10px] grid grid-cols-6 gap-1 py-1.5 border-b border-[#F1F5F9] last:border-0 items-center">
                  <div className="col-span-2 font-semibold text-[#0F172A]">{a.n}</div>
                  <div className="text-center text-[#64748B]">{a.p}</div>
                  <div className="text-center text-[#64748B]">{a.q}</div>
                  <div className="text-center text-[#64748B]">{a.s}</div>
                  <div className="text-center"><span className="px-1.5 py-0.5 rounded-full text-[8px] font-semibold" style={{ background: a.bb, color: a.bc }}>{a.badge}</span></div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ── HQ / Head Office ─────────────────────────────────────── */

function SceneHQ() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 3500),
      setTimeout(() => setStep(3), 6000),
      setTimeout(() => setStep(4), 8000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="flex h-full">
      <MockSidebar active="Dashboard" />
      <div className="flex-1 overflow-hidden p-4">
        <motion.div {...slideUp(0)} className="mb-3">
          <div className="text-[9px] font-bold text-[#01B8AA] uppercase tracking-wider">Head Office</div>
          <div className="text-lg font-bold text-[#0F172A]">Organization Dashboard</div>
        </motion.div>

        <div className="grid grid-cols-4 gap-2 mb-3">
          {[
            { label: "Visits", value: "248", color: "#01B8AA", delay: 0.1 },
            { label: "Active Agents", value: "42/50", color: "#3B82F6", delay: 0.2 },
            { label: "Attendance", value: "89%", color: "#16A34A", delay: 0.3 },
            { label: "Plan Done", value: "76%", color: "#F59E0B", delay: 0.4 },
          ].map((k) => (
            <motion.div key={k.label} {...slideUp(k.delay)} className="rounded-xl border border-[#E2E8F0] p-2.5 text-center relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-[2px]" style={{ background: k.color }} />
              <div className="text-lg font-bold" style={{ color: k.color }}><AnimVal value={k.value} delay={k.delay + 0.3} /></div>
              <div className="text-[8px] text-[#94A3B8] uppercase">{k.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Branch comparison */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-[#E2E8F0] p-3">
                <div className="text-[9px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">Branch Performance</div>
                {[
                  { n: "Delhi West", a: "12", s: "₹18.5L", pct: 92, c: "#16A34A" },
                  { n: "Mumbai Central", a: "15", s: "₹22.1L", pct: 88, c: "#01B8AA" },
                  { n: "Bangalore East", a: "8", s: "₹9.8L", pct: 74, c: "#F59E0B" },
                  { n: "Chennai South", a: "7", s: "₹6.2L", pct: 45, c: "#EF4444" },
                ].map((b, i) => (
                  <motion.div key={b.n} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                    className="flex items-center gap-2 py-1.5 border-b border-[#F1F5F9] last:border-0">
                    <div className="flex-1">
                      <div className="text-[11px] font-semibold text-[#0F172A]">{b.n}</div>
                      <div className="text-[9px] text-[#94A3B8]">{b.a} agents &middot; {b.s}</div>
                    </div>
                    <div className="w-12">
                      <div className="h-1 rounded-full bg-[#F1F5F9] overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: b.c }} initial={{ width: "0%" }} animate={{ width: `${b.pct}%` }} transition={{ duration: 0.6, delay: 0.3 + i * 0.1 }} />
                      </div>
                    </div>
                    <span className="text-[10px] font-bold w-8 text-right" style={{ color: b.c }}>{b.pct}%</span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Org KPIs */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { v: "₹50.6L", l: "Total Sales" },
                    { v: "74%", l: "Avg Achievement" },
                    { v: "1,248", l: "Total Visits" },
                    { v: "89%", l: "Attendance" },
                  ].map((k, i) => (
                    <motion.div key={k.l} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
                      className="rounded-xl border border-[#E2E8F0] p-2.5 text-center">
                      <div className="text-sm font-bold text-[#01B8AA]">{k.v}</div>
                      <div className="text-[8px] text-[#94A3B8] uppercase">{k.l}</div>
                    </motion.div>
                  ))}
                </div>

                {/* Alert */}
                <AnimatePresence>
                  {step >= 3 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-2.5">
                      <div className="text-[9px] font-semibold text-[#EF4444] flex items-center gap-1 mb-1"><AlertTriangle className="h-3 w-3" /> Low Attendance Alert</div>
                      <div className="text-[10px] text-[#64748B]">Chennai South: 45% — below 50% threshold</div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Admin actions */}
                <AnimatePresence>
                  {step >= 4 && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                      <div className="flex-1 py-2 rounded-lg border border-[#E2E8F0] text-[10px] font-semibold text-[#64748B] text-center flex items-center justify-center gap-1">
                        <Building2 className="h-3 w-3" /> Branches
                      </div>
                      <div className="flex-1 py-2 rounded-lg border border-[#E2E8F0] text-[10px] font-semibold text-[#64748B] text-center flex items-center justify-center gap-1">
                        <Users className="h-3 w-3" /> Users
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
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
