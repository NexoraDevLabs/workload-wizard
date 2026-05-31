'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Footer from '@/components/Footer';
import DynamicHeaderIsland from '@/components/dynamic-header-island';

export const dynamic = 'force-static';

export default function TermsOfServicePage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 animated-gradient pointer-events-none" />
      <DynamicHeaderIsland />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-[0_6px_24px_rgba(0,0,0,0.25)]">
            Terms of Service
          </h1>
          <p className="text-xl text-white/85 max-w-3xl mx-auto leading-relaxed">
            Last updated: August 2025
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 px-4 relative bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-8">
            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle>Agreement to Terms</CardTitle>
                  <Badge variant="outline" className="badge-subtle">Version 1.0</Badge>
                </div>
                <CardDescription>
                  By accessing and using WorkloadWizard, you accept and agree to
                  be bound by these terms.
                </CardDescription>
              </CardHeader>
              <CardContent className="prose prose-sm max-w-none">
                <p>
                  These Terms of Service (&quot;Terms&quot;) govern your use of
                  WorkloadWizard (&quot;Service&quot;) operated by our
                  organisation (&quot;us&quot;, &quot;we&quot;, or
                  &quot;our&quot;). By accessing or using our Service, you agree
                  to be bound by these Terms.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Use of Service</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Permitted Use</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Academic workload management and planning</li>
                    <li>Resource allocation and scheduling</li>
                    <li>Collaboration with authorised team members</li>
                    <li>
                      Data analysis and reporting for institutional purposes
                    </li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Prohibited Activities</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Unauthorised access to other users&apos; data</li>
                    <li>
                      Sharing login credentials with unauthorised personnel
                    </li>
                    <li>Attempting to circumvent security measures</li>
                    <li>
                      Using the service for non-academic commercial purposes
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle>User Accounts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You are responsible for maintaining the confidentiality of
                  your account credentials and for all activities that occur
                  under your account.
                </p>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm">
                      Provide accurate and complete information during
                      registration
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm">
                      Maintain the security of your password and account
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm">
                      Notify us immediately of any unauthorised use
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Data and Privacy</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  We are committed to protecting your privacy and handling your
                  data responsibly. For detailed information about how we
                  collect, use, and protect your data, please review our Privacy
                  Policy.
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm font-medium">
                    Academic Data Protection
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All academic workload data is encrypted and stored securely
                    in compliance with educational data protection standards.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Service Availability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We strive to maintain high service availability but cannot
                  guarantee uninterrupted access. Scheduled maintenance will be
                  communicated in advance when possible.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  WorkloadWizard is provided &quot;as is&quot; without
                  warranties of any kind. We shall not be liable for any
                  indirect, incidental, special, consequential, or punitive
                  damages resulting from your use of the service.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  We reserve the right to modify these terms at any time. Users
                  will be notified of significant changes via email or through
                  the service interface. Continued use of the service after
                  changes constitutes acceptance of the new terms.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  If you have any questions about these Terms of Service, please
                  contact us:
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Email:</strong> support@workload-wiz.xyz
                  </p>
                  <p>
                    <strong>Support Portal:</strong> Available through your
                    admin dashboard
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <style jsx>{`
        .animated-gradient {
          background:
            radial-gradient(
              1200px 600px at 20% 10%,
              rgba(255, 255, 255, 0.08),
              transparent 60%
            ),
            linear-gradient(120deg, #0f59ff, #8b5cf6, #06b6d4);
          background-size: 200% 200%;
          animation: gradientShift 12s ease infinite;
        }
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>

      <Footer />
    </div>
  );
}
