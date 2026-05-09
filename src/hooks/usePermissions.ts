import { useAuthUser } from '@/hooks/useAuthUser';
import { useMemo } from 'react';
import {
  hasPermission,
  canViewUsers,
  canCreateUsers,
  canEditUsers,
  canDeleteUsers,
  canManagePermissions,
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
  ) as { systemRoles?: string[] } | undefined;

  // Derive an effective role from publicMetadata.role or roles[] (prefer strongest)
  const userRole = useMemo(() => {
    const single = user?.publicMetadata?.role as string | undefined;
    const many = (user?.publicMetadata?.roles as string[] | undefined) || [];
    const systemRoles = Array.isArray(convexUser?.systemRoles)
      ? convexUser?.systemRoles
      : [];
    const combined = new Set<string>([
      ...many,
      ...systemRoles,
      ...(single ? [single] : []),
    ]);
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
    const found = priority.find((r) => combined.has(r));
    return found || undefined;
  }, [
    user?.publicMetadata?.role,
    user?.publicMetadata?.roles,
    convexUser?.systemRoles,
  ]);

  const permissions = useMemo(
    () => ({
      // Generic permission checker
      hasPermission: (permissionId: PermissionId, isSystemAction = false) =>
        hasPermission(userRole, permissionId, organisationId, isSystemAction),

      // Specific permission checks
      canViewUsers: () => canViewUsers(userRole, organisationId),
      canCreateUsers: () => canCreateUsers(userRole, organisationId),
      canEditUsers: () => canEditUsers(userRole, organisationId),
      canDeleteUsers: () => canDeleteUsers(userRole, organisationId),
      canManagePermissions: () =>
        canManagePermissions(userRole, organisationId),

      // Role checks
      isSystemAdmin: () =>
        userRole === 'systemadmin' ||
        userRole === 'sysadmin' ||
        userRole === 'admin',
      isOrgAdmin: () => userRole === 'orgadmin',
      isLecturer: () => userRole === 'lecturer',

      // Centralized gating utilities
      gateUIState: (
        permissionId: PermissionId,
        options?: {
          isSystemAction?: boolean;
          fallbackValue?: unknown;
          hideForbidden?: boolean;
        }
      ) => gateUIState(userRole, permissionId, { organisationId, ...options }),

      gateButtonState: (
        permissionId: PermissionId,
        options?: {
          isSystemAction?: boolean;
          disabledText?: string;
        }
      ) =>
        gateButtonState(userRole, permissionId, { organisationId, ...options }),

      gateActionState: (
        permissionId: PermissionId,
        options?: {
          isSystemAction?: boolean;
          actionName?: string;
        }
      ) =>
        gateActionState(userRole, permissionId, { organisationId, ...options }),

      // Current user info
      userRole,
      organisationId,
    }),
    [userRole, organisationId]
  );

  return permissions;
}
