// src/lib/route-access.ts
import type { PermissionId } from '@/lib/permissions';

export type RouteAccessRule = {
  pattern: RegExp;
  permission?: PermissionId;
  systemOnly?: boolean;
  allowSelf?: boolean;
};

export const ROUTE_ACCESS_RULES: RouteAccessRule[] = [
  {
    pattern: /^\/admin(?:\/.*)?$/,
    permission: 'organisations.manage',
    systemOnly: true,
  },
  {
    pattern: /^\/organisation\/audit-logs(?:\/.*)?$/,
    permission: 'audit.view',
  },
  {
    pattern: /^\/organisation\/settings(?:\/.*)?$/,
    permission: 'permissions.manage',
  },
  {
    pattern: /^\/staff\/create$/,
    permission: 'staff.create',
  },
  {
    pattern: /^\/staff\/[^/]+\/edit$/,
    permission: 'staff.edit',
  },
  {
    pattern: /^\/staff\/[^/]+$/,
    permission: 'users.view',
    allowSelf: true,
  },
  {
    pattern: /^\/courses(?:\/.*)?$/,
    permission: 'users.view',
  },
  {
    pattern: /^\/modules(?:\/.*)?$/,
    permission: 'users.view',
  },
];

export function getRouteAccessRule(pathname: string) {
  return ROUTE_ACCESS_RULES.find((rule) => rule.pattern.test(pathname));
}