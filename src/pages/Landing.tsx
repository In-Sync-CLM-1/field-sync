import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, MapPin, BarChart3, Users, Target, Shield, Zap, Play, CheckCircle } from "lucide-react";
import insyncLogo from "@/assets/insync-logo-color.png";

const Landing = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500">
      {/* Animated floating orbs */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-lime-400/30 rounded-full blur-2xl animate-[orb-float_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-40 right-32 w-48 h-48 bg-cyan-400/20 rounded-full blur-3xl animate-[orb-float_8s_ease-in-out_infinite]" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 right-1/3 w-24 h-24 bg-yellow-400/25 rounded-full blur-2xl animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute top-2/3 left-1/4 w-40 h-40 bg-pink-400/20 rounded-full blur-3xl animate-[orb-float_10s_ease-in-out_infinite]" style={{ animationDelay: '4s' }} />
      
      {/* Vibrant accent shapes */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-bl from-lime-400 via-emerald-400/70 to-transparent opacity-80" />
      <div className="absolute bottom-0 left-0 w-2/3 h-1/2 bg-gradient-to-tr from-cyan-400/50 to-transparent" />
      <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-yellow-400/30 rounded-full blur-3xl animate-[glow-pulse_4s_ease-in-out_infinite]" />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 py-6 max-w-7xl mx-auto animate-fade-in">
        <div className="flex items-center gap-3">
          <img src={insyncLogo} alt="In-Sync" className="h-12 w-auto object-contain" />
          <div className="flex flex-col">
            <span className="text-xl font-bold text-white">In-Sync <span className="text-lime-300">Field Force</span></span>
            <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider">Insurance Sales Platform</span>
          </div>
        </div>
        <Link to="/auth">
          <Button variant="outline" className="rounded-full border-2 border-white text-white hover:bg-white hover:text-purple-600 font-semibold px-6 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.5)]">
            Sign In <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 md:px-12 pt-12 md:pt-20 pb-20 text-center max-w-5xl mx-auto">
        {/* Trust badge with shimmer */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-md border-2 border-lime-400/40 mb-10 animate-fade-in hover:bg-white/30 transition-all cursor-default group">
          <Sparkles className="h-4 w-4 text-lime-300 animate-[glow-pulse_2s_ease-in-out_infinite]" />
          <span className="text-sm font-semibold text-white">Helping 50+ teams close 2x more policies</span>
          <Sparkles className="h-4 w-4 text-lime-300 animate-[glow-pulse_2s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Main headline with gradient text */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">
          <span className="text-white animate-fade-in inline-block">Know Exactly Where Your Team Is</span>
          <br />
          <span 
            className="bg-gradient-to-r from-lime-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent animate-fade-in inline-block"
            style={{ animationDelay: '0.2s' }}
          >
            — And What They're Closing
          </span>
        </h1>

        {/* Subheadline - outcome focused */}
        <p 
          className="text-base md:text-xl text-white/90 mb-10 max-w-2xl leading-relaxed animate-fade-in"
          style={{ animationDelay: '0.4s' }}
        >
          Finally know which visits lead to sales, which reps need coaching, and where your team really is —{" "}
          <span className="text-lime-300 font-bold">all in real-time.</span>
        </p>

        {/* CTA Buttons with glow effects */}
        <div 
          className="flex flex-col sm:flex-row gap-4 mb-16 animate-fade-in"
          style={{ animationDelay: '0.6s' }}
        >
          <Link to="/auth" className="flex flex-col items-center">
            <Button 
              size="lg" 
              className="bg-lime-400 text-purple-900 hover:bg-lime-300 font-bold px-8 py-6 text-lg rounded-xl shadow-[0_0_30px_rgba(163,230,53,0.5)] hover:shadow-[0_0_50px_rgba(163,230,53,0.7)] transition-all duration-300 hover:scale-105 animate-[fab-breathe_3s_ease-in-out_infinite] group"
            >
              Start Free — No Card Required
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline" 
            className="border-2 border-lime-300/80 text-lime-300 hover:bg-lime-300/20 font-bold px-8 py-6 text-lg rounded-xl transition-all duration-300 hover:scale-105 backdrop-blur-sm hover:border-lime-300 hover:shadow-[0_0_20px_rgba(163,230,53,0.3)]"
          >
            <Play className="mr-2 h-5 w-5" />
            See It In Action
          </Button>
        </div>

        {/* Feature Grid with staggered entrance */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-4xl mb-16">
          {[
            { icon: MapPin, label: "Proof of Every Visit", color: "#7C3AED", bg: "#f3e8ff" },
            { icon: BarChart3, label: "Know What's Working", color: "#16a34a", bg: "#dcfce7" },
            { icon: Users, label: "Coach Top Performers", color: "#db2777", bg: "#fce7f3" },
            { icon: Target, label: "Hit Targets Faster", color: "#0891b2", bg: "#cffafe" },
          ].map((feature, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-3 p-5 md:p-6 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-white shadow-xl hover:shadow-[0_10px_40px_rgba(139,92,246,0.3)] transition-all duration-300 hover:scale-105 hover:-translate-y-1 animate-fade-in group cursor-default"
              style={{ animationDelay: `${0.8 + i * 0.1}s` }}
            >
              <div className="p-3 rounded-xl transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: feature.bg }}>
                <feature.icon className="h-6 w-6" style={{ color: feature.color }} />
              </div>
              <span className="font-bold text-gray-800 text-sm md:text-base">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Stats Section with gradient values */}
        <div 
          className="grid grid-cols-3 gap-6 md:gap-12 w-full max-w-3xl mb-16 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-fade-in"
          style={{ animationDelay: '1.2s' }}
        >
          {[
            { value: "10,247", label: "Visits Verified This Month" },
            { value: "98%", label: "GPS Accuracy" },
            { value: "2x", label: "More Client Meetings" },
          ].map((stat, i) => (
            <div key={i} className="text-center group cursor-default">
              <div className="text-3xl md:text-5xl font-black bg-gradient-to-r from-lime-300 via-emerald-300 to-cyan-300 bg-clip-text text-transparent mb-1 transition-transform duration-300 group-hover:scale-110">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-white/80 font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Bottom trust indicators */}
        <div 
          className="flex flex-wrap items-center justify-center gap-4 md:gap-8 animate-fade-in"
          style={{ animationDelay: '1.4s' }}
        >
          {[
            { icon: Shield, label: "Bank-Grade Security", color: "text-lime-300" },
            { icon: Zap, label: "Instant Setup", color: "text-yellow-300" },
            { icon: CheckCircle, label: "No Training Required", color: "text-cyan-300" },
          ].map((item, i) => (
            <div 
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300 cursor-default group"
            >
              <item.icon className={`h-5 w-5 ${item.color} group-hover:scale-110 transition-transform`} />
              <span className="text-sm font-semibold text-white">{item.label}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-white/70 text-sm font-medium animate-fade-in" style={{ animationDelay: '1.6s' }}>
        © 2024 In-Sync Field Force. All rights reserved.
      </footer>
    </div>
  );
};

export default Landing;
