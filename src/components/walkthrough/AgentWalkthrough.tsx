import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Play, Pause, RotateCcw, Clock, CheckCircle,
  Camera, Navigation, Sparkles, CreditCard, Users,
  Package, Sun, LogOut, ScanLine, Search, Plus,
} from "lucide-react";

/* ── Timing ─────────────────────────────────────────────── */

const SCENES = [
  { id: "start",      label: "Start",       duration: 4000 },
  { id: "punchIn",    label: "Punch In",    duration: 6000 },
  { id: "plan",       label: "Plan",        duration: 7000 },
  { id: "checkIn",    label: "Check In",    duration: 7000 },
  { id: "scanOrder",  label: "Scan Order",  duration: 8000 },
  { id: "scanCard",   label: "Scan Card",   duration: 7000 },
  { id: "collection", label: "Collection",  duration: 6000 },
  { id: "endOfDay",   label: "End of Day",  duration: 5000 },
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
  return <>{s}<motion.span animate={{ opacity: [1, 0] }} transition={{ duration: 0.5, repeat: Infinity }} className="inline-block w-0.5 h-4.5 bg-indigo-500 ml-0.5 align-middle" /></>;
}

/* ── Animated counter ────────────────────────────────────── */

function AnimVal({ value, delay = 0 }: { value: string; delay: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay * 1000); return () => clearTimeout(t); }, [delay]);
  return <span>{show ? value : "\u2014"}</span>;
}

/* ── Phone frame ─────────────────────────────────────────── */

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-[280px] h-[580px] rounded-[36px] border-[4px] border-[#1E293B] overflow-hidden shadow-2xl bg-white relative" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[24px] bg-[#1E293B] rounded-b-[14px] z-10" />
      {/* Status bar */}
      <div className="pt-[28px] px-4 pb-1 flex items-center justify-between">
        <span className="text-[9px] font-semibold text-[#64748B]">9:41</span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-[2px]">
            <div className="w-[3px] h-[4px] rounded-sm bg-[#64748B]" />
            <div className="w-[3px] h-[6px] rounded-sm bg-[#64748B]" />
            <div className="w-[3px] h-[8px] rounded-sm bg-[#64748B]" />
            <div className="w-[3px] h-[10px] rounded-sm bg-[#64748B]/40" />
          </div>
          <span className="text-[8px] font-medium text-[#64748B]">5G</span>
          <div className="w-[18px] h-[9px] rounded-[2px] border border-[#64748B] relative">
            <div className="absolute inset-[1.5px] rounded-[1px] bg-[#16a34a]" />
            <div className="absolute -right-[3px] top-1/2 -translate-y-1/2 w-[2px] h-[4px] rounded-r-sm bg-[#64748B]" />
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="px-3 pb-3 flex-1 overflow-hidden" style={{ height: 'calc(100% - 46px)' }}>
        {children}
      </div>
      {/* Home indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full bg-[#1E293B]/20" />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   SCENES
   ════════════════════════════════════════════════════════════ */

/* ── Start ──────────────────────────────────────────────── */

function SceneStart() {
  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <PhoneFrame>
        <div className="flex flex-col items-center justify-center pt-10">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
            className="mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-2xl shadow-indigo-500/30"
          >
            <MapPin className="h-8 w-8 text-white" />
          </motion.div>

          <motion.div {...slideUp(0.3)} className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
            Field-Sync
          </motion.div>

          <motion.div {...slideUp(0.7)} className="mt-4 text-base text-[#0F172A]">
            <Tw text="Good morning, Raj" delay={0.8} speed={40} />
          </motion.div>

          <motion.div {...slideUp(1.2)} className="mt-3 text-sm text-[#94A3B8] flex items-center gap-2">
            <Sun className="h-4.5 w-4.5 text-amber-400" />
            <AnimVal value="18 Mar 2026" delay={1.4} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.2, duration: 0.4 }}
            className="mt-6 flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-[13px] font-medium text-indigo-600"
          >
            <Sparkles className="h-4 w-4" /> Ready to go
          </motion.div>
        </div>
      </PhoneFrame>
    </motion.div>
  );
}

