import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── palette ─── */
const C = {
  bg: "#0B1A1E",
  card: "#12282E",
  border: "rgba(1,184,170,0.15)",
  teal: "#01B8AA",
  gold: "#F2C80F",
  coral: "#FD625E",
  cyan: "#8AD4EB",
  purple: "#A66999",
  text: "#F0F4F5",
  muted: "#8FA3A8",
  dim: "#5F6B6D",
};

/* ─── scene config ─── */
const SCENES = [
  { id: "intro", label: "Intro", duration: 6000 },
  { id: "dashboard", label: "Dashboard", duration: 13000 },
  { id: "visits", label: "Visits", duration: 13000 },
  { id: "leads", label: "Leads", duration: 14000 },
  { id: "analytics", label: "Analytics", duration: 11000 },
  { id: "outro", label: "Summary", duration: 6000 },
] as const;

const TOTAL = SCENES.reduce((s, sc) => s + sc.duration, 0);

/* ─── animation variants ─── */
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.3 } },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.12 } },
};

const slideLeft = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
};

const slideRight = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.3 } },
};

/* ─── reusable components ─── */

function TypewriterText({ text, delay = 0, speed = 40, className = "" }: { text: string; delay?: number; speed?: number; className?: string }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  useEffect(() => {
    if (!started) return;
    if (displayed.length >= text.length) return;
    const t = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
    return () => clearTimeout(t);
  }, [started, displayed, text, speed]);
  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && started && (
        <span style={{ borderRight: `2px solid ${C.teal}`, marginLeft: 1, animation: "blink 1s step-end infinite" }} />
      )}
    </span>
  );
}

function AnimatedValue({ value, delay = 0, prefix = "", suffix = "" }: { value: number; delay?: number; prefix?: string; suffix?: string }) {
  const [current, setCurrent] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  useEffect(() => {
    if (!started) return;
    if (current >= value) return;
    const step = Math.max(1, Math.floor(value / 30));
    const t = setTimeout(() => setCurrent(Math.min(current + step, value)), 30);
    return () => clearTimeout(t);
  }, [started, current, value]);
  return <span>{prefix}{current.toLocaleString("en-IN")}{suffix}</span>;
}

function MiniBarChart({ bars, delay = 0 }: { bars: { label: string; value: number; color: string }[]; delay?: number }) {
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), delay); return () => clearTimeout(t); }, [delay]);
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 100, padding: "0 8px" }}>
      {bars.map((b, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 600 }}>{show ? b.value : 0}</div>
          <div style={{ width: "100%", background: "rgba(255,255,255,0.04)", borderRadius: 4, overflow: "hidden", height: 70, display: "flex", alignItems: "flex-end" }}>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: show ? `${(b.value / max) * 100}%` : 0 }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              style={{ width: "100%", background: b.color, borderRadius: 4 }}
            />
          </div>
          <div style={{ fontSize: 9, color: C.dim, textTransform: "uppercase", letterSpacing: 0.5 }}>{b.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── SCENE: Intro ─── */
function IntroScene() {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" exit="exit" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: 32 }}>
      <motion.div variants={fadeUp} style={{ fontSize: 40, fontWeight: 900, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 8 }}>
        <span style={{ color: C.text }}>In-Sync </span>
        <span style={{ color: C.teal }}>Field-Sync</span>
      </motion.div>
      <motion.div variants={fadeUp} style={{ fontSize: 14, color: C.muted, marginBottom: 32, maxWidth: 360, lineHeight: 1.6 }}>
        <TypewriterText text="GPS-Verified Field Force Management Platform" delay={600} speed={30} />
      </motion.div>
      <motion.div variants={fadeUp} style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { icon: "📍", label: "GPS-Verified", color: C.teal },
          { icon: "📱", label: "Offline-First", color: C.gold },
          { icon: "👥", label: "Role-Based Access", color: C.cyan },
        ].map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8 + i * 0.2, duration: 0.4 }}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "16px 20px", minWidth: 130, textAlign: "center" }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>{p.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: p.color }}>{p.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}

