import { Star, Quote } from "lucide-react";
import { ClientLogoCarousel } from "./client-logo-carousel";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Dr. Sarah Mitchell",
      role: "Dean of Faculty",
      university: "University of Cambridge",
      content:
        "WorkloadWizard transformed how we manage faculty allocation. What used to take weeks now takes hours, and the transparency has improved staff satisfaction dramatically.",
      rating: 5,
      image: "/api/placeholder/64/64",
    },
    {
      name: "Prof. James Chen",
      role: "Head of Computer Science",
      university: "Stanford University",
      content:
        "The AI-powered optimization is incredible. It finds allocation solutions we never would have considered manually, while ensuring complete fairness.",
      rating: 5,
      image: "/api/placeholder/64/64",
    },
    {
      name: "Dr. Emma Rodriguez",
      role: "Academic Administrator",
      university: "University of Toronto",
      content:
        "Finally, a system that understands the complexities of academic workload. The compliance features alone have saved us countless audit headaches.",
      rating: 5,
      image: "/api/placeholder/64/64",
    },
    {
      name: "Prof. Michael Thompson",
      role: "Vice Provost",
      university: "Harvard University",
      content:
        "The real-time dashboards give us unprecedented visibility into our faculty workload. Decision-making has never been more data-driven.",
      rating: 5,
      image: "/api/placeholder/64/64",
    },
  ];

  const stats = [
    { number: "98%", label: "User Satisfaction" },
    { number: "500+", label: "Universities" },
    { number: "50K+", label: "Faculty Members" },
    { number: "24/7", label: "Support" },
  ];

  return (
    <section className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-subtle opacity-30"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Trusted by leading
            <span className="text-[#365BD0]"> universities worldwide</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Join hundreds of institutions that have revolutionized their
            workload management with WorkloadWizard.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-[#365BD0] mb-2">
                {stat.number}
              </div>
              <div className="text-muted-foreground font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="group">
              <div className="p-8 rounded-2xl bg-background/80 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow relative">
                <Quote className="w-8 h-8 text-primary/30 mb-4" />

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-primary text-primary"
                    />
                  ))}
                </div>

                <p className="text-muted-foreground">
                  &ldquo;WorkloadWizard has transformed how we manage our
                  academic planning.&rdquo;
                </p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {testimonial.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </div>
                    <div className="text-sm text-[#365BD0] font-medium">
                      {testimonial.university}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Universities logos placeholder */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground mb-8">
            Trusted by prestigious institutions including:
          </p>
          <ClientLogoCarousel />
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