/* ── Punch In ───────────────────────────────────────────── */

function ScenePunchIn() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => setStep(2), 2800),
      setTimeout(() => setStep(3), 4200),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <PhoneFrame>
        <div className="pt-2">
          <motion.div {...slideUp(0.1)} className="text-center mb-4">
            <div className="text-[13px] text-[#94A3B8] uppercase tracking-wider font-semibold">Attendance</div>
            <div className="text-base font-bold text-[#0F172A] mt-0.5">Start Your Day</div>
          </motion.div>

          {/* Clock display */}
          <motion.div {...slideUp(0.2)} className="text-center mb-5">
            <div className="text-4xl font-bold text-[#0F172A] tabular-nums">09:00</div>
            <div className="text-[13px] text-[#94A3B8]">Tuesday, 18 Mar 2026</div>
          </motion.div>

          {/* Punch In button area */}
          <div className="flex flex-col items-center">
            <AnimatePresence mode="wait">
              {step < 2 ? (
                <motion.div
                  key="punch-btn"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: 1,
                    scale: step === 1 ? [1, 0.92, 1.05, 1] : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: step === 1 ? 0.4 : 0.5 }}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-xl shadow-green-500/30 cursor-pointer"
                >
                  <div className="text-center">
                    <div className="text-white text-base font-bold">Punch In</div>
                    <div className="text-green-100 text-xs mt-0.5">Tap to start</div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="on-duty"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-400 flex items-center justify-center"
                >
                  <div className="text-center">
                    <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-0.5" />
                    <div className="text-green-700 text-sm font-bold">On Duty</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* GPS coordinates */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 flex items-center justify-center gap-2 text-xs text-[#94A3B8]"
              >
                <Navigation className="h-4 w-4 text-green-500" />
                <span className="font-mono">28.6139\u00b0N, 77.2090\u00b0E</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary card */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-indigo-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A]">3 visits planned today</div>
                    <div className="text-xs text-[#94A3B8]">First visit at 10:00 AM</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhoneFrame>
    </motion.div>
  );
}

/* ── Today's Plan ───────────────────────────────────────── */

