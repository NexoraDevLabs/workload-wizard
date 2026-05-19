'use client';

import Link from 'next/link';
import {
  ExternalLink,
  KeyRound,
  Lock,
  Shield,
  Smartphone,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PasswordResetModal } from '@/components/account/PasswordResetModal';

type SecurityTabProps = {
  userEmail: string;
};

export function SecurityTab({ userEmail }: SecurityTabProps) {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Main security card */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4.5 w-4.5" aria-hidden="true" />
              Security & Privacy
            </CardTitle>
            <CardDescription>
              Authentication and security for WorkloadWizard is managed through this page. Use the options below to manage your security options.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Password */}
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-primary/10">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">Password &amp; authentication</p>
                  <p className="text-xs text-muted-foreground">
                    Send a secure reset email to update your password.
                  </p>
                </div>
              </div>
              <PasswordResetModal email={userEmail} />
            </div>

            <Separator />

            {/* MFA */}
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">Multi-factor authentication</p>
                  <p className="text-xs text-muted-foreground">
                    Add an extra layer of security to your account.
                  </p>
                </div>
              </div>
              <Badge variant="warning" className="ml-4 shrink-0">Coming soon</Badge>
            </div>

            <Separator />

            {/* Sessions */}
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">Active sessions</p>
                  <p className="text-xs text-muted-foreground">
                    View and manage devices that are currently signed in.
                  </p>
                </div>
              </div>
              <Badge variant="warning" className="ml-4 shrink-0">Coming soon</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <div>
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base">About security</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              WorkloadWizard uses <strong className="text-foreground">WorkOS AuthKit</strong>{' '}
              to handle authentication, password management, and identity verification.
            </p>
            <p>
              No passwords are stored within WorkloadWizard itself — all credentials are
              held securely by WorkOS.
            </p>
            <p>
              Multi-factor authentication and active session management are on the
              roadmap and will be available soon.
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
  );
}
