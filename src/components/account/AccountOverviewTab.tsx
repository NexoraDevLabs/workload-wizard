'use client';

import Link from 'next/link';
import type { ElementType } from 'react';
import { useState } from 'react';
import {
  Building2,
  Camera,
  CheckCircle2,
  Circle,
  LifeBuoy,
  Mail,
  Shield,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ProfileCompletenessItem } from '@/lib/account/profile-completeness';
import { getRoleBadgeVariant, getRoleLabel } from './AccountHeroHeader';

interface AccountSummaryItem {
  label: string;
  value: string;
  icon: ElementType;
}

type ProfileCompletenessSummary = {
  completedCount: number;
  totalCount: number;
  percent: number;
  isComplete: boolean;
};

interface AccountOverviewTabProps {
  userEmail: string;
  username: string | null | undefined;
  organisationName: string | null | undefined;
  userRoles: string[];
  profileCompletenessItems: ProfileCompletenessItem[];
  profileCompletenessSummary: ProfileCompletenessSummary;
  profileCompletenessDismissed: boolean;
  profileCompletenessVersion: string;
  subject: string;
  linkedStaffProfileId?: string;
  onGoToTab: (tab: string) => void;
}

export function AccountOverviewTab({
  userEmail,
  username,
  organisationName,
  userRoles,
  profileCompletenessItems,
  profileCompletenessSummary,
  profileCompletenessDismissed,
  profileCompletenessVersion,
  subject,
  linkedStaffProfileId,
  onGoToTab,
}: AccountOverviewTabProps) {
  const [isDismissing, setIsDismissing] = useState(false);

  const summaryItems: AccountSummaryItem[] = [
    { label: 'Email address', value: userEmail || 'Not set', icon: Mail },
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

  const [isProfileCompletenessCollapsed, setIsProfileCompletenessCollapsed] =
    useState(profileCompletenessDismissed);

  const isProfileIncomplete = !profileCompletenessSummary.isComplete;

  const toggleProfileCompleteness = () => {
    setIsProfileCompletenessCollapsed((prev) => !prev);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Summary cards - 2 cols on large */}
      <div className="flex flex-col gap-5 lg:col-span-2">
        {/* Account summary */}
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Account summary</CardTitle>
            <CardDescription>
              Your core account information at a glance.
            </CardDescription>
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
                    <Icon
                      className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />

                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">
                        {item.label}
                      </dt>

                      {item.label === 'Role(s)' && userRoles.length > 0 ? (
                        <dd className="mt-1 flex flex-wrap gap-1">
                          {userRoles.map((role) => (
                            <Badge
                              key={role}
                              variant={getRoleBadgeVariant(role)}
                              className="text-xs"
                            >
                              {getRoleLabel(role)}
                            </Badge>
                          ))}
                        </dd>
                      ) : (
                        <dd className="mt-0.5 truncate text-sm font-medium">
                          {item.value}
                        </dd>
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
            <CardDescription>
              A summary of your recent account activity.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-8 w-8 opacity-30" aria-hidden="true" />
              <p className="text-sm">Activity tracking coming soon.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-5">
        {/* Profile completeness */}
        {isProfileIncomplete ? (
          <Card className="border-border/60 overflow-hidden">
            <CardHeader className={isProfileCompletenessCollapsed ? 'pb-6' : 'pb-3'}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-base">
                    Profile incomplete
                  </CardTitle>

                  <CardDescription>
                    {profileCompletenessSummary.completedCount} of{' '}
                    {profileCompletenessSummary.totalCount} items complete.
                  </CardDescription>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={toggleProfileCompleteness}
                  aria-label={
                    isProfileCompletenessCollapsed
                      ? 'Expand profile completeness'
                      : 'Collapse profile completeness'
                  }
                >
                  {isProfileCompletenessCollapsed ? (
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            </CardHeader>

              {!isProfileCompletenessCollapsed ? (
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>

                      <span className="font-medium text-foreground">
                        {profileCompletenessSummary.percent}%
                      </span>
                    </div>

                    <Progress
                      value={profileCompletenessSummary.percent}
                      className="h-2"
                      aria-label={`Profile completeness: ${profileCompletenessSummary.percent}%`}
                    />
                  </div>

                  <ul
                    className="space-y-2"
                    aria-label="Profile completeness checklist"
                  >
                  {profileCompletenessItems.map((item) => {
                    const Icon = item.icon;

                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-2 text-sm"
                      >
                        {item.complete ? (
                          <CheckCircle2
                            className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400"
                            aria-label="Complete"
                          />
                        ) : (
                          <Circle
                            className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40"
                            aria-label="Incomplete"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <div
                            className={
                              item.complete
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            }
                          >
                            {item.label}
                          </div>

                          {!item.complete ? (
                            <button
                              type="button"
                              className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                              onClick={() => {
                                if (item.targetTab === 'staff-profile') {
                                  if (linkedStaffProfileId) {
                                    window.location.href = `/staff/${linkedStaffProfileId}`;
                                  }

                                  return;
                                }

                                onGoToTab(item.targetTab);
                              }}
                            >
                              <Icon
                                className="h-3 w-3"
                                aria-hidden="true"
                              />
                              Complete this
                            </button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </CardContent>
          ) : null}
          </Card>
        ) : null}

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