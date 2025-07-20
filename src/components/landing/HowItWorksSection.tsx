import { MessageSquare, Users, Mail, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: MessageSquare,
    title: "Submit Your Query",
    description: "Simply type what you're looking for in natural language. 'Find me 50 software engineers at startups in San Francisco.'"
  },
  {
    icon: Users,
    title: "Review Generated Leads",
    description: "Get enriched lead data with names, titles, companies, and verified email addresses. Edit and filter as needed."
  },
  {
    icon: Mail,
    title: "Send Personalized Outreach",
    description: "Export as CSV or send personalized emails directly through our platform with custom templates."
  },
  {
    icon: BarChart3,
    title: "Track Your Success",
    description: "Monitor your outreach performance, response rates, and manage your lead pipeline from your dashboard."
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6 lg:px-8 max-w-7xl">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate high-quality leads in four simple steps. No technical knowledge required.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card 
              key={index} 
              className="relative border-0 shadow-soft hover:shadow-strong transition-all duration-300 group animate-scale-in"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <CardContent className="p-6 text-center space-y-4">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                    {index + 1}
                  </div>
                </div>

                {/* Icon */}
                <div className="pt-4">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 animate-fade-in">
          <p className="text-lg text-muted-foreground mb-6">
            Ready to transform your lead generation process?
          </p>
          <div className="inline-flex items-center space-x-2 text-primary font-medium">
            <span>Start generating leads today</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </section>
  );
};

import { ArrowRight } from "lucide-react";