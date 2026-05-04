'use client';

import { useAuthUser } from '@/hooks/useAuthUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Shield, Key } from 'lucide-react';

// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

export default function SecurityPage() {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      router.replace('/api/auth/login?returnTo=/account/security');
    }
  }, [isLoaded, isSignedIn, user, router]);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Account', href: '/account' },
    { label: 'Security & Privacy' },
  ];

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return null;
  }

  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Security & Privacy"
      subtitle="Manage your password, authentication, and privacy settings"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Overview
            </CardTitle>
            <CardDescription>Your current security status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Key className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Password:</span>
                <span className="font-medium text-muted-foreground">
                  Managed by WorkOS
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Two-factor:</span>
                <span className="font-medium text-orange-500">Coming soon</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Password Management
            </CardTitle>
            <CardDescription>
              Password changes will be handled through the WorkOS account
              security flow.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h3 className="text-lg font-medium">Change Password</h3>
                  <p className="text-sm text-muted-foreground">
                    This feature is coming soon while account security is being
                    finalised.
                  </p>
                </div>
                <Button variant="outline" disabled>
                  <Key className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h3 className="text-lg font-medium">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account.
                  </p>
                </div>
                <Button variant="outline" disabled>
                  <Shield className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h3 className="text-lg font-medium">Privacy Settings</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your privacy preferences and data settings.
                  </p>
                </div>
                <Button variant="outline" disabled>
                  <Shield className="h-4 w-4 mr-2" />
                  Coming Soon
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardizedSidebarLayout>
  );
}