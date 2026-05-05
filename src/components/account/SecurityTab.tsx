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

export function SecurityTab() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Main security card */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4.5 w-4.5" aria-hidden="true" />
              Security settings
            </CardTitle>
            <CardDescription>
              Authentication and security for WorkloadWizard is managed through{' '}
              <strong>WorkOS AuthKit</strong>. Use the dedicated Security &amp; Privacy
              page to manage your security options.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Password */}
            <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4">
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium">Password &amp; authentication</p>
                  <p className="text-xs text-muted-foreground">
                    Managed securely through WorkOS. Click to open the full security page.
                  </p>
                </div>
              </div>
              <Badge variant="neutral" className="ml-4 shrink-0">Managed by WorkOS</Badge>
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

            {/* CTA to full security page */}
            <div className="pt-2">
              <Button asChild variant="soft" size="sm" className="gap-1.5">
                <Link href="/account/security">
                  <Shield className="h-3.5 w-3.5" />
                  Open Security &amp; Privacy page
                  <ExternalLink className="h-3 w-3 ml-0.5 opacity-60" />
                </Link>
              </Button>
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
