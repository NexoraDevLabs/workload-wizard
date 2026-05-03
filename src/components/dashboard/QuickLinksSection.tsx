'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  BookOpen,
  BarChart3,
  Building2,
  GraduationCap,
  ClipboardList,
  Settings,
  ShieldCheck,
  FileText,
  CalendarDays,
} from 'lucide-react';

interface QuickLink {
  label: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: 'default' | 'outline' | 'secondary';
  iconBg: string;
  iconColor: string;
}

const QUICK_LINKS: QuickLink[] = [
  {
    label: 'My Staff Profile',
    href: '/staff',
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
  },
  {
    label: 'Courses',
    href: '/courses',
    description: 'Manage course years and module links',
    icon: GraduationCap,
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
  {
    label: 'Organisation',
    href: '/organisation',
    description: 'Settings, roles and academic years',
    icon: Building2,
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    label: 'Academic Years',
    href: '/organisation/academic-years',
    description: 'Manage academic year configurations',
    icon: CalendarDays,
    iconBg: 'bg-violet-100 dark:bg-violet-900/30',
    iconColor: 'text-violet-600 dark:text-violet-400',
  },
  {
    label: 'Audit Logs',
    href: '/organisation/audit-logs',
    description: 'Review recent system activity',
    icon: ClipboardList,
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    label: 'Permissions',
    href: '/admin/permissions',
    description: 'Manage roles and user permissions',
    icon: ShieldCheck,
    iconBg: 'bg-rose-100 dark:bg-rose-900/30',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    label: 'Reports',
    href: '/admin',
    description: 'Admin overview and system reports',
    icon: BarChart3,
    iconBg: 'bg-cyan-100 dark:bg-cyan-900/30',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
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

export function QuickLinksSection() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold">Quick Links</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {QUICK_LINKS.map((link) => (
            <Button
              key={link.href}
              variant="outline"
              asChild
              className="h-auto justify-start gap-3 px-3 py-3 text-left hover:bg-accent/60 transition-colors"
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
