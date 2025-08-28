<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

## Table of contents

- [Permissions & Roles (RBAC)](#permissions--roles-rbac)
  - [Registry](#registry)
  - [Key Tables (Convex)](#key-tables-convex)
  - [Auditing](#auditing)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Permissions & Roles (RBAC)

Canonical reference for the RBAC system and permission registry.

## Registry

- Canonical permission metadata in `src/lib/permissions.ts`
- Admin UI: `/admin/permissions` (system registry) and `/organisation/roles`

## Key Tables (Convex)

- `system_permissions`, `user_roles`, `user_role_assignments`

## Auditing

- All permission and role changes are logged in `audit_logs`

_Last updated: January 2025_
