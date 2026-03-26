import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, Camera, CheckCircle, ArrowRight, Shield, ChevronDown,
  Menu, X, WifiOff, CalendarCheck, MessageCircle, TrendingUp,
} from "lucide-react";
import insyncLogo from "@/assets/insync-logo-color.png";

/* ─── Reusable fade-in wrapper ─── */
function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMobileOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const goRegister = () => navigate("/auth?tab=signup");
  const goSignIn = () => navigate("/auth");

  const navLinks = [
    { label: "Solution", action: () => scrollTo("solution") },
    { label: "Pricing", action: () => scrollTo("pricing") },
    { label: "FAQ", action: () => scrollTo("faq") },
  ];

  return (
    <div className="min-h-screen text-[#0F172A] overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ══════════ STICKY NAV ══════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-2" : "py-3.5"}`}
        style={{ background: scrolled ? "rgba(255,255,255,0.95)" : "transparent", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid #E2E8F0" : "1px solid transparent" }}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none">
            <img src={insyncLogo} alt="In-Sync Field" className="h-9 w-auto" />
            <span className={`font-bold text-[17px] transition-colors duration-300 ${scrolled ? "text-[#0F172A]" : "text-white"}`}>In-Sync Field</span>
          </button>
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((l, i) => (
              <button key={i} onClick={l.action} className={`text-[13px] font-medium bg-transparent border-none cursor-pointer transition-colors ${scrolled ? "text-[#64748B] hover:text-[#0F172A]" : "text-white/80 hover:text-white"}`}>{l.label}</button>
            ))}
            <button onClick={goSignIn} className={`text-[13px] font-semibold bg-transparent border-none cursor-pointer transition-colors ${scrolled ? "text-[#0F172A] hover:text-indigo-600" : "text-white hover:text-white/80"}`}>
              Sign In
            </button>
            <button onClick={goRegister} className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer border-none transition-all hover:shadow-lg hover:-translate-y-px" style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
              Start Free Trial
            </button>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className={`md:hidden bg-transparent border-none cursor-pointer p-2 ${scrolled ? "text-[#0F172A]" : "text-white"}`}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden px-6 pb-5 pt-3 flex flex-col gap-3 bg-white border-t border-[#E2E8F0]">
            {navLinks.map((l, i) => (
              <button key={i} onClick={l.action} className="text-left text-[#0F172A] text-[15px] font-medium bg-transparent border-none cursor-pointer py-2">{l.label}</button>
            ))}
            <button onClick={goSignIn} className="text-left text-[#0F172A] text-[15px] font-semibold bg-transparent border-none cursor-pointer py-2">Sign In</button>
            <button onClick={goRegister} className="mt-1 px-5 py-3 rounded-lg text-[14px] font-semibold text-white cursor-pointer border-none" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>Start Free Trial</button>
          </div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #4338ca 0%, #6d28d9 30%, #7c3aed 50%, #4338ca 100%)" }} />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-20 right-[15%] w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-0 left-[10%] w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(79,70,229,0.3), transparent 70%)", filter: "blur(50px)" }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-white/90 mb-8 border border-white/20"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
              >
                by In-Sync &middot; AI-powered field force management
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.08] mb-6 tracking-[-0.025em] text-white"
              >
                Know if your field team{"\n"}
                <span className="hero-gradient-text-light">actually showed up.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[17px] text-white/75 leading-[1.7] mb-10 max-w-[540px] mx-auto lg:mx-0"
              >
                GPS-verified attendance and visits. AI that replaces typing with camera taps. A lead pipeline your agents manage themselves — from first contact to enrolled. <strong className="text-white">Daily summaries on WhatsApp.</strong> Works fully offline.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="flex gap-4 flex-wrap justify-center lg:justify-start mb-8"
              >
                <button onClick={goRegister}
                  className="group inline-flex items-center gap-2.5 px-10 py-5 rounded-xl text-[16px] font-bold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", boxShadow: "0 4px 24px rgba(22,163,74,0.5)" }}
                >
                  <span className="relative z-10">Start Free Trial</span>
                  <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 cta-shimmer" />
                </button>
                <button onClick={() => scrollTo("solution")}
                  className="inline-flex items-center gap-2 px-8 py-5 rounded-xl text-[15px] font-semibold text-white bg-white/10 border border-white/25 cursor-pointer transition-all hover:bg-white/20 backdrop-blur-sm"
                >
                  See how it works
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                className="flex items-center justify-center lg:justify-start gap-5 text-[13px] text-white/50 flex-wrap"
              >
                {["No credit card required", "Cancel anytime", "2-minute setup"].map((t, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-green-400" /> {t}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Right: Hero cards */}
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="flex justify-center items-end gap-4 md:gap-5 py-8"
            >
              {/* Card 1 — Lead Pipeline */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="flex-shrink-0 hidden sm:block"
              >
                <div className="w-[170px] md:w-[190px] bg-white rounded-2xl p-4 md:p-5" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
                  <div className="text-center">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ background: "#fef3c7" }}>
                      <TrendingUp size={22} className="text-amber-600" />
                    </div>
                    <div className="text-[13px] font-bold text-[#0F172A] mb-2.5">Lead Pipeline</div>
                    <div className="space-y-1.5">
                      {[
                        { label: "New", count: 12, bg: "#f0f9ff", color: "#0369a1" },
                        { label: "Contacted", count: 8, bg: "#fef3c7", color: "#b45309" },
                        { label: "Proposal", count: 5, bg: "#f5f3ff", color: "#7c3aed" },
                        { label: "Enrolled", count: 3, bg: "#f0fdf4", color: "#16a34a" },
                      ].map((s, i) => (
                        <div key={i} className="rounded-lg px-2.5 py-1.5 flex items-center justify-between" style={{ background: s.bg }}>
                          <div className="text-[10px] font-medium" style={{ color: s.color }}>{s.label}</div>
                          <div className="text-[11px] font-bold" style={{ color: s.color }}>{s.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2 — GPS Visit Verified (center, taller) */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="flex-shrink-0 -mb-4"
              >
                <div className="w-[190px] md:w-[210px] bg-white rounded-2xl p-5 md:p-6" style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.3)" }}>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: "#f0fdf4" }}>
                      <MapPin size={28} className="text-green-600" />
                    </div>
                    <div className="text-[14px] font-bold text-[#0F172A] mb-3">Visit Verified</div>
                    <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2.5 mb-2.5">
                      <div className="text-[10px] text-green-600 uppercase tracking-wider font-semibold mb-0.5">GPS Confirmed</div>
                      <div className="text-[20px] font-bold text-green-700">10:02 AM</div>
                      <div className="text-[9px] text-green-600/80 mt-0.5">Acme Corp, Mumbai</div>
                    </div>
                    <div className="flex items-center justify-center gap-3 text-[10px] text-[#64748B] font-medium">
                      <span className="flex items-center gap-1"><span className="text-green-500 font-bold">3</span> done</span>
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                      <span className="flex items-center gap-1"><span className="text-amber-500 font-bold">2</span> pending</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 3 — WhatsApp Report */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="flex-shrink-0 hidden sm:block"
              >
                <div className="w-[170px] md:w-[190px] bg-white rounded-2xl p-4 md:p-5" style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
                  <div className="text-center">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ background: "#f0fdf4" }}>
                      <MessageCircle size={22} className="text-green-600" />
                    </div>
                    <div className="text-[13px] font-bold text-[#0F172A] mb-2.5">WhatsApp Report</div>
                    <div className="bg-[#f0fdf4] rounded-lg px-2.5 py-2 text-left">
                      <div className="text-[9px] text-green-700 font-medium leading-[1.5]">
                        <div className="font-bold mb-1">Daily Summary</div>
                        <div>&#10003; 12/15 agents active</div>
                        <div>&#10003; 48 visits completed</div>
                        <div>&#10003; 3 new leads added</div>
                        <div className="text-[8px] text-green-500 mt-1">Sent at 7:00 PM</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ PROBLEM ══════════ */}
      <section className="py-24 max-md:py-16">
        <div className="max-w-[1000px] mx-auto px-6">
          <FadeIn className="text-center mb-6">
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-red-500 mb-4 inline-block">The real problem</span>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.2] text-[#0F172A]">You're managing field teams blind.</h2>
            <p className="text-[17px] text-[#64748B] mt-4 max-w-[640px] mx-auto leading-relaxed">
              Your agents say they visited 8 clients today. Did they? You have <strong className="text-[#0F172A]">no way to know</strong>.
              Meanwhile, leads go cold, reports are padded, and you're chasing WhatsApp for updates.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-14">
            {/* Old way */}
            <FadeIn delay={0.1}>
              <div className="rounded-2xl border border-red-200 bg-red-50/50 p-8">
                <div className="text-[12px] font-bold uppercase tracking-[2px] text-red-400 mb-6">Without In-Sync Field</div>
                <div className="space-y-4">
                  {[
                    "No proof visits actually happened",
                    "Agents type long forms — so they don't",
                    "Leads tracked in notebooks, lost in a week",
                    "Chase WhatsApp groups for daily updates",
                    "End-of-day reports are fiction",
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <X size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[14px] text-red-700/80 line-through decoration-red-300/50">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            {/* New way */}
            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-green-200 bg-green-50/50 p-8">
                <div className="text-[12px] font-bold uppercase tracking-[2px] text-green-500 mb-6">With In-Sync Field</div>
                <div className="space-y-4">
                  {[
                    "GPS check-in proves every single visit",
                    "Snap a card or invoice — AI fills the data",
                    "Lead pipeline: New → Contacted → Proposal → Enrolled",
                    "Automated daily reports on WhatsApp",
                    "Real-time dashboard — see who's where, right now",
                  ].map((t, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-[14px] text-green-800 font-medium">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ══════════ SOLUTION — features folded into cards ══════════ */}
      <section id="solution" className="py-24 max-md:py-16 bg-[#F8FAFB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-indigo-600 mb-4 inline-block">Solution</span>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.2] mb-4 text-[#0F172A]">
              Managers see everything.{" "}<span className="text-[#94A3B8]">Agents do less paperwork.</span>
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                Icon: MapPin,
                title: "GPS Visit Verification",
                desc: "Every check-in is GPS-stamped with time and location proof. See who's where on a live map. No more padded visit reports.",
                accent: "#16a34a",
                bg: "#f0fdf4",
                gradient: "linear-gradient(135deg, #16a34a, #22c55e)",
              },
              {
                Icon: Camera,
                title: "AI Camera Intelligence",
                desc: "Photograph a business card, invoice, or order. AI reads it and fills in the data — names, numbers, line items. Zero typing.",
                accent: "#0ea5e9",
                bg: "#f0f9ff",
                gradient: "linear-gradient(135deg, #0ea5e9, #38bdf8)",
              },
              {
                Icon: TrendingUp,
                title: "Lead Pipeline",
                desc: "Agents manage their own pipeline: New → Contacted → Proposal → Enrolled. You see every lead's status across all agents, in real time.",
                accent: "#f59e0b",
                bg: "#fffbeb",
                gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
              },
              {
                Icon: CalendarCheck,
                title: "Visit Planning & Tracking",
                desc: "Build daily visit plans, assign customers to agents, and compare plan vs actual. Know who executed and who didn't.",
                accent: "#4f46e5",
                bg: "#eef2ff",
                gradient: "linear-gradient(135deg, #4f46e5, #6366f1)",
              },
              {
                Icon: MessageCircle,
                title: "WhatsApp Reports",
                desc: "Automated daily field summaries delivered to WhatsApp. Attendance, visits, collections — in the app your managers already check.",
                accent: "#25d366",
                bg: "#f0fdf4",
                gradient: "linear-gradient(135deg, #25d366, #128c7e)",
              },
              {
                Icon: WifiOff,
                title: "Works Fully Offline",
                desc: "No signal in the field? No problem. Every feature works offline and syncs automatically when connected. Built for Indian field conditions.",
                accent: "#64748B",
                bg: "#f8fafc",
                gradient: "linear-gradient(135deg, #475569, #64748B)",
              },
            ].map((card, i) => (
              <FadeIn key={i} delay={i * 0.08}>
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-7 h-full hover:shadow-lg hover:-translate-y-1 group transition-all duration-300 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: card.gradient }} />
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: card.bg }}>
                    <card.Icon size={24} style={{ color: card.accent }} />
                  </div>
                  <div className="text-[16px] font-bold text-[#0F172A] mb-2">{card.title}</div>
                  <div className="text-[14px] text-[#64748B] leading-[1.7]">{card.desc}</div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ PRICING ══════════ */}
      <section id="pricing" className="py-24 max-md:py-16">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <FadeIn>
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-indigo-600 mb-4 inline-block">Pricing</span>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.2] mb-4 text-[#0F172A]">Simple pricing. No surprises.</h2>
          </FadeIn>

          {/* ROI callout */}
          <FadeIn className="max-w-[600px] mx-auto mt-8 mb-12">
            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-6 text-left">
              <div className="text-[14px] text-amber-900 font-semibold mb-2">The math is simple</div>
              <p className="text-[15px] text-amber-800 leading-[1.7]">
                15 agents &times; &#8377;299 = <strong>&#8377;4,485/month</strong>. If even one agent is padding their visit report, you are already losing more than this costs.
              </p>
              <p className="text-[13px] text-amber-600 mt-2">Still 3&times; cheaper than BeatRoute, Lystloc, or any alternative that actually works.</p>
            </div>
          </FadeIn>

          <FadeIn className="max-w-[460px] mx-auto">
            <div className="relative">
              <div className="absolute -inset-[2px] rounded-[26px] opacity-80" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed, #16a34a)" }} />
              <div className="relative rounded-3xl p-10 md:p-12 text-center bg-white">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[11px] font-bold uppercase tracking-[1.5px] px-5 py-1.5 rounded-full" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>14-Day Free Trial</div>
                <div className="text-xl font-bold text-[#0F172A] mb-1 mt-2">In-Sync Field Pro</div>
                <div className="text-sm text-[#64748B] mb-6">Everything your team needs</div>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-[24px] font-semibold text-[#64748B]">&#8377;</span>
                  <span className="text-[56px] font-extrabold text-[#0F172A] leading-none">299</span>
                  <span className="text-base text-[#94A3B8]">/user/month</span>
                </div>
                <div className="text-sm text-[#94A3B8] mb-8">Billed monthly. Cancel anytime.</div>
                <ul className="text-left mb-8 space-y-0">
                  {[
                    "GPS tracking & visit verification",
                    "AI scanning (card, invoice, order)",
                    "Lead pipeline management",
                    "Visit planning & scheduling",
                    "WhatsApp daily reports",
                    "Works fully offline",
                    "Real-time manager dashboard",
                    "Priority support",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 py-2.5 text-[14px] text-[#475569] border-b border-[#F1F5F9] last:border-none">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={goRegister}
                  className="group w-full py-4 rounded-xl text-[16px] font-bold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", boxShadow: "0 4px 14px rgba(22,163,74,0.3)" }}
                >
                  <span className="relative z-10">Start 14-Day Free Trial</span>
                  <ArrowRight size={15} className="relative z-10 inline ml-2 group-hover:translate-x-0.5 transition-transform" />
                  <div className="absolute inset-0 cta-shimmer" />
                </button>
                <div className="text-[13px] text-[#94A3B8] mt-3 flex items-center justify-center gap-1">
                  <Shield size={12} /> No credit card required
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ══════════ FAQ ══════════ */}
      <section id="faq" className="py-24 max-md:py-16 bg-[#F8FAFB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-indigo-600 mb-4 inline-block">FAQ</span>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.2] text-[#0F172A]">Common Questions</h2>
          </FadeIn>
          <div className="max-w-[720px] mx-auto flex flex-col gap-3">
            {[
              { q: "How quickly can my team start?", a: "Under 2 minutes. Sign up, invite via link, done. No training needed — the app is intuitive enough for anyone to pick up instantly." },
              { q: "Does it work without internet?", a: "Yes. Everything works offline and syncs automatically when connected. Your agents can log visits, scan cards, and record orders with zero signal." },
              { q: "What does the AI scanning do?", a: "Take a photo of a business card, invoice, or order — AI reads it and fills in the data. No typing required. It extracts names, numbers, addresses, line items, and more." },
              { q: "Which industries use In-Sync Field?", a: "NBFCs, microfinance companies, DSA networks, insurance field teams, FMCG distributors, and any business with agents visiting clients in the field. If your team visits customers, this is built for you." },
              { q: "How does the WhatsApp integration work?", a: "Managers receive automated daily summaries on WhatsApp — attendance, visits completed, collections, and exceptions. No app-switching needed. Your field data arrives where you already check." },
              { q: "Can I try it before paying?", a: "Yes. 14-day free trial, no credit card needed. Full access to every feature from day one." },
              { q: "Is my data secure?", a: "Bank-grade encryption. Your data is stored in secure cloud servers with SOC2 compliance. Role-based access ensures every user only sees what they should." },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full text-left rounded-2xl bg-white border border-[#E2E8F0] hover:shadow-sm transition-all duration-300 overflow-hidden"
                >
                  <div className="flex items-center justify-between p-6 cursor-pointer">
                    <div className="text-[15px] font-semibold text-[#0F172A] pr-4">{f.q}</div>
                    <ChevronDown size={18} className={`text-[#94A3B8] flex-shrink-0 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                  </div>
                  <div className={`px-6 overflow-hidden transition-all duration-300 ${openFaq === i ? "pb-6 max-h-[200px]" : "max-h-0"}`}>
                    <div className="text-[14px] text-[#64748B] leading-[1.7]">{f.a}</div>
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="py-24 max-md:py-16 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #4338ca 0%, #6d28d9 50%, #7c3aed 100%)" }}>
        <div className="absolute inset-0 opacity-[0.06]" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.3), transparent 60%)", filter: "blur(80px)" }} />
        <FadeIn className="relative z-10 max-w-[600px] mx-auto px-6">
          <h2 className="text-[clamp(28px,4.5vw,44px)] font-bold mb-4 text-white">
            Stop guessing.<br />Start knowing.
          </h2>
          <p className="text-[16px] text-white/60 mb-10 leading-relaxed">If even one agent is padding their visits, you're already losing more than In-Sync Field costs.</p>
          <button onClick={goRegister}
            className="group inline-flex items-center gap-2.5 px-12 py-5 rounded-xl text-[17px] font-bold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", boxShadow: "0 4px 24px rgba(22,163,74,0.5)" }}
          >
            <span className="relative z-10">Start Free Trial</span>
            <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 cta-shimmer" />
          </button>
          <div className="flex items-center justify-center gap-4 mt-6 text-[13px] text-white/50">
            {["No credit card", "14-day trial", "Cancel anytime"].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle size={13} className="text-green-400" /> {t}
              </span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="py-12 border-t border-[#E2E8F0] bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <img src={insyncLogo} alt="In-Sync Field" className="h-8 w-auto" />
              <span className="font-bold text-[15px] text-[#0F172A]">In-Sync Field</span>
            </div>
            <div className="flex gap-6 flex-wrap justify-center">
              {[
                { label: "Solution", action: () => scrollTo("solution") },
                { label: "Pricing", action: () => scrollTo("pricing") },
                { label: "FAQ", action: () => scrollTo("faq") },
              ].map((link, i) => (
                <button key={i} onClick={link.action} className="text-[13px] text-[#94A3B8] hover:text-[#0F172A] transition-colors bg-transparent border-none cursor-pointer">{link.label}</button>
              ))}
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-[#F1F5F9] flex flex-col md:flex-row items-center justify-between gap-3 text-[13px] text-[#94A3B8]">
            <div>Built with care for Indian field teams</div>
            <div>&copy; 2026 In-Sync</div>
          </div>
        </div>
      </footer>

      {/* ══════════ CSS ══════════ */}
      <style>{`
        @keyframes ctaShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .hero-gradient-text-light {
          background: linear-gradient(135deg, #a5f3fc 0%, #86efac 50%, #fde68a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .cta-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: ctaShimmer 2.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;
