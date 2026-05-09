'use client';

import * as React from 'react';

import { NavMain } from '@/components/nav-main';
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
import {
  filterNavigationItems,
  mainNavigationItems,
  secondaryNavigationItems,
  type NavigationContext,
} from '@/config/navigation';
import { useAuthUser } from '@/hooks/useAuthUser';
import { usePermissions } from '@/hooks/usePermissions';
import { getUserRoles } from '@/lib/utils';


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuthUser();
  const permissions = usePermissions(user?.organisationId ?? undefined);

  const userRoles = getUserRoles(user);
  const userRole = permissions.userRole;

  const navigationContext: NavigationContext = {
    userRole,
    userRoles,
    organisationId: user?.organisationId ?? undefined,
  };

  const navMain = filterNavigationItems(mainNavigationItems, navigationContext);
  const navSecondary = secondaryNavigationItems;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}