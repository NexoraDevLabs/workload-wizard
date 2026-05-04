'use client';

import { useAuthUser } from '@/hooks/useAuthUser';
import { useEffect, useState, useCallback } from 'react';

// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Plus,
  Edit,
  Trash2,
  User,
  Mail,
  UserCheck,
  UserX,
  RefreshCw,
  ShieldCheck,
  Filter,
  Search,
  MoreHorizontal,
  UserCog,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useQuery } from 'convex/react';
import type { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { deleteUser } from '@/lib/actions/userActions';
import { useToast } from '@/hooks/use-toast';
import { CreateUserForm } from '@/components/domain/CreateUserForm';
import { EditUserForm } from '@/components/domain/EditUserForm';
import { DeleteConfirmationModal } from '@/components/domain/DeleteConfirmationModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

interface User {
  _id: string;
  email: string;
  username?: string;
  givenName: string;
  familyName: string;
  fullName: string;
  systemRoles: string[];
  organisationId: string;
  isActive: boolean;
  lastSignInAt?: number;
  createdAt: number;
  subject?: string; // WorkOS user ID
  pictureUrl?: string;
  organisation?: {
    id: string;
    name: string;
    code: string;
  };
}

export default function OrganisationUsersPage() {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local data views
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [sortedUsers, setSortedUsers] = useState<User[]>([]);

  // Sorting
  type SortField =
    | 'name'
    | 'email'
    | 'username'
    | 'role'
    | 'status'
    | 'created'
    | 'lastSignIn';
  type SortDirection = 'asc' | 'desc';
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Filters/search
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orgRoleFilter, setOrgRoleFilter] = useState<string>('all');

  // Selection + assign modal
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const [assigningUser, setAssigningUser] = useState<User | null>(null);
  const [selectedSystemRoles, setSelectedSystemRoles] = useState<string[]>([]);
  const [selectedOrgRoleIds, setSelectedOrgRoleIds] = useState<string[]>([]);
  const [isBulkAssign, setIsBulkAssign] = useState(false);

  // Get current user's organisation
  const currentUser = useQuery(
    api.users.getBySubject,
    user?.id ? { subject: user.id } : 'skip'
  );

  // Get organisation users
  const organisationUsers = useQuery(
    api.users.list,
    currentUser?.organisationId
      ? {
          organisationId:
            currentUser.organisationId as unknown as Id<'organisations'>,
        }
      : 'skip'
  );
  const orgRoles = useQuery(
    api.organisationalRoles.listByOrganisation,
    currentUser?.organisationId
      ? {
          organisationId:
            currentUser.organisationId as unknown as Id<'organisations'>,
        }
      : 'skip'
  );

  // Permission: can this actor assign elevated roles (sysadmin/developer/trial)?
  const canAssignElevated = (() => {
    const meta = user?.publicMetadata as Record<string, unknown> | undefined;
    const roles: string[] = Array.isArray(meta?.roles)
      ? (meta.roles as unknown[]).filter(
          (r): r is string => typeof r === 'string'
        )
      : [];
    const role: string | undefined =
      typeof meta?.role === 'string' ? meta.role : undefined;
    return (
      roles.includes('sysadmin') ||
      roles.includes('developer') ||
      role === 'sysadmin' ||
      role === 'developer'
    );
  })();
  const assignableSystemRoles = canAssignElevated
    ? ['user', 'orgadmin', 'sysadmin', 'developer', 'trial']
    : ['user', 'orgadmin'];

  // Helpers
  const getUniqueRoles = () => {
    const all = (organisationUsers || []).flatMap((u) => u.systemRoles || []);
    return Array.from(new Set(all)).sort();
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'orgadmin':
        return 'Organisation Admin';
      case 'sysadmin':
        return 'System Admin';
      case 'developer':
        return 'Developer';
      case 'user':
        return 'User';
      case 'trial':
        return 'Trial';
      default:
        return role;
    }
  };

  const getRoleBadgeClass = (
    role: string
  ): NonNullable<BadgeProps['variant']> => {
    switch (role) {
      case 'orgadmin':
        return 'danger';
      case 'sysadmin':
        return 'info';
      case 'developer':
        return 'info';
      case 'user':
        return 'success';
      case 'trial':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const sortUsers = useCallback(
    (list: User[], field: SortField, direction: SortDirection) => {
      const getRolesDisplay = (roles: string[]) => {
        if (!roles || roles.length === 0) return 'No roles';
        if (roles.length === 1 && roles[0]) return getRoleLabel(roles[0]);
        const priorityOrder = [
          'sysadmin',
          'developer',
          'orgadmin',
          'user',
          'trial',
        ];
        const sorted = [...roles].sort(
          (a, b) => priorityOrder.indexOf(a) - priorityOrder.indexOf(b)
        );
        return sorted.map(getRoleLabel).join(', ');
      };

      return [...list].sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;
        switch (field) {
          case 'name':
            aVal = `${a.givenName || ''} ${a.familyName || ''}`
              .toLowerCase()
              .trim();
            bVal = `${b.givenName || ''} ${b.familyName || ''}`
              .toLowerCase()
              .trim();
            break;
          case 'email':
            aVal = (a.email || '').toLowerCase();
            bVal = (b.email || '').toLowerCase();
            break;
          case 'username':
            aVal = (a.username || '').toLowerCase();
            bVal = (b.username || '').toLowerCase();
            break;
          case 'role':
            aVal = getRolesDisplay(a.systemRoles || []).toLowerCase();
            bVal = getRolesDisplay(b.systemRoles || []).toLowerCase();
            break;
          case 'status':
            aVal = a.isActive ? 1 : 0;
            bVal = b.isActive ? 1 : 0;
            break;
          case 'created':
            aVal = a.createdAt;
            bVal = b.createdAt;
            break;
          case 'lastSignIn':
            aVal = a.lastSignInAt || 0;
            bVal = b.lastSignInAt || 0;
            break;
          default:
            return 0;
        }
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    },
    []
  );

  const handleSort = (field: SortField) => {
    if (sortField === field)
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ChevronUp className="h-4 w-4 opacity-30" />;
    return sortDirection === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  // Filter + sort derive
  const applyFilters = useCallback(() => {
    let list = [...(organisationUsers || [])] as User[];
    if (searchTerm) {
      const t = searchTerm.toLowerCase();
      list = list.filter(
        (u) =>
          (u.givenName && u.givenName.toLowerCase().includes(t)) ||
          (u.familyName && u.familyName.toLowerCase().includes(t)) ||
          (u.fullName && u.fullName.toLowerCase().includes(t)) ||
          (u.email && u.email.toLowerCase().includes(t)) ||
          (u.username && u.username.toLowerCase().includes(t))
      );
    }
    if (roleFilter !== 'all')
      list = list.filter((u) => (u.systemRoles || []).includes(roleFilter));
    if (orgRoleFilter !== 'all')
      list = list.filter(
        (u) =>
          (u as unknown as { organisationalRole?: { id: string } })
            .organisationalRole?.id === orgRoleFilter
      );
    if (statusFilter !== 'all')
      list = list.filter((u) => u.isActive === (statusFilter === 'active'));
    setFilteredUsers(list);
  }, [organisationUsers, searchTerm, roleFilter, orgRoleFilter, statusFilter]);

  // effects

  // Re-run filters when data or filters change
  useEffect(() => {
    applyFilters();
  }, [
    organisationUsers,
    searchTerm,
    roleFilter,
    orgRoleFilter,
    statusFilter,
    applyFilters,
  ]);

  // Sort changes
  useEffect(() => {
    setSortedUsers(sortUsers(filteredUsers, sortField, sortDirection));
  }, [filteredUsers, sortField, sortDirection, sortUsers]);

  // Selection helpers
  const toggleSelectAll = () => {
    if (selectedUserIds.size === sortedUsers.length)
      setSelectedUserIds(new Set());
    else setSelectedUserIds(new Set(sortedUsers.map((u) => u._id)));
  };
  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Assign Roles
  const openAssignRoles = (target: User | null, bulk = false) => {
    setAssigningUser(bulk ? ({} as unknown as User) : target);
    const initialSys = target?.systemRoles || [];
    const clampedSys = initialSys.filter((r) =>
      assignableSystemRoles.includes(r)
    );
    setSelectedSystemRoles(clampedSys);
    // Preselect org roles from the target user's current assignments
    const preselectedOrgRoleIds = !bulk
      ? (
          (target as unknown as { organisationalRoles?: { id: string }[] })
            ?.organisationalRoles || []
        ).map((r) => r.id)
      : [];
    setSelectedOrgRoleIds(preselectedOrgRoleIds);
    setIsBulkAssign(bulk);
  };

  const submitAssignRoles = async () => {
    try {
      if (isBulkAssign) {
        const targets = sortedUsers.filter((u) => selectedUserIds.has(u._id));
        const updates = targets.map((u) =>
          fetch('/api/update-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: u.subject || u._id,
              systemRoles: selectedSystemRoles,
              organisationalRoleIds: selectedOrgRoleIds.length
                ? selectedOrgRoleIds
                : undefined,
              organisationId: currentUser?.organisationId,
            }),
          }).then(async (r) => {
            if (!r.ok) {
              const errorData = (await r.json()) as { error: string };
              throw new Error(errorData.error || 'Failed');
            }
          })
        );
        await Promise.all(updates);
        setSelectedUserIds(new Set());
      } else {
        if (!assigningUser?.subject && !assigningUser?._id) return;
        const res = await fetch('/api/update-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: assigningUser.subject || assigningUser._id,
            systemRoles: selectedSystemRoles,
            organisationalRoleIds: selectedOrgRoleIds.length
              ? selectedOrgRoleIds
              : undefined,
            organisationId: currentUser?.organisationId,
          }),
        });
        if (!res.ok) {
          const errorData = (await res.json()) as { error: string };
          throw new Error(errorData.error || 'Failed');
        }
      }
      setAssigningUser(null);
    } catch {
      // Error assigning user
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleDateString();
  };

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleToggleUserStatus = async (targetUser: User) => {
    if (!targetUser.subject) {
      // Cannot toggle status: User subject not found
      return;
    }

    setTogglingUserId(targetUser._id);

    try {
      const response = await fetch('/api/update-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: targetUser.subject,
          isActive: !targetUser.isActive,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error: string };
        throw new Error(errorData.error || 'Failed to update user status');
      }

      // The query will automatically refetch due to Convex reactivity
    } catch (error) {
      // Error toggling user status
      toast({
        title: 'Failed to update user status',
        description:
          error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setTogglingUserId(null);
    }
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
  };

  const handleConfirmDelete = async (userId: string) => {
    setIsDeleting(true);
    try {
      await deleteUser(userId);
      setDeletingUser(null);
      // The organisationUsers query will automatically refetch due to Convex reactivity
    } catch (err) {
      toast({
        title: 'Failed to delete user',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingUser(null);
  };

  if (!currentUser?.organisationId) {
    return (
      <Card>
        <CardContent className="p-6">
          <p>Loading organisation details...</p>
        </CardContent>
      </Card>
    );
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Organisation', href: '/organisation' },
    { label: 'Users' },
  ];

  const headerActions = (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <Button variant="outline" size="sm">
        <RefreshCw className="h-4 w-4 mr-2" />
        Sync
      </Button>
      <Button
        size="sm"
        onClick={() => setIsCreateDialogOpen(true)}
        data-testid="add-user-btn"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add User
      </Button>
    </div>
  );

  if (!isLoaded) {
    return null;
  }
  
  if (!isSignedIn || !user) {
    return null;
  }

  if (!user.organisationId) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Your account has not been assigned to an organisation yet.
      </div>
    );
  }

  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Organisation Users"
      subtitle="Manage users within your organisation"
      headerActions={headerActions}
    >
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>All users in your organisation</CardDescription>
            </div>
            <Badge variant="neutral" className="w-fit">
              {organisationUsers?.length || 0} total
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Toolbar */}
          <div className="app-surface rounded-2xl p-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Search users by name, email, or username..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:flex xl:flex-wrap xl:items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="shrink-0">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80 p-4">
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Role
                          </label>
                          <Select
                            value={roleFilter}
                            onValueChange={setRoleFilter}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All roles" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All roles</SelectItem>
                              {getUniqueRoles().map((role) => (
                                <SelectItem key={role} value={role}>
                                  {getRoleLabel(role)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Organisation Role
                          </label>
                          <Select
                            value={orgRoleFilter}
                            onValueChange={setOrgRoleFilter}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All org roles" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All org roles</SelectItem>
                              {(orgRoles || []).map(
                                (r: { _id: string; name: string }) => (
                                  <SelectItem key={r._id} value={r._id}>
                                    {r.name}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">
                            Status
                          </label>
                          <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="All status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All status</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex justify-end border-t pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm('');
                            setRoleFilter('all');
                            setOrgRoleFilter('all');
                            setStatusFilter('all');
                          }}
                        >
                          Clear All
                        </Button>
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                {selectedUserIds.size > 0 && (
                  <Button size="sm" onClick={() => openAssignRoles(null, true)}>
                    <UserCog className="h-4 w-4 mr-2" />
                    Bulk Assign ({selectedUserIds.size})
                  </Button>
                )}
                <Button variant="outline" size="sm" className="shrink-0">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {searchTerm && (
                <Badge variant="outline">Search: {searchTerm}</Badge>
              )}
              {roleFilter !== 'all' && (
                <Badge variant="outline">
                  Role: {getRoleLabel(roleFilter)}
                </Badge>
              )}
              {statusFilter !== 'all' && (
                <Badge variant="outline">Status: {statusFilter}</Badge>
              )}
              {orgRoleFilter !== 'all' && (
                <Badge variant="outline">Filtered org role</Badge>
              )}
            </div>
          </div>

          {sortedUsers && sortedUsers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[32px] text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedUserIds.size === sortedUsers.length &&
                        sortedUsers.length > 0
                      }
                      onChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead
                    className="w-[18%] cursor-pointer text-center"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Name {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[18%] cursor-pointer text-center"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Email {getSortIcon('email')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[12%] cursor-pointer text-center"
                    onClick={() => handleSort('username')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Username {getSortIcon('username')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[16%] cursor-pointer text-center"
                    onClick={() => handleSort('role')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      System Roles {getSortIcon('role')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[16%] text-center">
                    Organisation Role
                  </TableHead>
                  <TableHead
                    className="w-[10%] cursor-pointer text-center"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Status {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[12%] cursor-pointer text-center"
                    onClick={() => handleSort('created')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Created {getSortIcon('created')}
                    </div>
                  </TableHead>
                  <TableHead
                    className="w-[12%] cursor-pointer text-center"
                    onClick={() => handleSort('lastSignIn')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      Last Sign In {getSortIcon('lastSignIn')}
                    </div>
                  </TableHead>
                  <TableHead className="w-[8%] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={selectedUserIds.has(user._id)}
                        onChange={() => toggleSelectUser(user._id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {user.pictureUrl ? (
                          <img
                            src={user.pictureUrl}
                            alt={`${user.fullName} avatar`}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium">
                            {user.fullName}
                          </div>
                          <div className="truncate text-sm text-muted-foreground">
                            {user.username ||
                              `${user.givenName} ${user.familyName}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.username || 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {(user.systemRoles || []).length === 0 ? (
                          <Badge variant="neutral">None</Badge>
                        ) : (
                          user.systemRoles.map((r) => (
                            <Badge key={r} variant={getRoleBadgeClass(r)}>
                              {getRoleLabel(r)}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2 justify-center">
                        <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                        <div className="flex flex-wrap gap-1 justify-center">
                          {(
                            user as unknown as {
                              organisationalRoles?: Array<{
                                id: string;
                                name: string;
                              }>;
                            }
                          ).organisationalRoles &&
                          (
                            user as unknown as {
                              organisationalRoles?: Array<{
                                id: string;
                                name: string;
                              }>;
                            }
                          ).organisationalRoles!.length > 0 ? (
                            (
                              user as unknown as {
                                organisationalRoles: Array<{
                                  id: string;
                                  name: string;
                                }>;
                              }
                            ).organisationalRoles.map((r) => (
                              <Badge key={r.id} variant="neutral">
                                {r.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm">—</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {user.isActive ? (
                        <Badge variant="success">
                          <UserCheck className="mr-1 h-3.5 w-3.5" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <UserX className="mr-1 h-3.5 w-3.5" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell className="text-center">
                      {user.lastSignInAt
                        ? formatDateTime(user.lastSignInAt)
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-9 w-9 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => openAssignRoles(user, false)}
                          >
                            <UserCog className="mr-2 h-4 w-4" />
                            <span>Assign Roles</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleUserStatus(user)}
                            disabled={togglingUserId === user._id}
                          >
                            {togglingUserId === user._id ? (
                              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            ) : user.isActive ? (
                              <UserX className="mr-2 h-4 w-4" />
                            ) : (
                              <UserCheck className="mr-2 h-4 w-4" />
                            )}
                            <span>
                              {user.isActive
                                ? 'Deactivate User'
                                : 'Activate User'}
                            </span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit User</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.isActive}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete User</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="rounded-2xl border border-dashed border-border/80 bg-white/65 py-12 text-center">
              <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">No users found</h3>
              <p className="mb-4 text-muted-foreground">
                Get started by adding your first user to the organisation.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First User
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Roles Modal */}
      {assigningUser && (
        <Dialog
          open
          onOpenChange={(o) => {
            if (!o) setAssigningUser(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Roles</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium mb-2">System Roles</div>
                <div className="flex flex-wrap gap-2">
                  {assignableSystemRoles.map((role) => {
                    const checked = selectedSystemRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() =>
                          setSelectedSystemRoles(
                            checked
                              ? selectedSystemRoles.filter((r) => r !== role)
                              : [...selectedSystemRoles, role]
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${checked ? 'border-primary bg-primary text-white' : 'border-border bg-white/85 text-foreground hover:bg-accent'}`}
                      >
                        {getRoleLabel(role)}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">
                  Organisation Roles
                </div>
                <div className="flex flex-wrap gap-2">
                  {(orgRoles || []).map((r: { _id: string; name: string }) => {
                    const checked = selectedOrgRoleIds.includes(r._id);
                    return (
                      <button
                        key={r._id}
                        type="button"
                        onClick={() =>
                          setSelectedOrgRoleIds(
                            checked
                              ? selectedOrgRoleIds.filter((id) => id !== r._id)
                              : [...selectedOrgRoleIds, r._id]
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${checked ? 'border-primary bg-primary text-white' : 'border-border bg-white/85 text-foreground hover:bg-accent'}`}
                      >
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAssigningUser(null)}
                >
                  Cancel
                </Button>
                <Button onClick={submitAssignRoles}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserForm
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={() => {
            setEditingUser(null);
            // The query will automatically refetch
          }}
        />
      )}

      {/* Create User Modal */}
      {isCreateDialogOpen && (
        <CreateUserForm
          organisationId={currentUser.organisationId}
          onClose={() => setIsCreateDialogOpen(false)}
          onUserCreated={() => {
            setIsCreateDialogOpen(false);
            // The query will automatically refetch
          }}
        />
      )}

      {/* Delete User Modal */}
      {deletingUser && (
        <DeleteConfirmationModal
          user={{
            id: deletingUser.subject || deletingUser._id,
            firstName: deletingUser.givenName,
            lastName: deletingUser.familyName,
            email: deletingUser.email,
            roles: deletingUser.systemRoles,
          }}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDeleting={isDeleting}
        />
      )}
    </StandardizedSidebarLayout>
  );
}
