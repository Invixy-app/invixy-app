"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Zap, Shield, Globe, BarChart3, Lock, CheckCircle, Activity, TrendingUp } from "lucide-react";

const features = [
  {
    id: "feature-1",
    icon: Zap,
    title: "Instant Operations",
    description: "Built on edge infrastructure for zero-latency updates. Your financial data is synchronized instantly across all devices.",
    color: "bg-blue-500/10",
    iconColor: "text-blue-500",
    visual: "speed"
  },
  {
    id: "feature-2",
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-grade encryption for moving money and data. SOC2 compliant focused on keeping your business information private.",
    color: "bg-green-500/10",
    iconColor: "text-green-500",
    visual: "security"
  },
  {
    id: "feature-3",
    icon: Globe,
    title: "Multi-Currency Global",
    description: "Accept payments in 135+ currencies. We handle the tax calculations and exchange rates for you automatically.",
    color: "bg-purple-500/10",
    iconColor: "text-purple-500",
    visual: "global"
  },
  {
    id: "feature-4",
    icon: BarChart3,
    title: "Deep Financial Insights",
    description: "Don't just see numbers, understand them. Our analytics engine forecasts cash flow and identifies growth opportunities.",
    color: "bg-orange-500/10",
    iconColor: "text-orange-500",
    visual: "analytics"
  }
];

export function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const imagesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
    // Check if we are on mobile - verify window width
    const isMobile = globalThis.matchMedia("(max-width: 1024px)").matches;
    
    if (isMobile) return;

    const ctx = gsap.context(() => {
      // Pin the right column while scrolling through the container
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        pin: rightColRef.current,
        scrub: true,
      });

      // Animate images based on card positions
      const animateImage = (index: number) => {
        // Hide all images
        imagesRef.current.forEach((img) => {
          if (img) gsap.to(img, { opacity: 0, scale: 0.95, duration: 0.4, ease: "power2.out" });
        });
        // Show active image
        const activeImg = imagesRef.current[index];
        if (activeImg) {
          gsap.to(activeImg, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" });
        }
      };

      features.forEach((_, index) => {
        ScrollTrigger.create({
          trigger: cardsRef.current[index],
          start: "top 60%",
          end: "bottom 60%",
          onToggle: (self) => {
            if (self.isActive) {
              animateImage(index);
            }
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="platform-features" className="bg-background relative">
      <div ref={containerRef} className="container mx-auto px-4 md:px-6 flex flex-col lg:flex-row">
        
        {/* Left Column - Scrolling Cards */}
        <div className="w-full lg:w-1/2 py-12 lg:py-24 space-y-24 lg:space-y-[30vh]"> {/* Reduced spacing */}
          {features.map((feature, index) => (
            <div
              key={feature.id}
              ref={(el) => { cardsRef.current[index] = el }}
              className="flex flex-col justify-center p-4 md:p-8"
            >
              <div className={`h-14 w-14 rounded-2xl ${feature.color} flex items-center justify-center mb-6`}>
                <feature.icon className={`h-7 w-7 ${feature.iconColor}`} />
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Right Column - Sticky Visuals */}
        <div 
          ref={rightColRef} 
          className="hidden lg:flex w-1/2 h-screen sticky top-0 items-center justify-center p-12 overflow-hidden"
        >
          <div className="relative w-full aspect-video max-w-xl">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                ref={(el) => { imagesRef.current[index] = el }}
                className={`absolute inset-0 rounded-3xl border bg-card shadow-2xl overflow-hidden flex items-center justify-center ${index === 0 ? 'opacity-100' : 'opacity-0'}`}
              >
                {/* Background Decor */}
                <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-${feature.iconColor.replace('text-', '')}/10 to-transparent rounded-bl-full`} />

                {feature.visual === 'speed' && (
                    <div className="flex flex-col items-center gap-6 p-8 w-full max-w-xs">
                        <div className="relative w-48 h-24 overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-48 rounded-full border-[12px] border-muted/30 border-b-transparent border-l-transparent transform rotate-[45deg]" />
                            <div className="absolute top-0 left-0 w-full h-48 rounded-full border-[12px] border-blue-500 border-b-transparent border-r-transparent border-l-transparent transform -rotate-[45deg]" />
                        </div>
                        <div className="text-center">
                            <div className="text-4xl font-bold font-mono">24ms</div>
                            <div className="text-sm text-muted-foreground uppercase tracking-widest mt-2">Latency</div>
                        </div>
                        <div className="flex gap-2 text-xs bg-green-500/10 text-green-500 px-3 py-1 rounded-full items-center">
                            <Activity className="w-3 h-3" /> System Optimal
                        </div>
                    </div>
                )}

                {feature.visual === 'security' && (
                    <div className="w-full h-full p-8 flex flex-col items-center justify-center bg-grid-white/[0.02] bg-[size:16px_16px]">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <Lock className="w-12 h-12 text-green-500" />
                        </div>
                        <div className="bg-background border rounded-lg p-4 w-full max-w-xs shadow-sm">
                             <div className="flex items-center gap-3 mb-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">End-to-End Encryption</span>
                             </div>
                             <div className="flex items-center gap-3 mb-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">SOC2 Type II</span>
                             </div>
                             <div className="flex items-center gap-3">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span className="text-sm font-medium">Daily Backups</span>
                             </div>
                        </div>
                    </div>
                )}

                {feature.visual === 'global' && (
                     <div className="grid grid-cols-2 gap-4 w-full max-w-sm p-8">
                       {['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'].map(currency => (
                           <div key={currency} className="flex items-center justify-between bg-background border rounded-lg p-3">
                               <span className="font-mono font-bold">{currency}</span>
                               <Globe className="w-4 h-4 text-muted-foreground" />
                           </div>
                       ))}
                     </div>
                )}

                {feature.visual === 'analytics' && (
                    <div className="w-full max-w-sm p-8 flex flex-col gap-4">
                        <div className="bg-background border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-end h-24 gap-2">
                                <div className="w-full bg-orange-500/20 h-[40%] rounded-sm" />
                                <div className="w-full bg-orange-500/30 h-[60%] rounded-sm" />
                                <div className="w-full bg-orange-500/40 h-[50%] rounded-sm" />
                                <div className="w-full bg-orange-500/50 h-[80%] rounded-sm" />
                                <div className="w-full bg-orange-500 h-[70%] rounded-sm" />
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                             <div className="flex-1 bg-background border rounded-lg p-3">
                                <div className="text-xs text-muted-foreground">Revenue</div>
                                <div className="text-lg font-bold flex items-center gap-2">
                                    $24k <TrendingUp className="w-4 h-4 text-green-500" />
                                </div>
                             </div>
                             <div className="flex-1 bg-background border rounded-lg p-3">
                                <div className="text-xs text-muted-foreground">Growth</div>
                                <div className="text-lg font-bold text-green-500">+12%</div>
                             </div>
                        </div>
                    </div>
                )}

              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
