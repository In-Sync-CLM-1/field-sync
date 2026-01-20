import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, MapPin, BarChart3, Users, Target, Shield, Zap } from "lucide-react";
import insyncLogo from "@/assets/insync-logo-color.png";

const Landing = () => {
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #e9e4ff 0%, #ffffff 40%, #e8ffd4 100%)' }}>
      {/* Dot grid pattern */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #8B5CF6 1.5px, transparent 1.5px)',
          backgroundSize: '48px 48px'
        }} 
      />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <img src={insyncLogo} alt="In-Sync" className="h-12 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-[#7C3AED]">In-Sync <span className="text-[#1a1a2e]">Field Force</span></span>
            <span className="text-xs font-bold text-[#F97316] uppercase tracking-wider">Insurance Sales Platform</span>
          </div>
        </div>
        <Link to="/auth">
          <Button variant="outline" className="rounded-full border-2 border-[#1a1a2e] text-[#1a1a2e] hover:bg-[#1a1a2e] hover:text-white font-semibold px-6 transition-all">
            Sign In <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 md:px-12 pt-12 md:pt-20 pb-20 text-center max-w-5xl mx-auto">
        {/* Trust badge */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#f5f0ff] border-2 border-[#c4b5fd] mb-10">
          <Sparkles className="h-4 w-4 text-[#7C3AED]" />
          <span className="text-sm font-semibold text-[#7C3AED]">Trusted by 50+ Insurance Teams</span>
          <Sparkles className="h-4 w-4 text-[#7C3AED]" />
        </div>

        {/* Main headline */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
          <span className="text-[#1a1a2e]">Track Your </span>
          <span className="text-[#7C3AED]">Field Team</span>
          <br />
          <span className="text-[#1a1a2e] relative inline-block">
            Like Never Before
            <svg className="absolute -bottom-1 md:-bottom-2 left-0 w-full" viewBox="0 0 300 10" fill="none">
              <path d="M2 7 Q75 2, 150 7 T298 7" stroke="#84cc16" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-base md:text-xl text-[#4a4a5a] mb-10 max-w-2xl leading-relaxed">
          GPS-verified visits, real-time dashboards, and gamified performance tracking.{" "}
          <span className="text-[#7C3AED] font-bold">Built for insurance sales teams.</span>
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link to="/auth">
            <Button size="lg" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold px-8 py-6 text-lg rounded-xl shadow-lg shadow-[#7C3AED]/40 transition-all hover:scale-105 hover:shadow-xl">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="border-2 border-[#84cc16] text-[#4d7c0f] hover:bg-[#84cc16] hover:text-white font-bold px-8 py-6 text-lg rounded-xl transition-all hover:scale-105">
            Watch Demo
          </Button>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-4xl mb-16">
          {[
            { icon: MapPin, label: "GPS Tracking", color: "#7C3AED", bg: "#f3e8ff" },
            { icon: BarChart3, label: "Real-time Analytics", color: "#16a34a", bg: "#dcfce7" },
            { icon: Users, label: "Team Management", color: "#db2777", bg: "#fce7f3" },
            { icon: Target, label: "Goal Tracking", color: "#0891b2", bg: "#cffafe" },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 p-5 md:p-6 rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-white shadow-lg hover:shadow-xl transition-all hover:scale-105 hover:-translate-y-1"
            >
              <div className="p-3 rounded-xl" style={{ backgroundColor: feature.bg }}>
                <feature.icon className="h-6 w-6" style={{ color: feature.color }} />
              </div>
              <span className="font-bold text-[#1a1a2e] text-sm md:text-base">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-3 gap-6 md:gap-12 w-full max-w-3xl mb-16">
          {[
            { value: "10K+", label: "Visits Tracked" },
            { value: "98%", label: "Accuracy Rate" },
            { value: "2x", label: "Productivity Boost" },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl md:text-5xl font-black text-[#7C3AED] mb-1">{stat.value}</div>
              <div className="text-xs md:text-sm text-[#4a4a5a] font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#16a34a]" />
            <span className="text-sm font-semibold text-[#4a4a5a]">Enterprise Security</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[#7C3AED]" />
            <span className="text-sm font-semibold text-[#4a4a5a]">Instant Setup</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-[#6b6b7b] text-sm font-medium">
        © 2024 In-Sync Field Force. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
