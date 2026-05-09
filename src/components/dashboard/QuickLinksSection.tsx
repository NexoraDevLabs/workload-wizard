'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  BarChart3,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthUser } from '@/hooks/useAuthUser';
import { usePermissions } from '@/hooks/usePermissions';
import { getUserRoles } from '@/lib/utils';
import { hasPermission, type PermissionId } from '@/lib/permissions';

interface QuickLink {
  label: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  requiredPermissions?: PermissionId[];
  requireAllPermissions?: boolean;
  isSystemAction?: boolean;
  requiredRoles?: string[];
  hiddenForRoles?: string[];
}

type QuickLinkContext = {
  userRole: string | undefined;
  userRoles: string[];
  organisationId: string | undefined;
};

const QUICK_LINKS: QuickLink[] = [
  {
    label: 'My Staff Profile',
    href: '/staff/me',
    description: 'View your teaching profile and allocations',
    icon: Users,
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
  },
  {
    label: 'Modules',
    href: '/modules',
    description: 'Browse and manage module definitions',
    icon: BookOpen,
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    requiredPermissions: ['modules.create', 'modules.edit'],
  },
  {
    label: 'Courses',
    href: '/courses',
    description: 'Manage course years and module links',
    icon: GraduationCap,
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    requiredPermissions: ['courses.create', 'courses.edit'],
  },
  {
    label: 'Organisation',
    href: '/organisation',
    description: 'Settings, roles and academic years',
    icon: Building2,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    requiredPermissions: ['users.view', 'permissions.manage', 'audit.view'],
  },
  {
    label: 'Academic Years',
    href: '/organisation/academic-years',
    description: 'Manage academic year configurations',
    icon: CalendarDays,
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
    requiredPermissions: ['courses.create', 'courses.edit'],
  },
  {
    label: 'Audit Logs',
    href: '/organisation/audit-logs',
    description: 'Review recent system activity',
    icon: ClipboardList,
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
    requiredPermissions: ['audit.view'],
  },
  {
    label: 'Permissions',
    href: '/admin/permissions',
    description: 'Manage roles and user permissions',
    icon: ShieldCheck,
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
    requiredPermissions: ['permissions.manage'],
  },
  {
    label: 'Reports',
    href: '/admin',
    description: 'Admin overview and system reports',
    icon: BarChart3,
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    requiredPermissions: ['organisations.manage'],
    isSystemAction: true,
  },
  {
    label: 'Account Settings',
    href: '/account',
    description: 'Profile, security and preferences',
    icon: Settings,
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
  {
    label: 'Support',
    href: '/support',
    description: 'Get help or submit feedback',
    icon: FileText,
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
];

function userHasAnyRole(userRoles: string[], requiredRoles?: string[]) {
  if (!requiredRoles || requiredRoles.length === 0) return true;
  return requiredRoles.some((role) => userRoles.includes(role));
}

function userHasHiddenRole(userRoles: string[], hiddenForRoles?: string[]) {
  if (!hiddenForRoles || hiddenForRoles.length === 0) return false;
  return hiddenForRoles.some((role) => userRoles.includes(role));
}

function userHasRequiredPermissions(link: QuickLink, context: QuickLinkContext) {
  if (!link.requiredPermissions || link.requiredPermissions.length === 0) {
    return true;
  }

  const checks = link.requiredPermissions.map((permissionId) =>
    hasPermission(
      context.userRole,
      permissionId,
      context.organisationId,
      link.isSystemAction ?? false
    )
  );

  return link.requireAllPermissions
    ? checks.every(Boolean)
    : checks.some(Boolean);
}

function canSeeQuickLink(link: QuickLink, context: QuickLinkContext) {
  if (userHasHiddenRole(context.userRoles, link.hiddenForRoles)) {
    return false;
  }

  if (!userHasAnyRole(context.userRoles, link.requiredRoles)) {
    return false;
  }

  return userHasRequiredPermissions(link, context);
}

export function QuickLinksSection() {
  const { user } = useAuthUser();
  const permissions = usePermissions(user?.organisationId ?? undefined);

  const context: QuickLinkContext = {
    userRole: permissions.userRole,
    userRoles: getUserRoles(user),
    organisationId: user?.organisationId ?? undefined,
  };

  const visibleLinks = QUICK_LINKS.filter((link) =>
    canSeeQuickLink(link, context)
  );

  if (visibleLinks.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Quick Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {visibleLinks.map((link) => (
            <Button
              key={link.href}
              variant="outline"
              asChild
              className="h-auto justify-start gap-3 px-3 py-3 text-left transition-colors hover:bg-accent/60"
            >
              <Link href={link.href}>
                <div className={`flex-shrink-0 rounded-lg p-2 ${link.iconBg}`}>
                  <link.icon className={`h-4 w-4 ${link.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {link.label}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {link.description}
                  </p>
                </div>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}