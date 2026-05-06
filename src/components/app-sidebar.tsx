'use client';

import * as React from 'react';
import { useAuthUser } from '@/hooks/useAuthUser';
import { getUserRoles } from '@/lib/utils';
import {
  Home,
  Shield,
  Users,
  Building,
  User,
  Code,
  Settings,
  LifeBuoy,
} from 'lucide-react';

import { NavMain, type NavItem } from '@/components/nav-main';
import { NavSecondary } from '@/components/nav-secondary';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

// Generate role-based main navigation
function getNavMain(userRoles?: string[]): NavItem[] {
  const base: NavItem[] = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Home,
      isActive: true,
    },
    {
      title: 'Account',
      url: '/account',
      icon: User,
    },
  ];

  const roleNav: NavItem[] = [];

  // Admin navigation (sysadmin or developer)
  if (userRoles?.some((r) => r === 'sysadmin' || r === 'developer')) {
    roleNav.push({
      title: 'Admin',
      url: '/admin',
      icon: Shield,
      items: [
        { title: 'Dashboard', url: '/admin' },
        { title: 'Users Management', url: '/admin/users' },
        { title: 'Organisations', url: '/admin/organisations' },
        { title: 'Allocation Categories', url: '/admin/allocations/categories' },
        { title: 'Permissions', url: '/admin/permissions' },
        { title: 'Audit Logs', url: '/admin/audit-logs' },
      ],
    });
  }

  // Developer-only tools
  if (userRoles?.includes('developer')) {
    roleNav.push({
      title: 'Dev Tools',
      url: '/dev',
      icon: Code,
      items: [
        { title: 'Dashboard', url: '/dev' },
        { title: 'Permission Tests', url: '/dev/permission-test' },
      ],
    });
  }

  // Organisation admin
  if (userRoles?.some((r) => r === 'orgadmin')) {
    roleNav.push({
      title: 'Organisation',
      url: '/organisation',
      icon: Building,
      items: [
        { title: 'Dashboard', url: '/organisation' },
        { title: 'Users', url: '/organisation/users' },
        { title: 'Roles', url: '/organisation/roles' },
        { title: 'Settings', url: '/organisation/settings' },
        { title: 'Academic Years', url: '/organisation/academic-years' },
        { title: 'Courses', url: '/courses' },
        { title: 'Modules', url: '/modules' },
        { title: 'Staff', url: '/staff' },
        { title: 'Audit Logs', url: '/organisation/audit-logs' },
        {
          title: 'Admin Allocations',
          url: '/organisation/settings/admin-allocations',
        },
      ],
    });
  }

  // Regular staff (non-admin)
  const isAdminLike = userRoles?.some(
    (r) => r === 'orgadmin' || r === 'sysadmin' || r === 'developer'
  );
  if (!isAdminLike) {
    roleNav.push({
      title: 'Staff',
      url: '/staff',
      icon: Users,
      items: [{ title: 'My Profile', url: '/staff/me' }],
    });
  }

  return [...base, ...roleNav];
}

// Secondary navigation items (Settings, Support at bottom)
const secondaryNavItems = [
  {
    title: 'Settings',
    url: '/account?tab=preferences',
    icon: Settings,
  },
  {
    title: 'Support',
    url: '/support',
    icon: LifeBuoy,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthUser();
  const userRoles = getUserRoles(user);

  const navMain = getNavMain(userRoles);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={secondaryNavItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
