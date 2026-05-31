'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';

import { api } from '@/convex/_generated/api';
import { useAuthUser } from '@/hooks/useAuthUser';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

export default function MyStaffProfilePage() {
  const router = useRouter();

  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });

  const profile = useQuery(
    api.staff.getMine,
    isLoaded && isSignedIn && user?.id ? { userId: user.id } : 'skip'
  );

  useEffect(() => {
    if (profile?._id) {
      router.replace(`/staff/${profile._id}`);
    }
  }, [profile?._id, router]);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn || !user) {
    return null;
  }

  if (!user.organisationId) {
    return (
      <StandardizedSidebarLayout
        breadcrumbs={[
          { label: 'Staff', href: '/staff' },
          { label: 'My Profile' },
        ]}
        title="My Staff Profile"
      >
        <div className="p-6 text-sm text-muted-foreground">
          Your account has not been assigned to an organisation yet.
        </div>
      </StandardizedSidebarLayout>
    );
  }

  if (profile === undefined || profile?._id) {
    return (
      <StandardizedSidebarLayout
        breadcrumbs={[
          { label: 'Staff', href: '/staff' },
          { label: 'My Profile' },
        ]}
        title="My Staff Profile"
      >
        <div className="text-sm text-muted-foreground">Loading…</div>
      </StandardizedSidebarLayout>
    );
  }

  return (
    <StandardizedSidebarLayout
      breadcrumbs={[
        { label: 'Staff', href: '/staff' },
        { label: 'My Profile' },
      ]}
      title="My Staff Profile"
      subtitle="No linked lecturer profile was found for your account."
    >
      <Card>
        <CardHeader>
          <CardTitle>Profile not linked</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your user account exists, but it is not currently linked to an
            active lecturer profile. An administrator can link your account from
            the relevant staff profile page.
          </p>

          <Button asChild variant="outline">
            <Link href="/staff">Go to staff list</Link>
          </Button>
        </CardContent>
      </Card>
    </StandardizedSidebarLayout>
  );
}