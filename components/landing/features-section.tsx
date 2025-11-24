"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Zap, Shield, Globe, BarChart3 } from "lucide-react";

const features = [
  {
    id: "feature-1",
    icon: Zap,
    title: "Lightning Fast",
    description: "Built on modern infrastructure for instant page loads and real-time updates. Experience zero latency operations that keep your business moving at the speed of thought.",
    color: "bg-blue-500/10",
    iconColor: "text-blue-500"
  },
  {
    id: "feature-2",
    icon: Shield,
    title: "Bank-Grade Security",
    description: "Your data is encrypted at rest and in transit. We take security seriously with SOC2 compliance, regular audits, and automated threat detection systems.",
    color: "bg-green-500/10",
    iconColor: "text-green-500"
  },
  {
    id: "feature-3",
    icon: Globe,
    title: "Global Ready",
    description: "Support for multiple currencies, languages, and tax regulations worldwide. Expand your business across borders without worrying about compliance or conversion.",
    color: "bg-purple-500/10",
    iconColor: "text-purple-500"
  },
  {
    id: "feature-4",
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Gain insights into your revenue, expenses, and cash flow with detailed reports. Make data-driven decisions with our comprehensive dashboard and forecasting tools.",
    color: "bg-orange-500/10",
    iconColor: "text-orange-500"
  }
];

export function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rightColRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const imagesRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    
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
      features.forEach((_, index) => {
        ScrollTrigger.create({
          trigger: cardsRef.current[index],
          start: "top center",
          end: "bottom center",
          onToggle: (self) => {
            if (self.isActive) {
              // Hide all images
              imagesRef.current.forEach((img) => {
                if (img) gsap.to(img, { opacity: 0, scale: 0.95, duration: 0.3 });
              });
              // Show active image
              const activeImg = imagesRef.current[index];
              if (activeImg) {
                gsap.to(activeImg, { opacity: 1, scale: 1, duration: 0.3 });
              }
            }
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" className="bg-background relative">
      <div ref={containerRef} className="container mx-auto px-4 md:px-6 flex flex-col lg:flex-row">
        
        {/* Left Column - Scrolling Cards */}
        <div className="w-full lg:w-1/2 py-24 space-y-[50vh]">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              ref={(el) => { cardsRef.current[index] = el }}
              className="min-h-[50vh] flex flex-col justify-center p-8"
            >
              <div className={`h-16 w-16 rounded-2xl ${feature.color} flex items-center justify-center mb-8`}>
                <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
              </div>
              <h3 className="text-4xl font-bold mb-6 tracking-tight">{feature.title}</h3>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Right Column - Sticky Images */}
        <div 
          ref={rightColRef} 
          className="hidden lg:flex w-1/2 h-screen sticky top-0 items-center justify-center p-12"
        >
          <div className="relative w-full aspect-square max-w-xl">
            {features.map((feature, index) => (
              <div
                key={feature.id}
                ref={(el) => { imagesRef.current[index] = el }}
                className={`absolute inset-0 rounded-3xl border bg-card shadow-2xl overflow-hidden flex items-center justify-center ${index === 0 ? 'opacity-100' : 'opacity-0'}`}
              >
                {/* Abstract Background Pattern */}
                <div className={`absolute inset-0 opacity-20 ${feature.color}`} />
                
                {/* Content Representation */}
                <div className="relative z-10 text-center p-8">
                  <feature.icon className={`w-32 h-32 mx-auto mb-8 ${feature.iconColor} opacity-80`} />
                  <div className="h-4 w-32 bg-muted rounded-full mx-auto mb-4" />
                  <div className="h-4 w-48 bg-muted rounded-full mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
