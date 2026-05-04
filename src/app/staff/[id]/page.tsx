'use client';

import { useAuthUser } from '@/hooks/useAuthUser';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAcademicYear } from '@/components/providers/AcademicYearProvider';
import { PermissionGate } from '@/components/common/PermissionGate';
import {
  CheckCircle,
  AlertTriangle,
  User,
  Link2,
  RefreshCw,
  Edit,
  Shield,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { withToast } from '@/lib/utils';
import { EditStaffForm } from '@/components/domain/EditStaffForm';
import { DeactivateConfirmationModal } from '@/components/domain/DeactivateConfirmationModal';
import type { Doc } from '@/convex/_generated/dataModel';

// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

interface AdminAllocation {
  _id: Id<'admin_allocations'>;
  categoryId: string;
  hours: number;
  isCustom: boolean;
  customLabel?: string;
  comment?: string;
}

interface GroupAllocation {
  _id: Id<'group_allocations'>;
  moduleId: Id<'modules'>;
  hours: number;
  type: string;
}

interface LecturerAllocationDetail {
  allocation: Doc<'group_allocations'>;
  group: Doc<'module_groups'> | null;
  iteration: Doc<'module_iterations'> | null;
  module: Doc<'modules'> | null;
}

export default function LecturerProfilePage() {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  const params = useParams();
  const { toast } = useToast();
  const profileId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showLinkConfirm, setShowLinkConfirm] = useState(false);

  const profile = useQuery(
    api.staff.get,
    profileId ? { profileId: profileId as Id<'lecturer_profiles'> } : 'skip'
  );

  const { currentYear } = useAcademicYear();
  const _adminAllocations = useQuery(
    api.allocations.listAdminAllocations,
    profileId && currentYear?._id
      ? {
          lecturerId: profileId as Id<'lecturer_profiles'>,
          academicYearId: currentYear._id,
        }
      : 'skip'
  ) as AdminAllocation[] | undefined;
  const _groupAllocations = useQuery(
    api.allocations.listForLecturer,
    'skip'
  ) as GroupAllocation[] | undefined;

  // Permission checks
  const canEdit = useQuery(api.permissions.hasPermission, {
    userId: user?.id || '',
    permissionId: 'staff.edit',
  });

  const _canDeactivate = useQuery(api.permissions.hasPermission, {
    userId: user?.id || '',
    permissionId: 'staff.edit', // Using edit permission for deactivate
  });

  // Check if email matches WorkOS user
  const workosUser = useQuery(
    api.users.getByEmail,
    profile?.email ? { email: profile.email } : 'skip'
  );

  const editMutation = useMutation(api.staff.edit);
  const deactivateMutation = useMutation(api.staff.edit);
  const updateUserAvatarMutation = useMutation(api.users.updateUserAvatar);

  const handleEdit = async (
    formData: Partial<{
      _id: string;
      fullName: string;
      email: string;
      contract: string;
      fte: number;
      maxTeachingHours: number;
      totalContract: number;
      role?: string;
      teamName?: string;
      prefWorkingLocation?: string;
      prefSpecialism?: string;
      prefNotes?: string;
      isActive: boolean;
      contractFamily?: string;
      prefWorkingTime?: 'am' | 'pm' | 'all_day';
    }>
  ) => {
    try {
      await editMutation({
        profileId: profileId as Id<'lecturer_profiles'>,
        ...formData,
        userId: user?.id || '',
      });

      setIsEditing(false);
      toast({
        title: 'Profile Updated',
        description: 'Lecturer profile has been updated successfully.',
      });
    } catch {
      toast({
        title: 'Update Failed',
        description: 'Failed to update lecturer profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleLinkUser = async () => {
    if (!profile || !workosUser) return;
    try {
      await editMutation({
        profileId: profileId as Id<'lecturer_profiles'>,
        userSubject: workosUser.subject,
        userId: user?.id || '',
      });
      toast({
        title: 'Profile linked',
        description: 'Lecturer profile linked to user account.',
      });
      // ensure UI shows linked state immediately
      window.location.reload();
    } catch (e) {
      toast({
        title: 'Link failed',
        description: e instanceof Error ? e.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleSyncAvatar = async () => {
    if (!workosUser?.subject || !workosUser?.pictureUrl) return;
    try {
      // call users.updateUserAvatar to sync from WorkOS
      await updateUserAvatarMutation({
        subject: workosUser.subject,
        pictureUrl: workosUser.pictureUrl,
      });
      toast({
        title: 'Avatar synced',
        description: 'Profile picture synced from WorkOS.',
      });
    } catch (e) {
      toast({
        title: 'Avatar sync failed',
        description: e instanceof Error ? e.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleDeactivate = async () => {
    try {
      await deactivateMutation({
        profileId: profileId as Id<'lecturer_profiles'>,
        isActive: false,
        userId: user?.id || '',
      });

      setShowDeactivateModal(false);
      toast({
        title: 'Profile Deactivated',
        description: 'Lecturer profile has been deactivated.',
      });
    } catch {
      toast({
        title: 'Deactivation Failed',
        description: 'Failed to deactivate lecturer profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleReactivate = async () => {
    try {
      await deactivateMutation({
        profileId: profileId as Id<'lecturer_profiles'>,
        isActive: true,
        userId: user?.id || '',
      });

      toast({
        title: 'Profile Reactivated',
        description: 'Lecturer profile has been reactivated.',
      });
    } catch {
      toast({
        title: 'Reactivation Failed',
        description: 'Failed to reactivate lecturer profile. Please try again.',
      });
    }
  };

  if (!profile) {
    return (
      <StandardizedSidebarLayout
        breadcrumbs={[{ label: 'Staff', href: '/staff' }, { label: 'Profile' }]}
        title="Lecturer Profile"
      >
        <div className="text-sm text-muted-foreground">Loading…</div>
      </StandardizedSidebarLayout>
    );
  }

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
      breadcrumbs={[
        { label: 'Staff', href: '/staff' },
        { label: profile.fullName },
      ]}
      title={profile.fullName}
      subtitle={profile.email}
      headerActions={
        <div className="flex items-center gap-2">
          {profile.isActive ? (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Active
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Inactive
            </Badge>
          )}

          {profile?.userSubject ? (
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-emerald-300 bg-emerald-100 text-emerald-700"
              title="Profile is linked to a WorkOS user"
            >
              <CheckCircle className="h-3 w-3" />
              Linked to WorkOS
            </Badge>
          ) : (
            workosUser && (
              <>
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  WorkOS User
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLinkConfirm(true)}
                  title="Link profile to user"
                >
                  <Link2 className="h-4 w-4 mr-2" /> Link
                </Button>
              </>
            )
          )}
          {workosUser?.pictureUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncAvatar}
              title="Sync avatar from WorkOS"
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Sync Avatar
            </Button>
          )}

          <PermissionGate permission="staff.edit" fallback={null}>
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>

                {profile.isActive ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeactivateModal(true)}
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReactivate}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Reactivate
                  </Button>
                )}
              </>
            )}
          </PermissionGate>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Role: {profile.role || '—'}</div>
            <div>Team: {profile.teamName || '—'}</div>
            <div>Contract: {profile.contract}</div>
            <div>FTE: {profile.fte}</div>
            <div>Max Teaching: {profile.maxTeachingHours}h</div>
            <div>Total Contract: {profile.totalContract}h</div>
            <div>Pref Location: {profile.prefWorkingLocation || '—'}</div>
            <div>
              Pref Working Time:{' '}
              {profile.prefWorkingTime === 'am'
                ? 'AM'
                : profile.prefWorkingTime === 'pm'
                  ? 'PM'
                  : profile.prefWorkingTime === 'all_day'
                    ? 'All day'
                    : '—'}
            </div>
            <div>Specialism: {profile.prefSpecialism || '—'}</div>
            <div>Notes: {profile.prefNotes || '—'}</div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Module Allocations (current AY)</CardTitle>
          </CardHeader>
          <CardContent>
            <ModuleAllocationsTable lecturerId={profile._id} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Admin Allocations</CardTitle>
          </CardHeader>
          <CardContent>
            <AdminAllocationsTable lecturerId={profile._id} />
          </CardContent>
        </Card>
      </div>

      {/* Edit Form Modal */}
      {isEditing && (
        <EditStaffForm
          profile={profile}
          onSave={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && (
        <DeactivateConfirmationModal
          profileName={profile.fullName}
          onConfirm={handleDeactivate}
          onCancel={() => setShowDeactivateModal(false)}
        />
      )}

      {/* Link Confirmation */}
      <Dialog open={showLinkConfirm} onOpenChange={setShowLinkConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Profile to WorkOS User</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <div>
              This will link this lecturer profile to the WorkOS account:
            </div>
            <div className="rounded border p-2 text-xs">
              <div>
                <span className="font-medium">Name:</span>{' '}
                {workosUser?.givenName} {workosUser?.familyName}
              </div>
              <div>
                <span className="font-medium">Email:</span> {workosUser?.email}
              </div>
            </div>
            <div className="text-muted-foreground">
              You can change this later by editing the profile.
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLinkConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={async () => {
                await handleLinkUser();
                setShowLinkConfirm(false);
              }}
            >
              Confirm Link
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </StandardizedSidebarLayout>
  );
}

function ModuleAllocationsTable({
  lecturerId,
}: {
  lecturerId: Id<'lecturer_profiles'>;
}) {
  const { currentYear } = useAcademicYear();
  const rows = useQuery(
    api.allocations.listForLecturerDetailed,
    currentYear?._id
      ? {
          lecturerId: lecturerId,
          academicYearId: currentYear._id,
        }
      : 'skip'
  ) as LecturerAllocationDetail[] | undefined;
  const [sortBy, setSortBy] = useState<'module' | 'hours' | 'type'>('module');
  const [typeFilter, setTypeFilter] = useState<'all' | 'teaching' | 'admin'>(
    'all'
  );

  const data = (rows || [])
    .filter((r) => typeFilter === 'all' || r.allocation.type === typeFilter)
    .sort((a, b) => {
      if (sortBy === 'hours') {
        const ha =
          typeof a.allocation.hoursOverride === 'number'
            ? a.allocation.hoursOverride
            : a.allocation.hoursComputed || 0;
        const hb =
          typeof b.allocation.hoursOverride === 'number'
            ? b.allocation.hoursOverride
            : b.allocation.hoursComputed || 0;
        return hb - ha;
      }
      if (sortBy === 'type')
        return a.allocation.type.localeCompare(b.allocation.type);
      const ma = (a.module?.code || '') + (a.module?.name || '');
      const mb = (b.module?.code || '') + (b.module?.name || '');
      return ma.localeCompare(mb);
    });

  const handleExport = () => {
    const headers = ['Module Code', 'Module Name', 'Group', 'Type', 'Hours'];
    const rowsCsv = data.map(({ allocation, group, module }) => {
      const hours =
        typeof allocation.hoursOverride === 'number'
          ? allocation.hoursOverride
          : allocation.hoursComputed || 0;
      return [
        module?.code || '',
        module?.name || '',
        group?.name || '',
        allocation.type,
        String(hours),
      ];
    });
    const csv = [headers, ...rowsCsv]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `module-allocations-${currentYear?.name || 'year'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="text-sm text-muted-foreground flex-1">
          Academic Year: {currentYear?.name}
        </div>
        <div className="text-sm">
          <label className="mr-2">Type</label>
          <select
            className="border rounded px-2 py-1"
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as 'all' | 'teaching' | 'admin')
            }
          >
            <option value="all">All</option>
            <option value="teaching">Teaching</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="text-sm">
          <label className="mr-2">Sort</label>
          <select
            className="border rounded px-2 py-1"
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as 'module' | 'hours' | 'type')
            }
          >
            <option value="module">Module</option>
            <option value="hours">Hours</option>
            <option value="type">Type</option>
          </select>
        </div>
        <Button size="sm" onClick={handleExport}>
          Export CSV
        </Button>
      </div>

      {!Array.isArray(rows) ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : data.length === 0 ? (
        <div className="text-sm text-muted-foreground">No allocations</div>
      ) : (
        <ul className="divide-y border rounded">
          {data.map(({ allocation, group, module }) => {
            const hours =
              typeof allocation.hoursOverride === 'number'
                ? allocation.hoursOverride
                : allocation.hoursComputed || 0;
            return (
              <li
                key={String(allocation._id)}
                className="p-2 flex items-center justify-between text-sm"
              >
                <div>
                  <div className="font-medium">
                    {module?.code || ''} — {module?.name || ''}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Group: {group?.name || ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="capitalize">{allocation.type}</div>
                  <div className="font-medium">{hours}h</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function AdminAllocationsTable({
  lecturerId,
}: {
  lecturerId: Id<'lecturer_profiles'>;
}) {
  const { currentYear } = useAcademicYear();
  const { user } = useAuthUser();
  const { toast } = useToast();
  const orgCategories = useQuery(
    api.allocations.listOrganisationAdminCategories,
    user?.id ? { userId: user.id } : 'skip'
  );
  const sysCategories = useQuery(api.allocations.listAdminCategories, {});
  const categories =
    orgCategories && orgCategories.length > 0 ? orgCategories : sysCategories;
  const rows = useQuery(
    api.allocations.listAdminAllocations,
    currentYear?._id
      ? {
          lecturerId: lecturerId,
          academicYearId: currentYear._id,
        }
      : 'skip'
  ) as
    | Array<{
        allocation: Doc<'admin_allocations'>;
        category:
          | Doc<'admin_allocation_categories'>
          | Doc<'organisation_admin_allocation_categories'>
          | null;
      }>
    | undefined;
  const upsert = useMutation(api.allocations.upsertAdminAllocation);
  const remove = useMutation(api.allocations.removeAdminAllocation);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState<null | {
    id?: Id<'admin_allocations'>;
    categoryId?: string;
    hours: string;
    isCustom?: boolean;
    customLabel?: string;
    comment?: string;
  }>(null);
  const handleSave = async () => {
    if (!formOpen) return;
    const hours = Number(formOpen.hours);
    if (!Number.isFinite(hours) || hours < 0 || hours > 1000) {
      toast({
        title: 'Invalid hours',
        description: 'Enter a number between 0 and 1000',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(formOpen.id || 'new');
    try {
      await withToast(
        () =>
          upsert({
            userId: user!.id,
            lecturerId: lecturerId,
            academicYearId: currentYear!._id,
            ...(formOpen.isCustom
              ? {
                  isCustom: true,
                  customLabel: formOpen.customLabel || '',
                  comment: formOpen.comment || '',
                }
              : { categoryId: formOpen.categoryId || '' }),
            hours,
            ...(formOpen.id ? { allocationId: formOpen.id } : {}),
          }),
        {
          success: {
            title: formOpen.id ? 'Allocation updated' : 'Allocation created',
          },
          error: { title: 'Save failed' },
        },
        toast
      );
      setFormOpen(null);
    } finally {
      setIsSaving(null);
    }
  };

  const handleRemove = async (allocationId: Id<'admin_allocations'>) => {
    if (!confirm('Remove allocation?')) return;
    setIsRemoving(allocationId);
    try {
      await withToast(
        () => remove({ userId: user!.id, allocationId: allocationId }),
        {
          success: { title: 'Allocation removed' },
          error: { title: 'Remove failed' },
        },
        toast
      );
    } finally {
      setIsRemoving(null);
    }
  };

  if (!currentYear)
    return (
      <div className="text-sm text-muted-foreground">
        Select an academic year
      </div>
    );

  const totalAdminHours = (rows || []).reduce(
    (acc, r) => acc + (Number(r?.allocation?.hours) || 0),
    0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground flex items-center gap-3">
          <span>Academic Year: {currentYear.name}</span>
          <Badge variant="outline" className="text-xs">
            Admin total: {totalAdminHours}h
          </Badge>
        </div>
        <Button
          size="sm"
          onClick={() =>
            setFormOpen({
              categoryId: categories?.[0]?._id ? String(categories[0]._id) : '',
              hours: '',
              isCustom: false,
            })
          }
          disabled={isSaving !== null}
        >
          Add
        </Button>
      </div>
      {!Array.isArray(rows) ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No admin allocations
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map(({ allocation, category }) => (
            <div
              key={String(allocation._id)}
              className="flex items-center justify-between border rounded p-2 text-sm"
            >
              <div>
                <div className="font-medium">
                  {allocation.isCustom && allocation.customLabel
                    ? allocation.customLabel
                    : category?.name || allocation.categoryId}
                </div>
                {category?.description && (
                  <div className="text-xs text-muted-foreground">
                    {category.description}
                  </div>
                )}
                {allocation.isCustom && allocation.comment && (
                  <div className="text-xs text-muted-foreground">
                    {allocation.comment}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {allocation.hours}h
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isSaving !== null}
                  onClick={() =>
                    setFormOpen({
                      id: allocation._id,
                      categoryId: String(allocation.categoryId),
                      hours: String(allocation.hours),
                    })
                  }
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={isRemoving === String(allocation._id)}
                  onClick={() => handleRemove(allocation._id)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
      {formOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-background border rounded-md p-4 w-full max-w-md space-y-3">
            <div className="font-medium">
              {formOpen.id ? 'Edit Admin Allocation' : 'Add Admin Allocation'}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category</Label>
                <label className="text-xs inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={Boolean(formOpen.isCustom)}
                    onChange={(e) =>
                      setFormOpen(
                        (f) => f && { ...f, isCustom: e.target.checked }
                      )
                    }
                  />
                  Custom
                </label>
              </div>
              {formOpen.isCustom ? (
                <div className="space-y-2">
                  <Input
                    placeholder="Custom category label"
                    value={formOpen.customLabel || ''}
                    onChange={(e) =>
                      setFormOpen(
                        (f) => f && { ...f, customLabel: e.target.value }
                      )
                    }
                  />
                  <Input
                    placeholder="Comment (optional)"
                    value={formOpen.comment || ''}
                    onChange={(e) =>
                      setFormOpen((f) => f && { ...f, comment: e.target.value })
                    }
                  />
                </div>
              ) : (
                <select
                  className="w-full border rounded px-2 py-1"
                  value={formOpen.categoryId}
                  onChange={(e) =>
                    setFormOpen(
                      (f) => f && { ...f, categoryId: e.target.value }
                    )
                  }
                >
                  {(categories || []).map((c) => (
                    <option key={String(c._id)} value={String(c._id)}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <Label>Hours</Label>
              <Input
                value={formOpen.hours}
                onChange={(e) =>
                  setFormOpen((f) => f && { ...f, hours: e.target.value })
                }
                type="number"
                min="0"
                max="1000"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFormOpen(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving !== null}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
