import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-6");
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".anim-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
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
    <div className="min-h-screen text-[#0F172A] overflow-x-hidden" style={{ fontFamily: "'DM Sans', sans-serif", background: "#FFFFFF" }}>

      {/* ── NAVBAR ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "py-2" : "py-3.5"}`}
        style={{ background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)", borderBottom: scrolled ? "1px solid #E2E8F0" : "1px solid transparent" }}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none">
            <img src={insyncLogo} alt="Field-Sync" className="h-9 w-auto" />
            <span className="font-bold text-[17px] text-[#0F172A]">Field-Sync</span>
          </button>
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((l, i) => (
              <button key={i} onClick={l.action} className="text-[#64748B] text-[13px] font-medium hover:text-[#0F172A] bg-transparent border-none cursor-pointer transition-colors">{l.label}</button>
            ))}
            <button onClick={goAuth} className="text-[#64748B] text-[13px] font-medium hover:text-[#0F172A] bg-transparent border-none cursor-pointer transition-colors">Sign In</button>
            <button onClick={goAuth} className="px-5 py-2.5 rounded-lg text-[13px] font-semibold bg-[#01B8AA] text-white cursor-pointer border-none transition-all hover:bg-[#019E93] hover:shadow-md" style={{ boxShadow: "0 2px 8px rgba(1,184,170,0.25)" }}>
              Start Free Trial
            </button>
          </div>
          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden bg-transparent border-none cursor-pointer p-2">
            <div className="flex flex-col gap-1.5">
              <div className={`w-5 h-0.5 bg-[#0F172A] transition-all ${mobileOpen ? "rotate-45 translate-y-2" : ""}`} />
              <div className={`w-5 h-0.5 bg-[#0F172A] transition-all ${mobileOpen ? "opacity-0" : ""}`} />
              <div className={`w-5 h-0.5 bg-[#0F172A] transition-all ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>
        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden px-6 pb-5 pt-3 flex flex-col gap-3 bg-white border-t border-[#E2E8F0]">
            {navLinks.map((l, i) => (
              <button key={i} onClick={l.action} className="text-left text-[#0F172A] text-[15px] font-medium bg-transparent border-none cursor-pointer py-2">{l.label}</button>
            ))}
            <button onClick={goAuth} className="text-left text-[#0F172A] text-[15px] font-medium bg-transparent border-none cursor-pointer py-2">Sign In</button>
            <button onClick={goAuth} className="mt-1 px-5 py-3 rounded-lg text-[14px] font-semibold bg-[#01B8AA] text-white cursor-pointer border-none">Start Free Trial →</button>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden">
        {/* BG blobs */}
        <div className="absolute top-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full opacity-[0.07]" style={{ background: "radial-gradient(circle, #01B8AA 0%, transparent 70%)" }} />
        <div className="absolute bottom-[-100px] left-[-150px] w-[400px] h-[400px] rounded-full opacity-[0.05]" style={{ background: "radial-gradient(circle, #01B8AA 0%, transparent 70%)" }} />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6">
          <div className="text-center max-w-[720px] mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#01B8AA] mb-8 bg-[#F0FDFA] border border-[#01B8AA]/15" style={{ animation: "fadeInUp 0.6s ease both" }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#01B8AA] animate-pulse" />
              Trusted by 100+ field teams across India
            </div>
            <h1 className="text-[clamp(36px,5.5vw,60px)] font-extrabold leading-[1.08] mb-6 tracking-[-0.02em]" style={{ fontFamily: "'Playfair Display', Georgia, serif", animation: "fadeInUp 0.6s ease 0.1s both" }}>
              Your field team visits dozens daily.<br />
              <span style={{ background: "linear-gradient(135deg, #01B8AA 0%, #059669 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>How many actually convert?</span>
            </h1>
            <p className="text-[18px] text-[#64748B] leading-[1.7] mb-10 max-w-[540px] mx-auto" style={{ animation: "fadeInUp 0.6s ease 0.2s both" }}>
              GPS-verified visits, real-time dashboards, and gamified targets — everything to turn field activity into closed deals. Works offline. Setup in 10 minutes.
            </p>
            <div className="flex gap-4 flex-wrap justify-center mb-8" style={{ animation: "fadeInUp 0.6s ease 0.3s both" }}>
              <button onClick={goAuth} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold bg-[#01B8AA] text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-xl" style={{ boxShadow: "0 4px 14px rgba(1,184,170,0.35)" }}>
                Start Free — 14 Day Trial →
              </button>
              <button onClick={() => scrollTo("how-it-works")} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-[15px] font-semibold text-[#0F172A] bg-white border border-[#E2E8F0] cursor-pointer transition-all hover:border-[#CBD5E1] hover:shadow-md">
                See How It Works
              </button>
            </div>
            <div className="flex items-center justify-center gap-2 text-[13px] text-[#94A3B8]" style={{ animation: "fadeInUp 0.6s ease 0.35s both" }}>
              <span className="text-[#01B8AA] font-bold">✓</span> No credit card required
              <span className="mx-2">·</span>
              <span className="text-[#01B8AA] font-bold">✓</span> Cancel anytime
              <span className="mx-2">·</span>
              <span className="text-[#01B8AA] font-bold">✓</span> Full features included
            </div>
          </div>

          {/* Demo embed */}
          <div className="max-w-[880px] mx-auto" style={{ animation: "fadeInUp 0.8s ease 0.4s both" }}>
            <div className="rounded-2xl overflow-hidden bg-white border border-[#E2E8F0]" style={{ boxShadow: "0 25px 80px rgba(0,0,0,0.08), 0 8px 30px rgba(0,0,0,0.04)" }}>
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
          </div>
        </div>
      </section>

      {/* ── SOCIAL PROOF BAR ── */}
      <div className="py-14 border-y border-[#E2E8F0] bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
            {[
              { value: 500, suffix: "+", label: "Field Agents Tracked", icon: "👥" },
              { value: 40, suffix: "%", label: "Fewer Missed Follow-ups", icon: "📈" },
              { value: 98, suffix: "%", label: "GPS Verification Rate", icon: "📍" },
              { value: 10, suffix: " min", label: "Average Setup Time", icon: "⚡" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-[#0F172A] mb-1">
                  <Counter target={s.value} suffix={s.suffix} />
                </div>
                <div className="text-[13px] text-[#94A3B8] font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PROBLEM → SOLUTION ── */}
      <section className="py-24 max-md:py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">The Problem</span>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Field Teams Without Visibility Are Leaking Revenue</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: "🔍", problem: "No visit verification", detail: "Agents report visits but there's no way to verify if they actually happened. Managers rely on trust alone.", color: "#EF4444" },
              { icon: "📵", problem: "Data goes dark offline", detail: "In rural areas or poor connectivity zones, agents can't log anything. A full day's work gets lost or forgotten.", color: "#F59E0B" },
              { icon: "📉", problem: "No performance visibility", detail: "Managers can't tell who's performing and who's not. Coaching happens too late. Targets get missed silently.", color: "#8B5CF6" },
            ].map((p, i) => (
              <div key={i} className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 rounded-2xl p-7 bg-white border border-[#E2E8F0]" style={{ transition: "all 0.3s" }}>
                <div className="text-2xl mb-3">{p.icon}</div>
                <div className="text-[15px] font-bold mb-2 text-[#0F172A]">{p.problem}</div>
                <div className="text-sm text-[#64748B] leading-relaxed">{p.detail}</div>
              </div>
            ))}
          </div>
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F0FDFA] border border-[#01B8AA]/15 text-[#01B8AA] text-sm font-semibold">
              ↓ Field-Sync solves all three
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: "📍", solution: "Every visit GPS-verified", detail: "Auto-captured coordinates at check-in and check-out. Photo capture, checklists, and duration tracking create an indisputable visit record.", color: "#01B8AA" },
              { icon: "📱", solution: "Works 100% offline", detail: "IndexedDB-powered offline mode means agents log visits, update leads, and plan their day without any network. Everything syncs the moment they're back online.", color: "#01B8AA" },
              { icon: "📊", solution: "Real-time team dashboards", detail: "See every agent's performance, location, and pipeline in real time. Branch-level KPIs, gamified badges, and AI insights surface what matters.", color: "#01B8AA" },
            ].map((s, i) => (
              <div key={i} className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 rounded-2xl p-7 border-2 border-[#01B8AA]/20 bg-[#F0FDFA]/50" style={{ transition: "all 0.3s" }}>
                <div className="text-2xl mb-3">{s.icon}</div>
                <div className="text-[15px] font-bold mb-2 text-[#0F172A]">{s.solution}</div>
                <div className="text-sm text-[#64748B] leading-relaxed">{s.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-24 max-md:py-16 bg-[#F8FAFB]">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">How It Works</span>
          <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] mb-4 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Up and Running in 10 Minutes</h2>
          <p className="text-[16px] text-[#64748B] max-w-[500px] mx-auto leading-relaxed mb-16">No complex onboarding. No IT team. Just three steps to full field visibility.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-[40px] left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-[#01B8AA]/30 via-[#01B8AA]/10 to-[#01B8AA]/30" />
            {[
              { n: "1", icon: "📲", title: "Invite Your Team", desc: "Add agents and managers. They download the app and log in — role-based access is pre-configured automatically." },
              { n: "2", icon: "📍", title: "Agents Log Visits", desc: "Every visit is GPS-verified and timestamped. Agents log notes, photos, checklists, and next steps — even offline." },
              { n: "3", icon: "📊", title: "Track Everything Live", desc: "Real-time dashboards show who's where, what's converting, and where to focus. Branch and org-wide views included." },
            ].map((s, i) => (
              <div key={i} className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 text-center relative">
                <div className="w-[52px] h-[52px] rounded-full border-2 border-[#01B8AA] flex items-center justify-center text-lg font-bold text-[#01B8AA] mx-auto mb-6 relative z-10 bg-white" style={{ boxShadow: "0 4px 14px rgba(1,184,170,0.15)" }}>{s.n}</div>
                <div className="text-3xl mb-4">{s.icon}</div>
                <div className="text-[17px] font-bold mb-2 text-[#0F172A]">{s.title}</div>
                <div className="text-sm text-[#64748B] leading-relaxed max-w-[280px] mx-auto">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 max-md:py-16">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">Features</span>
          <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] mb-4 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Everything Your Field Team Needs</h2>
          <p className="text-[16px] text-[#64748B] max-w-[500px] mx-auto leading-relaxed mb-16">Purpose-built for field sales teams — from daily planning to incentive tracking.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[
              { icon: "📍", bg: "#F0FDFA", accent: "#01B8AA", title: "Live GPS Tracking", desc: "See every agent's location on a territory map. GPS-verified check-in/out with coordinates, timestamps, and route replay." },
              { icon: "📊", bg: "#FEF2F2", accent: "#EF4444", title: "Performance Analytics", desc: "Visit trends, completion rates, branch KPIs, and AI-powered insights. Know who's excelling and who needs coaching." },
              { icon: "📋", bg: "#FFFBEB", accent: "#F59E0B", title: "Daily Planning", desc: "Agents set targets. Managers review and correct with audit trails. Real-time progress tracking throughout the day." },
              { icon: "👥", bg: "#F0F9FF", accent: "#3B82F6", title: "Lead Pipeline", desc: "Full prospect lifecycle: New → Contacted → Interested → Proposal → Enrolled. Activity timeline with every interaction." },
              { icon: "📱", bg: "#FAF5FF", accent: "#8B5CF6", title: "Offline-First", desc: "IndexedDB-powered offline mode. Agents work uninterrupted in zero-connectivity zones. Auto-sync when back online." },
              { icon: "🏆", bg: "#FFF7ED", accent: "#EA580C", title: "Gamified Targets", desc: "Bronze, Silver, Gold badges. Leaderboards, incentive tracking, and milestone celebrations that drive healthy competition." },
            ].map((f, i) => (
              <div
                key={i}
                className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 text-left rounded-2xl p-7 bg-white border border-[#E2E8F0] relative overflow-hidden group hover:-translate-y-1 hover:shadow-lg"
                style={{ transition: "all 0.35s ease" }}
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity rounded-t-2xl" style={{ background: f.accent }} />
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-5" style={{ background: f.bg }}>{f.icon}</div>
                <div className="text-[16px] font-bold mb-2 text-[#0F172A]">{f.title}</div>
                <div className="text-[13px] text-[#64748B] leading-[1.7]">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MID CTA ── */}
      <section className="py-16 bg-[#0F172A]">
        <div className="max-w-[800px] mx-auto px-6 text-center">
          <h3 className="text-[clamp(22px,3.5vw,32px)] font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Ready to see what your field team is <span className="text-[#01B8AA]">actually</span> doing?
          </h3>
          <p className="text-[15px] text-[#94A3B8] mb-8 max-w-[440px] mx-auto">Start your 14-day free trial today. No credit card required. Full access to every feature.</p>
          <button onClick={goAuth} className="px-8 py-4 rounded-xl text-[15px] font-semibold bg-[#01B8AA] text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-xl" style={{ boxShadow: "0 4px 14px rgba(1,184,170,0.35)" }}>
            Start Free Trial →
          </button>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section id="use-cases" className="py-24 max-md:py-16">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">Who It's For</span>
          <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] mb-4 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Built for Every Role in Your Team</h2>
          <p className="text-[16px] text-[#64748B] max-w-[500px] mx-auto leading-relaxed mb-16">Whether you manage 5 agents or 500 — Field-Sync adapts to your role.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { emoji: "🏃", role: "Sales Officer", title: "Plan, Visit, Close", desc: "Plan your daily route, log GPS-verified visits, track your incentive progress, and earn milestone badges. Works offline in the field.", accent: "#01B8AA", bg: "#F0FDFA" },
              { emoji: "📋", role: "Branch Manager", title: "Coach & Optimize", desc: "See your branch's performance at a glance. Identify top performers, spot agents who need support, and track targets against goals.", accent: "#F59E0B", bg: "#FFFBEB" },
              { emoji: "🏢", role: "Admin / Leadership", title: "Full Org Visibility", desc: "Organization-wide territory maps, cross-branch analytics, team management, and complete pipeline visibility — one dashboard.", accent: "#8B5CF6", bg: "#FAF5FF" },
            ].map((c, i) => (
              <div key={i} className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 text-center rounded-2xl py-10 px-7 bg-white border border-[#E2E8F0] hover:shadow-lg hover:-translate-y-1 group" style={{ transition: "all 0.3s" }}>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-5" style={{ background: c.bg }}>{c.emoji}</div>
                <div className="text-[11px] uppercase tracking-[1.5px] font-bold mb-2" style={{ color: c.accent }}>{c.role}</div>
                <div className="text-lg font-bold mb-3 text-[#0F172A]">{c.title}</div>
                <div className="text-[13px] text-[#64748B] leading-relaxed">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 max-md:py-16 bg-[#F8FAFB]">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">What Teams Say</span>
          <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] mb-16 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Trusted by Field Sales Teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { quote: "We reduced missed follow-ups by 40% in the first month. Agents plan properly now and I see exactly where they are in real-time.", initials: "SK", name: "Suresh Kumar", role: "Branch Manager · Insurance", avatarBg: "#01B8AA" },
              { quote: "The badge system changed everything. Everyone wants Gold now. Deal closures up 28% since we started. The competition is healthy.", initials: "MP", name: "Meena Patel", role: "Regional Manager · FMCG", avatarBg: "#F59E0B" },
              { quote: "Finally an app that works without network! I log visits in rural areas, everything syncs later. GPS verification builds trust with my manager.", initials: "RV", name: "Rahul Verma", role: "Sales Officer · Pharma", avatarBg: "#8B5CF6" },
            ].map((t, i) => (
              <div key={i} className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 text-left rounded-2xl p-8 bg-white border border-[#E2E8F0]" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                <div className="text-[13px] text-[#F59E0B] mb-4">★★★★★</div>
                <div className="text-[15px] text-[#475569] leading-[1.7] mb-6">&ldquo;{t.quote}&rdquo;</div>
                <div className="flex items-center gap-3 pt-5 border-t border-[#F1F5F9]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white" style={{ background: t.avatarBg }}>{t.initials}</div>
                  <div>
                    <div className="text-sm font-semibold text-[#0F172A]">{t.name}</div>
                    <div className="text-xs text-[#94A3B8]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 max-md:py-16">
        <div className="max-w-[1200px] mx-auto px-6 text-center">
          <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">Pricing</span>
          <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] mb-4 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>One Plan. Everything Included.</h2>
          <p className="text-[16px] text-[#64748B] max-w-[480px] mx-auto leading-relaxed mb-16">No tiers to compare. No features locked behind upgrades. Every team gets everything.</p>
          <div className="max-w-[440px] mx-auto">
            <div className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 rounded-3xl p-10 md:p-12 text-center relative bg-white border-2 border-[#01B8AA]" style={{ boxShadow: "0 25px 60px rgba(1,184,170,0.1)" }}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#01B8AA] text-white text-[11px] font-bold uppercase tracking-[1.5px] px-5 py-1.5 rounded-full">14-Day Free Trial</div>
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
                  "GPS visit tracking & territory maps",
                  "Daily planning & prospect pipeline",
                  "Analytics hub with AI insights",
                  "Gamified badges & leaderboards",
                  "Offline-first with automatic sync",
                  "Role-based access control",
                  "Unlimited team members",
                  "Email & chat support",
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5 text-[14px] text-[#475569] border-b border-[#F1F5F9] last:border-none">
                    <span className="text-[#01B8AA] text-sm font-bold flex-shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={goAuth} className="w-full py-4 rounded-xl text-[15px] font-semibold bg-[#01B8AA] text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg" style={{ boxShadow: "0 4px 14px rgba(1,184,170,0.3)" }}>
                Start Free Trial →
              </button>
              <div className="text-[12px] text-[#94A3B8] mt-3">No credit card required · Cancel anytime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 max-md:py-16 bg-[#F8FAFB]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">FAQ</span>
            <h2 className="text-[clamp(28px,4vw,40px)] font-bold leading-[1.2] text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Common Questions</h2>
          </div>
          <div className="max-w-[720px] mx-auto flex flex-col gap-4">
            {[
              { q: "Does it work without internet?", a: "Yes. Field-Sync uses offline-first architecture with IndexedDB. Agents can log visits, update prospects, and plan their day without any network. Everything syncs automatically when connectivity returns." },
              { q: "Can I track agents across multiple branches?", a: "Absolutely. Admins get org-wide visibility across all branches on a single territory map. Branch Managers see their branch, Sales Officers see their own data — all role-based and automatic." },
              { q: "Is my data secure?", a: "Enterprise-grade security with encrypted data storage and HTTPS-only connections. Role-based access controls at every level ensure your prospect data and visit logs are fully protected." },
              { q: "How long does setup take?", a: "Under 10 minutes. Create your account, invite team members, and they log in. No IT team needed, no complex configuration. Start tracking visits the same day." },
              { q: "What industries does it work for?", a: "Categories are fully configurable — FMCG, insurance, pharma, real estate, or any field-based vertical. Every prospect and visit can be tagged for accurate pipeline tracking." },
              { q: "Can agents fake their GPS location?", a: "GPS verification is built into every visit log. The system captures precise coordinates and timestamps, creating a verifiable record that builds accountability and trust." },
            ].map((f, i) => (
              <div key={i} className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 rounded-2xl p-6 bg-white border border-[#E2E8F0] hover:shadow-sm" style={{ transition: "all 0.3s" }}>
                <div className="text-[15px] font-semibold text-[#0F172A] mb-2">{f.q}</div>
                <div className="text-[13px] text-[#64748B] leading-[1.7]">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 max-md:py-16 text-center relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #F0FDFA 100%)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-[0.06]" style={{ background: "radial-gradient(circle, #01B8AA 0%, transparent 60%)" }} />
        <div className="relative z-10 max-w-[600px] mx-auto px-6">
          <h2 className="text-[clamp(28px,4.5vw,42px)] font-bold mb-4 text-[#0F172A]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Stop guessing.<br /><span style={{ background: "linear-gradient(135deg, #01B8AA 0%, #059669 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Start tracking.</span>
          </h2>
          <p className="text-[16px] text-[#64748B] mb-10 leading-relaxed">Join teams across India who've already transformed their field operations with GPS-verified accountability.</p>
          <button onClick={goAuth} className="px-10 py-4 rounded-xl text-[15px] font-semibold bg-[#01B8AA] text-white border-none cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-xl" style={{ boxShadow: "0 4px 14px rgba(1,184,170,0.35)" }}>
            Start Your 14-Day Free Trial →
          </button>
          <div className="flex items-center justify-center gap-4 mt-6 text-[13px] text-[#94A3B8]">
            <span>✓ No credit card</span>
            <span>✓ Full features</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between flex-wrap gap-5">
          <div className="flex items-center gap-5">
            <img src={insyncLogo} alt="Field-Sync" className="h-7 w-auto opacity-60" />
            <div className="text-[13px] text-[#94A3B8]">© 2026 Field-Sync by ECR Technical Innovations Pvt. Ltd.</div>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[13px] text-[#94A3B8] hover:text-[#0F172A] transition-colors no-underline">Privacy</a>
            <a href="#" className="text-[13px] text-[#94A3B8] hover:text-[#0F172A] transition-colors no-underline">Terms</a>
            <a href="#" className="text-[13px] text-[#94A3B8] hover:text-[#0F172A] transition-colors no-underline">Contact</a>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Landing;