/* ─── SCENE: Dashboard ─── */
function DashboardScene() {
  const kpis = [
    { label: "Visits Today", value: 8, color: C.teal, icon: "📍" },
    { label: "Pipeline", value: 42, prefix: "₹", suffix: "L", color: C.teal, icon: "💰" },
    { label: "Deals MTD", value: 15, color: C.gold, icon: "🏆" },
    { label: "Overdue", value: 3, color: C.coral, icon: "⚠️" },
  ];
  const chartBars = [
    { label: "Mon", value: 12, color: C.teal },
    { label: "Tue", value: 18, color: C.teal },
    { label: "Wed", value: 9, color: C.teal },
    { label: "Thu", value: 22, color: C.gold },
    { label: "Fri", value: 16, color: C.teal },
    { label: "Sat", value: 7, color: C.dim },
  ];
  const insightText = "↑ 23% visit completion rate vs last week. Top performer: Ravi Kumar (28 visits). 3 agents below target — consider route optimization for South Zone.";

  return (
    <motion.div initial="initial" animate="animate" exit="exit" style={{ display: "flex", height: "100%", overflow: "hidden" }}>
      {/* Sidebar */}
      <motion.div variants={slideRight} style={{ width: 56, background: C.card, borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, gap: 12, flexShrink: 0 }}>
        {["📊", "📍", "👤", "📋", "⏱", "🌐", "⚙️"].map((ic, i) => (
          <div key={i} style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, background: i === 0 ? "rgba(1,184,170,0.15)" : "transparent", cursor: "default" }}>{ic}</div>
        ))}
      </motion.div>

      {/* Main */}
      <div style={{ flex: 1, padding: 20, overflow: "hidden" }}>
        <motion.div variants={fadeUp} style={{ fontSize: 11, color: C.dim, marginBottom: 2 }}>Good Morning,</motion.div>
        <motion.div variants={fadeUp} style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>Ravi Kumar 👋</motion.div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 16 }}>
          {kpis.map((k, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15 }}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px" }}
            >
              <div style={{ fontSize: 10, color: C.dim, display: "flex", alignItems: "center", gap: 4 }}>
                <span>{k.icon}</span> {k.label}
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color, marginTop: 2 }}>
                <AnimatedValue value={k.value} delay={800 + i * 150} prefix={k.prefix || ""} suffix={k.suffix || ""} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Chart + Insights */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Weekly Visits</div>
            <MiniBarChart bars={chartBars} delay={1800} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}
          >
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: C.teal }}>✦</span> AI Insights
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
              <TypewriterText text={insightText} delay={2800} speed={20} />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── SCENE: Visits ─── */
