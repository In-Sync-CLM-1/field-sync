import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import insyncLogo from "@/assets/insync-logo-color.png";

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Intersection Observer for scroll animations
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
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll(".anim-scroll").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const goAuth = () => navigate("/auth");

  return (
    <div
      className="min-h-screen text-[#F0F4F5] overflow-x-hidden"
      style={{ fontFamily: "'DM Sans', sans-serif", background: "#0B1A1E" }}
    >
      {/* ── NAVBAR ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "py-2.5 border-b border-[#01B8AA]/15"
            : "py-4 bg-transparent"
        }`}
        style={scrolled ? { background: "rgba(11,26,30,0.92)", backdropFilter: "blur(20px)" } : {}}
      >
        <div className="max-w-[1140px] mx-auto px-6 flex items-center justify-between">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5 cursor-pointer bg-transparent border-none">
            <img src={insyncLogo} alt="In-Sync" className="h-10 w-auto" />
            <span className="font-bold text-lg text-[#F0F4F5]">
              In-Sync <span className="text-[#01B8AA]">Field Force</span>
            </span>
          </button>
          <ul className="hidden md:flex items-center gap-8 list-none">
            <li><button onClick={() => scrollTo("features")} className="text-[#8FA3A8] text-sm font-medium hover:text-white bg-transparent border-none cursor-pointer transition-colors">Features</button></li>
            <li><button onClick={() => scrollTo("use-cases")} className="text-[#8FA3A8] text-sm font-medium hover:text-white bg-transparent border-none cursor-pointer transition-colors">Who It's For</button></li>
            <li><button onClick={() => scrollTo("pricing")} className="text-[#8FA3A8] text-sm font-medium hover:text-white bg-transparent border-none cursor-pointer transition-colors">Pricing</button></li>
            <li><button onClick={() => scrollTo("faq")} className="text-[#8FA3A8] text-sm font-medium hover:text-white bg-transparent border-none cursor-pointer transition-colors">FAQ</button></li>
            <li><button onClick={goAuth} className="text-[#8FA3A8] text-sm font-medium hover:text-white bg-transparent border-none cursor-pointer transition-colors">Sign In</button></li>
            <li>
              <button
                onClick={goAuth}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-[#01B8AA] text-[#0B1A1E] cursor-pointer border-none transition-all hover:-translate-y-0.5"
                style={{ boxShadow: "0 0 30px rgba(1,184,170,0.25), 0 4px 15px rgba(0,0,0,0.3)" }}
              >
                Start Free Trial →
              </button>
            </li>
          </ul>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
        {/* BG gradients */}
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(1,184,170,0.12) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(1,184,170,0.06) 0%, transparent 50%)" }} />
        <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(1,184,170,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(1,184,170,0.03) 1px, transparent 1px)", backgroundSize: "60px 60px", maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 20%, transparent 70%)" }} />

        <div className="relative z-10 max-w-[1140px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left */}
          <div className="max-w-[560px] lg:text-left text-center mx-auto lg:mx-0">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#01B8AA]/15 text-[13px] font-medium text-[#01B8AA] mb-7" style={{ background: "rgba(1,184,170,0.1)", animation: "fadeInUp 0.6s ease both" }}>
              <span className="w-2 h-2 rounded-full bg-[#01B8AA] animate-pulse" />
              Built for Field Sales Teams
            </div>
            <h1
              className="text-[clamp(38px,5.5vw,56px)] font-extrabold leading-[1.12] mb-6"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", animation: "fadeInUp 0.6s ease 0.1s both" }}
            >
              Track Every Visit.<br />
              <span className="text-[#01B8AA]">Close More Deals.</span>
            </h1>
            <p className="text-lg text-[#8FA3A8] leading-relaxed mb-9 max-w-[480px] lg:mx-0 mx-auto" style={{ animation: "fadeInUp 0.6s ease 0.2s both" }}>
              Your field agents make dozens of visits daily — but how many actually convert? Get real-time visibility into every meeting, follow-up, and deal closure across your entire team.
            </p>
            <div className="flex gap-4 flex-wrap mb-10 lg:justify-start justify-center" style={{ animation: "fadeInUp 0.6s ease 0.3s both" }}>
              <button onClick={goAuth} className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-semibold bg-[#01B8AA] text-[#0B1A1E] border-none cursor-pointer transition-all hover:-translate-y-0.5" style={{ boxShadow: "0 0 30px rgba(1,184,170,0.25), 0 4px 15px rgba(0,0,0,0.3)" }}>
                Start 14-Day Free Trial →
              </button>
              <button onClick={() => scrollTo("how-it-works")} className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-semibold bg-transparent text-[#F0F4F5] border border-[#01B8AA]/15 cursor-pointer transition-all hover:border-[#01B8AA] hover:bg-[#01B8AA]/10" style={{ backdropFilter: "blur(10px)" }}>
                See How It Works
              </button>
            </div>
            <div className="flex items-center gap-6 lg:justify-start justify-center" style={{ animation: "fadeInUp 0.6s ease 0.4s both" }}>
              {[
                { num: "500+", label: "Field Agents" },
                { num: "40%", label: "Fewer Missed Follow-ups" },
                { num: "3x", label: "Faster Reporting" },
              ].map((s, i) => (
                <div key={i} className="flex items-center gap-6">
                  {i > 0 && <div className="w-px h-10 bg-[#01B8AA]/15" />}
                  <div className="flex flex-col">
                    <span className="text-[22px] font-bold text-[#F0F4F5]">{s.num}</span>
                    <span className="text-xs text-[#5F6B6D] uppercase tracking-wider">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right - Phone Mockup */}
          <div className="hidden lg:block relative" style={{ animation: "fadeInUp 0.8s ease 0.3s both" }}>
            <div className="relative w-[280px] mx-auto">
              <div className="w-full rounded-[32px] border-2 border-[#01B8AA]/15 overflow-hidden p-4" style={{ background: "#12282E", boxShadow: "0 30px 80px rgba(0,0,0,0.5), 0 0 60px rgba(1,184,170,0.25)" }}>
                <div className="w-[120px] h-7 bg-[#0B1A1E] rounded-b-2xl -mt-4 mx-auto mb-3" />
                <div className="bg-[#0B1A1E] rounded-[20px] p-5 pb-4">
                  <div className="text-xs text-[#5F6B6D] mb-1">Good Morning,</div>
                  <div className="text-lg font-bold mb-4">Ravi Kumar 👋</div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      { v: "8", l: "Visits Today", c: "#01B8AA" },
                      { v: "₹4.2L", l: "Pipeline", c: "#01B8AA" },
                      { v: "15", l: "Deals MTD", c: "#01B8AA" },
                      { v: "3", l: "Overdue", c: "#FD625E" },
                    ].map((s, i) => (
                      <div key={i} className="rounded-xl p-3 border border-[#01B8AA]/15" style={{ background: "#12282E" }}>
                        <div className="text-xl font-bold" style={{ color: s.c }}>{s.v}</div>
                        <div className="text-[10px] text-[#5F6B6D] uppercase tracking-wider">{s.l}</div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl p-3 border border-[#01B8AA]/15" style={{ background: "#12282E" }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA3A8]">Today's Schedule</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold text-[#01B8AA]" style={{ background: "rgba(1,184,170,0.15)" }}>5 Pending</span>
                    </div>
                    {[
                      { name: "Anil Sharma", type: "Quote Presentation · Health", time: "10:30", color: "#01B8AA" },
                      { name: "Priya Patel", type: "Renewal · Motor", time: "11:45", color: "#F2C80F" },
                      { name: "Rajesh Gupta", type: "Follow-up · Life", time: "14:00", color: "#FD625E" },
                    ].map((v, i) => (
                      <div key={i} className={`flex items-center gap-2.5 py-2 ${i < 2 ? "border-b border-white/5" : ""}`}>
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: v.color }} />
                        <div className="flex-1">
                          <div className="text-[13px] font-semibold">{v.name}</div>
                          <div className="text-[10px] text-[#5F6B6D]">{v.type}</div>
                        </div>
                        <div className="text-[11px] text-[#8FA3A8]">{v.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Float cards */}
              <div className="absolute top-[60px] right-[-20px] rounded-[14px] px-[18px] py-[14px] border border-[#01B8AA]/15" style={{ background: "#12282E", boxShadow: "0 10px 40px rgba(0,0,0,0.3)", animation: "float 6s ease-in-out infinite", backdropFilter: "blur(10px)" }}>
                <div className="text-xl mb-1">🏆</div>
                <div className="text-xs font-semibold text-[#F2C80F]">Gold Badge!</div>
                <div className="text-[10px] text-[#5F6B6D]">25 Deals This Month</div>
              </div>
              <div className="absolute bottom-[100px] left-[-30px] rounded-[14px] px-[18px] py-[14px] border border-[#01B8AA]/15" style={{ background: "#12282E", boxShadow: "0 10px 40px rgba(0,0,0,0.3)", animation: "float 6s ease-in-out infinite 2s", backdropFilter: "blur(10px)" }}>
                <div className="text-xl mb-1">📍</div>
                <div className="text-xs font-semibold">Visit Logged</div>
                <div className="text-[10px] text-[#5F6B6D]">GPS Verified · 10:32 AM</div>
              </div>
              <div className="absolute bottom-[40px] right-[-10px] rounded-[14px] px-[18px] py-[14px] border border-[#01B8AA]/15" style={{ background: "#12282E", boxShadow: "0 10px 40px rgba(0,0,0,0.3)", animation: "float 6s ease-in-out infinite 4s", backdropFilter: "blur(10px)" }}>
                <div className="text-xl mb-1">📊</div>
                <div className="text-xs font-semibold text-[#01B8AA]">+12% This Week</div>
                <div className="text-[10px] text-[#5F6B6D]">Conversion Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ── */}
      <div className="py-[50px] border-y border-[#01B8AA]/15" style={{ background: "rgba(1,184,170,0.02)" }}>
        <div className="max-w-[1140px] mx-auto px-6 flex items-center justify-center gap-10 flex-wrap">
          {[
            { icon: "🇮🇳", bold: "Built for Indian", rest: " Sales Teams" },
            { icon: "🔒", bold: "Enterprise-Grade", rest: " Data Security" },
            { icon: "📱", bold: "Works Offline", rest: " — Syncs Automatically" },
            { icon: "⚡", bold: "Setup in 10 Min", rest: " — No IT Team Needed" },
          ].map((t, i) => (
            <div key={i} className="flex items-center gap-10">
              {i > 0 && <div className="w-px h-[30px] bg-[#01B8AA]/15 hidden sm:block" />}
              <div className="flex items-center gap-2.5 text-[#5F6B6D] text-sm">
                <span className="text-base w-9 h-9 rounded-lg flex items-center justify-center">{t.icon}</span>
                <span><span className="text-[#F0F4F5] font-semibold">{t.bold}</span>{t.rest}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-[100px] max-md:py-[70px]">
        <div className="max-w-[1140px] mx-auto px-6 text-center">
          <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">How It Works</span>
          <h2 className="text-[clamp(32px,5vw,44px)] font-bold leading-[1.2] mb-[18px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Up and Running in 3 Simple Steps</h2>
          <p className="text-[17px] text-[#8FA3A8] max-w-[560px] mx-auto leading-relaxed">No complex setup. No IT team required. Get your entire field force tracked in under 10 minutes.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-[60px] relative">
            <div className="hidden md:block absolute top-[56px] left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-[#01B8AA] via-[rgba(1,184,170,0.25)] to-[#01B8AA] opacity-30" />
            {[
              { n: "1", icon: "📲", title: "Invite Your Team", desc: "Add your agents and managers. They download the app and log in — that's it. Role-based access is pre-configured." },
              { n: "2", icon: "📍", title: "Agents Log Visits", desc: "Every field visit is GPS-verified and timestamped. Agents log visit purpose, notes, and next steps — even offline." },
              { n: "3", icon: "📊", title: "Managers See Everything", desc: "Real-time dashboards show who's where, what's converting, and where to focus. Branch and org-wide views included." },
            ].map((s, i) => (
              <div key={i} className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 text-center relative">
                <div className="w-14 h-14 rounded-full border-2 border-[#01B8AA] flex items-center justify-center text-xl font-bold text-[#01B8AA] mx-auto mb-6 relative z-10" style={{ background: "#12282E", boxShadow: "0 0 25px rgba(1,184,170,0.25)" }}>{s.n}</div>
                <div className="text-4xl mb-4">{s.icon}</div>
                <div className="text-lg font-bold mb-2.5">{s.title}</div>
                <div className="text-sm text-[#8FA3A8] leading-relaxed">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-[100px] max-md:py-[70px]">
        <div className="max-w-[1140px] mx-auto px-6 text-center">
          <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">Features</span>
          <h2 className="text-[clamp(32px,5vw,44px)] font-bold leading-[1.2] mb-[18px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Everything Your Field Team Needs</h2>
          <p className="text-[17px] text-[#8FA3A8] max-w-[560px] mx-auto leading-relaxed">Purpose-built for field sales teams — from daily planning to incentive tracking.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-[60px]">
            {[
              { icon: "📍", bg: "rgba(1,184,170,0.12)", title: "Know Where Your Agents Are — Live", desc: "Real-time GPS tracking with visit verification. See every agent's location on a territory map with role-based visibility — Sales Officers see their data, Managers see the branch, Admins see everything." },
              { icon: "📊", bg: "rgba(253,98,94,0.12)", title: "Spot Top Performers Instantly", desc: "Unified analytics with visit trends, completion rates, and branch-level KPIs. Trophy and medal rankings make it easy to identify who's excelling and who needs coaching." },
              { icon: "📋", bg: "rgba(242,200,15,0.12)", title: "Plan the Day in 60 Seconds", desc: "Agents set daily targets for prospects, quotes, and policies. Managers track Life & Health branch targets in real time. Works offline-first — syncs the moment connectivity returns." },
              { icon: "👥", bg: "rgba(254,150,102,0.12)", title: "Manage Prospects End-to-End", desc: "Full prospect lifecycle with industry-specific fields: Category, Deal Value, Source, Follow-up Date — with automatic location capture on every interaction." },
              { icon: "📱", bg: "rgba(138,212,235,0.12)", title: "Works Offline, Syncs Automatically", desc: "Built for areas with patchy connectivity. Agents work uninterrupted with IndexedDB-powered offline mode. Data syncs seamlessly the instant they're back online." },
              { icon: "👨‍💼", bg: "rgba(166,105,153,0.12)", title: "Role-Based Team Control", desc: "Three-tier hierarchy: Sales Officer → Branch Manager → Admin. Assign reporting managers, toggle active/inactive status, and control exactly who sees what across your organization." },
            ].map((f, i) => (
              <div
                key={i}
                className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 text-left rounded-[18px] p-8 border border-[#01B8AA]/15 relative overflow-hidden group hover:-translate-y-1 hover:border-[#01B8AA]/30"
                style={{ background: "#12282E", transition: "all 0.35s ease" }}
              >
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#01B8AA] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[22px] mb-5" style={{ background: f.bg }}>{f.icon}</div>
                <div className="text-[17px] font-bold mb-2.5">{f.title}</div>
                <div className="text-sm text-[#8FA3A8] leading-[1.65]">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── GAMIFICATION ── */}
      <section id="gamification" className="py-[100px] max-md:py-[70px] relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(242,200,15,0.06) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-[1140px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 max-w-[480px] lg:text-left text-center mx-auto lg:mx-0">
            <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">Motivation Built In</span>
            <h2 className="text-[clamp(32px,5vw,44px)] font-bold leading-[1.2] mb-[18px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Gamify Performance.<br />Watch Closures Rise.
            </h2>
            <p className="text-[17px] text-[#8FA3A8] max-w-[560px] leading-relaxed">Incentive tracking and milestone badges turn routine fieldwork into a competitive, rewarding experience. Agents see their progress, earn recognition, and stay motivated month after month.</p>
            <div className="inline-flex items-center gap-2 mt-6 px-3.5 py-2 rounded-lg text-[13px] font-medium text-[#F2C80F]" style={{ background: "rgba(242,200,15,0.08)", border: "1px solid rgba(242,200,15,0.2)" }}>
              🇮🇳 Designed for Indian field sales culture
            </div>
          </div>
          <div className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 flex justify-center gap-5 flex-wrap">
            {[
              { emoji: "🥉", name: "Bronze", req: "7 Deals / Month", borderColor: "rgba(181,149,37,0.3)", shadow: "" },
              { emoji: "🥈", name: "Silver", req: "15 Deals / Month", borderColor: "rgba(138,212,235,0.3)", shadow: "", offset: true },
              { emoji: "🏆", name: "Gold", req: "25 Deals / Month", borderColor: "rgba(242,200,15,0.4)", shadow: "0 0 30px rgba(242,200,15,0.1)" },
            ].map((b, i) => (
              <div
                key={i}
                className={`w-40 text-center rounded-[18px] py-7 px-4 border transition-transform hover:scale-105 ${b.offset ? "mt-[30px]" : ""}`}
                style={{ background: "#12282E", borderColor: b.borderColor, boxShadow: b.shadow }}
              >
                <span className="text-[44px] mb-3 block">{b.emoji}</span>
                <div className="text-base font-bold mb-1">{b.name}</div>
                <div className="text-xs text-[#5F6B6D]">{b.req}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ── */}
      <section id="use-cases" className="py-[100px] max-md:py-[70px]">
        <div className="max-w-[1140px] mx-auto px-6 text-center">
          <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">Who It's For</span>
          <h2 className="text-[clamp(32px,5vw,44px)] font-bold leading-[1.2] mb-[18px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Built for Every Role in Your Team</h2>
          <p className="text-[17px] text-[#8FA3A8] max-w-[560px] mx-auto leading-relaxed">Whether you manage 5 agents or 500 — In-Sync adapts to your role.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-[60px]">
            {[
              { emoji: "🏃", role: "Sales Officer", title: "Plan, Visit, Close", desc: "Plan your daily route, log GPS-verified visits, track your incentive progress, and earn milestone badges. Works even without internet in the field." },
              { emoji: "📋", role: "Branch Manager", title: "Coach & Optimize", desc: "See your entire branch's performance at a glance. Identify top performers, spot agents who need support, and track Life & Health targets against goals." },
              { emoji: "🏢", role: "Admin / Leadership", title: "Full Org Visibility", desc: "Organization-wide territory maps, cross-branch analytics, team management, and complete prospect pipeline visibility — all from a single dashboard." },
            ].map((c, i) => (
              <div key={i} className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 text-center rounded-[18px] py-9 px-7 border border-[#01B8AA]/15 hover:border-[#01B8AA]/30 hover:-translate-y-1" style={{ background: "#12282E", transition: "all 0.3s" }}>
                <span className="text-[40px] mb-4 block">{c.emoji}</span>
                <div className="text-[11px] uppercase tracking-[1.5px] text-[#01B8AA] font-semibold mb-2">{c.role}</div>
                <div className="text-lg font-bold mb-2.5">{c.title}</div>
                <div className="text-sm text-[#8FA3A8] leading-relaxed">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-[100px] max-md:py-[70px]" style={{ background: "rgba(1,184,170,0.02)" }}>
        <div className="max-w-[1140px] mx-auto px-6 text-center">
          <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">What Teams Say</span>
          <h2 className="text-[clamp(32px,5vw,44px)] font-bold leading-[1.2] mb-[18px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Trusted by Field Sales Teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-[60px]">
            {[
              { quote: "We reduced missed follow-ups by nearly 40% in the first month itself. My agents now plan their day properly and I can see exactly where they are.", initials: "SK", name: "Suresh Kumar", role: "Branch Manager", avatarBg: "#01B8AA" },
              { quote: "The badge system has completely changed how my team approaches targets. Everyone wants to hit Gold now. Our deal closures are up 28% since we started using In-Sync.", initials: "MP", name: "Meena Patel", role: "Regional Manager", avatarBg: "#F2C80F" },
              { quote: "Finally an app that works when there's no network! I can log visits in rural areas and everything syncs when I'm back in range. The GPS verification builds trust with my manager.", initials: "RV", name: "Rahul Verma", role: "Sales Officer", avatarBg: "#FD625E" },
            ].map((t, i) => (
              <div key={i} className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 text-left rounded-[18px] p-8 border border-[#01B8AA]/15" style={{ background: "#12282E" }}>
                <div className="text-[26px] text-[#01B8AA] opacity-40 leading-none mb-3" style={{ fontFamily: "Georgia, serif" }}>"</div>
                <div className="text-[13px] text-[#F2C80F] mb-3">★★★★★</div>
                <div className="text-[15px] text-[#8FA3A8] leading-relaxed mb-5 italic">{t.quote}</div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-[#0B1A1E]" style={{ background: t.avatarBg }}>{t.initials}</div>
                  <div>
                    <div className="text-sm font-semibold">{t.name}</div>
                    <div className="text-xs text-[#5F6B6D]">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-[100px] max-md:py-[70px]">
        <div className="max-w-[1140px] mx-auto px-6 text-center">
          <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">Pricing</span>
          <h2 className="text-[clamp(32px,5vw,44px)] font-bold leading-[1.2] mb-[18px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Simple, Transparent Pricing</h2>
          <p className="text-[17px] text-[#8FA3A8] max-w-[560px] mx-auto leading-relaxed">One plan. All features. No hidden fees. Scale your team without worrying about per-feature upgrades.</p>
          <div className="max-w-[480px] mx-auto mt-[60px]">
            <div className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 rounded-3xl p-12 text-center relative border-2 border-[#01B8AA]" style={{ background: "#12282E", boxShadow: "0 0 60px rgba(1,184,170,0.25)" }}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-[#01B8AA] text-[#0B1A1E] text-xs font-bold uppercase tracking-[1.5px] px-6 py-1.5 rounded-full">Most Popular</div>
              <div className="text-xl font-bold mb-2 mt-2.5">Field Force Pro</div>
              <div className="text-sm text-[#8FA3A8] mb-7">Everything your team needs</div>
              <div className="flex items-baseline justify-center gap-1 mb-2">
                <span className="text-[28px] font-semibold text-[#8FA3A8]">₹</span>
                <span className="text-[64px] font-extrabold text-[#01B8AA] leading-none">99</span>
                <span className="text-base text-[#5F6B6D]">/month</span>
              </div>
              <div className="text-sm text-[#5F6B6D] mb-8">per user · billed monthly</div>
              <ul className="text-left mb-9 space-y-0">
                {[
                  "14-day free trial — no credit card required",
                  "GPS visit tracking & territory maps",
                  "Daily planning & prospect management",
                  "Analytics hub with branch performance",
                  "Incentive tracking & milestone badges",
                  "Offline-first with automatic sync",
                  "Role-based access (Officer → Manager → Admin)",
                  "Unlimited team members",
                ].map((f, i) => (
                  <li key={i} className="flex items-center gap-3 py-2.5 text-[15px] text-[#8FA3A8] border-b border-white/[0.04] last:border-none">
                    <span className="text-[#01B8AA] text-base font-bold">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <button onClick={goAuth} className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-[15px] font-semibold bg-[#01B8AA] text-[#0B1A1E] border-none cursor-pointer transition-all hover:-translate-y-0.5" style={{ boxShadow: "0 0 30px rgba(1,184,170,0.25), 0 4px 15px rgba(0,0,0,0.3)" }}>
                Start 14-Day Free Trial →
              </button>
              <div className="text-[13px] text-[#5F6B6D] mt-4">No credit card required · Cancel anytime</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-[100px] max-md:py-[70px]">
        <div className="max-w-[1140px] mx-auto px-6 text-center">
          <span className="text-[13px] font-semibold tracking-[2.5px] uppercase text-[#01B8AA] mb-4 inline-block">FAQ</span>
          <h2 className="text-[clamp(32px,5vw,44px)] font-bold leading-[1.2] mb-[18px]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Common Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-[60px] text-left">
            {[
              { q: "Does it work without internet?", a: "Yes. In-Sync uses offline-first architecture with IndexedDB. Agents can log visits, update prospects, and plan their day without any network. Everything syncs automatically the moment connectivity is restored." },
              { q: "Can I track agents across multiple branches?", a: "Absolutely. Admins get org-wide visibility across all branches on a single territory map. Branch Managers see their branch, and Sales Officers see their own data — all role-based and automatic." },
              { q: "Is my data secure?", a: "Enterprise-grade security with encrypted data storage and HTTPS-only connections. Your prospect data and visit logs are fully protected with role-based access controls at every level." },
              { q: "How long does setup take?", a: "Under 10 minutes. Create your account, invite team members via email, and they download the app and log in. No IT team needed, no complex configuration. Start tracking visits the same day." },
              { q: "What industry categories are supported?", a: "Categories are fully configurable to match your industry — whether it's FMCG, pharma, real estate, or any other vertical. Every prospect and visit can be tagged with the relevant category for accurate pipeline tracking and analytics." },
              { q: "Can agents fake their GPS location?", a: "GPS verification is built into every visit log. The system captures the precise coordinates and timestamp when a visit is logged, creating a verifiable record that builds trust between agents and managers." },
            ].map((f, i) => (
              <div key={i} className="anim-scroll opacity-0 translate-y-6 transition-all duration-700 rounded-[14px] p-7 border border-[#01B8AA]/15 hover:border-[#01B8AA]/30 cursor-default" style={{ background: "#12282E", transition: "all 0.3s" }}>
                <div className="text-[15px] font-semibold mb-2 flex items-start gap-2.5">
                  <span className="text-[#01B8AA] text-base flex-shrink-0 mt-0.5">→</span>
                  {f.q}
                </div>
                <div className="text-sm text-[#8FA3A8] leading-[1.65] pl-[26px]">{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="pt-[100px] pb-[60px] text-center relative">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 80%, rgba(1,184,170,0.1) 0%, transparent 60%)" }} />
        <div className="relative z-10 max-w-[1140px] mx-auto px-6">
          <h2 className="text-[clamp(30px,4.5vw,46px)] font-bold mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Ready to See Every Visit,<br /><span className="text-[#01B8AA]">Close More Deals?</span>
          </h2>
          <p className="text-[17px] text-[#8FA3A8] mb-9 max-w-[500px] mx-auto">Join field teams who've already transformed their field operations. Start your free trial today — no credit card needed.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button onClick={goAuth} className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-[15px] font-semibold bg-[#01B8AA] text-[#0B1A1E] border-none cursor-pointer transition-all hover:-translate-y-0.5" style={{ boxShadow: "0 0 30px rgba(1,184,170,0.25), 0 4px 15px rgba(0,0,0,0.3)" }}>
              Start 14-Day Free Trial →
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t border-[#01B8AA]/15">
        <div className="max-w-[1140px] mx-auto px-6 flex items-center justify-between flex-wrap gap-5">
          <div className="text-[13px] text-[#5F6B6D]">© 2025 In-Sync Field Force by ECR Technical Innovations Pvt. Ltd.</div>
          <div className="flex gap-6">
            <a href="#" className="text-[13px] text-[#5F6B6D] hover:text-[#F0F4F5] transition-colors no-underline">Privacy Policy</a>
            <a href="#" className="text-[13px] text-[#5F6B6D] hover:text-[#F0F4F5] transition-colors no-underline">Terms of Service</a>
            <a href="#" className="text-[13px] text-[#5F6B6D] hover:text-[#F0F4F5] transition-colors no-underline">Contact</a>
          </div>
        </div>
      </footer>

      {/* Float animation keyframe */}
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
