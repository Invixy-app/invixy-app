import { Hexagon, Triangle, Circle, Square, Command } from "lucide-react";

export function TrustedBy() {
  return (
    <section className="py-20 border-y bg-background">
      <div className="container mx-auto px-4 md:px-6">
        <p className="text-center text-sm font-semibold text-muted-foreground mb-12 uppercase tracking-wide">
          Trusted by 10,000+ businesses globally
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center justify-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
          
          <div className="flex items-center justify-center gap-2 group cursor-default">
            <Hexagon className="h-8 w-8 text-primary fill-primary/20 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold tracking-tight">AcmeInc</span>
          </div>

          <div className="flex items-center justify-center gap-2 group cursor-default">
            <Triangle className="h-8 w-8 text-blue-500 fill-blue-500/20 group-hover:scale-110 transition-transform rotate-180" />
            <span className="text-xl font-bold tracking-tight font-mono">VORTEX</span>
          </div>

          <div className="flex items-center justify-center gap-2 group cursor-default">
            <Command className="h-8 w-8 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold tracking-tight">Cmd+R</span>
          </div>

          <div className="flex items-center justify-center gap-2 group cursor-default">
            <Circle className="h-8 w-8 text-green-500 fill-green-500/20 group-hover:scale-110 transition-transform" />
            <span className="text-xl font-bold tracking-tight font-serif italic">Sphere</span>
          </div>

          <div className="flex items-center justify-center gap-2 group cursor-default">
            <Square className="h-8 w-8 text-purple-500 fill-purple-500/20 group-hover:scale-110 transition-transform rotate-45" />
            <span className="text-xl font-bold tracking-tight">Blockd</span>
          </div>

        </div>
      </div>
    </section>
  );
}
