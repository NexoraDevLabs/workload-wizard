'use client';

import * as React from 'react';
import { useUser } from '@clerk/nextjs';
import { getUserRoles } from '@/lib/utils';
import {
  Building2,
  Home,
  Shield,
  Users,
  FileText,
  Building,
  Zap,
  User,
  Code,
  Database,
  Bug,
  Terminal,
} from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { TeamSwitcher } from '@/components/team-switcher';
import { YearSwitcher } from '@/components/common/YearSwitcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';

// Generate role-based navigation data
const getNavigationData = (userRoles?: string[]) => {
  const baseNav = [
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
    // Staff entries are injected below based on role
  ];

  // Add role-specific navigation
  const roleNav = [];

  // Admin navigation (for both sysadmin and developer)
  if (userRoles?.some((role) => role === 'sysadmin' || role === 'developer')) {
    roleNav.push({
      title: 'Admin',
      url: '/admin',
      icon: Shield,
      items: [
        {
          title: 'Dashboard',
          url: '/admin',
        },
        {
          title: 'Users Management',
          url: '/admin/users',
        },
        {
          title: 'Organisations',
          url: '/admin/organisations',
        },
        {
          title: 'Allocation Categories',
          url: '/admin/allocations/categories',
        },
        ...// Show Permissions page to sysadmin or developer (support both single and array roles via getUserRoles)
        (userRoles?.some((r) => r === 'sysadmin' || r === 'developer')
          ? [{ title: 'Permissions', url: '/admin/permissions' }]
          : []),
        {
          title: 'Audit Logs',
          url: '/admin/audit-logs',
        },
      ],
    });
  }

  // Developer-specific tools (only for developer role)
  if (userRoles?.includes('developer')) {
    // Add developer-specific tools
    roleNav.push({
      title: 'Dev Tools',
      url: '/dev',
      icon: Code,
      items: [
        {
          title: 'Dashboard',
          url: '/dev',
        },
        {
          title: 'Dev Tools',
          url: '/dev/tools',
        },
        {
          title: 'Permission Tests',
          url: '/dev/permission-test',
        },
        {
          title: 'Statsig Test',
          url: '/dev/statsig-test',
        },
      ],
    });
  }

  // Orgadmin navigation
  if (userRoles?.some((role) => role === 'orgadmin')) {
    roleNav.push({
      title: 'Organisation',
      url: '/organisation',
      icon: Building,
      items: [
        {
          title: 'Dashboard',
          url: '/organisation',
        },
        {
          title: 'Users',
          url: '/organisation/users',
        },
        {
          title: 'Roles',
          url: '/organisation/roles',
        },
        {
          title: 'Settings',
          url: '/organisation/settings',
        },
        {
          title: 'Academic Years',
          url: '/organisation/academic-years',
        },
        {
          title: 'Courses',
          url: '/courses',
        },
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

  // For non-admin users, show only Staff -> My Profile
  const isAdminLike = userRoles?.some(
    (role) => role === 'orgadmin' || role === 'sysadmin' || role === 'developer'
  );
  if (!isAdminLike) {
    roleNav.push({
      title: 'Staff',
      url: '/staff',
      icon: Users,
      items: [{ title: 'My Profile', url: '/staff/me' }],
    });
  }

  return {
    user: {
      name: 'Admin User',
      email: 'admin@workload.com',
      avatar: '/avatars/admin.jpg',
    },
    teams: [
      {
        name: 'WorkloadWizard',
        logo: Zap,
        plan: 'Enterprise',
      },
    ],
    navMain: [...baseNav, ...roleNav],
    projects: getProjectsData(userRoles),
  };
};

// Generate role-based projects data
const getProjectsData = (userRoles?: string[]) => {
  const projects = [];

  // Admin projects (for both sysadmin and developer)
  if (userRoles?.some((role) => role === 'sysadmin' || role === 'developer')) {
    projects.push(
      {
        name: 'User Management',
        url: '/admin/users',
        icon: Users,
      },
      {
        name: 'Organisation Setup',
        url: '/admin/organisations',
        icon: Building2,
      },
      {
        name: 'Audit & Compliance',
        url: '/admin/audit-logs',
        icon: FileText,
      }
    );
  }

  // Developer-specific projects (only for developer role)
  if (userRoles?.includes('developer')) {
    projects.push(
      {
        name: 'Database Tools',
        url: '/dev/database',
        icon: Database,
      },
      {
        name: 'API Testing',
        url: '/dev/api',
        icon: Terminal,
      },
      {
        name: 'Debug Console',
        url: '/dev/debug',
        icon: Bug,
      }
    );
  }

  // Orgadmin projects
  if (userRoles?.includes('orgadmin')) {
    projects.push(
      {
        name: 'Team Management',
        url: '/organisation/users',
        icon: Users,
      },
      {
        name: 'Role Configuration',
        url: '/organisation/roles',
        icon: Shield,
      },
      {
        name: 'Organisation Settings',
        url: '/organisation/settings',
        icon: Building2,
      }
    );
  }

  return projects;
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const userRoles = getUserRoles(user);
  const { state } = useSidebar();

  // Get role-based navigation data
  const data = getNavigationData(userRoles);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
        {state === 'expanded' && (
          <div className="px-2">
            <YearSwitcher compact />
          </div>
        )}
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
