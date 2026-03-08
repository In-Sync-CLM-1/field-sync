import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, BarChart3, ClipboardList, Users, Smartphone, Trophy,
  CheckCircle, Zap, TrendingUp, Shield, WifiOff, Eye,
  ArrowRight, Star, Target, Building2, Sparkles, ChevronDown,
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

      {/* ══════════ NAVBAR ══════════ */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-2" : "py-3.5"}`}
        style={{ background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)", borderBottom: scrolled ? "1px solid #E2E8F0" : "1px solid transparent" }}
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
            <button onClick={goAuth} className="text-[#64748B] text-[13px] font-medium hover:text-[#0F172A] bg-transparent border-none cursor-pointer transition-colors">Sign In</button>
            <button onClick={goAuth} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold text-white cursor-pointer border-none transition-all hover:shadow-lg hover:-translate-y-px" style={{ background: "linear-gradient(135deg, #01B8AA 0%, #059669 100%)", boxShadow: "0 2px 8px rgba(1,184,170,0.3)" }}>
              Start Free Trial
            </button>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden bg-transparent border-none cursor-pointer p-2">
            <div className="flex flex-col gap-1.5">
              <div className={`w-5 h-0.5 bg-[#0F172A] transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
              <div className={`w-5 h-0.5 bg-[#0F172A] transition-all ${mobileOpen ? "opacity-0" : ""}`} />
              <div className={`w-5 h-0.5 bg-[#0F172A] transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden px-6 pb-5 pt-3 flex flex-col gap-3 bg-white border-t border-[#E2E8F0]">
            {navLinks.map((l, i) => (
              <button key={i} onClick={l.action} className="text-left text-[#0F172A] text-[15px] font-medium bg-transparent border-none cursor-pointer py-2">{l.label}</button>
            ))}
            <button onClick={goAuth} className="text-left text-[#0F172A] text-[15px] font-medium bg-transparent border-none cursor-pointer py-2">Sign In</button>
            <button onClick={goAuth} className="mt-1 px-5 py-3 rounded-lg text-[14px] font-semibold text-white cursor-pointer border-none" style={{ background: "linear-gradient(135deg, #01B8AA, #059669)" }}>Start Free Trial</button>
          </div>
        )}
      </nav>

      {/* ══════════ HERO ══════════ */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0" style={{
          background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(1,184,170,0.14), transparent 70%), radial-gradient(ellipse 60% 60% at 100% 50%, rgba(139,92,246,0.06), transparent 60%), radial-gradient(ellipse 50% 50% at 0% 100%, rgba(59,130,246,0.05), transparent 60%), #fff",
        }} />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.35]" style={{
          backgroundImage: "radial-gradient(circle, rgba(1,184,170,0.12) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)",
        }} />
        {/* Animated blobs */}
        <div className="absolute top-16 right-[12%] w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(1,184,170,0.12), transparent 70%)", animation: "heroFloat1 8s ease-in-out infinite" }} />
        <div className="absolute bottom-0 left-[8%] w-60 h-60 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08), transparent 70%)", animation: "heroFloat2 10s ease-in-out infinite" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full" style={{ background: "radial-gradient(circle, rgba(1,184,170,0.04), transparent 50%)" }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-[740px] mx-auto mb-16">
            {/* Badge */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#01B8AA] mb-8 border border-[#01B8AA]/15"
              style={{ background: "rgba(240,253,250,0.85)", backdropFilter: "blur(8px)" }}
            >
              <Sparkles size={14} />
              Trusted by 100+ field teams across India
            </motion.div>

            {/* Headline */}
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-[clamp(36px,5.5vw,62px)] font-extrabold leading-[1.06] mb-6 tracking-[-0.025em]"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Your field team visits dozens daily.<br />
              <span className="hero-gradient-text">How many actually convert?</span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[18px] text-[#64748B] leading-[1.7] mb-10 max-w-[560px] mx-auto"
            >
              GPS-verified visits, real-time dashboards, and gamified targets — everything to turn field activity into closed deals. Works offline. Setup in 10 minutes.
            </motion.p>

            {/* CTAs */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex gap-4 flex-wrap justify-center mb-8"
            >
              <button onClick={goAuth}
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden"
                style={{ background: "linear-gradient(135deg, #01B8AA 0%, #059669 100%)", boxShadow: "0 4px 20px rgba(1,184,170,0.35)" }}
              >
                <span className="relative z-10">Start Free — 14 Day Trial</span>
                <ArrowRight size={16} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
                <div className="absolute inset-0 cta-shimmer" />
              </button>
              <button onClick={() => scrollTo("how-it-works")}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold text-[#0F172A] bg-white/80 border border-[#E2E8F0] cursor-pointer transition-all hover:border-[#CBD5E1] hover:shadow-lg backdrop-blur-sm"
              >
                See How It Works
              </button>
            </motion.div>

            {/* Trust line */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
              className="flex items-center justify-center gap-4 md:gap-5 text-[13px] text-[#94A3B8] flex-wrap"
            >
              {["No credit card required", "Cancel anytime", "Full features included"].map((t, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  <CheckCircle size={13} className="text-[#01B8AA]" /> {t}
                </span>
              ))}
            </motion.div>
          </div>

          {/* ── Demo embed with floating cards ── */}
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.45 }}
            className="relative max-w-[900px] mx-auto"
          >
            {/* Floating stat cards */}
            <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="hidden md:flex absolute -top-5 right-[-50px] z-20 items-center gap-2.5 bg-white rounded-xl px-4 py-2.5 border border-[#E2E8F0]"
              style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><TrendingUp size={15} className="text-emerald-500" /></div>
              <div>
                <div className="text-sm font-bold text-[#0F172A]">+23%</div>
                <div className="text-[10px] text-[#94A3B8]">conversion rate</div>
              </div>
            </motion.div>
            <motion.div animate={{ y: [0, 6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="hidden md:flex absolute -bottom-4 left-[-45px] z-20 items-center gap-2.5 bg-white rounded-xl px-4 py-2.5 border border-[#E2E8F0]"
              style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}
            >
              <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center"><MapPin size={15} className="text-[#01B8AA]" /></div>
              <div>
                <div className="text-sm font-bold text-[#0F172A]">98%</div>
                <div className="text-[10px] text-[#94A3B8]">GPS accuracy</div>
              </div>
            </motion.div>
            <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
              className="hidden md:flex absolute top-[38%] left-[-60px] z-20 items-center gap-2.5 bg-white rounded-xl px-4 py-2.5 border border-[#E2E8F0]"
              style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.06)" }}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center"><Users size={15} className="text-[#8B5CF6]" /></div>
              <div>
                <div className="text-sm font-bold text-[#0F172A]">500+</div>
                <div className="text-[10px] text-[#94A3B8]">agents tracked</div>
              </div>
            </motion.div>

            {/* Glow behind frame */}
            <div className="absolute inset-6 rounded-3xl" style={{ background: "radial-gradient(ellipse at center, rgba(1,184,170,0.1), transparent 70%)", filter: "blur(40px)" }} />

            {/* Browser chrome frame */}
            <div className="relative rounded-2xl overflow-hidden bg-white border border-[#E2E8F0]" style={{ boxShadow: "0 25px 80px -12px rgba(1,184,170,0.12), 0 20px 60px -15px rgba(0,0,0,0.1)" }}>
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#E2E8F0] bg-[#F8FAFB]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FCA5A5]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FDE68A]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#86EFAC]" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="bg-white rounded-md px-3 py-1 text-[11px] text-[#94A3B8] font-mono text-center border border-[#E2E8F0]">app.fieldsync.in/demo</div>
                </div>
              </div>
              <iframe src="/demo" title="Product Demo" className="w-full border-none" style={{ height: 420, background: "#0B1A1E" }} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════ SOCIAL PROOF BAR ══════════ */}
      <div className="py-14 border-y border-[#E2E8F0] bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { value: 500, suffix: "+", label: "Field Agents Tracked", Icon: Users, color: "#01B8AA" },
              { value: 40, suffix: "%", label: "Fewer Missed Follow-ups", Icon: TrendingUp, color: "#059669" },
              { value: 98, suffix: "%", label: "GPS Verification Rate", Icon: MapPin, color: "#8B5CF6" },
              { value: 10, suffix: " min", label: "Average Setup Time", Icon: Zap, color: "#F59E0B" },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.08} className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}12` }}>
                    <s.Icon size={18} style={{ color: s.color }} />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-extrabold text-[#0F172A] mb-1">
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-[13px] text-[#94A3B8] font-medium">{s.label}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ CLIENT LOGOS ══════════ */}
      <div className="py-12 overflow-hidden bg-[#FAFBFC]">
        <div className="text-center mb-8">
          <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-[#94A3B8]">Trusted by teams at</span>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-28 z-10" style={{ background: "linear-gradient(90deg, #FAFBFC, transparent)" }} />
          <div className="absolute right-0 top-0 bottom-0 w-28 z-10" style={{ background: "linear-gradient(270deg, #FAFBFC, transparent)" }} />
          <div className="flex gap-14 items-center logo-scroll">
            {[...LOGOS, ...LOGOS].map((src, i) => (
              <img key={i} src={src} alt="" className="h-9 w-auto object-contain flex-shrink-0 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-300" />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════ PROBLEM → SOLUTION ══════════ */}
      <section className="py-24 max-md:py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <FadeIn className="text-center mb-16">
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-[#EF4444] mb-4 inline-block">The Problem</span>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Field Teams Without Visibility Are Leaking Revenue</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { Icon: Eye, problem: "No visit verification", detail: "Agents report visits but there's no way to verify if they actually happened. Managers rely on trust alone.", color: "#EF4444", bg: "#FEF2F2" },
              { Icon: WifiOff, problem: "Data goes dark offline", detail: "In rural areas or poor connectivity zones, agents can't log anything. A full day's work gets lost or forgotten.", color: "#F59E0B", bg: "#FFFBEB" },
              { Icon: BarChart3, problem: "No performance visibility", detail: "Managers can't tell who's performing and who's not. Coaching happens too late. Targets get missed silently.", color: "#8B5CF6", bg: "#FAF5FF" },
            ].map((p, i) => (
              <FadeIn key={i} delay={i * 0.1} className="rounded-2xl p-7 bg-white border border-[#E2E8F0] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: p.bg }}>
                  <p.Icon size={20} style={{ color: p.color }} />
                </div>
                <div className="text-[15px] font-bold mb-2 text-[#0F172A]">{p.problem}</div>
                <div className="text-sm text-[#64748B] leading-relaxed">{p.detail}</div>
              </FadeIn>
            ))}
          </div>
          <FadeIn className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#01B8AA]/15 text-sm font-semibold" style={{ background: "linear-gradient(135deg, rgba(240,253,250,0.9), rgba(236,253,245,0.9))", color: "#01B8AA" }}>
              <Sparkles size={14} /> Field-Sync solves all three
            </div>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { Icon: MapPin, solution: "Every visit GPS-verified", detail: "Auto-captured coordinates at check-in and check-out. Photo capture, checklists, and duration tracking create an indisputable visit record.", color: "#01B8AA" },
              { Icon: Smartphone, solution: "Works 100% offline", detail: "IndexedDB-powered offline mode means agents log visits, update leads, and plan their day without any network. Everything syncs automatically.", color: "#01B8AA" },
              { Icon: BarChart3, solution: "Real-time team dashboards", detail: "See every agent's performance, location, and pipeline in real time. Branch-level KPIs, gamified badges, and AI insights surface what matters.", color: "#01B8AA" },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.1} className="rounded-2xl p-7 border-2 border-[#01B8AA]/20 hover:border-[#01B8AA]/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden" style={{ background: "linear-gradient(180deg, rgba(240,253,250,0.5) 0%, white 100%)" }}>
                <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #01B8AA, #059669)" }} />
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 bg-[#F0FDFA]">
                  <s.Icon size={20} className="text-[#01B8AA]" />
                </div>
                <div className="text-[15px] font-bold mb-2 text-[#0F172A]">{s.solution}</div>
                <div className="text-sm text-[#64748B] leading-relaxed">{s.detail}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ HOW IT WORKS ══════════ */}
      <section id="how-it-works" className="py-24 max-md:py-16 bg-[#F8FAFB]">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <FadeIn>
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">How It Works</span>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] mb-4 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Up and Running in 10 Minutes</h2>
            <p className="text-[16px] text-[#64748B] max-w-[500px] mx-auto leading-relaxed mb-16">No complex onboarding. No IT team required. Three steps to full field visibility.</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[48px] left-[20%] right-[20%] h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #01B8AA30, #01B8AA30, transparent)" }} />
            {[
              { n: "1", Icon: Users, title: "Invite Your Team", desc: "Add agents and managers. They download the app and log in — role-based access is pre-configured automatically." },
              { n: "2", Icon: MapPin, title: "Agents Log Visits", desc: "Every visit is GPS-verified and timestamped. Agents log notes, photos, checklists, and next steps — even offline." },
              { n: "3", Icon: BarChart3, title: "Track Everything Live", desc: "Real-time dashboards show who's where, what's converting, and where to focus. Branch and org-wide views included." },
            ].map((s, i) => (
              <FadeIn key={i} delay={i * 0.15} className="text-center relative">
                <div className="w-[56px] h-[56px] rounded-full flex items-center justify-center text-lg font-bold text-white mx-auto mb-6 relative z-10" style={{ background: "linear-gradient(135deg, #01B8AA, #059669)", boxShadow: "0 4px 14px rgba(1,184,170,0.25)" }}>{s.n}</div>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(1,184,170,0.08)" }}>
                  <s.Icon size={22} className="text-[#01B8AA]" />
                </div>
                <div className="text-[17px] font-bold mb-2 text-[#0F172A]">{s.title}</div>
                <div className="text-sm text-[#64748B] leading-relaxed max-w-[280px] mx-auto">{s.desc}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" className="py-24 max-md:py-16">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <FadeIn>
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">Features</span>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] mb-4 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Everything Your Field Team Needs</h2>
            <p className="text-[16px] text-[#64748B] max-w-[500px] mx-auto leading-relaxed mb-16">Purpose-built for field sales teams — from daily planning to incentive tracking.</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[
              { Icon: MapPin, bg: "#F0FDFA", accent: "#01B8AA", accentEnd: "#059669", title: "Live GPS Tracking", desc: "See every agent's location on a territory map. GPS-verified check-in/out with coordinates, timestamps, and route replay." },
              { Icon: BarChart3, bg: "#FEF2F2", accent: "#EF4444", accentEnd: "#DC2626", title: "Performance Analytics", desc: "Visit trends, completion rates, branch KPIs, and AI-powered insights. Know who's excelling and who needs coaching." },
              { Icon: ClipboardList, bg: "#FFFBEB", accent: "#F59E0B", accentEnd: "#D97706", title: "Daily Planning", desc: "Agents set targets. Managers review and correct with audit trails. Real-time progress tracking throughout the day." },
              { Icon: Target, bg: "#F0F9FF", accent: "#3B82F6", accentEnd: "#2563EB", title: "Lead Pipeline", desc: "Full prospect lifecycle: New → Contacted → Interested → Proposal → Enrolled. Activity timeline with every interaction." },
              { Icon: Smartphone, bg: "#FAF5FF", accent: "#8B5CF6", accentEnd: "#7C3AED", title: "Offline-First", desc: "IndexedDB-powered offline mode. Agents work uninterrupted in zero-connectivity zones. Auto-sync when back online." },
              { Icon: Trophy, bg: "#FFF7ED", accent: "#EA580C", accentEnd: "#C2410C", title: "Gamified Targets", desc: "Bronze, Silver, Gold badges. Leaderboards, incentive tracking, and milestone celebrations that drive healthy competition." },
            ].map((f, i) => (
              <FadeIn key={i} delay={i * 0.08}
                className="text-left rounded-2xl p-7 bg-white border border-[#E2E8F0] relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(90deg, ${f.accent}, ${f.accentEnd})` }} />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-5" style={{ background: f.bg }}>
                  <f.Icon size={22} style={{ color: f.accent }} />
                </div>
                <div className="text-[16px] font-bold mb-2 text-[#0F172A]">{f.title}</div>
                <div className="text-[13px] text-[#64748B] leading-[1.7]">{f.desc}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ MID CTA ══════════ */}
      <section className="py-20 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)" }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <div className="absolute top-[-200px] right-[-100px] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(1,184,170,0.15), transparent 70%)" }} />
        <div className="relative z-10 max-w-[800px] mx-auto px-6 text-center">
          <FadeIn>
            <h3 className="text-[clamp(22px,3.5vw,34px)] font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Ready to see what your field team is{" "}
              <span className="hero-gradient-text">actually</span>{" "}doing?
            </h3>
            <p className="text-[15px] text-[#94A3B8] mb-8 max-w-[440px] mx-auto">Start your 14-day free trial today. No credit card required. Full access to every feature.</p>
            <button onClick={goAuth}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #01B8AA 0%, #059669 100%)", boxShadow: "0 4px 20px rgba(1,184,170,0.4)" }}
            >
              <span className="relative z-10">Start Free Trial</span>
              <ArrowRight size={16} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
              <div className="absolute inset-0 cta-shimmer" />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ══════════ USE CASES ══════════ */}
      <section id="use-cases" className="py-24 max-md:py-16">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <FadeIn>
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">Who It's For</span>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] mb-4 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Built for Every Role in Your Team</h2>
            <p className="text-[16px] text-[#64748B] max-w-[500px] mx-auto leading-relaxed mb-16">Whether you manage 5 agents or 500 — Field-Sync adapts to your role.</p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { Icon: Target, role: "Sales Officer", title: "Plan, Visit, Close", desc: "Plan your daily route, log GPS-verified visits, track your incentive progress, and earn milestone badges. Works offline in the field.", accent: "#01B8AA", bg: "#F0FDFA", gradient: "linear-gradient(135deg, #01B8AA, #059669)" },
              { Icon: ClipboardList, role: "Branch Manager", title: "Coach & Optimize", desc: "See your branch's performance at a glance. Identify top performers, spot agents who need support, and track targets against goals.", accent: "#F59E0B", bg: "#FFFBEB", gradient: "linear-gradient(135deg, #F59E0B, #D97706)" },
              { Icon: Building2, role: "Admin / Leadership", title: "Full Org Visibility", desc: "Organization-wide territory maps, cross-branch analytics, team management, and complete pipeline visibility — one dashboard.", accent: "#8B5CF6", bg: "#FAF5FF", gradient: "linear-gradient(135deg, #8B5CF6, #7C3AED)" },
            ].map((c, i) => (
              <FadeIn key={i} delay={i * 0.1} className="text-center rounded-2xl py-10 px-7 bg-white border border-[#E2E8F0] hover:shadow-xl hover:-translate-y-1 group transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: c.gradient }} />
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: c.bg }}>
                  <c.Icon size={28} style={{ color: c.accent }} />
                </div>
                <div className="text-[11px] uppercase tracking-[1.5px] font-bold mb-2" style={{ color: c.accent }}>{c.role}</div>
                <div className="text-lg font-bold mb-3 text-[#0F172A]">{c.title}</div>
                <div className="text-[13px] text-[#64748B] leading-relaxed">{c.desc}</div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="py-24 max-md:py-16 bg-[#F8FAFB]">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <FadeIn>
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">What Teams Say</span>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] mb-16 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Trusted by Field Sales Teams</h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "We reduced missed follow-ups by 40% in the first month. Agents plan properly now and I see exactly where they are in real-time.", initials: "SK", name: "Suresh Kumar", role: "Branch Manager · Insurance", color: "#01B8AA" },
              { quote: "The badge system changed everything. Everyone wants Gold now. Deal closures up 28% since we started. The competition is healthy.", initials: "MP", name: "Meena Patel", role: "Regional Manager · FMCG", color: "#F59E0B" },
              { quote: "Finally an app that works without network! I log visits in rural areas, everything syncs later. GPS verification builds trust with my manager.", initials: "RV", name: "Rahul Verma", role: "Sales Officer · Pharma", color: "#8B5CF6" },
            ].map((t, i) => (
              <FadeIn key={i} delay={i * 0.1} className="text-left rounded-2xl p-8 bg-white border border-[#E2E8F0] hover:shadow-lg transition-all duration-300 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-[3px] h-full" style={{ background: `linear-gradient(180deg, ${t.color}, transparent)` }} />
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => <Star key={j} size={14} className="fill-[#F59E0B] text-[#F59E0B]" />)}
                </div>
                <div className="text-[15px] text-[#475569] leading-[1.7] mb-6">&ldquo;{t.quote}&rdquo;</div>
                <div className="flex items-center gap-3 pt-5 border-t border-[#F1F5F9]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white" style={{ background: t.color }}>{t.initials}</div>
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A]">{t.name}</div>
                    <div className="text-xs text-[#94A3B8]">{t.role}</div>
                  </div>
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
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">Pricing</span>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] mb-4 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>One Plan. Everything Included.</h2>
            <p className="text-[16px] text-[#64748B] max-w-[480px] mx-auto leading-relaxed mb-16">No tiers to compare. No features locked behind upgrades. Every team gets everything.</p>
          </FadeIn>
          <FadeIn className="max-w-[440px] mx-auto">
            <div className="relative">
              {/* Gradient border wrapper */}
              <div className="absolute -inset-[2px] rounded-[26px] opacity-80" style={{ background: "linear-gradient(135deg, #01B8AA, #059669, #0EA5E9, #8B5CF6)" }} />
              <div className="relative rounded-3xl p-10 md:p-12 text-center bg-white">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-[11px] font-bold uppercase tracking-[1.5px] px-5 py-1.5 rounded-full" style={{ background: "linear-gradient(135deg, #01B8AA, #059669)" }}>14-Day Free Trial</div>
                <div className="text-xl font-bold text-[#0F172A] mb-1 mt-2">Field-Sync Pro</div>
                <div className="text-sm text-[#64748B] mb-6">Everything your team needs</div>
                <div className="flex items-baseline justify-center gap-1 mb-1">
                  <span className="text-[24px] font-semibold text-[#64748B]">₹</span>
                  <span className="text-[56px] font-extrabold text-[#0F172A] leading-none">99</span>
                  <span className="text-base text-[#94A3B8]">/mo</span>
                </div>
                <div className="text-sm text-[#94A3B8] mb-8">per user · billed monthly</div>
                <ul className="text-left mb-8 space-y-0">
                  {[
                    { text: "GPS visit tracking & territory maps", Icon: MapPin },
                    { text: "Daily planning & prospect pipeline", Icon: ClipboardList },
                    { text: "Analytics hub with AI insights", Icon: BarChart3 },
                    { text: "Gamified badges & leaderboards", Icon: Trophy },
                    { text: "Offline-first with automatic sync", Icon: Smartphone },
                    { text: "Role-based access control", Icon: Shield },
                    { text: "Unlimited team members", Icon: Users },
                    { text: "Email & chat support", Icon: Zap },
                  ].map((f, i) => (
                    <li key={i} className="flex items-center gap-3 py-2.5 text-[14px] text-[#475569] border-b border-[#F1F5F9] last:border-none">
                      <f.Icon size={15} className="text-[#01B8AA] flex-shrink-0" />
                      {f.text}
                    </li>
                  ))}
                </ul>
                <button onClick={goAuth}
                  className="group w-full py-4 rounded-xl text-[15px] font-semibold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg relative overflow-hidden"
                  style={{ background: "linear-gradient(135deg, #01B8AA 0%, #059669 100%)", boxShadow: "0 4px 14px rgba(1,184,170,0.3)" }}
                >
                  <span className="relative z-10">Start Free Trial</span>
                  <ArrowRight size={15} className="relative z-10 inline ml-2 group-hover:translate-x-0.5 transition-transform" />
                  <div className="absolute inset-0 cta-shimmer" />
                </button>
                <div className="text-[12px] text-[#94A3B8] mt-3 flex items-center justify-center gap-1">
                  <Shield size={12} /> No credit card required · Cancel anytime
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
            <span className="text-[12px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">FAQ</span>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Common Questions</h2>
          </FadeIn>
          <div className="max-w-[720px] mx-auto flex flex-col gap-3">
            {[
              { q: "Does it work without internet?", a: "Yes. Field-Sync uses offline-first architecture with IndexedDB. Agents can log visits, update prospects, and plan their day without any network. Everything syncs automatically when connectivity returns." },
              { q: "Can I track agents across multiple branches?", a: "Absolutely. Admins get org-wide visibility across all branches on a single territory map. Branch Managers see their branch, Sales Officers see their own data — all role-based and automatic." },
              { q: "Is my data secure?", a: "Enterprise-grade security with encrypted data storage and HTTPS-only connections. Role-based access controls at every level ensure your prospect data and visit logs are fully protected." },
              { q: "How long does setup take?", a: "Under 10 minutes. Create your account, invite team members, and they log in. No IT team needed, no complex configuration. Start tracking visits the same day." },
              { q: "What industries does it work for?", a: "Categories are fully configurable — FMCG, insurance, pharma, real estate, or any field-based vertical. Every prospect and visit can be tagged for accurate pipeline tracking." },
              { q: "Can agents fake their GPS location?", a: "GPS verification is built into every visit log. The system captures precise coordinates and timestamps, creating a verifiable record that builds accountability and trust." },
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
                    <div className="text-[13px] text-[#64748B] leading-[1.7]">{f.a}</div>
                  </div>
                </button>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ FINAL CTA ══════════ */}
      <section className="py-24 max-md:py-16 text-center relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F0FDFA 50%, #ECFDF5 100%)" }}>
        <div className="absolute inset-0 opacity-[0.3]" style={{
          backgroundImage: "radial-gradient(circle, rgba(1,184,170,0.08) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%)",
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full" style={{ background: "radial-gradient(circle, rgba(1,184,170,0.08), transparent 60%)" }} />
        <FadeIn className="relative z-10 max-w-[600px] mx-auto px-6">
          <h2 className="text-[clamp(28px,4.5vw,44px)] font-bold mb-4 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Stop guessing.<br />
            <span className="hero-gradient-text">Start tracking.</span>
          </h2>
          <p className="text-[16px] text-[#64748B] mb-10 leading-relaxed">Join teams across India who've already transformed their field operations with GPS-verified accountability.</p>
          <button onClick={goAuth}
            className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl text-[15px] font-semibold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #01B8AA 0%, #059669 100%)", boxShadow: "0 4px 20px rgba(1,184,170,0.35)" }}
          >
            <span className="relative z-10">Start Your 14-Day Free Trial</span>
            <ArrowRight size={16} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
            <div className="absolute inset-0 cta-shimmer" />
          </button>
          <div className="flex items-center justify-center gap-4 mt-6 text-[13px] text-[#94A3B8]">
            {["No credit card", "Full features", "Cancel anytime"].map((t, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <CheckCircle size={13} className="text-[#01B8AA]" /> {t}
              </span>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="py-10 border-t border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between flex-wrap gap-5">
          <div className="flex items-center gap-5">
            <img src={insyncLogo} alt="Field-Sync" className="h-7 w-auto opacity-60" />
            <div className="text-[13px] text-[#94A3B8]">&copy; 2026 Field-Sync by ECR Technical Innovations Pvt. Ltd.</div>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[13px] text-[#94A3B8] hover:text-[#0F172A] transition-colors no-underline">Privacy</a>
            <a href="#" className="text-[13px] text-[#94A3B8] hover:text-[#0F172A] transition-colors no-underline">Terms</a>
            <a href="#" className="text-[13px] text-[#94A3B8] hover:text-[#0F172A] transition-colors no-underline">Contact</a>
          </div>
        </div>
      </footer>

      {/* ══════════ CSS ══════════ */}
      <style>{`
        @keyframes heroFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(20px, -15px) scale(1.05); }
        }
        @keyframes heroFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-15px, 10px) scale(0.95); }
        }
        @keyframes scrollLogos {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes ctaShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .hero-gradient-text {
          background: linear-gradient(135deg, #01B8AA 0%, #059669 40%, #0EA5E9 100%);
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
