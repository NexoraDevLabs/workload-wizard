import { Upload, Settings, BarChart, CheckCircle, Clock } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: Upload,
      step: 1,
      title: "Import Your Data",
      description:
        "Upload staff lists, course catalogs, and existing workload data. Our smart import wizard handles multiple formats.",
      details: [
        "Excel, CSV, and XML support",
        "Automatic data validation",
        "Bulk import capabilities",
      ],
    },
    {
      icon: Settings,
      step: 2,
      title: "Configure Policies",
      description:
        "Set up your institution's specific workload policies, union agreements, and allocation rules.",
      details: [
        "Flexible rule engine",
        "Custom workload models",
        "Compliance templates",
      ],
    },
    {
      icon: BarChart,
      step: 3,
      title: "Optimise Allocation",
      description:
        "Let our AI-powered engine suggest optimal workload distributions based on your constraints and preferences.",
      details: [
        "Smart scheduling algorithms",
        "Conflict detection",
        "Load balancing",
      ],
    },
    {
      icon: CheckCircle,
      step: 4,
      title: "Monitor & Adjust",
      description:
        "Track workload in real-time, generate reports, and make adjustments as needed throughout the academic year.",
      details: ["Live dashboards", "Automated reporting", "Change tracking"],
    },
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Get started in
            <span className="text-[#365BD0]"> four simple steps</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We&apos;ll guide you through every step of the process.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Connection line for larger screens */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-12 h-px bg-gradient-to-r from-primary/50 to-transparent"></div>
              )}

              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform duration-300">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mx-auto mt-4">
                    <span className="text-sm font-bold text-[#365BD0]">
                      {step.step}
                    </span>
                  </div>
                </div>

                <div className="flex-1 pt-1">
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {step.description}
                  </p>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li
                        key={detailIndex}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[#365BD0]"></div>
                        {detail}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#365BD0]/10 text-[#365BD0] text-sm font-medium">
            <Clock className="w-4 h-4" />
            Average setup time: 3-5 days
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
