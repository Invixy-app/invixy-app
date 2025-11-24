export function TrustedBy() {
  return (
    <section className="py-12 border-y bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <p className="text-center text-sm font-semibold text-muted-foreground mb-8 uppercase tracking-wider">
          Trusted by innovative teams worldwide
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 grayscale opacity-70">
          {/* Placeholder Logos - In a real app, use SVGs */}
          <div className="flex items-center gap-2 text-xl font-bold">
            <div className="w-6 h-6 bg-foreground rounded-full" />
            Acme Corp
          </div>
          <div className="flex items-center gap-2 text-xl font-bold">
            <div className="w-6 h-6 bg-foreground rounded-md" />
            Globex
          </div>
          <div className="flex items-center gap-2 text-xl font-bold">
            <div className="w-6 h-6 bg-foreground rounded-tr-xl" />
            Soylent
          </div>
          <div className="flex items-center gap-2 text-xl font-bold">
            <div className="w-6 h-6 bg-foreground rounded-bl-xl" />
            Initech
          </div>
          <div className="flex items-center gap-2 text-xl font-bold">
            <div className="w-6 h-6 bg-foreground rounded-full border-2 border-background" />
            Umbrella
          </div>
        </div>
      </div>
    </section>
  );
}
