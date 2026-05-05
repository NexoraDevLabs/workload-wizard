'use client';

import Link from 'next/link';
import { ArrowLeft, KeyRound, Lock, Shield, Smartphone } from 'lucide-react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { LoadingOverlay } from '@/components/loading-overlay';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Account', href: '/account' },
  { label: 'Security & Privacy' },
];

export default function SecurityPage() {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });

  if (!isLoaded) return <LoadingOverlay delayMs={0} />;
  if (!isSignedIn || !user) return null;

  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Security & Privacy"
      subtitle="Authentication and security for WorkloadWizard is managed through WorkOS AuthKit."
    >
      <div className="flex flex-col gap-5">
        {/* Back to hub */}
        <div>
          <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
            <Link href="/account">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Account hub
            </Link>
          </Button>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Main security card */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            {/* Overview */}
            <Card className="border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4" aria-hidden="true" />
                  Security overview
                </CardTitle>
                <CardDescription>
                  Your account security is handled by{' '}
                  <strong>WorkOS AuthKit</strong>. No passwords are stored
                  within WorkloadWizard itself.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Password */}
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <KeyRound
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium">
                        Password &amp; authentication
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Managed securely through WorkOS. Password resets are
                        handled via the WorkOS authentication flow.
                      </p>
                    </div>
                  </div>
                  <Badge variant="neutral" className="ml-4 shrink-0">
                    Managed by WorkOS
                  </Badge>
                </div>

                <Separator />

                {/* MFA */}
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <Smartphone
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium">
                        Multi-factor authentication
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Add an extra layer of security with a second verification
                        step.
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning" className="ml-4 shrink-0">
                    Coming soon
                  </Badge>
                </div>

                <Separator />

                {/* Sessions */}
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <Lock
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium">Active sessions</p>
                      <p className="text-xs text-muted-foreground">
                        View and manage devices that are currently signed in to
                        your account.
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning" className="ml-4 shrink-0">
                    Coming soon
                  </Badge>
                </div>

                <Separator />

                {/* Privacy */}
                <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-start gap-3">
                    <Shield
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <div>
                      <p className="text-sm font-medium">Privacy settings</p>
                      <p className="text-xs text-muted-foreground">
                        Manage your privacy preferences and data settings.
                      </p>
                    </div>
                  </div>
                  <Badge variant="warning" className="ml-4 shrink-0">
                    Coming soon
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Info card */}
          <div>
            <Card className="border-border/60">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">About security</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>
                  WorkloadWizard uses{' '}
                  <strong className="text-foreground">WorkOS AuthKit</strong> to
                  handle authentication, password management, and identity
                  verification.
                </p>
                <p>
                  No passwords are stored within WorkloadWizard itself — all
                  credentials are held securely by WorkOS.
                </p>
                <p>
                  Multi-factor authentication and active session management are
                  on the roadmap and will be available in a future update.
                </p>
                <p>
                  For urgent security concerns, please contact{' '}
                  <a
                    href="mailto:support@workload-wiz.xyz"
                    className="text-primary underline underline-offset-2 hover:no-underline"
                  >
                    support@workload-wiz.xyz
                  </a>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StandardizedSidebarLayout>
  );
}
