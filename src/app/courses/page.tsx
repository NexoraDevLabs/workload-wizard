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
import { useAuthUser } from '@/hooks/useAuthUser';
import { EditCourseForm } from '@/components/domain/EditCourseForm';
import { GenericDeleteModal } from '@/components/domain/GenericDeleteModal';
import { withToast } from '@/lib/utils';
import { Edit, Trash2 } from 'lucide-react';

interface Course {
  _id: Id<'courses'>;
  code: string;
  name: string;
  campuses?: string[];
}

// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

export default function CoursesPage() {
  const { toast } = useToast();
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  // Derive organisation on the server from the authenticated actor, not from client public metadata
  const courses = useQuery(
    api.courses.listForActor,
    user?.id ? { userId: user.id } : 'skip'
  ) as Course[] | undefined;
  const organisationSettings = useQuery(
    api.organisationSettings.getForActor,
    user?.id ? { userId: user.id } : 'skip'
  ) as { campusOptions?: string[] } | null | undefined;

  const createCourse = useMutation(api.courses.create);
  const deleteCourse = useMutation(api.courses.remove);
  const [form, setForm] = useState({ code: '', name: '', campuses: '' });
  const codeAvailability = useQuery(
    api.courses.isCodeAvailable,
    user?.id && form.code.trim()
      ? { userId: user.id, code: form.code.trim() }
      : 'skip'
  ) as { available: boolean } | undefined;
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
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

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCourse({
        userId: user!.id,
        code: form.code.trim(),
        name: form.name.trim(),
        ...(form.campuses.trim()
          ? {
              campuses: form.campuses
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : {}),
      });
      setForm({ code: '', name: '', campuses: '' });
      toast({
        title: 'Course created',
        description: `${form.code.trim()} has been created successfully.`,
        variant: 'success',
      });
    } catch {
      toast({
        title: 'Failed to create course',
        description: 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
  };

  const handleDeleteCourse = (course: Course) => {
    setDeletingCourse(course);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCourse) return;
    const toDelete = deletingCourse;
    setIsDeleting(true);
    try {
      setOptimisticallyRemovedIds((prev) => {
        const next = new Set(prev);
        next.add(String(toDelete._id));
        return next;
      });
      await withToast(
        () => deleteCourse({ userId: user!.id, id: toDelete._id }),
        {
          success: {
            title: 'Course deleted',
            description: `${toDelete.code} has been deleted successfully.`,
          },
          error: { title: 'Failed to delete course' },
        },
        toast
      );
      setDeletingCourse(null);
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

  const handleCourseUpdated = () => {
    setEditingCourse(null);
  };

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
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Courses' },
      ]}
      title="Courses"
      subtitle="View courses and manage years"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Create Course</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-3"
              onSubmit={handleCreateCourse}
              data-testid="create-course-form"
            >
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  data-testid="course-code-input"
                  value={form.code}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, code: e.target.value }))
                  }
                  placeholder="CSE100"
                />
                {form.code.trim() &&
                  codeAvailability &&
                  !codeAvailability.available && (
                    <p className="text-xs text-destructive">
                      Course code already exists in your organisation
                    </p>
                  )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  data-testid="course-name-input"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="Computer Science"
                />
              </div>
              {/* Campuses chip multi-select */}
              <div className="space-y-2" data-testid="campuses-section">
                <Label>Campuses (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {(form.campuses || '')
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          const list = (form.campuses || '')
                            .split(',')
                            .map((s) => s.trim())
                            .filter(Boolean)
                            .filter((x) => x !== c);
                          setForm((f) => ({ ...f, campuses: list.join(', ') }));
                        }}
                        className="px-2 py-1 rounded-full text-xs bg-muted hover:bg-muted/70"
                        title="Click to remove"
                      >
                        {c} ×
                      </button>
                    ))}
                </div>
                <div className="flex gap-2">
                  <select
                    data-testid="campus-selector"
                    className="h-9 rounded-md border px-2 bg-background"
                    value=""
                    onChange={(e) => {
                      const val = e.target.value;
                      if (!val) return;
                      const list = (form.campuses || '')
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (!list.includes(val)) list.push(val);
                      setForm((f) => ({ ...f, campuses: list.join(', ') }));
                      e.currentTarget.value = '';
                    }}
                  >
                    <option value="">Add campus…</option>
                    {(
                      organisationSettings?.campusOptions || []
                    ).map((c: string) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {/* PermissionGate removed as per new_code */}
              <Button
                data-testid="create-course"
                className="w-full"
                disabled={!canSubmit}
                type="submit"
              >
                Create
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>All Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.isArray(courses) && courses.length ? (
                <ul className="divide-y" data-testid="courses-list">
                  {courses.map((c: Course) => (
                    <li
                      key={c._id}
                      className="py-3"
                      data-testid={`course-item-${c.code}`}
                    >
                      <div className="flex items-center justify-between">
                        {/* Link removed as per new_code */}
                        <span className="font-medium">{c.code}</span> — {c.name}
                        <div className="flex items-center space-x-2">
                          {/* PermissionGate removed as per new_code */}
                          <Button
                            data-testid={`edit-course-${c.code}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCourse(c)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {/* PermissionGate removed as per new_code */}
                          <Button
                            data-testid={`delete-course-${c.code}`}
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCourse(c)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-muted-foreground">
                  No courses yet.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Course Modal */}
      {editingCourse && (
        <EditCourseForm
          course={editingCourse}
          onClose={() => setEditingCourse(null)}
          onCourseUpdated={handleCourseUpdated}
        />
      )}

      {/* Delete Course Modal */}
      {deletingCourse && (
        <GenericDeleteModal
          entityType="Course"
          entityName={deletingCourse.name}
          entityCode={deletingCourse.code}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingCourse(null)}
          isDeleting={isDeleting}
        />
      )}
    </StandardizedSidebarLayout>
  );
}
