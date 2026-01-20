import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Target, Users, TrendingUp, BarChart3, Shield, Wifi, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import insyncLogo from '@/assets/insync-logo-color.png';

const Landing = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const problems = [
    {
      icon: <MapPin className="h-5 w-5" />,
      text: "Zero visibility into who's working?"
    },
    {
      icon: <X className="h-5 w-5" />,
      text: "Agents lying about field visits?"
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      text: "Drowning in manual reports?"
    }
  ];

  const features = [
    {
      icon: <Target className="h-6 w-6" />,
      name: "Daily Planning",
      desc: "Set targets & track achievement"
    },
    {
      icon: <Users className="h-6 w-6" />,
      name: "Prospect Management",
      desc: "Lead to policy tracking"
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      name: "Visit Tracking",
      desc: "GPS-based check-in/out"
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      name: "Commission & Incentives",
      desc: "Leaderboards & badges"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      name: "Analytics & Reporting",
      desc: "Real-time dashboards"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      name: "Role-Based Access",
      desc: "Agent, Manager, Admin views"
    },
    {
      icon: <Wifi className="h-6 w-6" />,
      name: "Offline-First PWA",
      desc: "Works without internet"
    }
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Floating Orbs Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-3/4 left-1/2 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className={`relative z-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        {/* Header */}
        <header className="p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
                <img 
                  src={insyncLogo} 
                  alt="InSync" 
                  className="relative h-14 w-auto object-contain drop-shadow-lg" 
                />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">
                  In-Sync Field Force
                </h1>
                <p className="text-sm md:text-base text-primary font-medium">
                  For Insurance Sales Teams
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Grid */}
        <main className="px-6 md:px-8 pb-8">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Left Column - Problems & CTA */}
            <div className="space-y-8">
              {/* Problems Section */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    Your Challenges
                  </h2>
                  <div className="space-y-4">
                    {problems.map((problem, index) => (
                      <div 
                        key={index}
                        className={`flex items-center gap-3 transition-all duration-500 ${
                          isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
                        }`}
                        style={{ transitionDelay: `${index * 150}ms` }}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center text-destructive">
                          {problem.icon}
                        </div>
                        <p className="text-foreground font-medium">
                          {problem.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* CTA Section */}
              <Card className="bg-gradient-to-br from-primary/10 to-accent/10 backdrop-blur-sm border-primary/30">
                <CardContent className="p-6 text-center">
                  <div className="mb-4">
                    <span className="text-5xl font-bold text-primary">₹99</span>
                    <span className="text-muted-foreground ml-2">per user/month</span>
                  </div>
                  <p className="text-sm text-accent font-medium mb-6">
                    Annual: ₹999/year (Save 16%)
                  </p>
                  
                  <Button 
                    size="lg" 
                    className="w-full h-12 text-lg font-semibold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all hover:shadow-xl hover:shadow-primary/40 hover:scale-[1.02]"
                    asChild
                  >
                    <Link to="/auth">
                      Start Now
                      <Zap className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  
                  <div className="mt-6 space-y-1 text-sm text-muted-foreground">
                    <p className="font-medium text-accent">14 Days Free Trial</p>
                    <p>✓ No credit card required</p>
                    <p>✓ Setup in 5 minutes</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Features */}
            <div className="space-y-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-6">
                    Everything You Need
                  </h2>
                  
                  <div className="grid gap-4">
                    {features.map((feature, index) => (
                      <div 
                        key={index}
                        className={`group flex items-start gap-4 p-3 rounded-lg transition-all duration-300 hover:bg-accent/10 ${
                          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                        style={{ transitionDelay: `${index * 100}ms` }}
                      >
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center text-accent group-hover:bg-accent/30 transition-colors">
                          {feature.icon}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {feature.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {feature.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Trust Bar */}
                  <div className="mt-6 pt-6 border-t border-border/50">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">5 min</p>
                        <p className="text-xs text-muted-foreground">Setup Time</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-accent">100%</p>
                        <p className="text-xs text-muted-foreground">Offline Ready</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-yellow-500">⭐⭐⭐⭐⭐</p>
                        <p className="text-xs text-muted-foreground">User Rated</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-8 border-t border-border/30">
          <div className="max-w-6xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              © 2024 In-Sync Field Force • Built for Insurance Teams • support@insync.in
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;
