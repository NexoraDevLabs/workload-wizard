import { CheckCircle, TrendingUp, Users2, Clock } from 'lucide-react';

export default function Benefits() {
  const keyPoints = [
    'Real-time workload visibility across all departments',
    'Automated compliance with union agreements and regulations',
    'Seamless integration with existing university systems',
    'Mobile-first design for access anywhere, anytime',
    'Comprehensive audit trails for all workload decisions',
    'Customisable reporting for different stakeholder needs',
  ];

  return (
    <section className="py-24 bg-muted/30">
      <div className="container mx-auto px-6">
        {/* Stats Grid 
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <benefit.icon className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-[#365BD0] mb-2">{benefit.stat}</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>*/}

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Why universities choose
              <span className="text-[#365BD0]"> WorkloadWizard</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Built by academics, for academics. We understand the unique
              challenges of university workload management and have created the
              most comprehensive solution available.
            </p>
            <div className="space-y-4">
              {keyPoints.map((point, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-[#365BD0] mt-1 flex-shrink-0" />
                  <span className="text-foreground">{point}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            {/*<div className="aspect-square rounded-2xl bg-gradient-primary p-1">
              <div className="w-full h-full rounded-2xl bg-background/95 backdrop-blur-sm p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-[#365BD0] mb-4">500+</div>
                  <div className="text-xl text-foreground font-semibold mb-2">Universities</div>
                  <div className="text-muted-foreground">Trust WorkloadWizard</div>
                </div>
              </div>
            </div>*/}
            {/* Floating elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-secondary/20 rounded-full blur-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
