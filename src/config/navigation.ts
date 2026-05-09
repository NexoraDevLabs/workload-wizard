import {
    Building,
    Code,
    Home,
    LifeBuoy,
    Settings,
    Shield,
    User,
    Bell,
    type LucideIcon,
  } from 'lucide-react';
  
  import type { NavItem } from '@/components/nav-main';
  import { hasPermission, type PermissionId } from '@/lib/permissions';
  import type { NavSecondaryItem } from '@/components/nav-secondary';

  type NavigationRole =
    | 'systemadmin'
    | 'sysadmin'
    | 'admin'
    | 'developer'
    | 'dev'
    | 'orgadmin'
    | 'lecturer'
    | 'user';
  
  export type NavigationItem = {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: NavigationItem[];
  
    /**
     * Permission-aware visibility.
     *
     * - requiredPermissions: user must have at least one by default.
     * - requireAllPermissions: user must have every listed permission.
     * - isSystemAction: use for system-scoped checks such as organisations.manage.
     */
    requiredPermissions?: PermissionId[];
    requireAllPermissions?: boolean;
    isSystemAction?: boolean;
  
    /**
     * Role fallback for special cases that are not yet represented by permissions.
     * Keep this limited - prefer permissions for long-term maintainability.
     */
    requiredRoles?: NavigationRole[];
    hiddenForRoles?: NavigationRole[];
  };
  
