import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, BarChart3, Users, Shield, Clock, Target } from "lucide-react";
import insyncLogo from "@/assets/insync-logo-color.png";

const Landing = () => {
  const features = [
    {
      icon: MapPin,
      title: "GPS Visit Tracking",
      description: "Real-time location verification for every field visit."
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Visual dashboards showing team productivity and trends."
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Monitor your sales force with role-based access."
    },
    {
      icon: Target,
      title: "Daily Planning",
      description: "Set targets and coach your team to hit goals."
    },
    {
      icon: Clock,
      title: "Real-Time Sync",
      description: "Offline-first with seamless data synchronization."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security and audit trails."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Subtle background grid pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      
      {/* Gradient accent glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-lime-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="flex items-center justify-between px-6 md:px-12 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img src={insyncLogo} alt="In-Sync" className="h-12 md:h-16 w-auto object-contain" />
            <div className="hidden sm:flex flex-col">
              <span className="text-lg md:text-xl font-bold text-white tracking-tight">
                In-Sync <span className="text-lime-400">Field Force</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                Insurance Sales Platform
              </span>
            </div>
          </div>
          <Link to="/auth">
            <Button 
              variant="ghost" 
              className="text-slate-300 hover:text-white hover:bg-white/10 font-medium h-9"
            >
              Sign In
            </Button>
          </Link>
        </nav>

        {/* Hero Section */}
        <section className="px-6 md:px-12 py-8 md:py-12 max-w-7xl mx-auto text-center">
          <div className="max-w-4xl mx-auto space-y-5">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-lime-500/10 border border-lime-500/20 rounded-full text-lime-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />
              Built for Insurance Field Teams
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05]">
              Your Field.
              <br />
              <span className="text-lime-400">Your Control.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base md:text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
              Track field visits in real-time, monitor team performance, and close more policies.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link to="/auth">
                <Button 
                  size="lg"
                  className="bg-lime-400 hover:bg-lime-300 text-slate-950 font-bold px-8 py-6 rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_30px_rgba(163,230,53,0.5),0_0_60px_rgba(163,230,53,0.3)] hover:shadow-[0_0_50px_rgba(163,230,53,0.7),0_0_80px_rgba(163,230,53,0.4)] animate-pulse border-2 border-lime-300"
                >
                  🚀 Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="lg"
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white font-medium px-6 py-5 rounded-full"
              >
                See How It Works
              </Button>
            </div>

            {/* Trust indicator */}
            <p className="text-xs text-slate-500">
              No credit card required • Setup in 5 minutes • Cancel anytime
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-6 md:px-12 py-8 md:py-12 max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
              Everything You Need to Manage Field Sales
            </h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              One platform to track, analyze, and optimize your entire field force.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-lime-500/30 hover:bg-slate-900/80 transition-all duration-300"
              >
                <div className="w-10 h-10 bg-lime-500/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-lime-500/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-lime-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="px-6 md:px-12 py-8 md:py-12 max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-r from-lime-500/10 to-emerald-500/10 border border-lime-500/20 rounded-2xl p-6 md:p-10 text-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-lime-500/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                Ready to Transform Your Field Sales?
              </h2>
              <p className="text-slate-400 text-sm max-w-md mx-auto mb-5">
                Join teams who've increased field productivity by up to 40%.
              </p>
              <Link to="/auth">
                <Button 
                  size="lg"
                  className="bg-lime-500 hover:bg-lime-400 text-slate-950 font-bold px-8 py-5 rounded-full transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(163,230,53,0.4)]"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 md:px-12 py-6 max-w-7xl mx-auto border-t border-slate-800">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <img src={insyncLogo} alt="In-Sync" className="h-6 w-auto object-contain" />
              <span className="text-slate-400 text-xs">
                © {new Date().getFullYear()} In-Sync Field Force
              </span>
            </div>
            <div className="flex items-center gap-5 text-xs text-slate-500">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
              <a href="#" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
