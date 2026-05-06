'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthUser } from '@/hooks/useAuthUser';
import { getUserRoles } from '@/lib/utils';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { LoadingOverlay } from '@/components/loading-overlay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AccountHeroHeader } from '@/components/account/AccountHeroHeader';
import { AccountOverviewTab } from '@/components/account/AccountOverviewTab';
import { AccountDetailsTab } from '@/components/account/AccountDetailsTab';
import { ProfilePictureTab } from '@/components/account/ProfilePictureTab';
import { SecurityTab } from '@/components/account/SecurityTab';
import { PreferencesTab } from '@/components/account/PreferencesTab';

// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

type TabValue = 'overview' | 'details' | 'picture' | 'security' | 'preferences';

const breadcrumbs = [{ label: 'Home', href: '/' }, { label: 'Account' }];

const VALID_TABS: TabValue[] = ['overview', 'details', 'picture', 'security', 'preferences'];

export default function AccountPage() {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });

  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get initial tab from URL or default to 'overview'
  const tabFromUrl = searchParams.get('tab') as TabValue | null;
  const initialTab = tabFromUrl && VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'overview';
  
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);
  
  // Sync tab state with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabValue | null;
    if (tabParam && VALID_TABS.includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [searchParams, activeTab]);
  
  // Update URL when tab changes
  const handleTabChange = useCallback((newTab: string) => {
    const tab = newTab as TabValue;
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.replace(`/account?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  const accountDetails = useQuery(
    api.users.getAccountManagementDetails,
    user ? { subject: user.id } : 'skip'
  );

  const profilePictureUrl = useQuery(
    api.users.getOwnProfilePictureUrl,
    user ? { subject: user.id } : 'skip'
  );

  const handleRefreshed = useCallback(() => {
    setAvatarRefreshKey((prev) => prev + 1);
  }, []);

  const handleGoToTab = useCallback((tab: string) => {
    handleTabChange(tab);
  }, [handleTabChange]);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  if (!isLoaded) return <LoadingOverlay delayMs={0} />;
  if (!isSignedIn || !user) return null;

  // ── Derived values ──────────────────────────────────────────────────────────
  const userName =
    accountDetails?.user.fullName ||
    user.fullName ||
    user.firstName ||
    'User';

  const userEmail =
    accountDetails?.user.email ||
    user.emailAddresses[0]?.emailAddress ||
    '';

  const username = accountDetails?.user.username ?? null;
  const organisationName = accountDetails?.organisation?.name ?? null;
  const userRoles = getUserRoles(user);
  const createdAt = user.createdAt ?? null;

  // Prefer Convex-stored picture, fall back to WorkOS imageUrl
  const convexPictureUrl = profilePictureUrl
    ? `${profilePictureUrl}?r=${avatarRefreshKey}`
    : null;
  const avatarUrl =
    convexPictureUrl ||
    (user.imageUrl ? `${user.imageUrl}?r=${avatarRefreshKey}` : '');

  const initialFormData = {
    firstName: accountDetails?.user.givenName || user.firstName || '',
    lastName: accountDetails?.user.familyName || user.lastName || '',
    username: username ?? '',
    email: userEmail,
  };

  const hasProfilePicture = Boolean(profilePictureUrl);
  const hasFirstName = Boolean(accountDetails?.user.givenName || user.firstName);
  const hasLastName = Boolean(accountDetails?.user.familyName || user.lastName);

  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Account hub"
      subtitle="Manage your profile, security and preferences all in one place."
    >
      <div className="flex flex-col gap-6">
        {/* ── Hero header ─────────────────────────────────────────────────── */}
        <AccountHeroHeader
          userName={userName}
          userEmail={userEmail}
          userRoles={userRoles}
          avatarUrl={avatarUrl}
          username={username}
          organisationName={organisationName}
          createdAt={createdAt}
          onEditDetails={() => setActiveTab('details')}
          onChangePhoto={() => setActiveTab('picture')}
          onSecuritySettings={() => setActiveTab('security')}
        />

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
        >
          <TabsList className="flex h-auto flex-wrap gap-1 p-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="details">Account details</TabsTrigger>
            <TabsTrigger value="picture">Profile picture</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-5">
            <AccountOverviewTab
              userEmail={userEmail}
              username={username}
              organisationName={organisationName}
              userRoles={userRoles}
              hasProfilePicture={hasProfilePicture}
              hasFirstName={hasFirstName}
              hasLastName={hasLastName}
              onGoToTab={handleGoToTab}
            />
          </TabsContent>

          <TabsContent value="details" className="mt-5">
            <AccountDetailsTab initialData={initialFormData} />
          </TabsContent>

          <TabsContent value="picture" className="mt-5">
            <ProfilePictureTab
              userName={userName}
              avatarUrl={avatarUrl}
              subject={user.id}
              onRefreshed={handleRefreshed}
            />
          </TabsContent>

          <TabsContent value="security" className="mt-5">
            <SecurityTab />
          </TabsContent>

          <TabsContent value="preferences" className="mt-5">
            <PreferencesTab />
          </TabsContent>
        </Tabs>
      </div>
    </StandardizedSidebarLayout>
  );
}