export type NavigationContext = {
  userRole: string | undefined;
  userRoles: string[];
  organisationId: string | undefined;
};
  
  function hasAnyRole(userRoles: string[], requiredRoles?: NavigationRole[]) {
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.some((role) => userRoles.includes(role));
  }
  
  function isHiddenForRole(userRoles: string[], hiddenForRoles?: NavigationRole[]) {
    if (!hiddenForRoles || hiddenForRoles.length === 0) return false;
    return hiddenForRoles.some((role) => userRoles.includes(role));
  }
  
  function hasRequiredPermissions(
    item: NavigationItem,
    context: NavigationContext
  ) {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true;
    }
  
    const checks = item.requiredPermissions.map((permissionId) =>
        hasPermission(
            context.userRole,
            permissionId,
            context.organisationId,
            item.isSystemAction ?? false
            )
    );
  
    return item.requireAllPermissions
      ? checks.every(Boolean)
      : checks.some(Boolean);
  }
  
  function canSeeNavigationItem(
    item: NavigationItem,
    context: NavigationContext
  ) {
    if (isHiddenForRole(context.userRoles, item.hiddenForRoles)) {
      return false;
    }
  
    if (!hasAnyRole(context.userRoles, item.requiredRoles)) {
      return false;
    }
  
    return hasRequiredPermissions(item, context);
  }
  
  export function filterNavigationItems(
    items: NavigationItem[],
    context: NavigationContext
  ): NavItem[] {
    return items
      .map((item) => {
        const filteredChildren = item.items
          ? filterNavigationItems(item.items, context)
          : undefined;
  
        const canSeeSelf = canSeeNavigationItem(item, context);
        const hasVisibleChildren =
          filteredChildren !== undefined && filteredChildren.length > 0;
  
        if (!canSeeSelf && !hasVisibleChildren) {
          return null;
        }
  
        const navItem: NavItem = {
          title: item.title,
          url: item.url,
          ...(item.icon ? { icon: item.icon } : {}),
          ...(item.isActive ? { isActive: item.isActive } : {}),
          ...(hasVisibleChildren ? { items: filteredChildren } : {}),
        };
  
        return navItem;
      })
      .filter((item): item is NavItem => item !== null);
  }
  
  export const mainNavigationItems: NavigationItem[] = [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Home,
    },
    {
      title: 'My Profile',
      url: '/staff/me',
      icon: User,
      hiddenForRoles: ['orgadmin', 'systemadmin', 'sysadmin', 'admin', 'developer', 'dev'],
    },
    {
      title: 'Admin',
      url: '/admin',
      icon: Shield,
      requiredPermissions: [
        'organisations.manage',
        'permissions.manage',
        'users.view',
        'audit.view',
      ],
      items: [
        {
          title: 'Dashboard',
          url: '/admin',
          requiredPermissions: ['organisations.manage'],
          isSystemAction: true,
        },
        {
          title: 'Users Management',
          url: '/admin/users',
          requiredPermissions: ['users.view'],
        },
        {
          title: 'Organisations',
          url: '/admin/organisations',
          requiredPermissions: ['organisations.manage'],
          isSystemAction: true,
        },
        {
          title: 'Allocation Categories',
          url: '/admin/allocations/categories',
          requiredRoles: ['systemadmin', 'sysadmin', 'admin', 'developer', 'dev'],
        },
        {
          title: 'Permissions',
          url: '/admin/permissions',
          requiredPermissions: ['permissions.manage'],
        },
        {
          title: 'Audit Logs',
          url: '/admin/audit-logs',
          requiredPermissions: ['audit.view'],
          isSystemAction: true,
        },
      ],
    },
    {
      title: 'Dev Tools',
      url: '/dev',
      icon: Code,
      requiredRoles: ['developer', 'dev'],
      items: [
        {
          title: 'Dashboard',
          url: '/dev',
          requiredRoles: ['developer', 'dev'],
        },
        {
          title: 'Permission Tests',
          url: '/dev/permission-test',
          requiredRoles: ['developer', 'dev'],
        },
        {
          title: 'Permissions',
          url: '/dev/permissions',
          requiredPermissions: ['nav.dev'],
        },
      ],
    },
    {
      title: 'Organisation',
      url: '/organisation',
      icon: Building,
      requiredPermissions: [
        'users.view',
        'permissions.manage',
        'audit.view',
        'courses.create',
        'courses.edit',
        'modules.create',
        'modules.edit',
        'staff.create',
        'staff.edit',
        'allocations.assign',
        'allocations.bulk',
      ],
      items: [
        {
          title: 'Dashboard',
          url: '/organisation',
          requiredPermissions: ['users.view', 'permissions.manage', 'audit.view'],
        },
        {
          title: 'Users',
          url: '/organisation/users',
          requiredPermissions: ['users.view'],
        },
        {
          title: 'Roles',
          url: '/organisation/roles',
          requiredPermissions: ['permissions.manage'],
        },
        {
          title: 'Settings',
          url: '/organisation/settings',
          requiredPermissions: ['permissions.manage'],
        },
        {
          title: 'Academic Years',
          url: '/organisation/academic-years',
          requiredPermissions: ['courses.create', 'courses.edit'],
        },
        {
          title: 'Courses',
          url: '/courses',
          requiredPermissions: ['courses.create', 'courses.edit'],
        },
        {
          title: 'Modules',
          url: '/modules',
          requiredPermissions: ['modules.create', 'modules.edit'],
        },
        {
          title: 'Staff',
          url: '/staff',
          requiredPermissions: ['staff.create', 'staff.edit', 'users.view'],
        },
        {
          title: 'Audit Logs',
          url: '/organisation/audit-logs',
          requiredPermissions: ['audit.view'],
        },
        {
          title: 'Admin Allocations',
          url: '/organisation/settings/admin-allocations',
          requiredPermissions: ['allocations.assign', 'allocations.bulk'],
        },
      ],
    },
  ];
  
  export const secondaryNavigationItems: NavSecondaryItem[] = [
    {
        title: 'Notifications',
        url: '/notifications',
        icon: Bell,
        badge: 'Soon',
        badgeVariant: 'warning',
        disabled: true,
    },
    {
        title: 'Support',
        url: '/support',
        icon: LifeBuoy,
    },
    {
        title: 'Settings',
        url: '/account?tab=preferences',
        icon: Settings,
    },
  ];