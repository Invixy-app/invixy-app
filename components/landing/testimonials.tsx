import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Freelance Designer",
    company: "Design Studio",
    avatar: "SC",
    content: "Invixy has completely transformed how I handle my finances. I used to spend hours on invoices, now it takes minutes. The automated reminders are a lifesaver.",
    rating: 5
  },
  {
    name: "Marcus Rodriguez",
    role: "Founder",
    company: "TechStart Inc",
    avatar: "MR",
    content: "The best invoicing platform for small businesses. It scales with you. We started on the free plan and upgraded as we grew. The API support is fantastic.",
    rating: 5
  },
  {
    name: "Emily Watson",
    role: "Operations Manager",
    company: "Global Logistics",
    avatar: "EW",
    content: "Security and compliance were our top concerns. Invixy checked all the boxes. The multi-currency support works flawlessly for our international clients.",
    rating: 5
  }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Loved by businesses everywhere
          </h2>
          <p className="text-lg text-muted-foreground">
            Don't just take our word for it. Here's what our customers have to say.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <Card key={i} className="bg-background border-none shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={`https://avatar.vercel.sh/${testimonial.name}`} />
                    <AvatarFallback>{testimonial.avatar}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.role}, {testimonial.company}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  "{testimonial.content}"
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
