import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle } from 'lucide-react';

const CTA = () => {
  const benefits = [
    'No setup fees or hidden costs',
    '30-day free trial with full features',
    'White-glove onboarding included',
    'Cancel anytime, no questions asked',
  ];

  return (
    <section className="py-24 bg-gradient-hero relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-subtle opacity-20"></div>
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to transform your
            <br />
            <span className="text-white/90">workload management?</span>
          </h2>

          <p className="text-xl md:text-2xl text-white/80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Join institutions already using WorkloadWizard to create fairer,
            more efficient workload distribution.
          </p>

          {/* Benefits list */}
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-3 text-white/90"
              >
                <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              variant="ghost-light"
              size="lg"
              className="text-lg px-8 py-6 h-auto"
            >
              <Calendar className="w-5 h-5 mr-2" />
              Book a Demo
            </Button>
          </div>

          {/* Trust indicators 
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>99.9% Uptime SLA</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span>ISO 27001 Certified</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span>GDPR Compliant</span>
            </div>
          </div>*/}
        </div>
      </div>
    </section>
  );
};

export default CTA;
