import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, BarChart3, Camera, FileText, Compass, WifiOff,
  CheckCircle, ArrowRight, Shield, ChevronDown, Check,
  Users, Briefcase, Menu, X,
} from "lucide-react";
import insyncLogo from "@/assets/insync-logo-color.png";

/* ─── Animated counter ─── */
function Counter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let start = 0;
          const step = Math.max(1, Math.floor(target / 40));
          const id = setInterval(() => {
            start = Math.min(start + step, target);
            setVal(start);
            if (start >= target) clearInterval(id);
          }, 30);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);
  return <span ref={ref}>{prefix}{val.toLocaleString("en-IN")}{suffix}</span>;
}

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

const LOGOS = [
  "/logos/resized_Quess_Logo.png",
  "/logos/resized_Motherson-Logo.jpg",
  "/logos/resized_College Dekho.jpg",
  "/logos/resized_Zolve_transparent.webp",
  "/logos/resized_alice-blue-financial-services-logo-vector.png",
  "/logos/resized_Zopper-Logo-Transparent-Background_5dbced9873927dbc00aa1bed763f6f2b.png",
  "/logos/Incred.png",
  "/logos/resized_UHC.png",
  "/logos/resized_Ezeepay.png",
  "/logos/resized_Seeds.png",
  "/logos/resized_Ev-co.jpg",
  "/logos/resized_Growthvive.png",
  "/logos/resized_CI.webp",
  "/logos/resized_SMB Connect.jpg",
  "/logos/resized_logo-ecofy.png",
  "/logos/resized_CAR_TRENDS_LOGO.webp",
  "/logos/resized_RB.jpg",
  "/logos/resized_legitquest-logo.png",
  "/logos/resized_audi-14-logo-png-transparent.png",
];

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

  const goAuth = () => navigate("/auth");

  const navLinks = [
    { label: "Features", action: () => scrollTo("features") },
    { label: "How It Works", action: () => scrollTo("how-it-works") },
    { label: "Pricing", action: () => scrollTo("pricing") },
    { label: "FAQ", action: () => scrollTo("faq") },
  ];

  return (
    <div className="min-h-screen text-[#0F172A] overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* ══════════ STICKY NAV ══════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-2" : "py-3.5"}`}
        style={{ background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)", borderBottom: scrolled ? "1px solid #E2E8F0" : "1px solid transparent" }}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none">
            <img src={insyncLogo} alt="Field-Sync" className="h-9 w-auto" />
            <span className="font-bold text-[17px] text-[#0F172A]">Field-Sync</span>
          </button>
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((l, i) => (
              <button key={i} onClick={l.action} className="text-[#64748B] text-[13px] font-medium hover:text-[#0F172A] bg-transparent border-none cursor-pointer transition-colors">{l.label}</button>
            ))}
            <button onClick={goAuth} className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer border-none transition-all hover:shadow-lg hover:-translate-y-px" style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", boxShadow: "0 2px 8px rgba(22,163,74,0.3)" }}>
              Start Free Trial
            </button>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden bg-transparent border-none cursor-pointer p-2">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden px-6 pb-5 pt-3 flex flex-col gap-3 bg-white border-t border-[#E2E8F0]">
            {navLinks.map((l, i) => (
              <button key={i} onClick={l.action} className="text-left text-[#0F172A] text-[15px] font-medium bg-transparent border-none cursor-pointer py-2">{l.label}</button>
            ))}
            <button onClick={goAuth} className="mt-1 px-5 py-3 rounded-lg text-[14px] font-semibold text-white cursor-pointer border-none" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>Start Free Trial</button>
          </div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0" style={{
          background: "linear-gradient(135deg, #4338ca 0%, #6d28d9 30%, #7c3aed 50%, #4338ca 100%)",
        }} />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        {/* Glow orbs */}
        <div className="absolute top-20 right-[15%] w-96 h-96 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-0 left-[10%] w-72 h-72 rounded-full" style={{ background: "radial-gradient(circle, rgba(79,70,229,0.3), transparent 70%)", filter: "blur(50px)" }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: Copy */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-white/90 mb-8 border border-white/20"
                style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)" }}
              >
                Your field team's smartest companion
              </motion.div>

              {/* Headline */}
              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-[clamp(32px,5vw,56px)] font-extrabold leading-[1.08] mb-6 tracking-[-0.025em] text-white"
              >
                Stop chasing your field team.{"\n"}
                <span className="hero-gradient-text-light">Start empowering them.</span>
              </motion.h1>

              {/* Subheadline */}
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="text-[17px] text-white/75 leading-[1.7] mb-10 max-w-[540px] mx-auto lg:mx-0"
              >
                Field-Sync gives your agents a tool they actually <strong className="text-white">WANT</strong> to use. Camera-first, forms-last — snap a card to add a customer, snap an order to record it, snap an invoice to file it. Your team does less typing, you get more data.
              </motion.p>

              {/* CTAs */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
                className="flex gap-4 flex-wrap justify-center lg:justify-start mb-8"
              >
                <button onClick={goAuth}
                  className="group inline-flex items-center gap-2.5 px-10 py-5 rounded-xl text-[16px] font-bold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", boxShadow: "0 4px 24px rgba(22,163,74,0.5)" }}
                >
                  <span className="relative z-10">Start Free Trial</span>
                  <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 cta-shimmer" />
                </button>
                <button onClick={() => scrollTo("how-it-works")}
                  className="inline-flex items-center gap-2 px-8 py-5 rounded-xl text-[15px] font-semibold text-white bg-white/10 border border-white/25 cursor-pointer transition-all hover:bg-white/20 backdrop-blur-sm"
                >
                  See how it works
                </button>
              </motion.div>

              {/* Trust line */}
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

            {/* Right: Phone mockup cards in fan layout */}
            <motion.div initial={{ opacity: 0, y: 50, rotateY: -10 }} animate={{ opacity: 1, y: 0, rotateY: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="relative flex justify-center items-center min-h-[420px] md:min-h-[480px]"
              style={{ perspective: "1000px" }}
            >
              {/* Card 1 — Snap a business card */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute phone-card"
                style={{ transform: "rotate(-12deg) translateX(-80px)", zIndex: 1 }}
              >
                <div className="w-[200px] md:w-[220px] bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-5 shadow-2xl">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
                      <Camera size={28} className="text-white" />
                    </div>
                    <div className="text-[14px] font-bold text-white mb-3">Snap a business card</div>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-6 h-[2px] bg-white/30" />
                      <ArrowRight size={14} className="text-green-400" />
                      <div className="w-6 h-[2px] bg-white/30" />
                    </div>
                    <div className="bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-2">
                      <div className="text-[13px] font-semibold text-green-300">Customer created</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2 — Snap an order (center, front) */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="relative phone-card"
                style={{ zIndex: 3 }}
              >
                <div className="w-[220px] md:w-[240px] bg-white/15 backdrop-blur-md rounded-3xl border border-white/25 p-6 shadow-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-4">
                      <Camera size={32} className="text-white" />
                    </div>
                    <div className="text-[15px] font-bold text-white mb-4">Snap an order</div>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <div className="w-8 h-[2px] bg-white/30" />
                      <ArrowRight size={16} className="text-green-400" />
                      <div className="w-8 h-[2px] bg-white/30" />
                    </div>
                    <div className="bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-2.5">
                      <div className="text-[14px] font-semibold text-green-300">Order recorded</div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 3 — Check in with GPS */}
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute phone-card"
                style={{ transform: "rotate(12deg) translateX(80px)", zIndex: 2 }}
              >
                <div className="w-[200px] md:w-[220px] bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-5 shadow-2xl">
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
                      <MapPin size={28} className="text-white" />
                    </div>
                    <div className="text-[14px] font-bold text-white mb-3">Check in with GPS</div>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="w-6 h-[2px] bg-white/30" />
                      <ArrowRight size={14} className="text-green-400" />
                      <div className="w-6 h-[2px] bg-white/30" />
                    </div>
                    <div className="bg-green-500/20 border border-green-400/30 rounded-lg px-3 py-2">
                      <div className="text-[13px] font-semibold text-green-300">Visit logged</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════ LOGO CAROUSEL (Social Proof) ══════════ */}
      <div className="py-10 overflow-hidden bg-white border-b border-[#E2E8F0]">
        <div className="text-center mb-6">
          <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-[#94A3B8]">Trusted by 500+ field teams across India</span>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-28 z-10" style={{ background: "linear-gradient(90deg, white, transparent)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-28 z-10" style={{ background: "linear-gradient(270deg, white, transparent)" }} />
          <div className="flex gap-14 items-center logo-scroll">
            {[...LOGOS, ...LOGOS].map((src, i) => (
              <img key={i} src={src} alt="" className="h-9 w-auto object-contain flex-shrink-0 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ TRUST BAR / STATS ══════════ */}
      <div className="py-14 bg-[#F8FAFB] border-b border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { value: 500, suffix: "+", label: "Teams", color: "#4f46e5" },
              { value: 50000, suffix: "+", label: "Visits Tracked", color: "#7c3aed" },
              { value: 100, suffix: "%", label: "Works Offline", color: "#16a34a" },
              { value: 2, suffix: "-min", label: "Setup Time", color: "#f59e0b" },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.08} className="text-center">
                <div className="text-4xl md:text-5xl font-extrabold mb-1" style={{ color: s.color }}>
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-[14px] text-[#64748B] font-medium">{s.label}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ PAIN → SOLUTION ══════════ */}
      <section className="py-24 max-md:py-16">
        <div className="max-w-[1000px] mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-indigo-600 mb-4 inline-block">The problem</span>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.2] text-[#0F172A]">Sound familiar?</h2>
          </FadeIn>
          <div className="flex flex-col gap-6">
            {[
              {
                pain: "Your agents spend 30 min/day filling forms",
                solution: "They snap a photo. AI does the rest.",
                emoji: "😩",
              },
              {
                pain: "You don't know who visited which customer",
                solution: "GPS check-in/out with live tracking.",
                emoji: "🤷",
              },
              {
                pain: "End-of-day reports are always late",
                solution: "Data flows in real-time, even offline.",
                emoji: "😤",
              },
            ].map((item, i) => (
              <FadeIn key={i} delay={i * 0.1}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-sm hover:shadow-md transition-shadow">
                  {/* Pain side */}
                  <div className="bg-red-50 p-6 md:p-8 flex items-center gap-4">
                    <span className="text-2xl flex-shrink-0">{item.emoji}</span>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-red-400 mb-1">The pain</div>
                      <div className="text-[15px] font-semibold text-red-700 line-through decoration-red-300">{item.pain}</div>
                    </div>
                  </div>
                  {/* Solution side */}
                  <div className="bg-green-50 p-6 md:p-8 flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check size={18} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-[1.5px] text-green-500 mb-1">With Field-Sync</div>
                      <div className="text-[15px] font-semibold text-green-800">{item.solution}</div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.3} className="text-center mt-10">
            <button onClick={goAuth}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}
            >
              <span className="relative z-10">Fix this today — Start Free Trial</span>
              <ArrowRight size={16} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
              <div className="absolute inset-0 cta-shimmer" />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" className="py-24 max-md:py-16 bg-[#F8FAFB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-indigo-600 mb-4 inline-block">Features</span>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.2] mb-4 text-[#0F172A]">Everything your field team needs.{" "}<span className="text-[#94A3B8]">Nothing they don't.</span></h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[
              { Icon: Camera, title: "Snap to Add Customer", desc: "Point at a business card. Customer created in 3 seconds.", accent: "#4f46e5", bg: "#eef2ff" },
              { Icon: FileText, title: "Scan Orders & Invoices", desc: "Photograph handwritten orders or invoices. AI extracts the data.", accent: "#7c3aed", bg: "#f5f3ff" },
              { Icon: MapPin, title: "Smart Check-in", desc: "GPS auto-detects the nearest customer. One tap to check in.", accent: "#16a34a", bg: "#f0fdf4" },
              { Icon: Compass, title: "Discover Nearby", desc: "Explore businesses near your location. Turn any area into prospects.", accent: "#0ea5e9", bg: "#f0f9ff" },
              { Icon: WifiOff, title: "Works Offline", desc: "Full functionality with no signal. Syncs when you're back online.", accent: "#f59e0b", bg: "#fffbeb" },
              { Icon: BarChart3, title: "Manager Dashboard", desc: "One screen: who's where, what they did, how much they collected.", accent: "#ef4444", bg: "#fef2f2" },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.08}
                className="text-left rounded-2xl p-7 bg-white border border-[#E2E8F0] relative overflow-hidden group hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300"
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: f.accent }} />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ background: f.bg }}>
                  <f.Icon size={24} style={{ color: f.accent }} />
                </div>
                <div className="text-[16px] font-bold mb-2 text-[#0F172A]">{f.title}</div>
                <div className="text-[14px] text-[#64748B] leading-[1.7]">{f.desc}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works" className="py-24 max-md:py-16">
        <div className="max-w-[1000px] mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-indigo-600 mb-4 inline-block">How It Works</span>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.2] mb-4 text-[#0F172A]">Live in 2 minutes</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Sign up & invite your team", desc: "Share a link. They're in.", accent: "#4f46e5" },
              { step: "2", title: "Agents start their day", desc: "Punch in, see today's plan, head out.", accent: "#7c3aed" },
              { step: "3", title: "You see everything", desc: "Visits, orders, collections — all in real-time.", accent: "#16a34a" },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.15} className="text-center relative">
                {/* Connector line on desktop */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-12 right-0 w-full h-[2px] translate-x-1/2" style={{ background: `linear-gradient(90deg, ${s.accent}30, transparent)` }} />
                )}
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-white text-[32px] font-extrabold" style={{ background: `linear-gradient(135deg, ${s.accent}, ${s.accent}cc)` }}>
                  {s.step}
                </div>
                <div className="text-[17px] font-bold mb-2 text-[#0F172A]">{s.title}</div>
                <div className="text-[15px] text-[#64748B] leading-relaxed">{s.desc}</div>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={0.4} className="text-center mt-12">
            <button onClick={goAuth}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)", boxShadow: "0 4px 20px rgba(22,163,74,0.35)" }}
            >
              <span className="relative z-10">Start Free Trial</span>
              <ArrowRight size={16} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
              <div className="absolute inset-0 cta-shimmer" />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ══════════ ROLE-BASED VALUE ══════════ */}
      <section className="py-24 max-md:py-16 bg-[#F8FAFB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-indigo-600 mb-4 inline-block">For Every Role</span>
            <h2 className="text-[clamp(28px,4vw,42px)] font-bold leading-[1.2] mb-4 text-[#0F172A]">Built for every role</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { Icon: Users, role: "Field Agent", desc: "Less typing, more selling. Snap cards, scan orders, check in with one tap.", accent: "#4f46e5", bg: "#eef2ff", gradient: "linear-gradient(135deg, #4f46e5, #6366f1)" },
              { Icon: Briefcase, role: "Manager", desc: "See your team's activity live. Know who visited whom, when, and what happened.", accent: "#7c3aed", bg: "#f5f3ff", gradient: "linear-gradient(135deg, #7c3aed, #8b5cf6)" },
              { Icon: Shield, role: "Admin", desc: "Full visibility across the org. Set up plans, track collections, measure performance.", accent: "#16a34a", bg: "#f0fdf4", gradient: "linear-gradient(135deg, #16a34a, #22c55e)" },
            ].map((c, i) => (
              <FadeIn key={i} delay={i * 0.1} className="text-center rounded-2xl py-10 px-8 bg-white border border-[#E2E8F0] hover:shadow-xl hover:-translate-y-1 group transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: c.gradient }} />
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: c.bg }}>
                  <c.Icon size={28} style={{ color: c.accent }} />
                </div>
                <div className="text-[12px] uppercase tracking-[1.5px] font-bold mb-3" style={{ color: c.accent }}>{c.role}</div>
                <div className="text-[15px] text-[#475569] leading-relaxed">{c.desc}</div>
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
          <FadeIn className="max-w-[460px] mx-auto mt-12">
            <div className="relative">
              {/* Gradient border wrapper */}
              <div className="absolute -inset-[2px] rounded-[26px] opacity-80" style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed, #16a34a)" }} />
              <div className="relative rounded-3xl p-10 md:p-12 text-center bg-white">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[11px] font-bold uppercase tracking-[1.5px] px-5 py-1.5 rounded-full" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>14-Day Free Trial</div>
                <div className="text-xl font-bold text-[#0F172A] mb-1 mt-2">Field-Sync Pro</div>
                <div className="text-sm text-[#64748B] mb-6">Everything your team needs</div>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-[24px] font-semibold text-[#64748B]">&#8377;</span>
                  <span className="text-[56px] font-extrabold text-[#0F172A] leading-none">99</span>
                  <span className="text-base text-[#94A3B8]">/user/month</span>
                </div>
                <div className="text-sm text-[#94A3B8] mb-8">Billed monthly. Cancel anytime.</div>
                <ul className="text-left mb-8 space-y-0">
                  {[
                    "Unlimited visits & customers",
                    "AI-powered scanning (card, invoice, order)",
                    "Nearby business discovery",
                    "Offline mode",
                    "GPS tracking & attendance",
                    "Manager dashboard",
                    "Priority support",
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 py-2.5 text-[14px] text-[#475569] border-b border-[#F1F5F9] last:border-none">
                      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={goAuth}
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
            Ready to empower your field team?
          </h2>
          <p className="text-[16px] text-white/60 mb-10 leading-relaxed">Join 500+ teams already using Field-Sync to get more done with less effort.</p>
          <button onClick={goAuth}
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
              <img src={insyncLogo} alt="Field-Sync" className="h-8 w-auto" />
              <span className="font-bold text-[15px] text-[#0F172A]">Field-Sync</span>
            </div>
            <div className="flex gap-6 flex-wrap justify-center">
              {[
                { label: "Features", action: () => scrollTo("features") },
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
        @keyframes scrollLogos {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
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
        .logo-scroll {
          animation: scrollLogos 35s linear infinite;
          width: max-content;
        }
        .logo-scroll:hover { animation-play-state: paused; }
        .cta-shimmer {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
          animation: ctaShimmer 2.5s infinite;
        }
      `}</style>
    </div>
  );
};

export default Landing;