function VisitsScene() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setStep(1), 1000),
      setTimeout(() => setStep(2), 3000),
      setTimeout(() => setStep(3), 5500),
      setTimeout(() => setStep(4), 8000),
      setTimeout(() => setStep(5), 10500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const steps = [
    { icon: "📍", title: "Check-In", desc: "GPS auto-captured: 28.6139, 77.2090", color: C.teal },
    { icon: "📋", title: "Fill Checklist", desc: "Presented quote ✓  Collected docs ✓", color: C.gold },
    { icon: "📷", title: "Capture Photos", desc: "Selfie, document, property — 3 photos", color: C.cyan },
    { icon: "📦", title: "Book Order", desc: "Life Insurance Term Plan — ₹25,000", color: C.purple },
    { icon: "✅", title: "Check-Out", desc: "Duration: 42 min • GPS verified", color: C.teal },
  ];

  return (
    <motion.div initial="initial" animate="animate" exit="exit" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100%", overflow: "hidden" }}>
      {/* Left - Steps */}
      <div style={{ padding: 24, overflow: "hidden" }}>
        <motion.div variants={fadeUp} style={{ fontSize: 11, fontWeight: 600, color: C.teal, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Visit Management</motion.div>
        <motion.div variants={fadeUp} style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, fontFamily: "'Playfair Display', Georgia, serif" }}>GPS-Verified Visit Flow</motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {steps.map((s, i) => (
            <AnimatePresence key={i}>
              {step > i && (
                <motion.div
                  initial={{ opacity: 0, x: -20, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: "auto" }}
                  transition={{ duration: 0.4 }}
                  style={{ display: "flex", alignItems: "center", gap: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px" }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: `${s.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.title}</div>
                    <div style={{ fontSize: 11, color: C.dim }}>{s.desc}</div>
                  </div>
                  <div style={{ marginLeft: "auto", color: C.teal, fontSize: 14, fontWeight: 700 }}>✓</div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>

      {/* Right - Phone mockup */}
      <motion.div variants={slideLeft} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
        <div style={{ width: 180, borderRadius: 24, border: `2px solid ${C.border}`, background: C.card, padding: 10, boxShadow: `0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(1,184,170,0.15)` }}>
          <div style={{ width: 60, height: 5, background: C.bg, borderRadius: 10, margin: "0 auto 8px" }} />
          <div style={{ background: C.bg, borderRadius: 14, padding: 12, minHeight: 240 }}>
            <div style={{ fontSize: 10, color: C.dim, marginBottom: 2 }}>Visit Detail</div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Anil Sharma</div>
            <div style={{ fontSize: 9, color: C.dim, marginBottom: 10 }}>Meeting · Health Insurance</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
              <div style={{ flex: 1, background: `${C.teal}15`, borderRadius: 6, padding: 6, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 8, color: C.dim }}>CHECK-IN</div>
                <div style={{ fontSize: 10, fontWeight: 600 }}>10:32 AM</div>
              </div>
              <div style={{ flex: 1, background: "rgba(255,255,255,0.03)", borderRadius: 6, padding: 6, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 8, color: C.dim }}>DURATION</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: C.teal }}>00:42:15</div>
              </div>
            </div>
            <AnimatePresence>
              {step >= 2 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 8 }}>
                  <div style={{ fontSize: 8, color: C.dim, fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Checklist</div>
                  {["Presented quote", "Collected docs"].map((c, i) => (
                    <div key={i} style={{ fontSize: 9, display: "flex", gap: 4, alignItems: "center", marginBottom: 2 }}>
                      <span style={{ color: C.teal }}>✓</span> {c}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {step >= 3 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", gap: 3, marginBottom: 8 }}>
                  {["📷", "📄", "🏠"].map((e, i) => (
                    <div key={i} style={{ width: 28, height: 28, borderRadius: 6, background: `${C.teal}15`, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{e}</div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {step >= 5 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ background: C.teal, color: C.bg, borderRadius: 8, padding: "6px 0", textAlign: "center", fontSize: 10, fontWeight: 700 }}>
                  ✓ Visit Complete
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── SCENE: Leads ─── */
function LeadsScene() {
  const [msgs, setMsgs] = useState<number>(0);
  useEffect(() => {
    const timers = [
      setTimeout(() => setMsgs(1), 1200),
      setTimeout(() => setMsgs(2), 3500),
      setTimeout(() => setMsgs(3), 6000),
      setTimeout(() => setMsgs(4), 8500),
      setTimeout(() => setMsgs(5), 11000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const pipeline = [
    { stage: "New", count: 12, color: "#3B82F6" },
    { stage: "Contacted", count: 8, color: C.teal },
    { stage: "Interested", count: 5, color: C.gold },
    { stage: "Proposal", count: 3, color: C.purple },
    { stage: "Enrolled", count: 2, color: "#22C55E" },
  ];

  const activities = [
    { icon: "📞", text: "Called Anil Sharma — Interested in Term Plan", time: "10:32 AM", color: C.teal },
    { icon: "📍", text: "Visit logged for Priya Patel — GPS verified", time: "11:15 AM", color: C.gold },
    { icon: "💬", text: "WhatsApp follow-up sent to Rajesh Gupta", time: "12:00 PM", color: C.cyan },
    { icon: "📋", text: "Proposal generated — Health Insurance ₹15K/yr", time: "2:30 PM", color: C.purple },
    { icon: "✅", text: "Meena Patel enrolled — Motor ₹8,500/yr", time: "3:45 PM", color: "#22C55E" },
  ];

  return (
    <motion.div initial="initial" animate="animate" exit="exit" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", height: "100%", overflow: "hidden" }}>
      {/* Left - Pipeline */}
      <div style={{ padding: 24, overflow: "hidden" }}>
        <motion.div variants={fadeUp} style={{ fontSize: 11, fontWeight: 600, color: C.teal, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Lead Management</motion.div>
        <motion.div variants={fadeUp} style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, fontFamily: "'Playfair Display', Georgia, serif" }}>Full Prospect Pipeline</motion.div>

        {/* Pipeline stages */}
        <motion.div variants={fadeUp} style={{ display: "flex", gap: 4, marginBottom: 16 }}>
          {pipeline.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              style={{ flex: 1, background: `${p.color}20`, borderRadius: 8, padding: "8px 6px", textAlign: "center", border: `1px solid ${p.color}30` }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: p.color }}>{p.count}</div>
              <div style={{ fontSize: 8, color: C.dim, textTransform: "uppercase", letterSpacing: 0.5 }}>{p.stage}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Lead cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            { init: "AS", name: "Anil Sharma", detail: "Health · ₹15,000/yr", status: "Interested", bg: C.teal, sBg: `${C.gold}25`, sColor: C.gold },
            { init: "PP", name: "Priya Patel", detail: "Life · ₹25,000/yr", status: "Proposal", bg: C.gold, sBg: `${C.purple}25`, sColor: C.purple },
            { init: "RG", name: "Rajesh Gupta", detail: "Motor · ₹8,500/yr", status: "New", bg: C.coral, sBg: "#3B82F625", sColor: "#3B82F6" },
          ].map((l, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 + i * 0.2 }}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 10 }}
            >
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: l.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.bg }}>{l.init}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{l.name}</div>
                <div style={{ fontSize: 10, color: C.dim }}>{l.detail}</div>
              </div>
              <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: l.sBg, color: l.sColor, fontWeight: 600 }}>{l.status}</span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right - Activity Timeline */}
      <div style={{ padding: 24, borderLeft: `1px solid ${C.border}`, overflow: "hidden" }}>
        <motion.div variants={fadeUp} style={{ fontSize: 11, fontWeight: 600, color: C.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Activity Timeline</motion.div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
          <div style={{ position: "absolute", left: 13, top: 8, bottom: 8, width: 1, background: C.border }} />
          {activities.map((a, i) => (
            <AnimatePresence key={i}>
              {msgs > i && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  style={{ display: "flex", gap: 12, padding: "8px 0", position: "relative" }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: "50%", background: `${a.color}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, zIndex: 1 }}>{a.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: C.text, lineHeight: 1.4 }}>{a.text}</div>
                    <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>{a.time}</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── SCENE: Analytics ─── */
function AnalyticsScene() {
  const [showBadges, setShowBadges] = useState(false);
  const [showBoard, setShowBoard] = useState(false);
  useEffect(() => {
    const t1 = setTimeout(() => setShowBadges(true), 800);
    const t2 = setTimeout(() => setShowBoard(true), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const leaderboard = [
    { rank: 1, name: "Ravi Kumar", visits: 28, deals: 12, badge: "🏆", color: C.gold },
    { rank: 2, name: "Priya Mehta", visits: 24, deals: 10, badge: "🥈", color: C.cyan },
    { rank: 3, name: "Suresh Rao", visits: 21, deals: 8, badge: "🥉", color: "#CD7F32" },
    { rank: 4, name: "Anita Singh", visits: 18, deals: 6, badge: "", color: C.muted },
  ];

  return (
    <motion.div initial="initial" animate="animate" exit="exit" style={{ padding: 24, height: "100%", overflow: "hidden" }}>
      <motion.div variants={fadeUp} style={{ fontSize: 11, fontWeight: 600, color: C.teal, textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Analytics & Gamification</motion.div>
      <motion.div variants={fadeUp} style={{ fontSize: 18, fontWeight: 800, marginBottom: 20, fontFamily: "'Playfair Display', Georgia, serif" }}>Performance That Motivates</motion.div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, height: "calc(100% - 70px)" }}>
        {/* Badges */}
        <div>
          <div style={{ fontSize: 10, color: C.dim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Milestone Badges</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[
              { emoji: "🥉", name: "Bronze", req: "7 Deals", border: "rgba(181,149,37,0.3)" },
              { emoji: "🥈", name: "Silver", req: "15 Deals", border: "rgba(138,212,235,0.3)" },
              { emoji: "🏆", name: "Gold", req: "25 Deals", border: "rgba(242,200,15,0.4)" },
            ].map((b, i) => (
              <AnimatePresence key={i}>
                {showBadges && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.2, type: "spring", stiffness: 200 }}
                    style={{ flex: 1, textAlign: "center", background: C.card, border: `1px solid ${b.border}`, borderRadius: 12, padding: "12px 8px" }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 4 }}>{b.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>{b.name}</div>
                    <div style={{ fontSize: 9, color: C.dim }}>{b.req}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            ))}
          </div>

          {/* Branch stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 12 }}
          >
            <div style={{ fontSize: 10, color: C.dim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Branch Performance</div>
            <MiniBarChart
              bars={[
                { label: "North", value: 85, color: C.teal },
                { label: "South", value: 62, color: C.gold },
                { label: "East", value: 74, color: C.cyan },
                { label: "West", value: 91, color: C.teal },
              ]}
              delay={2500}
            />
          </motion.div>
        </div>

        {/* Leaderboard */}
        <AnimatePresence>
          {showBoard && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}
            >
              <div style={{ fontSize: 10, color: C.dim, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Leaderboard — This Month</div>
              {leaderboard.map((l, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.15 }}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < leaderboard.length - 1 ? `1px solid rgba(255,255,255,0.04)` : "none" }}
                >
                  <div style={{ width: 22, fontSize: 12, fontWeight: 800, color: l.color, textAlign: "center" }}>{l.badge || `#${l.rank}`}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{l.name}</div>
                    <div style={{ fontSize: 9, color: C.dim }}>{l.visits} visits · {l.deals} deals</div>
                  </div>
                  {i === 0 && (
                    <div style={{ fontSize: 8, padding: "2px 8px", borderRadius: 99, background: `${C.gold}25`, color: C.gold, fontWeight: 600 }}>TOP</div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ─── SCENE: Outro ─── */
function OutroScene() {
  return (
    <motion.div variants={stagger} initial="initial" animate="animate" exit="exit" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center", padding: 32 }}>
      <motion.div variants={fadeUp} style={{ fontSize: 28, fontWeight: 900, fontFamily: "'Playfair Display', Georgia, serif", marginBottom: 6 }}>
        Ready to <span style={{ color: C.teal }}>Transform</span> Your Field Ops?
      </motion.div>
      <motion.div variants={fadeUp} style={{ fontSize: 13, color: C.muted, marginBottom: 28, maxWidth: 340, lineHeight: 1.6 }}>
        Join field teams who've already transformed their operations.
      </motion.div>
      <motion.div variants={fadeUp} style={{ display: "flex", gap: 14, marginBottom: 28, flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { icon: "📍", title: "GPS-Verified", desc: "Every visit tracked", color: C.teal },
          { icon: "📱", title: "Offline-First", desc: "Works without internet", color: C.gold },
          { icon: "👥", title: "Role-Based", desc: "Right view for every role", color: C.cyan },
        ].map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 + i * 0.15 }}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 18px", minWidth: 130, textAlign: "center" }}
          >
            <div style={{ fontSize: 22, marginBottom: 4 }}>{c.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: c.color, marginBottom: 2 }}>{c.title}</div>
            <div style={{ fontSize: 10, color: C.dim }}>{c.desc}</div>
          </motion.div>
        ))}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.6 }}
        style={{ background: C.teal, color: C.bg, padding: "10px 28px", borderRadius: 99, fontSize: 13, fontWeight: 700, boxShadow: `0 0 30px rgba(1,184,170,0.3)` }}
      >
        Start 14-Day Free Trial →
      </motion.div>
    </motion.div>
  );
}

/* ─── SCENE MAP ─── */
const SCENE_MAP: Record<string, () => JSX.Element> = {
  intro: IntroScene,
  dashboard: DashboardScene,
  visits: VisitsScene,
  leads: LeadsScene,
  analytics: AnalyticsScene,
  outro: OutroScene,
};

/* ═══════════════════════════════════════════
   MAIN DEMO COMPONENT
   ═══════════════════════════════════════════ */

export default function Demo() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scene = SCENES[sceneIdx];
  const SceneComponent = SCENE_MAP[scene.id];

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (tickRef.current) clearInterval(tickRef.current);
  }, []);

  // Scene auto-advance
  useEffect(() => {
    if (!playing) return;
    clearTimers();

    const sceneStart = Date.now();
    tickRef.current = setInterval(() => {
      setElapsed(Date.now() - sceneStart);
    }, 50);

    timerRef.current = setTimeout(() => {
      if (sceneIdx < SCENES.length - 1) {
        setSceneIdx((i) => i + 1);
        setElapsed(0);
      } else {
        setPlaying(false);
      }
    }, scene.duration);

    return clearTimers;
  }, [sceneIdx, playing, scene.duration, clearTimers]);

  const goToScene = (i: number) => {
    clearTimers();
    setSceneIdx(i);
    setElapsed(0);
    setPlaying(true);
  };

  const restart = () => goToScene(0);

  const togglePlay = () => {
    if (!playing && sceneIdx === SCENES.length - 1) {
      restart();
    } else {
      setPlaying(!playing);
    }
  };

  // Global progress
  const priorMs = SCENES.slice(0, sceneIdx).reduce((s, sc) => s + sc.duration, 0);
  const globalProgress = ((priorMs + Math.min(elapsed, scene.duration)) / TOTAL) * 100;

  return (
    <div style={{ width: "100%", height: "100vh", background: C.bg, fontFamily: "'DM Sans', sans-serif", color: C.text, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* ── TOP BAR ── */}
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {/* Scene pills */}
        <div style={{ display: "flex", gap: 4, flex: 1, flexWrap: "wrap" }}>
          {SCENES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goToScene(i)}
              style={{
                padding: "4px 12px",
                borderRadius: 99,
                fontSize: 11,
                fontWeight: 600,
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                background: i === sceneIdx ? C.teal : C.card,
                color: i === sceneIdx ? C.bg : C.muted,
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
        {/* Controls */}
        <button onClick={togglePlay} style={{ width: 30, height: 30, borderRadius: "50%", background: C.card, border: `1px solid ${C.border}`, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}>
          {playing ? "⏸" : "▶"}
        </button>
        <button onClick={restart} style={{ width: 30, height: 30, borderRadius: "50%", background: C.card, border: `1px solid ${C.border}`, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 12 }}>
          ↻
        </button>
      </div>

      {/* ── PROGRESS BAR ── */}
      <div style={{ height: 3, background: "rgba(255,255,255,0.04)", flexShrink: 0 }}>
        <div style={{ height: "100%", background: C.teal, width: `${globalProgress}%`, transition: "width 0.05s linear", borderRadius: "0 2px 2px 0" }} />
      </div>

      {/* ── SCENE ── */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: "100%", height: "100%" }}
          >
            <SceneComponent />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* blink cursor animation */}
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}
