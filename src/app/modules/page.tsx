'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAcademicYear } from '@/components/providers/AcademicYearProvider';
import { EditModuleForm } from '@/components/domain/EditModuleForm';
import { GenericDeleteModal } from '@/components/domain/GenericDeleteModal';
import { PermissionGate } from '@/components/common/PermissionGate';
import { withToast } from '@/lib/utils';
import { Edit, Trash2 } from 'lucide-react';

// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

interface Module {
  _id: Id<'modules'>;
  code: string;
  name: string;
  credits?: number;
  leaderProfileId?: Id<'lecturer_profiles'>;
  level?: number;
  teachingHours?: number;
  markingHours?: number;
}

interface Lecturer {
  _id: Id<'lecturer_profiles'>;
  fullName: string;
  email?: string;
  role?: string;
  teamName?: string;
}

export default function ModulesPage() {
  const { toast } = useToast();
  const modules = useQuery(api.modules.listByOrganisation) as
    | Module[]
    | undefined;
  const { currentYear } = useAcademicYear();
  const create = useMutation(api.modules.create);
  const deleteModule = useMutation(api.modules.remove);
  const me = useQuery(
    api.users.getBySubject,
    typeof window !== 'undefined' &&
      (window as { WorkOS?: { user?: { id: string } } }).WorkOS?.user?.id
      ? {
          subject:
            (window as { WorkOS?: { user?: { id: string } } }).WorkOS?.user?.id ||
            '',
        }
      : 'skip'
  ) as { systemRoles?: string[] } | undefined;
  const _isAdminLike = (me?.systemRoles || []).some(
    (r) => r === 'orgadmin' || r === 'sysadmin' || r === 'developer'
  );

  const [form, setForm] = useState({
    code: '',
    name: '',
    credits: '',
    leaderProfileId: '',
    level: '',
    teachingHours: '',
    markingHours: '',
  });

  const lecturers = (useQuery(api.staff.listForActor) || []) as Lecturer[];
  const codeAvailability = useQuery(
    api.modules.isCodeAvailable,
    form.code.trim() ? { code: form.code.trim() } : 'skip'
  ) as { available: boolean } | undefined;
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deletingModule, setDeletingModule] = useState<Module | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [_optimisticallyRemovedIds, setOptimisticallyRemovedIds] = useState<
    Set<string>
  >(new Set());

  const canSubmit = useMemo(
    () =>
      form.code.trim().length > 0 &&
      form.name.trim().length > 0 &&
      (codeAvailability ? codeAvailability.available : true),
    [form, codeAvailability]
  );

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await create({
        code: form.code.trim(),
        name: form.name.trim(),
        ...(form.credits.trim() ? { credits: Number(form.credits) } : {}),
        ...(form.leaderProfileId
          ? { leaderProfileId: form.leaderProfileId as Id<'lecturer_profiles'> }
          : {}),
        ...(form.level.trim() ? { level: Number(form.level) } : {}),
        ...(form.teachingHours.trim()
          ? { teachingHours: Number(form.teachingHours) }
          : {}),
        ...(form.markingHours.trim()
          ? { markingHours: Number(form.markingHours) }
          : {}),
      });
      setForm({
        code: '',
        name: '',
        credits: '',
        leaderProfileId: '',
        level: '',
        teachingHours: '',
        markingHours: '',
      });
      toast({
        title: 'Module created',
        description: `${form.code.trim()} has been created successfully.`,
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Failed to create module',
        description: 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
  };

  const handleDeleteModule = (module: Module) => {
    setDeletingModule(module);
  };

  const handleConfirmDelete = async () => {
    if (!deletingModule) return;
    const toDelete = deletingModule;
    setIsDeleting(true);
    try {
      setOptimisticallyRemovedIds((prev) => {
        const next = new Set(prev);
        next.add(String(toDelete._id));
        return next;
      });
      await withToast(
        () => deleteModule({ id: toDelete._id }),
        {
          success: {
            title: 'Module deleted',
            description: `${toDelete.code} has been deleted successfully.`,
          },
          error: { title: 'Failed to delete module' },
        },
        toast
      );
      setDeletingModule(null);
    } catch {
      // handled by withToast
      setOptimisticallyRemovedIds((prev) => {
        const next = new Set(prev);
        next.delete(String(toDelete._id));
        return next;
      });
    } finally {
      setIsDeleting(false);
      setTimeout(() => {
        setOptimisticallyRemovedIds((prev) => {
          const next = new Set(prev);
          next.delete(String(toDelete._id));
          return next;
        });
      }, 600);
    }
  };

  const handleModuleUpdated = () => {
    setEditingModule(null);
  };

  return (
    <StandardizedSidebarLayout
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Modules' },
      ]}
      title="Modules"
      subtitle="Create and manage modules"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Create Module</CardTitle>
          </CardHeader>
          <CardContent>
            <PermissionGate
              permission="modules.create"
              fallback={
                <div className="text-sm text-muted-foreground">
                  You don&apos;t have permission to create modules.
                </div>
              }
            >
              <form
                className="space-y-3"
                onSubmit={handleCreateModule}
                data-testid="create-module-form"
              >
                <div className="space-y-2">
                  <Label htmlFor="code">Code</Label>
                  <Input
                    id="code"
                    data-testid="module-code-input"
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value }))
                    }
                    placeholder="MOD101"
                  />
                  {form.code.trim() &&
                    codeAvailability &&
                    !codeAvailability.available && (
                      <p className="text-xs text-destructive">
                        Module code already exists in your organisation
                      </p>
                    )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    data-testid="module-name-input"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Introduction to Something"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leader">Module leader</Label>
                  <select
                    id="leader"
                    className="w-full border rounded h-9 px-3 bg-background"
                    value={form.leaderProfileId}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        leaderProfileId: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select leader (optional)</option>
                    {lecturers?.map((l) => (
                      <option key={l._id} value={String(l._id)}>
                        {l.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Level</Label>
                  <select
                    id="level"
                    className="w-full border rounded h-9 px-3 bg-background"
                    value={form.level}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, level: e.target.value }))
                    }
                  >
                    <option value="">Select level (optional)</option>
                    {[3, 4, 5, 6, 7].map((lvl) => (
                      <option key={lvl} value={String(lvl)}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="credits">Credits (optional)</Label>
                  <Input
                    id="credits"
                    type="number"
                    inputMode="numeric"
                    value={form.credits}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, credits: e.target.value }))
                    }
                    placeholder="20"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teachingHours">Teaching hours</Label>
                    <Input
                      id="teachingHours"
                      type="number"
                      inputMode="numeric"
                      value={form.teachingHours}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          teachingHours: e.target.value,
                        }))
                      }
                      placeholder="48"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="markingHours">Marking/prep hours</Label>
                    <Input
                      id="markingHours"
                      type="number"
                      inputMode="numeric"
                      value={form.markingHours}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, markingHours: e.target.value }))
                      }
                      placeholder="48"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full"
                  data-testid="create-module-btn"
                >
                  Create
                </Button>
              </form>
            </PermissionGate>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>
              All Modules {currentYear ? `— ${currentYear.name}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {modules?.length ? (
                <ul className="divide-y">
                  {modules.map((m) => (
                    <li
                      key={m._id}
                      className="py-3 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{m.code}</div>
                        <div className="text-sm text-muted-foreground">
                          {m.name}
                          {typeof m.credits === 'number'
                            ? ` · ${m.credits} credits`
                            : null}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PermissionGate
                          permission="modules.edit"
                          fallback={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 opacity-50 cursor-not-allowed"
                              disabled
                              title="Insufficient permissions"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditModule(m)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                        <PermissionGate
                          permission="modules.delete"
                          fallback={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-600 opacity-50 cursor-not-allowed"
                              disabled
                              title="Insufficient permissions"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteModule(m)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </PermissionGate>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No modules yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Module Modal */}
      {editingModule && (
        <EditModuleForm
          module={editingModule}
          onClose={() => setEditingModule(null)}
          onModuleUpdated={handleModuleUpdated}
        />
      )}

      {/* Delete Module Modal */}
      {deletingModule && (
        <GenericDeleteModal
          entityType="Module"
          entityName={deletingModule.name}
          entityCode={deletingModule.code}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingModule(null)}
          isDeleting={isDeleting}
        />
      )}
    </StandardizedSidebarLayout>
  );
}
