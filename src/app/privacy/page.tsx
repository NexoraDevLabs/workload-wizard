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
import {
  Shield,
  Lock,
  Eye,
  Database,
  Users,
  AlertTriangle,
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const dynamic = 'force-static';

export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 animated-gradient pointer-events-none" />
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-[0_6px_24px_rgba(0,0,0,0.25)]">
            Privacy Policy
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
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Our Commitment to Privacy
                  </CardTitle>
                  <Badge variant="outline">GDPR Compliant</Badge>
                </div>
                <CardDescription>
                  WorkloadWizard is committed to protecting your privacy and
                  ensuring the security of your personal information.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This Privacy Policy explains how we collect, use, disclose,
                  and safeguard your information when you use our academic
                  workload management service. Please read this policy carefully
                  to understand our views and practises regarding your personal
                  data.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-blue-500" />
                  Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Personal Information
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Name, email address, and institutional affiliation</li>
                    <li>Academic role and department information</li>
                    <li>Authentication credentials (securely hashed)</li>
                    <li>Profile preferences and settings</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Academic Data</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>Course assignments and workload allocations</li>
                    <li>Teaching schedules and academic calendar data</li>
                    <li>Research project information and timelines</li>
                    <li>Administrative task assignments</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Technical Information</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                    <li>IP address and browser information</li>
                    <li>Usage patterns and feature interactions</li>
                    <li>Error logs and performance metrics</li>
                    <li>Session data and authentication tokens</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-green-500" />
                  How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-sm">Service Provision</p>
                      <p className="text-xs text-muted-foreground">
                        Provide and maintain the workload management platform
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-sm">
                        Analytics and Improvement
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Analyse usage patterns to improve functionality and user
                        experience
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-sm">Communication</p>
                      <p className="text-xs text-muted-foreground">
                        Send important updates, notifications, and support
                        communications
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-medium text-sm">
                        Security and Compliance
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Maintain system security and comply with institutional
                        policies
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-indigo-500" />
                  Data Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-lg dark:bg-indigo-950/30 dark:border-indigo-800">
                  <h4 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
                    Security Measures
                  </h4>
                  <div className="grid gap-2 text-sm text-indigo-800 dark:text-indigo-300">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                      <span>End-to-end encryption for data transmission</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                      <span>Encrypted database storage with AES-256</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                      <span>Multi-factor authentication support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                      <span>Regular security audits and monitoring</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  We implement industry-standard security measures to protect
                  your personal information. However, no method of transmission
                  over the internet is 100% secure, and we cannot guarantee
                  absolute security.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Data Sharing and Disclosure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg dark:bg-green-950/30 dark:border-green-800">
                    <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                      We DO NOT sell your personal information
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-300">
                      Your data is never sold to third parties for marketing or
                      commercial purposes.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Limited Sharing</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      We may share information only in the following
                      circumstances:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
                      <li>With your explicit consent</li>
                      <li>
                        Within your institution for legitimate academic purposes
                      </li>
                      <li>To comply with legal obligations</li>
                      <li>To protect the safety and security of our users</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Your Rights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">
                      Access
                    </Badge>
                    <p className="text-sm">
                      Request access to your personal data
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">
                      Rectification
                    </Badge>
                    <p className="text-sm">
                      Request correction of inaccurate data
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">
                      Erasure
                    </Badge>
                    <p className="text-sm">
                      Request deletion of your personal data
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">
                      Portability
                    </Badge>
                    <p className="text-sm">Request transfer of your data</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <Badge variant="outline" className="mt-0.5">
                      Objection
                    </Badge>
                    <p className="text-sm">Object to processing of your data</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Data Retention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  We retain your personal information only for as long as
                  necessary to fulfil the purposes outlined in this privacy
                  policy, unless a longer retention period is required by law.
                </p>
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg dark:bg-amber-950/30 dark:border-amber-800">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                    Retention Periods
                  </h4>
                  <div className="text-sm text-amber-800 dark:text-amber-300 space-y-1">
                    <p>
                      <strong>Active accounts:</strong> Data retained while
                      account is active
                    </p>
                    <p>
                      <strong>Inactive accounts:</strong> Data deleted after 3
                      years of inactivity
                    </p>
                    <p>
                      <strong>Legal requirements:</strong> Some data may be
                      retained longer as required by law
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle>Contact Us</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  If you have any questions about this Privacy Policy or our
                  data practises, please contact us:
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Email:</strong> support@workload-wiz.xyz
                  </p>
                  <p>
                    <strong>Data Protection Officer:</strong>{' '}
                    dpo@workload-wiz.xyz
                  </p>
                  <p>
                    <strong>Support:</strong> Available through our{' '}
                    <a
                      href="/support"
                      className="text-blue-500 hover:text-blue-600"
                    >
                      support page
                    </a>
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
