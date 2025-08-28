import { Calendar, Users, BarChart3, Shield, Clock, Zap } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Smart Scheduling',
      description:
        'Intelligent workload distribution across academic terms with automated conflict detection.',
    },
    {
      icon: Users,
      title: 'Staff Management',
      description:
        'Comprehensive staff profiles with skills, availability, and workload capacity tracking.',
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description:
        'Real-time dashboards and reports to visualise workload patterns and optimise resource allocation.',
    },
    {
      icon: Shield,
      title: 'Privacy First',
      description:
        'Built with privacy by design. Your academic data stays secure and under your control.',
    },
    {
      icon: Clock,
      title: 'Time Tracking',
      description:
        'Accurate time logging with automated calculations for teaching, research, and administrative duties.',
    },
    {
      icon: Zap,
      title: 'Quick Setup',
      description:
        'Get started in minutes with our intuitive setup wizard and pre-configured templates.',
    },
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute inset-0 bg-gradient-subtle opacity-50"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Everything you need to manage
            <span className="text-[#365BD0]"> academic workload</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Powerful features designed specifically for universities and
            colleges to streamline staff allocation and workload planning.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-glow"
            >
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-4">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
