import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    title: "VP of Sales",
    company: "TechFlow Solutions",
    content: "LeadPilot has completely transformed our prospecting process. What used to take our team hours now takes minutes. We've increased our qualified leads by 300%.",
    rating: 5,
    avatar: "SC"
  },
  {
    name: "Marcus Rodriguez",
    title: "Business Development Manager",
    company: "Growth Labs",
    content: "The natural language processing is incredible. I can just type 'find me CTOs at fintech companies' and get exactly what I need. Game changer for our outreach.",
    rating: 5,
    avatar: "MR"
  },
  {
    name: "Emily Watson",
    title: "Founder",
    company: "StartupBoost",
    content: "As a small team, we needed efficient lead generation. LeadPilot gives us enterprise-level capabilities without the enterprise price tag. Highly recommended!",
    rating: 5,
    avatar: "EW"
  }
];

export const TestimonialsSection = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Trusted by Sales Teams Worldwide
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See what our customers are saying about their success with LeadPilot.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="border-0 shadow-soft hover:shadow-strong transition-all duration-300 group animate-scale-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-6 space-y-4">
                {/* Rating */}
                <div className="flex space-x-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>

                {/* Content */}
                <blockquote className="text-foreground leading-relaxed">
                  "{testimonial.content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center space-x-3 pt-4 border-t border-border">
                  <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.title} at {testimonial.company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-3 gap-8 mt-16 pt-16 border-t border-border">
          <div className="text-center animate-fade-in">
            <div className="text-4xl font-bold text-primary mb-2">500+</div>
            <div className="text-muted-foreground">Active Users</div>
          </div>
          <div className="text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="text-4xl font-bold text-primary mb-2">50k+</div>
            <div className="text-muted-foreground">Leads Generated</div>
          </div>
          <div className="text-center animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <div className="text-4xl font-bold text-primary mb-2">85%</div>
            <div className="text-muted-foreground">Response Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
};