function ScenePlan() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 1800),
      setTimeout(() => setStep(3), 2800),
      setTimeout(() => setStep(4), 4500),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const visits = [
    { name: "Acme Corp", time: "10:00 AM", type: "Follow-up", dotColor: "#16a34a", show: step >= 1 },
    { name: "Nova Traders", time: "12:30 PM", type: "First Visit", dotColor: "#3B82F6", show: step >= 2 },
    { name: "Star Industries", time: "3:00 PM", type: "Collection", dotColor: "#F59E0B", show: step >= 3 },
  ];

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <PhoneFrame>
        <div className="pt-2">
          <motion.div {...slideUp(0)} className="mb-4">
            <div className="text-[13px] text-[#94A3B8] uppercase tracking-wider font-semibold">Schedule</div>
            <div className="text-base font-bold text-[#0F172A]">Today's Schedule</div>
            <div className="text-xs text-[#94A3B8] mt-0.5">18 March 2026</div>
          </motion.div>

          {/* Visit cards */}
          <div className="space-y-3">
            {visits.map((v, i) => (
              <AnimatePresence key={v.name}>
                {v.show && (
                  <motion.div
                    {...slideLeft(0)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#E2E8F0] bg-white shadow-sm"
                  >
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center self-stretch">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-0.5" style={{ background: v.dotColor }} />
                      {i < 2 && <div className="w-[1.5px] flex-1 bg-[#E2E8F0] mt-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-[#0F172A]">{v.name}</div>
                        <div className="text-xs font-medium text-[#64748B]">{v.time}</div>
                      </div>
                      <div className="text-xs mt-0.5">
                        <span className="px-1.5 py-0.5 rounded-full text-[11px] font-medium" style={{ background: `${v.dotColor}15`, color: v.dotColor }}>
                          {v.type}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Route optimization */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shrink-0">
                    <Navigation className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-indigo-700">12.4 km total</div>
                    <div className="text-xs text-indigo-500 font-medium flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5" /> Optimized route
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhoneFrame>
    </motion.div>
  );
}

/* ── Check In ───────────────────────────────────────────── */

function SceneCheckIn() {
  const [step, setStep] = useState(0);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 4000),
      setTimeout(() => setStep(4), 5200),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  // Visit timer
  useEffect(() => {
    if (step < 4) return;
    const iv = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [step]);

  const formatTimer = (s: number) => {
    const m = String(Math.floor(s / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${m}:${sec}`;
  };

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <PhoneFrame>
        <div className="pt-2">
          <motion.div {...slideUp(0)} className="mb-4">
            <div className="text-[13px] text-[#94A3B8] uppercase tracking-wider font-semibold">Visit</div>
            <div className="text-base font-bold text-[#0F172A]">Acme Corp</div>
            <div className="text-xs text-[#94A3B8]">Follow-up &middot; Scheduled 10:00 AM</div>
          </motion.div>

          {/* GPS auto-detect */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200 mb-4"
              >
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                  <Navigation className="h-4.5 w-4.5 text-green-500" />
                </motion.div>
                <div>
                  <div className="text-[13px] font-medium text-green-700">Acme Corp detected</div>
                  <div className="text-[11px] text-green-600">24m away</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Check-in button */}
          <div className="mb-4">
            <AnimatePresence mode="wait">
              {step < 3 ? (
                <motion.div
                  key="checkin-btn"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    scale: step === 2 ? [1, 0.95, 1.03, 1] : 1,
                  }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: step === 2 ? 0.35 : 0.4 }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold text-center shadow-lg shadow-indigo-500/25"
                >
                  <MapPin className="h-4.5 w-4.5 inline mr-1.5 -mt-0.5" />
                  One-Tap Check In
                </motion.div>
              ) : (
                <motion.div
                  key="checked-in"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full py-2.5 rounded-xl bg-green-50 border border-green-300 text-green-700 text-sm font-semibold text-center"
                >
                  <CheckCircle className="h-4.5 w-4.5 inline mr-1.5 -mt-0.5" />
                  Checked In &middot; 10:02 AM
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Location badge */}
          <AnimatePresence>
            {step >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-xs text-[#94A3B8] mb-4 px-1"
              >
                <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                <span className="font-mono">28.6139\u00b0N, 77.2090\u00b0E</span>
                <span className="ml-auto text-[11px] text-green-600 font-medium">GPS verified</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visit timer */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-[#F8FAFB] border border-[#E2E8F0]"
              >
                <div className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-semibold mb-1">Visit Duration</div>
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-green-500"
                  />
                  <span className="text-xl font-bold text-[#0F172A] tabular-nums">{formatTimer(timer)}</span>
                  <span className="text-xs text-[#94A3B8] ml-auto">
                    <Clock className="h-4 w-4 inline mr-0.5 -mt-0.5" />
                    Running
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhoneFrame>
    </motion.div>
  );
}

/* ── Scan Order ─────────────────────────────────────────── */

function SceneScanOrder() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3500),
      setTimeout(() => setStep(4), 5200),
      setTimeout(() => setStep(5), 6800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <PhoneFrame>
        <div className="pt-2">
          <motion.div {...slideUp(0)} className="mb-4">
            <div className="text-[13px] text-[#94A3B8] uppercase tracking-wider font-semibold">Order Capture</div>
            <div className="text-base font-bold text-[#0F172A]">New Order &mdash; Acme Corp</div>
          </motion.div>

          {/* Camera button */}
          <AnimatePresence>
            {step < 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  scale: step === 1 ? [1, 0.95, 1.03, 1] : 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: step === 1 ? 0.35 : 0.4 }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-semibold text-center shadow-lg shadow-indigo-500/25 mb-4"
              >
                <Camera className="h-5 w-5 inline mr-1.5 -mt-0.5" />
                Snap Order
              </motion.div>
            )}
          </AnimatePresence>

          {/* Camera flash / viewfinder */}
          <AnimatePresence>
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0.8, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-28 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 mb-4 flex items-center justify-center relative overflow-hidden"
              >
                {/* Viewfinder corners */}
                <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-white/50 rounded-tl" />
                <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-white/50 rounded-tr" />
                <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-white/50 rounded-bl" />
                <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-white/50 rounded-br" />
                {/* Scan line */}
                <motion.div
                  className="absolute inset-x-4 h-[2px] bg-indigo-400/60"
                  animate={{ y: [-40, 40] }}
                  transition={{ duration: 1, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                />
                <motion.div animate={{ opacity: [1, 0] }} transition={{ duration: 0.15 }}
                  className="absolute inset-0 bg-white" />
                <ScanLine className="h-6 w-6 text-white/70" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* AI Reading spinner */}
          <AnimatePresence>
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center gap-3 py-4 mb-4"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full"
                />
                <span className="text-sm font-medium text-indigo-600">AI Reading...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Extracted data */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[#E2E8F0] overflow-hidden mb-4"
              >
                <div className="bg-indigo-50 px-3 py-1.5 flex items-center gap-2 border-b border-indigo-100">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  <span className="text-xs font-semibold text-indigo-600">Extracted by AI</span>
                </div>
                <div className="p-3 space-y-3">
                  <div>
                    <div className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-semibold">Items</div>
                    <div className="text-[13px] text-[#0F172A] mt-0.5">
                      <div className="flex justify-between">
                        <span>Widget A</span><span className="font-semibold">x50</span>
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span>Widget B</span><span className="font-semibold">x20</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-[#E2E8F0] pt-2 flex items-center justify-between">
                    <div className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-semibold">Total</div>
                    <div className="text-base font-bold text-[#0F172A]">{"\u20B9"}24,500</div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save confirmation */}
          <AnimatePresence>
            {step >= 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full py-2 rounded-xl bg-green-50 border border-green-300 text-green-700 text-sm font-semibold text-center"
              >
                <CheckCircle className="h-4.5 w-4.5 inline mr-1.5 -mt-0.5" />
                Save Order {"\u2713"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhoneFrame>
    </motion.div>
  );
}

/* ── Scan Card ──────────────────────────────────────────── */

function SceneScanCard() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2200),
      setTimeout(() => setStep(3), 3500),
      setTimeout(() => setStep(4), 4800),
      setTimeout(() => setStep(5), 6000),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <PhoneFrame>
        <div className="pt-2">
          <motion.div {...slideUp(0)} className="mb-4">
            <div className="text-[13px] text-[#94A3B8] uppercase tracking-wider font-semibold">Discover</div>
            <div className="text-base font-bold text-[#0F172A]">New Customers</div>
          </motion.div>

          {/* Discover Nearby button */}
          <AnimatePresence>
            {step < 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{
                  opacity: 1,
                  scale: step === 1 ? [1, 0.95, 1.03, 1] : 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: step === 1 ? 0.35 : 0.4 }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-semibold text-center shadow-lg shadow-blue-500/25 mb-4"
              >
                <Search className="h-4.5 w-4.5 inline mr-1.5 -mt-0.5" />
                Discover Nearby
              </motion.div>
            )}
          </AnimatePresence>

          {/* Nearby businesses found */}
          <AnimatePresence>
            {step >= 2 && step < 3 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 mb-4"
              >
                <Users className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-[13px] font-medium text-blue-700">4 businesses found</div>
                  <div className="text-[11px] text-blue-500">within 500m</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Or scan a business card */}
          <AnimatePresence>
            {step >= 3 && step < 4 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-[13px] text-[#94A3B8] text-center mb-3 font-medium">Or scan a business card</div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.8, 1] }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-20 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 mb-4 flex items-center justify-center relative overflow-hidden"
                >
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/50 rounded-tl" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/50 rounded-tr" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/50 rounded-bl" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/50 rounded-br" />
                  <motion.div animate={{ opacity: [1, 0] }} transition={{ duration: 0.15 }}
                    className="absolute inset-0 bg-white" />
                  <CreditCard className="h-5 w-5 text-white/70" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Extracted contact */}
          <AnimatePresence>
            {step >= 4 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-[#E2E8F0] overflow-hidden mb-4"
              >
                <div className="bg-purple-50 px-3 py-1.5 flex items-center gap-2 border-b border-purple-100">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-semibold text-purple-600">AI Extracted</span>
                </div>
                <div className="p-3 space-y-2">
                  {[
                    { label: "Name", value: "Vikram Shah" },
                    { label: "Company", value: "Shah Electronics" },
                    { label: "Phone", value: "+91 98765 43210" },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center justify-between">
                      <span className="text-[11px] text-[#94A3B8] uppercase tracking-wider font-semibold">{f.label}</span>
                      <span className="text-[13px] font-medium text-[#0F172A]">{f.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Customer added */}
          <AnimatePresence>
            {step >= 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full py-2 rounded-xl bg-green-50 border border-green-300 text-green-700 text-sm font-semibold text-center"
              >
                <Plus className="h-4.5 w-4.5 inline mr-1.5 -mt-0.5" />
                Customer Added {"\u2713"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhoneFrame>
    </motion.div>
  );
}

/* ── Collection ─────────────────────────────────────────── */

function SceneCollection() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 800),
      setTimeout(() => setStep(2), 2000),
      setTimeout(() => setStep(3), 3400),
      setTimeout(() => setStep(4), 4800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <PhoneFrame>
        <div className="pt-2">
          <motion.div {...slideUp(0)} className="mb-4">
            <div className="text-[13px] text-[#94A3B8] uppercase tracking-wider font-semibold">Collection</div>
            <div className="text-base font-bold text-[#0F172A]">Star Industries</div>
            <div className="text-xs text-[#94A3B8]">Payment collection &middot; 3:00 PM</div>
          </motion.div>

          {/* Amount field */}
          <motion.div {...slideUp(0.2)} className="mb-4">
            <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Amount</div>
            <div className="relative">
              <div className="text-3xl font-bold text-[#0F172A] px-3 py-2.5 rounded-xl bg-[#F8FAFB] border border-[#E2E8F0]">
                <AnimVal value={"\u20B9 12,500"} delay={0.5} />
              </div>
            </div>
          </motion.div>

          {/* Customer info */}
          <AnimatePresence>
            {step >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <div className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-1">Customer</div>
                <div className="text-sm font-medium text-[#0F172A] px-3 py-2 rounded-xl bg-[#F8FAFB] border border-[#E2E8F0]">
                  Star Industries
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Receipt scanned badge */}
          <AnimatePresence>
            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 mb-4"
              >
                <Camera className="h-4.5 w-4.5 text-amber-600" />
                <span className="text-[13px] font-medium text-amber-700">Receipt Scanned {"\u2713"}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Save collection button */}
          <AnimatePresence mode="wait">
            {step >= 3 && step < 4 && (
              <motion.div
                key="save-btn"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: [1, 0.95, 1.03, 1] }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold text-center shadow-lg shadow-green-500/25"
              >
                <Package className="h-4.5 w-4.5 inline mr-1.5 -mt-0.5" />
                Save Collection
              </motion.div>
            )}
            {step >= 4 && (
              <motion.div
                key="confirmed"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full py-2.5 rounded-xl bg-green-50 border border-green-300 text-green-700 text-sm font-semibold text-center"
              >
                <CheckCircle className="h-4.5 w-4.5 inline mr-1.5 -mt-0.5" />
                Collection Saved {"\u2713"}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhoneFrame>
    </motion.div>
  );
}

/* ── End of Day ─────────────────────────────────────────── */

function SceneEndOfDay() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setStep(1), 600),
      setTimeout(() => setStep(2), 2500),
      setTimeout(() => setStep(3), 3800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const summaryItems = [
    { icon: MapPin, label: "Visits completed", value: "3 / 3", color: "#16a34a", show: step >= 1 },
    { icon: Package, label: "Order captured", value: "\u20B924,500", color: "#3B82F6", show: step >= 1 },
    { icon: CreditCard, label: "Collection", value: "\u20B912,500", color: "#F59E0B", show: step >= 1 },
    { icon: Users, label: "New customers", value: "2", color: "#8B5CF6", show: step >= 1 },
  ];

  return (
    <motion.div {...fade} className="h-full px-6 py-3">
      <PhoneFrame>
        <div className="pt-2">
          <motion.div {...slideUp(0)} className="mb-4 text-center">
            <div className="text-[13px] text-[#94A3B8] uppercase tracking-wider font-semibold">Summary</div>
            <div className="text-base font-bold text-[#0F172A]">End of Day</div>
            <div className="text-xs text-[#94A3B8]">18 March 2026</div>
          </motion.div>

          {/* Summary items */}
          <div className="space-y-3 mb-4">
            {summaryItems.map((item, i) => (
              <AnimatePresence key={item.label}>
                {item.show && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFB] border border-[#E2E8F0]"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${item.color}15` }}>
                      <item.icon className="h-5 w-5" style={{ color: item.color }} />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-[#94A3B8] font-medium">{item.label}</div>
                      <div className="text-sm font-bold text-[#0F172A]">{item.value}</div>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Punch Out */}
          <AnimatePresence mode="wait">
            {step >= 2 && step < 3 && (
              <motion.div
                key="punch-out-btn"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: [1, 0.95, 1.03, 1] }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4 }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-semibold text-center shadow-lg shadow-red-500/25"
              >
                <LogOut className="h-4.5 w-4.5 inline mr-1.5 -mt-0.5" />
                Punch Out
              </motion.div>
            )}
            {step >= 3 && (
              <motion.div
                key="off-duty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <div className="w-full py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm font-semibold mb-3">
                  <CheckCircle className="h-4.5 w-4.5 inline mr-1.5 -mt-0.5 text-slate-400" />
                  Off Duty
                </div>
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-indigo-600 font-medium"
                >
                  Great day, Raj!
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhoneFrame>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN WALKTHROUGH
   ════════════════════════════════════════════════════════════ */

export default function AgentWalkthrough() {
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
      case "start":      return <SceneStart />;
      case "punchIn":    return <ScenePunchIn />;
      case "plan":       return <ScenePlan />;
      case "checkIn":    return <SceneCheckIn />;
      case "scanOrder":  return <SceneScanOrder />;
      case "scanCard":   return <SceneScanCard />;
      case "collection": return <SceneCollection />;
      case "endOfDay":   return <SceneEndOfDay />;
    }
  };

  return (
    <div className="flex flex-col" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-2 py-1.5 shrink-0">
        <div className="flex items-center gap-2 text-xs text-[#64748B]">
          <MapPin className="h-3.5 w-3.5" />
          <span className="font-medium">Agent Day Walkthrough</span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="mr-3 hidden items-center gap-1 sm:flex">
            {SCENES.map((s, i) => (
              <button
                key={s.id}
                onClick={() => { setSceneIndex(i); setElapsed(0); setPlaying(true); }}
                className={`rounded-full px-2 py-0.5 text-[9px] font-medium transition-colors border-none cursor-pointer ${
                  i === sceneIndex
                    ? "bg-indigo-500 text-white"
                    : i < sceneIndex
                      ? "bg-indigo-100 text-indigo-600"
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
        <motion.div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
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
