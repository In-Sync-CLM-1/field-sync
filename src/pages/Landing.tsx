import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Target, Users, TrendingUp, BarChart3, Shield, Wifi, Zap, X, ChevronRight, Sparkles, Trophy, Rocket, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import insyncLogo from '@/assets/insync-logo-color.png';

const Landing = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const problems = [
    { icon: <MapPin className="h-5 w-5" />, text: "Zero visibility into who's working?" },
    { icon: <X className="h-5 w-5" />, text: "Agents lying about field visits?" },
    { icon: <BarChart3 className="h-5 w-5" />, text: "Drowning in manual reports?" }
  ];

  const features = [
    { icon: <Target className="h-6 w-6" />, name: "Daily Planning", desc: "Set targets & track achievement", color: "primary" },
    { icon: <Users className="h-6 w-6" />, name: "Prospect Management", desc: "Lead to policy tracking", color: "accent" },
    { icon: <MapPin className="h-6 w-6" />, name: "Visit Tracking", desc: "GPS-based check-in/out", color: "neon-pink" },
    { icon: <TrendingUp className="h-6 w-6" />, name: "Commissions", desc: "Leaderboards & badges", color: "neon-cyan" },
    { icon: <BarChart3 className="h-6 w-6" />, name: "Analytics", desc: "Real-time dashboards", color: "primary" },
    { icon: <Shield className="h-6 w-6" />, name: "Role-Based", desc: "Agent, Manager, Admin", color: "accent" },
    { icon: <Wifi className="h-6 w-6" />, name: "Offline-First", desc: "Works without internet", color: "neon-pink" }
  ];

  const stats = [
    { value: "50+", label: "Active Teams", icon: <Users className="h-4 w-4" /> },
    { value: "10K+", label: "Visits Tracked", icon: <MapPin className="h-4 w-4" /> },
    { value: "99.9%", label: "Uptime", icon: <Zap className="h-4 w-4" /> },
    { value: "5 min", label: "Setup Time", icon: <Rocket className="h-4 w-4" /> }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Large gradient orbs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-primary/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-accent/25 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-40 left-1/3 w-[400px] h-[400px] bg-[hsl(var(--neon-pink))]/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-[hsl(var(--neon-cyan))]/15 rounded-full blur-[60px] animate-pulse" style={{ animationDelay: '0.5s' }} />
        
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary/40 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      <div className={`relative z-10 transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
        {/* Header */}
        <header className="px-4 py-6 md:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/40 blur-xl rounded-full transition-all group-hover:bg-primary/60" />
                <img src={insyncLogo} alt="InSync" className="relative h-12 md:h-14 w-auto object-contain drop-shadow-lg" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
                  In-Sync <span className="text-primary">Field Force</span>
                </h1>
                <p className="text-xs md:text-sm text-accent font-semibold tracking-wide uppercase">
                  Insurance Sales Platform
                </p>
              </div>
            </div>
            
            <Button variant="outline" className="hidden md:flex border-primary/50 hover:bg-primary/10 hover:border-primary" asChild>
              <Link to="/auth">
                Sign In <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Hero Section */}
        <section className="px-4 md:px-8 pt-8 pb-16 md:pt-16 md:pb-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-4xl mx-auto mb-12 md:mb-16">
              {/* Badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-6 transition-all duration-700 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <Sparkles className="h-4 w-4 text-accent animate-pulse" />
                <span className="text-sm font-medium text-primary">Trusted by 50+ Insurance Teams</span>
                <Trophy className="h-4 w-4 text-accent" />
              </div>
              
              {/* Headline */}
              <h2 className={`text-3xl md:text-5xl lg:text-6xl font-bold mb-6 transition-all duration-700 delay-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <span className="text-foreground">Track Your </span>
                <span className="relative">
                  <span className="text-primary neon-text">Field Team</span>
                  <svg className="absolute -bottom-2 left-0 w-full h-3 text-accent/60" viewBox="0 0 200 12" fill="none">
                    <path d="M2 10C50 4 100 4 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
                <br />
                <span className="text-foreground">Like Never Before</span>
              </h2>
              
              {/* Subheadline */}
              <p className={`text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 transition-all duration-700 delay-200 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                GPS-verified visits, real-time dashboards, and gamified performance tracking. 
                <span className="text-accent font-semibold"> Built for insurance sales teams.</span>
              </p>

              {/* CTA Buttons */}
              <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <Button size="lg" className="h-14 px-8 text-lg font-bold bg-primary hover:bg-primary/90 glow-primary transition-all hover:scale-105 group" asChild>
                  <Link to="/auth">
                    Start Free Trial
                    <Rocket className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold border-accent/50 text-accent hover:bg-accent/10 hover:border-accent" asChild>
                  <Link to="/auth">
                    Watch Demo
                    <Zap className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>

              {/* Trust indicators */}
              <div className={`flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground transition-all duration-700 delay-400 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <span className="flex items-center gap-1"><Check className="h-4 w-4 text-accent" /> No credit card</span>
                <span className="flex items-center gap-1"><Check className="h-4 w-4 text-accent" /> 14 days free</span>
                <span className="flex items-center gap-1"><Check className="h-4 w-4 text-accent" /> 5 min setup</span>
              </div>
            </div>

            {/* Stats Bar */}
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-16 transition-all duration-700 delay-500 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="relative group p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all hover:scale-105"
                >
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary/30 transition-colors">
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problems Section */}
        <section className="px-4 md:px-8 py-16 bg-card/30 backdrop-blur-sm border-y border-border/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Sound <span className="text-destructive">Familiar</span>?
              </h3>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {problems.map((problem, index) => (
                <div
                  key={index}
                  className={`group p-6 rounded-xl bg-destructive/5 border border-destructive/20 hover:border-destructive/40 hover:bg-destructive/10 transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                  style={{ transitionDelay: `${600 + index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center text-destructive mb-4 group-hover:scale-110 transition-transform">
                    {problem.icon}
                  </div>
                  <p className="text-lg font-semibold text-foreground">{problem.text}</p>
                </div>
              ))}
            </div>

            <div className="text-center mt-12">
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-accent/10 border border-accent/30">
                <Sparkles className="h-5 w-5 text-accent" />
                <span className="text-lg font-semibold text-accent">We solve all of this!</span>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 md:px-8 py-16 md:py-24">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                <span className="text-primary">Power-Packed</span> Features
              </h3>
              <p className="text-muted-foreground">Everything you need to manage your field sales team</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`group relative p-5 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                  style={{ transitionDelay: `${800 + index * 50}ms` }}
                >
                  <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-all group-hover:scale-110 ${
                      feature.color === 'primary' ? 'bg-primary/20 text-primary' :
                      feature.color === 'accent' ? 'bg-accent/20 text-accent' :
                      feature.color === 'neon-pink' ? 'bg-[hsl(var(--neon-pink))]/20 text-[hsl(var(--neon-pink))]' :
                      'bg-[hsl(var(--neon-cyan))]/20 text-[hsl(var(--neon-cyan))]'
                    }`}>
                      {feature.icon}
                    </div>
                    <h4 className="font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{feature.name}</h4>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="px-4 md:px-8 py-16 md:py-24 bg-card/30 backdrop-blur-sm border-y border-border/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Simple, <span className="text-accent">Transparent</span> Pricing
              </h3>
            </div>

            <div className="max-w-md mx-auto">
              <div className="relative group">
                {/* Glow effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                
                <div className="relative p-8 rounded-2xl bg-card border border-primary/30">
                  {/* Popular badge */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 rounded-full bg-accent text-accent-foreground text-sm font-bold">
                      MOST POPULAR
                    </div>
                  </div>

                  <div className="text-center pt-4">
                    <p className="text-muted-foreground mb-2">Per user, per month</p>
                    <div className="flex items-baseline justify-center gap-1 mb-2">
                      <span className="text-5xl md:text-6xl font-bold text-primary">₹99</span>
                    </div>
                    <p className="text-accent font-semibold mb-6">
                      Annual: ₹999/year <span className="text-xs bg-accent/20 px-2 py-0.5 rounded-full ml-1">Save 16%</span>
                    </p>

                    <div className="space-y-3 mb-8 text-left">
                      {['Unlimited visits & prospects', 'GPS verification', 'Real-time dashboards', 'Team leaderboards', 'Offline mode', 'Priority support'].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                            <Check className="h-3 w-3 text-accent" />
                          </div>
                          <span className="text-foreground">{item}</span>
                        </div>
                      ))}
                    </div>

                    <Button size="lg" className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 glow-primary transition-all hover:scale-[1.02]" asChild>
                      <Link to="/auth">
                        Start 14-Day Free Trial
                        <Zap className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                    
                    <p className="mt-4 text-sm text-muted-foreground">No credit card required</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 md:px-8 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
              Ready to <span className="text-primary neon-text">Transform</span> Your Sales Team?
            </h3>
            <p className="text-lg text-muted-foreground mb-8">
              Join 50+ insurance teams already using In-Sync Field Force
            </p>
            <Button size="lg" className="h-14 px-10 text-lg font-bold bg-primary hover:bg-primary/90 glow-primary transition-all hover:scale-105" asChild>
              <Link to="/auth">
                Get Started Now
                <ChevronRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-4 md:px-8 py-8 border-t border-border/30">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src={insyncLogo} alt="InSync" className="h-8 w-auto object-contain" />
              <span className="text-sm text-muted-foreground">© 2024 In-Sync Field Force</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ for Insurance Teams • support@insync.in
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
