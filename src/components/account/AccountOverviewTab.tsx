'use client';

import Link from 'next/link';
import {
  Building2,
  Camera,
  CheckCircle2,
  Circle,
  LifeBuoy,
  Mail,
  Shield,
  User,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getRoleBadgeVariant, getRoleLabel } from './AccountHeroHeader';

interface AccountSummaryItem {
  label: string;
  value: string;
  icon: React.ElementType;
}

interface CompletenessItem {
  label: string;
  complete: boolean;
}

interface AccountOverviewTabProps {
  userEmail: string;
  username: string | null | undefined;
  organisationName: string | null | undefined;
  userRoles: string[];
  hasProfilePicture: boolean;
  hasFirstName: boolean;
  hasLastName: boolean;
  onGoToTab: (tab: string) => void;
}

export function AccountOverviewTab({
  userEmail,
  username,
  organisationName,
  userRoles,
  hasProfilePicture,
  hasFirstName,
  hasLastName,
  onGoToTab,
}: AccountOverviewTabProps) {
  const summaryItems: AccountSummaryItem[] = [
    { label: 'Email address', value: userEmail, icon: Mail },
    { label: 'Username', value: username ? `@${username}` : 'Not set', icon: User },
    {
      label: 'Organisation',
      value: organisationName ?? 'No organisation assigned',
      icon: Building2,
    },
    {
      label: 'Role(s)',
      value: userRoles.map(getRoleLabel).join(', ') || 'No roles',
      icon: Shield,
    },
  ];

  const completenessItems: CompletenessItem[] = [
    { label: 'First name set', complete: hasFirstName },
    { label: 'Last name set', complete: hasLastName },
    { label: 'Username set', complete: Boolean(username) },
    { label: 'Profile picture uploaded', complete: hasProfilePicture },
    { label: 'Email address verified', complete: Boolean(userEmail) },
  ];

  const completedCount = completenessItems.filter((i) => i.complete).length;
  const completenessPercent = Math.round(
    (completedCount / completenessItems.length) * 100
  );

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Summary cards – 2 cols on large */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        {/* Account summary */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account summary</CardTitle>
            <CardDescription>Your core account information at a glance.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 sm:grid-cols-2">
              {summaryItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/30 px-4 py-3"
                  >
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">{item.label}</dt>
                      {item.label === 'Role(s)' && userRoles.length > 0 ? (
                        <dd className="mt-1 flex flex-wrap gap-1">
                          {userRoles.map((r, i) => (
                            <Badge key={i} variant={getRoleBadgeVariant(r)} className="text-xs">
                              {getRoleLabel(r)}
                            </Badge>
                          ))}
                        </dd>
                      ) : (
                        <dd className="mt-0.5 text-sm font-medium truncate">{item.value}</dd>
                      )}
                    </div>
                  </div>
                );
              })}
            </dl>
          </CardContent>
        </Card>

        {/* Activity placeholder */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>A summary of your recent account activity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground gap-2">
              <CheckCircle2 className="h-8 w-8 opacity-30" aria-hidden="true" />
              <p className="text-sm">Activity tracking coming soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-5">
        {/* Profile completeness */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Profile completeness</CardTitle>
            <CardDescription>{completedCount} of {completenessItems.length} items complete.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span className="font-medium text-foreground">{completenessPercent}%</span>
              </div>
              <Progress value={completenessPercent} className="h-2" aria-label={`Profile completeness: ${completenessPercent}%`} />
            </div>

            <ul className="space-y-2" aria-label="Profile completeness checklist">
              {completenessItems.map((item) => (
                <li key={item.label} className="flex items-center gap-2 text-sm">
                  {item.complete ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-label="Complete" />
                  ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" aria-label="Incomplete" />
                  )}
                  <span className={item.complete ? 'text-foreground' : 'text-muted-foreground'}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Quick links */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={() => onGoToTab('security')}
            >
              <Shield className="h-4 w-4 text-muted-foreground" />
              Security &amp; Privacy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              onClick={() => onGoToTab('picture')}
            >
              <Camera className="h-4 w-4 text-muted-foreground" />
              Change profile picture
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="justify-start gap-2"
              asChild
            >
              <Link href="/support">
                <LifeBuoy className="h-4 w-4 text-muted-foreground" />
                Support &amp; help centre
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
