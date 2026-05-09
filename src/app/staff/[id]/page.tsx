'use client';

import { useAuthUser } from '@/hooks/useAuthUser';
import { useParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Doc, Id } from '@/convex/_generated/dataModel';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAcademicYear } from '@/components/providers/AcademicYearProvider';
import { PermissionGate } from '@/components/common/PermissionGate';
import {
  AlertTriangle,
  CheckCircle,
  Edit,
  Link2,
  Shield,
  User,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { withToast } from '@/lib/utils';
import { toDisplayLabel } from '@/lib/formatters';
import { EditStaffForm } from '@/components/domain/EditStaffForm';
import { DeactivateConfirmationModal } from '@/components/domain/DeactivateConfirmationModal';

export const dynamic = 'force-dynamic';

type PreferredWorkingTime = 'am' | 'pm' | 'all_day';

type OwnStaffPreferencesFormData = {
  prefWorkingLocation?: string;
  prefWorkingTime?: PreferredWorkingTime;
  prefSpecialism?: string;
  prefNotes?: string;
};

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

function formatPreferredWorkingTime(value?: string) {
  switch (value) {
    case 'am':
      return 'AM';
    case 'pm':
      return 'PM';
    case 'all_day':
      return 'All day';
    default:
      return '—';
  }
}

function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        'grid grid-cols-[7.25rem_1fr] gap-3 border-b border-border/50 py-2 last:border-b-0',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

export default function LecturerProfilePage() {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });

  const params = useParams();
  const { toast } = useToast();
  const { currentYear } = useAcademicYear();
  const profileId = params.id as string;

  const [isEditing, setIsEditing] = useState(false);
  const [isEditingOwnPreferences, setIsEditingOwnPreferences] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showLinkConfirm, setShowLinkConfirm] = useState(false);

  const profile = useQuery(
    api.staff.get,
    profileId ? { profileId: profileId as Id<'lecturer_profiles'> } : 'skip'
  );

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

  const canEdit = useQuery(api.permissions.hasPermission, {
    userId: user?.id || '',
    permissionId: 'staff.edit',
  });

  const _canDeactivate = useQuery(api.permissions.hasPermission, {
    userId: user?.id || '',
    permissionId: 'staff.edit',
  });

  const workosUser = useQuery(
    api.users.getByEmail,
    profile?.email ? { email: profile.email } : 'skip'
  );

  const editMutation = useMutation(api.staff.edit);
  const deactivateMutation = useMutation(api.staff.edit);
  const updateOwnPreferencesMutation = useMutation(
    api.staff.updateOwnPreferences
  );

  const isOwnLinkedProfile = Boolean(
    profile?.userSubject && user?.id && profile.userSubject === user.id
  );

  const handleUpdateOwnPreferences = async (
    formData: OwnStaffPreferencesFormData
  ) => {
    try {
      await updateOwnPreferencesMutation({
        profileId: profileId as Id<'lecturer_profiles'>,
        userId: user?.id || '',
        prefWorkingLocation: formData.prefWorkingLocation?.trim() ?? '',
        ...(formData.prefWorkingTime
          ? { prefWorkingTime: formData.prefWorkingTime }
          : {}),
        prefSpecialism: formData.prefSpecialism?.trim() ?? '',
        prefNotes: formData.prefNotes?.trim() ?? '',
      });

      setIsEditingOwnPreferences(false);

      toast({
        title: 'Preferences updated',
        description: 'Your staff profile preferences have been updated.',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update your profile preferences.',
        variant: 'destructive',
      });
    }
  };

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
      prefWorkingTime?: PreferredWorkingTime;
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
        title: 'Profile updated',
        description: 'Lecturer profile has been updated successfully.',
      });
    } catch {
      toast({
        title: 'Update failed',
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

      window.location.reload();
    } catch (error) {
      toast({
        title: 'Link failed',
        description:
          error instanceof Error ? error.message : 'An error occurred',
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
        title: 'Profile deactivated',
        description: 'Lecturer profile has been deactivated.',
      });
    } catch {
      toast({
        title: 'Deactivation failed',
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
        title: 'Profile reactivated',
        description: 'Lecturer profile has been reactivated.',
      });
    } catch {
      toast({
        title: 'Reactivation failed',
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

  if (!isLoaded) return null;
  if (!isSignedIn || !user) return null;

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

          {profile.userSubject ? (
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
                  <Link2 className="mr-2 h-4 w-4" />
                  Link
                </Button>
              </>
            )
          )}

          <PermissionGate permission="staff.edit" fallback={null}>
            {canEdit ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>

                {profile.isActive ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeactivateModal(true)}
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReactivate}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Reactivate
                  </Button>
                )}
              </>
            ) : null}
          </PermissionGate>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="md:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle>Details</CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <section aria-labelledby="employment-details-heading">
            <h3
              id="employment-details-heading"
              className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            >
              Employment details
            </h3>

            <dl className="rounded-lg border border-border/60 bg-muted/20 px-4 py-2">
              <DetailRow label="Role" value={toDisplayLabel(profile.role)} />
              <DetailRow label="Team" value={profile.teamName || '—'} />
              <DetailRow label="Contract" value={profile.contract || '—'} />
              <DetailRow label="FTE" value={profile.fte ?? '—'} />
              <DetailRow
                label="Max teaching"
                value={
                  typeof profile.maxTeachingHours === 'number'
                    ? `${profile.maxTeachingHours}h`
                    : '—'
                }
              />
              <DetailRow
                label="Total contract"
                value={
                  typeof profile.totalContract === 'number'
                    ? `${profile.totalContract}h`
                    : '—'
                }
              />
            </dl>
          </section>

          <section aria-labelledby="preferences-heading">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3
                id="preferences-heading"
                className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                Preferences
              </h3>

              {isOwnLinkedProfile ? (
                <TooltipProvider delayDuration={150}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full"
                        onClick={() => setIsEditingOwnPreferences(true)}
                        aria-label="Edit your staff profile preferences"
                      >
                        <Edit className="h-3.5 w-3.5" aria-hidden="true" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="left" align="center">
                      Edit your preferred location, working time, specialism and notes
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>

            <dl className="rounded-lg border border-border/60 bg-background px-4 py-2">
              <DetailRow
                label="Location"
                value={profile.prefWorkingLocation || '—'}
              />
              <DetailRow
                label="Working time"
                value={formatPreferredWorkingTime(profile.prefWorkingTime)}
              />
              <DetailRow
                label="Specialism"
                value={profile.prefSpecialism || '—'}
              />
              <DetailRow
                label="Notes"
                value={
                  profile.prefNotes ? (
                    <span className="whitespace-pre-wrap break-words">
                      {profile.prefNotes}
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
            </dl>
          </section>
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
            <AdminAllocationsTable
              lecturerId={profile._id}
              canManageAllocations={Boolean(canEdit)}
            />
          </CardContent>
        </Card>
      </div>

      {isEditingOwnPreferences ? (
        <EditOwnStaffPreferencesDialog
          open={isEditingOwnPreferences}
          profile={profile}
          onOpenChange={setIsEditingOwnPreferences}
          onSave={handleUpdateOwnPreferences}
        />
      ) : null}

      {isEditing ? (
        <EditStaffForm
          profile={profile}
          onSave={handleEdit}
          onCancel={() => setIsEditing(false)}
        />
      ) : null}

      {showDeactivateModal ? (
        <DeactivateConfirmationModal
          profileName={profile.fullName}
          onConfirm={handleDeactivate}
          onCancel={() => setShowDeactivateModal(false)}
        />
      ) : null}

      <Dialog open={showLinkConfirm} onOpenChange={setShowLinkConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link Profile to WorkOS User</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 text-sm">
            <div>This will link this lecturer profile to the WorkOS account:</div>

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
          lecturerId,
          academicYearId: currentYear._id,
        }
      : 'skip'
  ) as LecturerAllocationDetail[] | undefined;

  const [sortBy, setSortBy] = useState<'module' | 'hours' | 'type'>('module');
  const [typeFilter, setTypeFilter] = useState<'all' | 'teaching' | 'admin'>(
    'all'
  );

  const data = (rows || [])
    .filter((row) => typeFilter === 'all' || row.allocation.type === typeFilter)
    .sort((a, b) => {
      if (sortBy === 'hours') {
        const aHours =
          typeof a.allocation.hoursOverride === 'number'
            ? a.allocation.hoursOverride
            : a.allocation.hoursComputed || 0;
        const bHours =
          typeof b.allocation.hoursOverride === 'number'
            ? b.allocation.hoursOverride
            : b.allocation.hoursComputed || 0;

        return bHours - aHours;
      }

      if (sortBy === 'type') {
        return a.allocation.type.localeCompare(b.allocation.type);
      }

      const aModule = (a.module?.code || '') + (a.module?.name || '');
      const bModule = (b.module?.code || '') + (b.module?.name || '');

      return aModule.localeCompare(bModule);
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
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = `module-allocations-${currentYear?.name || 'year'}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3">
        <div className="flex-1 text-sm text-muted-foreground">
          Academic Year: {currentYear?.name}
        </div>

        <div className="text-sm">
          <label className="mr-2">Type</label>
          <select
            className="rounded border px-2 py-1"
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as 'all' | 'teaching' | 'admin')
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
            className="rounded border px-2 py-1"
            value={sortBy}
            onChange={(event) =>
              setSortBy(event.target.value as 'module' | 'hours' | 'type')
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
        <ul className="divide-y rounded border">
          {data.map(({ allocation, group, module }) => {
            const hours =
              typeof allocation.hoursOverride === 'number'
                ? allocation.hoursOverride
                : allocation.hoursComputed || 0;

            return (
              <li
                key={String(allocation._id)}
                className="flex items-center justify-between p-2 text-sm"
              >
                <div>
                  <div className="font-medium">
                    {module?.code || ''} - {module?.name || ''}
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
  canManageAllocations,
}: {
  lecturerId: Id<'lecturer_profiles'>;
  canManageAllocations: boolean;
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
          lecturerId,
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
    if (!canManageAllocations || !formOpen || !currentYear || !user) return;

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
            userId: user.id,
            lecturerId,
            academicYearId: currentYear._id,
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
    if (!canManageAllocations || !user) return;
    if (!confirm('Remove allocation?')) return;

    setIsRemoving(allocationId);

    try {
      await withToast(
        () => remove({ userId: user.id, allocationId }),
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

  if (!currentYear) {
    return (
      <div className="text-sm text-muted-foreground">
        Select an academic year
      </div>
    );
  }

  const totalAdminHours = (rows || []).reduce(
    (acc, row) => acc + (Number(row?.allocation?.hours) || 0),
    0
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Academic Year: {currentYear.name}</span>
          <Badge variant="outline" className="text-xs">
            Admin total: {totalAdminHours}h
          </Badge>
        </div>

        {canManageAllocations ? (
          <Button
            size="sm"
            onClick={() =>
              setFormOpen({
                categoryId: categories?.[0]?._id
                  ? String(categories[0]._id)
                  : '',
                hours: '',
                isCustom: false,
              })
            }
            disabled={isSaving !== null}
          >
            Add
          </Button>
        ) : null}
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
              className="flex items-center justify-between rounded border p-2 text-sm"
            >
              <div>
                <div className="font-medium">
                  {allocation.isCustom && allocation.customLabel
                    ? allocation.customLabel
                    : category?.name || allocation.categoryId}
                </div>

                {category?.description ? (
                  <div className="text-xs text-muted-foreground">
                    {category.description}
                  </div>
                ) : null}

                {allocation.isCustom && allocation.comment ? (
                  <div className="text-xs text-muted-foreground">
                    {allocation.comment}
                  </div>
                ) : null}

                <div className="text-xs text-muted-foreground">
                  {allocation.hours}h
                </div>
              </div>

              {canManageAllocations ? (
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
              ) : null}
            </div>
          ))}
        </div>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="w-full max-w-md space-y-3 rounded-md border bg-background p-4">
            <div className="font-medium">
              {formOpen.id ? 'Edit Admin Allocation' : 'Add Admin Allocation'}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Category</Label>
                <label className="inline-flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={Boolean(formOpen.isCustom)}
                    onChange={(event) =>
                      setFormOpen(
                        (current) =>
                          current && {
                            ...current,
                            isCustom: event.target.checked,
                          }
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
                    onChange={(event) =>
                      setFormOpen(
                        (current) =>
                          current && {
                            ...current,
                            customLabel: event.target.value,
                          }
                      )
                    }
                  />

                  <Input
                    placeholder="Comment (optional)"
                    value={formOpen.comment || ''}
                    onChange={(event) =>
                      setFormOpen(
                        (current) =>
                          current && {
                            ...current,
                            comment: event.target.value,
                          }
                      )
                    }
                  />
                </div>
              ) : (
                <select
                  className="w-full rounded border px-2 py-1"
                  value={formOpen.categoryId}
                  onChange={(event) =>
                    setFormOpen(
                      (current) =>
                        current && {
                          ...current,
                          categoryId: event.target.value,
                        }
                    )
                  }
                >
                  {(categories || []).map((category) => (
                    <option
                      key={String(category._id)}
                      value={String(category._id)}
                    >
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label>Hours</Label>
              <Input
                value={formOpen.hours}
                onChange={(event) =>
                  setFormOpen(
                    (current) =>
                      current && { ...current, hours: event.target.value }
                  )
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

              <Button size="sm" onClick={handleSave} disabled={isSaving !== null}>
                {isSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EditOwnStaffPreferencesDialog({
  open,
  profile,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  profile: Doc<'lecturer_profiles'>;
  onOpenChange: (open: boolean) => void;
  onSave: (formData: OwnStaffPreferencesFormData) => Promise<void>;
}) {
  const [prefWorkingLocation, setPrefWorkingLocation] = useState(
    profile.prefWorkingLocation ?? ''
  );

  const initialPrefWorkingTime: '' | PreferredWorkingTime =
    profile.prefWorkingTime === 'am' ||
    profile.prefWorkingTime === 'pm' ||
    profile.prefWorkingTime === 'all_day'
      ? profile.prefWorkingTime
      : '';

  const [prefWorkingTime, setPrefWorkingTime] = useState<
    '' | PreferredWorkingTime
  >(initialPrefWorkingTime);

  const [prefSpecialism, setPrefSpecialism] = useState(
    profile.prefSpecialism ?? ''
  );
  const [prefNotes, setPrefNotes] = useState(profile.prefNotes ?? '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const formData: OwnStaffPreferencesFormData = {
        prefWorkingLocation,
        ...(prefWorkingTime ? { prefWorkingTime } : {}),
        prefSpecialism,
        prefNotes,
      };

      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit your preferences</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prefWorkingLocation">Preferred location</Label>
            <Input
              id="prefWorkingLocation"
              value={prefWorkingLocation}
              onChange={(event) => setPrefWorkingLocation(event.target.value)}
              placeholder="e.g. Brentford, Reading, remote"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prefWorkingTime">Preferred working time</Label>
            <select
              id="prefWorkingTime"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={prefWorkingTime}
              onChange={(event) =>
                setPrefWorkingTime(
                  event.target.value as '' | PreferredWorkingTime
                )
              }
            >
              <option value="">No preference</option>
              <option value="am">AM</option>
              <option value="pm">PM</option>
              <option value="all_day">All day</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prefSpecialism">Specialism</Label>
            <Input
              id="prefSpecialism"
              value={prefSpecialism}
              onChange={(event) => setPrefSpecialism(event.target.value)}
              placeholder="e.g. simulation, paramedicine, assessment"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prefNotes">Notes</Label>
            <Textarea
              id="prefNotes"
              value={prefNotes}
              onChange={(event) => setPrefNotes(event.target.value)}
              rows={4}
              placeholder="Any relevant working preferences or notes"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>

          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save preferences'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}