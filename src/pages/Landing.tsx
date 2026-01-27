import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MapPin, BarChart3, Users, Target, Clock, Shield, Check, ArrowRight } from "lucide-react";
import insyncLogo from "@/assets/insync-logo-color.png";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MapPin,
      title: "GPS Visit Tracking",
      description: "Track field visits in real-time with precise GPS location logging and geofencing."
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Comprehensive dashboards and reports to measure and improve team performance."
    },
    {
      icon: Users,
      title: "Team Management",
      description: "Efficiently manage your field team with role-based access and hierarchy controls."
    },
    {
      icon: Target,
      title: "Daily Planning",
      description: "Set daily targets, plan visits, and track progress towards your goals."
    },
    {
      icon: Clock,
      title: "Real-Time Sync",
      description: "Instant data synchronization across all devices, even in low connectivity areas."
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with encrypted data and 99.9% uptime guarantee."
    }
  ];

  const pricingBenefits = [
    "14-day free trial",
    "All features included",
    "Unlimited team members",
    "Cancel anytime"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(1, 184, 170, 0.5) 1px, transparent 1px),
                             linear-gradient(90deg, rgba(1, 184, 170, 0.5) 1px, transparent 1px)`,
            backgroundSize: '80px 80px'
          }}
        />
        
        {/* Floating gradient orbs */}
        {/* Primary teal glow - top center */}
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#01B8AA]/20 rounded-full blur-[150px] animate-pulse" />
        
        {/* Light blue orb - top right */}
        <div 
          className="absolute top-[100px] right-[-100px] w-[400px] h-[400px] bg-[#8AD4EB]/15 rounded-full blur-[120px]"
          style={{ animation: 'float 8s ease-in-out infinite' }}
        />
        
        {/* Purple orb - left side */}
        <div 
          className="absolute top-[400px] left-[-150px] w-[350px] h-[350px] bg-[#A66999]/10 rounded-full blur-[100px]"
          style={{ animation: 'float 10s ease-in-out infinite reverse' }}
        />
        
        {/* Gold accent - bottom right */}
        <div 
          className="absolute bottom-[200px] right-[10%] w-[300px] h-[300px] bg-[#F2C80F]/8 rounded-full blur-[100px]"
          style={{ animation: 'float 12s ease-in-out infinite' }}
        />
        
        {/* Teal accent - bottom left */}
        <div 
          className="absolute bottom-[-100px] left-[20%] w-[400px] h-[400px] bg-[#01B8AA]/10 rounded-full blur-[130px]"
          style={{ animation: 'float 9s ease-in-out infinite reverse' }}
        />
        
        {/* Small accent orbs for depth */}
        <div className="absolute top-[60%] right-[30%] w-[150px] h-[150px] bg-[#4AC5BB]/10 rounded-full blur-[60px]" />
        <div className="absolute top-[30%] left-[15%] w-[100px] h-[100px] bg-[#8AD4EB]/8 rounded-full blur-[50px]" />
        
        {/* Subtle noise texture overlay */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
          }}
        />
        
        {/* Teal glow at top */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#01B8AA]/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="px-6 md:px-12 py-6 flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img 
              src={insyncLogo} 
              alt="In-Sync Field Force" 
              className="h-14 md:h-20 w-auto"
            />
            <div className="hidden sm:block">
              <span className="text-xl md:text-2xl font-bold text-white">In-Sync</span>
              <span className="text-xl md:text-2xl font-bold text-[#01B8AA]"> Field Force</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            onClick={() => navigate("/auth")}
            className="text-slate-300 hover:text-white hover:bg-slate-800/50"
          >
            Sign In
          </Button>
        </nav>

        {/* Hero Section */}
        <section className="px-6 md:px-12 py-16 md:py-24 max-w-7xl mx-auto text-center">
          {/* Trial Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#01B8AA]/10 border border-[#01B8AA]/30 mb-8">
            <span className="w-2 h-2 rounded-full bg-[#01B8AA] animate-pulse" />
            <span className="text-[#01B8AA] font-medium text-sm">14-Day Free Trial</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6">
            Your Field.{" "}
            <span className="text-[#01B8AA]">Your Control.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            Track visits, boost performance, close more policies with real-time field sales management built for insurance teams.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Button 
              onClick={() => navigate("/auth")}
              className="bg-[#01B8AA] hover:bg-[#00a89b] text-slate-950 font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-[#01B8AA]/25 hover:shadow-[#01B8AA]/40 transition-all"
            >
              Start 14-Day Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="border-slate-700 text-slate-300 hover:bg-slate-800/50 hover:text-white px-8 py-6 text-lg rounded-xl"
            >
              See How It Works
            </Button>
          </div>

          {/* Trust Text */}
          <p className="text-sm text-slate-500">
            ₹99/user/month after trial · No credit card required
          </p>
        </section>

        {/* Features Section */}
        <section id="features" className="px-6 md:px-12 py-16 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-[#01B8AA]/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-[#01B8AA]/10 flex items-center justify-center mb-4 group-hover:bg-[#01B8AA]/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-[#01B8AA]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Section */}
        <section className="px-6 md:px-12 py-16 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-slate-400">
              One plan, all features, no hidden fees
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900 to-slate-900/50 border border-[#01B8AA]/30 shadow-xl shadow-[#01B8AA]/5">
              {/* Price */}
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl md:text-6xl font-black text-[#01B8AA]">₹99</span>
                  <span className="text-slate-400 text-lg">/user/month</span>
                </div>
              </div>

              {/* Benefits */}
              <ul className="space-y-4 mb-8">
                {pricingBenefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#01B8AA]/20 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-[#01B8AA]" />
                    </div>
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button 
                onClick={() => navigate("/auth")}
                className="w-full bg-[#01B8AA] hover:bg-[#00a89b] text-slate-950 font-semibold py-6 text-lg rounded-xl shadow-lg shadow-[#01B8AA]/25 hover:shadow-[#01B8AA]/40 transition-all"
              >
                Start 14-Day Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 md:px-12 py-8 border-t border-slate-800">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img 
                src={insyncLogo} 
                alt="In-Sync Field Force" 
                className="h-8 w-auto"
              />
              <span className="text-slate-400 text-sm">
                © 2025 In-Sync Field Force
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-slate-300 transition-colors">Contact</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
