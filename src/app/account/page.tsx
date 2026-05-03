'use client';

import { useUser } from '@clerk/nextjs';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { LoadingOverlay } from '@/components/loading-overlay';
import { getUserRoles } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  User,
  Shield,
  Bell,
  Key,
  Sparkles,
  ChevronRight,
  Mail,
  CalendarDays,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import Link from 'next/link';

// Force dynamic rendering to prevent Clerk authentication errors during build
export const dynamic = 'force-dynamic';

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'orgadmin':
      return 'Org Admin';
    case 'sysadmin':
      return 'System Admin';
    case 'developer':
      return 'Developer';
    case 'user':
      return 'User';
    case 'trial':
      return 'Trial';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
};

const getRoleBadgeVariant = (
  role: string
): NonNullable<BadgeProps['variant']> => {
  switch (role) {
    case 'orgadmin':
      return 'danger';
    case 'sysadmin':
      return 'info';
    case 'developer':
      return 'info';
    case 'user':
      return 'success';
    case 'trial':
      return 'warning';
    default:
      return 'neutral';
  }
};

const formatDate = (date: Date | null) => {
  if (!date) return 'Unknown';
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

interface SettingsTile {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  comingSoon?: boolean;
}

const settingsTiles: SettingsTile[] = [
  {
    title: 'Profile',
    description: 'Update your name, photo & contact details',
    icon: User,
    href: '/account/profile',
  },
  {
    title: 'Security',
    description: 'Password, two-factor auth & privacy',
    icon: Shield,
    href: '/account/security',
  },
  {
    title: 'Early Access',
    description: 'Opt into experimental features',
    icon: Sparkles,
    href: '/account/features',
  },
  {
    title: 'Notifications',
    description: 'Email alerts and notification preferences',
    icon: Bell,
    href: '/account/notifications',
    comingSoon: true,
  },
  {
    title: 'API Keys',
    description: 'Manage access tokens & integrations',
    icon: Key,
    href: '/account/api-keys',
    comingSoon: true,
  },
];

export default function AccountPage() {
  const { user, isLoaded } = useUser();

  if (!isLoaded) return <LoadingOverlay delayMs={0} />;

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please sign in to view your account.</p>
      </div>
    );
  }

  const userName = user.fullName || user.firstName || 'User';
  const userEmail = user.emailAddresses[0]?.emailAddress || '';
  const userRoles = getUserRoles(user);
  const createdAt = user.createdAt;
  const initials = getInitials(userName);

  const breadcrumbs = [{ label: 'Home', href: '/' }, { label: 'Account' }];

  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Account Settings"
      subtitle="Manage your profile, security and preferences"
    >
      <div className="flex flex-col gap-6">
        {/* ── Hero Profile Card ─────────────────────────────────── */}
        <Card className="overflow-hidden border-border/60">
          {/* Tinted banner strip */}
          <div className="h-24 bg-primary/8 relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 50%, var(--color-primary) 0%, transparent 60%), radial-gradient(circle at 80% 20%, var(--color-accent-foreground) 0%, transparent 50%)',
              }}
            />
          </div>

          <CardContent className="px-6 pb-6 pt-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-10">
              {/* Avatar + identity */}
              <div className="flex items-end gap-4">
                <Avatar className="h-20 w-20 ring-4 ring-background shadow-md">
                  <AvatarImage src={user.imageUrl} alt={userName} />
                  <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="mb-1">
                  <h2 className="text-xl font-semibold leading-tight">
                    {userName}
                  </h2>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                </div>
              </div>

              {/* Role badges + edit CTA */}
              <div className="flex flex-wrap items-center gap-2 sm:mb-1">
                {userRoles && userRoles.length > 0 ? (
                  userRoles.map((role, i) => (
                    <Badge key={i} variant={getRoleBadgeVariant(role)}>
                      {getRoleLabel(role)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="neutral">No roles</Badge>
                )}
                <Link href="/account/profile">
                  <Button size="sm" variant="soft" className="ml-1">
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </div>

            {/* Metadata row */}
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/50 pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {userEmail}
              </span>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                Member since {formatDate(createdAt)}
              </span>
              {userRoles.includes('sysadmin') && (
                <span className="flex items-center gap-1.5 text-blue-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Full system access
                </span>
              )}
              {userRoles.includes('orgadmin') && (
                <span className="flex items-center gap-1.5 text-red-600">
                  <Lock className="h-3.5 w-3.5" />
                  Organisation admin
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Settings Tiles Grid ───────────────────────────────── */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Settings
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {settingsTiles.map((tile) => {
              const Icon = tile.icon;

              if (tile.comingSoon) {
                return (
                  <div
                    key={tile.title}
                    className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 opacity-60"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {tile.title}
                        </span>
                        <Badge
                          variant="neutral"
                          className="text-[10px] py-0 px-1.5"
                        >
                          Soon
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-1">
                        {tile.description}
                      </p>
                    </div>
                  </div>
                );
              }

              return (
                <Link key={tile.title} href={tile.href} className="group block">
                  <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 transition-all duration-150 group-hover:border-primary/30 group-hover:shadow-sm group-hover:-translate-y-0.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-white shadow-xs transition-colors group-hover:border-primary/20 group-hover:bg-primary/5">
                      <Icon className="h-5 w-5 text-primary transition-transform group-hover:scale-110" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm">{tile.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-1">
                        {tile.description}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-all group-hover:text-primary group-hover:translate-x-0.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </StandardizedSidebarLayout>
  );
}
