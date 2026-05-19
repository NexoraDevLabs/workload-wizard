import { useAuthUser } from '@/hooks/useAuthUser';
import { useMemo } from 'react';
import {
  hasPermission,
  gateUIState,
  gateButtonState,
  gateActionState,
  type PermissionId,
} from '@/lib/permissions';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function usePermissions(organisationId?: string) {
  const { user, isLoaded } = useAuthUser();
  const convexUser = useQuery(
    api.users.getBySubject,
    isLoaded && user?.id && user?.organisationId ? { subject: user.id } : 'skip'
  ) as { systemRoles?: string[]; organisationRoles?: string[] } | undefined;

  // Derive an effective role from publicMetadata.role or roles[] (prefer strongest)
  const userRoles = useMemo(() => {
    const single = user?.publicMetadata?.role as string | undefined;
    const many = (user?.publicMetadata?.roles as string[] | undefined) || [];
    const systemRoles = Array.isArray(convexUser?.systemRoles)
      ? convexUser?.systemRoles
      : [];
    const organisationRoles = Array.isArray(convexUser?.organisationRoles)
      ? convexUser.organisationRoles
      : [];
    const normalise = (role: string) =>
      role.trim().toLowerCase().replace(/[_\s-]+/g, '');
    const orgRoleMap: Record<string, string> = {
      user: 'user',
      viewer: 'user',
      lecturer: 'user',
      manager: 'manager',
      teammanager: 'manager',
      workloadadmin: 'workloadadmin',
      organisationadmin: 'orgadmin',
      organizationadmin: 'orgadmin',
      orgadmin: 'orgadmin',
      admin: 'orgadmin',
    };
    const combined = new Set<string>([
      ...many,
      ...systemRoles,
      ...organisationRoles.map((role) => orgRoleMap[normalise(role)] ?? role),
      ...(single ? [single] : []),
    ]);
    return [...combined];
  }, [
    user?.publicMetadata?.role,
    user?.publicMetadata?.roles,
    convexUser?.systemRoles,
    convexUser?.organisationRoles,
  ]);

  const userRole = useMemo(() => {
    // Prioritise high-privilege roles if present (include dev/developer aliases)
    const priority = [
      'systemadmin',
      'sysadmin',
      'admin',
      'developer',
      'dev',
      'orgadmin',
      'workloadadmin',
      'manager',
      'lecturer',
      'user',
    ];
    const found = priority.find((r) => userRoles.includes(r));
    return found || undefined;
  }, [userRoles]);

  const hasRolePermission = (
    permissionId: PermissionId,
    isSystemAction = false
  ) =>
    userRoles.some((role) =>
      hasPermission(role, permissionId, organisationId, isSystemAction)
    );

  const roleForPermission = (permissionId: PermissionId, isSystemAction = false) =>
    userRoles.find((role) =>
      hasPermission(role, permissionId, organisationId, isSystemAction)
    ) ?? userRole;

  const permissions = useMemo(
    () => ({
      // Generic permission checker
      hasPermission: (permissionId: PermissionId, isSystemAction = false) =>
        hasRolePermission(permissionId, isSystemAction),

      // Specific permission checks
      canViewUsers: () => hasRolePermission('users.view'),
      canCreateUsers: () => hasRolePermission('users.create'),
      canEditUsers: () => hasRolePermission('users.edit'),
      canDeleteUsers: () => hasRolePermission('users.delete'),
      canManagePermissions: () =>
        hasRolePermission('permissions.manage'),

      // Role checks
      isSystemAdmin: () =>
        userRole === 'systemadmin' ||
        userRole === 'sysadmin' ||
        userRole === 'admin',
      isOrgAdmin: () => userRoles.includes('orgadmin'),
      isLecturer: () => userRoles.includes('lecturer'),

      // Centralized gating utilities
      gateUIState: (
        permissionId: PermissionId,
        options?: {
          isSystemAction?: boolean;
          fallbackValue?: unknown;
          hideForbidden?: boolean;
        }
      ) =>
        gateUIState(roleForPermission(permissionId, options?.isSystemAction), permissionId, {
          organisationId,
          ...options,
        }),

      gateButtonState: (
        permissionId: PermissionId,
        options?: {
          isSystemAction?: boolean;
          disabledText?: string;
        }
      ) =>
        gateButtonState(
          roleForPermission(permissionId, options?.isSystemAction),
          permissionId,
          { organisationId, ...options }
        ),

      gateActionState: (
        permissionId: PermissionId,
        options?: {
          isSystemAction?: boolean;
          actionName?: string;
        }
      ) =>
        gateActionState(
          roleForPermission(permissionId, options?.isSystemAction),
          permissionId,
          { organisationId, ...options }
        ),

      // Current user info
      userRole,
      userRoles,
      organisationId,
    }),
    [userRole, userRoles, organisationId]
  );

  return permissions;
}
