'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { withToast } from '@/lib/utils';
import { GenericDeleteModal } from '@/components/domain/GenericDeleteModal';
import { useAcademicYear } from '@/components/providers/AcademicYearProvider';

// Force dynamic rendering to prevent Clerk authentication errors during build
export const dynamic = 'force-dynamic';

// Type definitions for the component
interface CampusRow {
  campus: string;
  count: string;
}

interface RecommendedCampus {
  campus: string;
  groups: number;
  count: number;
}

interface StudentDistribution {
  campus: string;
  count: number;
}

interface OrganisationSettings {
  _id?: Id<'organisation_settings'>;
  _creationTime?: number;
  organisationId?: Id<'organisations'>;
  staffRoleOptions: string[];
  teamOptions: string[];
  campusOptions?: string[];
  maxClassSizePerGroup?: number;
  baseMaxTeachingAtFTE1: number;
  baseTotalContractAtFTE1: number;
  moduleHoursByCredits?: Array<{
    credits: number;
    teaching: number;
    marking: number;
  }>;
  roleMaxTeachingRules?: Array<{
    role: string;
    mode: 'percent' | 'fixed';
    value: number;
  }>;
  contractFamilyOptions?: string[];
  familyMaxTeachingRules?: Array<{
    family: string;
    mode: 'percent' | 'fixed';
    value: number;
  }>;
  createdAt?: number;
  updatedAt?: number;
}

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const courseId = params?.id;
  const { toast } = useToast();
  const { currentYear } = useAcademicYear();

  const course = useQuery(
    api.courses.getById,
    courseId ? { id: courseId as Id<'courses'> } : 'skip'
  );
  const years = useQuery(
    api.courses.listYears,
    courseId ? { courseId: courseId as Id<'courses'> } : 'skip'
  );
  const addYear = useMutation(api.courses.addYear);

  const [yearInput, setYearInput] = useState<string>('1');
  const [isAddingYear, setIsAddingYear] = useState(false);
  const [studentsOpen, setStudentsOpen] = useState(false);
  const [studentTotal, setStudentTotal] = useState<string>('');
  const [campusRows, setCampusRows] = useState<
    Array<{ campus: string; count: string }>
  >([]);
  const settings = useQuery(
    api.organisationSettings.getForActor,
    {}
  ) as OrganisationSettings | null | undefined;


  const updateCourse = useMutation(api.courses.update);
  const initialiseSplit = useMutation(
    api.courses.initialiseRecommendedGroups
  );
  const canAdd = useMemo(() => {
    const val = Number(yearInput);
    const formatOk = Number.isFinite(val) && val >= 1 && val <= 10;
    const exists = Array.isArray(years)
      ? years.some((y) => Number(y.yearNumber) === val)
      : false;
    return formatOk && !exists;
  }, [yearInput, years]);

  // Compute recommendations early (guard when course isn't loaded yet),
  // so hooks order stays stable across renders.
  const recommendedByCampus = useMemo(() => {
    const maxSize = settings?.maxClassSizePerGroup ?? 25;
    if (!course)
      return [] as Array<{ campus: string; groups: number; count: number }>;
    const dist = (course.studentDistributionByCampus || []) as Array<{
      campus: string;
      count: number;
    }>;
    if (!Array.isArray(dist) || dist.length === 0)
      return [] as Array<{ campus: string; groups: number; count: number }>;
    return dist.map((d) => ({
      campus: d.campus,
      count: d.count,
      groups: Math.ceil((d.count || 0) / maxSize),
    }));
  }, [course, settings]);

  if (!course) {
    return (
      <StandardizedSidebarLayout
        breadcrumbs={[
          { label: 'Courses', href: '/courses' },
          { label: 'Loading...' },
        ]}
        title="Course"
      >
        <div className="text-sm text-muted-foreground">Loading...</div>
      </StandardizedSidebarLayout>
    );
  }

  // Seed modal state from course when opening
  const openStudentsEditor = () => {
    setStudentTotal(String(course.studentCount || ''));
    const dist = (course.studentDistributionByCampus || []) as Array<{
      campus: string;
      count: number;
    }>;
    if (Array.isArray(dist) && dist.length > 0) {
      setCampusRows(
        dist.map((d) => ({ campus: d.campus, count: String(d.count) }))
      );
    } else if (Array.isArray(course.campuses)) {
      setCampusRows(
        (course.campuses).map((c) => ({
          campus: c,
          count: '',
        }))
      );
    } else {
      setCampusRows([]);
    }
    setStudentsOpen(true);
  };

  return (
    <StandardizedSidebarLayout
      breadcrumbs={[
        { label: 'Courses', href: '/courses' },
        { label: course.code },
      ]}
      title={`${course.code} — ${course.name}`}
    >
      <Tabs defaultValue="years" className="w-full">
        <TabsContent value="years">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Overview</CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openStudentsEditor}
                  data-testid="edit-students-btn"
                >
                  Edit students & campuses
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3 text-sm">
                {course.leaderProfileId && (
                  <div>
                    <div className="text-muted-foreground">Leader Profile</div>
                    <div className="mt-1">
                      <code className="rounded bg-muted px-1 py-0.5">
                        {String(course.leaderProfileId)}
                      </code>
                    </div>
                  </div>
                )}
                {typeof course.studentCount === 'number' && (
                  <div>
                    <div className="text-muted-foreground">Students</div>
                    <div className="mt-1 font-medium">
                      {course.studentCount}
                    </div>
                  </div>
                )}
                {Array.isArray(course.campuses) &&
                  course.campuses.length > 0 && (
                    <div>
                      <div className="text-muted-foreground">Campuses</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {course.campuses.map((c: string) => (
                          <Badge key={c} variant="secondary">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Years</div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">
                    {Array.isArray(years) ? years.length : 0}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">
                    Course code
                  </div>
                  <div className="mt-1 text-xl font-semibold">
                    {course.code}
                  </div>
                </div>
                <div className="rounded-md border p-3">
                  <div className="text-xs text-muted-foreground">Students</div>
                  <div className="mt-1 text-xl font-semibold tabular-nums">
                    {typeof course.studentCount === 'number'
                      ? course.studentCount
                      : '–'}
                  </div>
                </div>
              </div>

              {recommendedByCampus.length > 0 && (
                <div className="mt-6">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Recommended groups by campus
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {recommendedByCampus.map((r) => (
                      <div
                        key={r.campus}
                        className="rounded-md border p-3 text-sm"
                      >
                        <div className="text-muted-foreground">{r.campus}</div>
                        <div className="mt-1 flex items-baseline gap-2">
                          <div className="text-xl font-semibold tabular-nums">
                            {r.groups}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            groups · {r.count} students
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      disabled={!currentYear}
                      onClick={async () => {
                        if (!currentYear) return;
                        try {
                          await withToast(
                            () =>
                              initialiseSplit({
                                courseId: course._id,
                                academicYearId: (currentYear as any)._id,
                              } as any),
                            {
                              success: {
                                title: 'Initialised',
                                description:
                                  'Group split initialised for this AY.',
                              },
                              error: { title: 'Failed to initialise' },
                            },
                            toast
                          );
                        } catch {
                          // Error handling is done by withToast
                        }
                      }}
                      data-testid="create-groups-split-btn"
                    >
                      Create groups split
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Students editor modal */}
          <StudentsEditor
            open={studentsOpen}
            onOpenChange={setStudentsOpen}
            studentTotal={studentTotal}
            setStudentTotal={setStudentTotal}
            campusRows={campusRows}
            setCampusRows={setCampusRows}
            campusOptions={settings?.campusOptions}
            onSave={async () => {
              const total = Number(studentTotal);
              const rows = campusRows
                .filter((r) => r.campus && r.count.trim() !== '')
                .map((r) => ({
                  campus: r.campus,
                  count: Number(r.count) || 0,
                }));
              try {
                await withToast(
                  () =>
                    updateCourse({
                      id: course._id,
                      code: course.code,
                      name: course.name,
                      ...(isNaN(total) ? {} : { studentCount: total }),
                      studentDistributionByCampus: rows as any,
                      ...(Array.isArray(course.campuses)
                        ? { campuses: course.campuses }
                        : {}),
                    } as any),
                  {
                    success: {
                      title: 'Saved',
                      description: 'Student distribution updated.',
                    },
                    error: { title: 'Save failed' },
                  },
                  toast
                );
                setStudentsOpen(false);
              } catch {
                // Error handling is done by withToast
              }
            }}
          />

          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Add Year</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-2">
                  <Label htmlFor="yearNumber">Year number</Label>
                  <Input
                    id="yearNumber"
                    data-testid="year-number-input"
                    type="number"
                    min={1}
                    max={10}
                    value={yearInput}
                    onChange={(e) => setYearInput(e.target.value)}
                    className="w-24"
                  />
                  {(() => {
                    const val = Number(yearInput);
                    const exists = Array.isArray(years)
                      ? years.some((y) => Number(y.yearNumber) === val)
                      : false;
                    return Number.isFinite(val) && exists ? (
                      <p className="text-xs text-destructive">
                        Year already exists for this course
                      </p>
                    ) : null;
                  })()}
                </div>
                <Button
                  data-testid="add-year-btn"
                  disabled={!canAdd || isAddingYear}
                  onClick={async () => {
                    const yearNumber = Number(yearInput);
                    setIsAddingYear(true);
                    try {
                      await addYear({
                        courseId: course._id,
                        yearNumber,
                      });
                      setYearInput(String(yearNumber + 1));
                      toast({
                        title: 'Year added',
                        description: `Year ${yearNumber} has been added successfully.`,
                        variant: 'success',
                      });
                    } catch (error) {
                      toast({
                        title: 'Failed to add year',
                        description:
                          error instanceof Error
                            ? error.message
                            : 'An error occurred',
                        variant: 'destructive',
                      });
                    } finally {
                      setIsAddingYear(false);
                    }
                  }}
                >
                  {isAddingYear ? 'Adding...' : 'Add Year'}
                </Button>
              </div>
            </CardContent>
          </Card>
          <div>
            {Array.isArray(years) && years.length ? (
              <ul className="grid gap-4" data-testid="course-years-list">
                {years.map((y: any) => (
                  <li
                    key={y._id}
                    className="basis-full"
                    data-testid={`course-year-${y.yearNumber}`}
                  >
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-2">
                            <Badge variant="secondary">Y{y.yearNumber}</Badge>
                            <span className="text-sm text-muted-foreground">
                              Modules & teaching
                            </span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CourseYearModules
                          yearId={y._id}
                          recommendedList={(recommendedByCampus as any) || []}
                        />
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">
                No years added yet.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </StandardizedSidebarLayout>
  );
}

function CourseYearModules({
  yearId,
  recommendedList,
}: {
  yearId: string;
  recommendedList?: Array<{ campus: string; groups: number; count: number }>;
}) {
  const { toast } = useToast();
  const attached = useQuery(api.modules.listForCourseYear, {
    courseYearId: yearId as string & { __tableName: 'course_years' },
  } as any);
  const allModules = useQuery(api.modules.listByOrganisation);
  const attach = useMutation(api.modules.attachToCourseYear);
  const detach = useMutation(api.modules.detachFromCourseYear);

  const [selected, setSelected] = useState<string>('');
  const [isCore, setIsCore] = useState<boolean>(true);
  const [isAttaching, setIsAttaching] = useState(false);
  const [isDetaching, setIsDetaching] = useState(false);
  const [_detaching, _setDetaching] = useState<{
    moduleId: string;
    moduleCode: string;
    moduleName: string;
  } | null>(null);
  const recList = (recommendedList ?? []) as Array<{
    campus: string;
    groups: number;
    count: number;
  }>;

  const available = useMemo(() => {
    const used = new Set(
      (attached || []).map((a: any) => String(a.module?._id))
    );
    return (allModules || []).filter((m: any) => !used.has(String(m._id)));
  }, [attached, allModules]);

  return (
    <div className="space-y-4" data-testid="module-attachment-form">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-72 min-w-[16rem]">
          <Label>Attach Module</Label>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger data-testid="attach-module-trigger">
              <SelectValue placeholder="Select module" />
            </SelectTrigger>
            <SelectContent>
              {available.map((m: any) => (
                <SelectItem key={m._id} value={String(m._id)}>
                  {m.code} — {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!!selected &&
            (attached || []).some(
              (a: any) => String(a.module?._id) === selected
            ) && (
              <p className="text-xs text-destructive mt-1">
                Module already attached to this year
              </p>
            )}
        </div>
        <div className="flex items-center gap-2">
          <Label className="block">Core?</Label>
          <button
            type="button"
            data-testid="core-toggle-btn"
            className={`px-3 py-2 border rounded-md text-sm ${isCore ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
            onClick={() => setIsCore((v) => !v)}
          >
            {isCore ? 'Core' : 'Optional'}
          </button>
        </div>
        <Button
          data-testid="attach-module-btn"
          disabled={
            !selected ||
            (attached || []).some(
              (a: any) => String(a.module?._id) === selected
            ) ||
            isAttaching
          }
          onClick={async () => {
            setIsAttaching(true);
            try {
              await withToast(
                () =>
                  attach({
                    courseYearId: yearId as any,
                    moduleId: selected as any,
                    isCore,
                  }),
                {
                  success: {
                    title: 'Module attached',
                    description: 'Module has been attached successfully.',
                  },
                  error: { title: 'Failed to attach module' },
                },
                toast
              );
              setSelected('');
            } finally {
              setIsAttaching(false);
            }
          }}
        >
          {isAttaching ? 'Attaching...' : 'Attach'}
        </Button>
      </div>
      <Separator />
      <div>
        {attached?.length ? (
          <ul
            className="flex gap-2 flex-wrap"
            data-testid="attached-modules-list"
          >
            {attached.map((a: any) => (
              <li
                key={a.link._id}
                data-testid={`attached-module-${a.module?.code}`}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-sm">
                  <span className="font-medium">{a.module?.code}</span>
                  <Badge variant={a.link.isCore ? 'default' : 'secondary'}>
                    {a.link.isCore ? 'Core' : 'Optional'}
                  </Badge>
                  <ModuleIterationAndGroupsAndAllocations
                    moduleId={String(a.module?._id)}
                    recommendedList={recList}
                  />
                  <button
                    className="ml-1 text-destructive"
                    disabled={isDetaching}
                    onClick={() => {
                      _setDetaching({
                        moduleId: String(a.module?._id),
                        moduleCode: String(a.module?.code || 'Unknown'),
                        moduleName: String(a.module?.name || ''),
                      });
                    }}
                  >
                    ×
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-muted-foreground">
            No modules attached.
          </div>
        )}
      </div>

      {_detaching && (
        <GenericDeleteModal
          entityType="Module from Course Year"
          entityName={_detaching.moduleName}
          entityCode={_detaching.moduleCode}
          onConfirm={async () => {
            try {
              setIsDetaching(true);
              await withToast(
                () =>
                  detach({
                    courseYearId: yearId as any,
                    moduleId: _detaching.moduleId as any,
                  }),
                {
                  success: {
                    title: 'Module detached',
                    description: `${_detaching.moduleCode} has been detached successfully.`,
                  },
                  error: { title: 'Failed to detach module' },
                },
                toast
              );
              _setDetaching(null);
            } finally {
              setIsDetaching(false);
            }
          }}
          onCancel={() => _setDetaching(null)}
          isDeleting={isDetaching}
        />
      )}
    </div>
  );
}

function ModuleIterationAndGroupsAndAllocations({
  moduleId,
  recommendedList,
}: {
  moduleId: string;
  recommendedList?: Array<{ campus: string; groups: number; count: number }>;
}) {
  const { currentYear } = useAcademicYear();
  const { toast } = useToast();
  const { user } = useUser();
  const params = useParams();
  const iteration = useQuery(
    api.modules.getIterationForYear,
    currentYear?._id
      ? ({ moduleId: moduleId as any, academicYearId: currentYear._id } as any)
      : ('skip' as any)
  );
  const createIteration = useMutation(api.modules.createIterationForYear);

  const [isCreating, setIsCreating] = useState(false);
  const hasIteration = Boolean(iteration?._id);

  const groups = useQuery(
    (api as any).groups.listByIteration,
    hasIteration && iteration
      ? ({ moduleIterationId: iteration._id } as any)
      : ('skip' as any)
  );
  const createGroup = useMutation((api as any).groups.create);
  const autoCreateGroups = useMutation(
    (api as any).groups.createAutoForIteration
  );

  // Allocations UI bits
  const profiles = useQuery(
    (api as any).staff.list,
    user?.id ? ({ userId: user.id } as any) : ('skip' as any)
  );
  const assign = useMutation((api as any).allocations.assignLecturer);
  const removeAllocation = useMutation((api as any).allocations.remove);
  const updateAllocation = useMutation((api as any).allocations.update);
  const [assignOpen, setAssignOpen] = useState(false);
  const [autoOpen, setAutoOpen] = useState(false);
  const recList = (recommendedList ?? []) as Array<{
    campus: string;
    groups: number;
    count: number;
  }>;
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>('');
  const [hoursOverride, setHoursOverride] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [_detaching, _setDetaching] = useState<{
    moduleId: string;
    moduleCode: string;
    moduleName: string;
  } | null>(null);
  const listAllocations = useQuery(
    (api as any).allocations.listForGroup,
    selectedGroupId
      ? ({ groupId: selectedGroupId as any } as any)
      : ('skip' as any)
  ) as Array<{ allocation: any; lecturer: any }> | undefined;

  // Get module teaching hours for preview
  const moduleHours = useQuery(
    (api as any).allocations.getModuleTeachingHours,
    selectedGroupId
      ? ({ groupId: selectedGroupId as any } as any)
      : ('skip' as any)
  );

  // Get lecturer totals for instant updates
  const lecturerTotals = useQuery(
    (api as any).allocations.getLecturerTotals,
    selectedLecturerId
      ? ({
          lecturerId: selectedLecturerId as any,
          academicYearId: (currentYear as any)?._id,
        } as any)
      : ('skip' as any)
  );

  const resetDialogState = () => {
    setSelectedGroupId('');
    setSelectedLecturerId('');
    setHoursOverride('');
    setIsSubmitting(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetDialogState();
    }
    setAssignOpen(open);
  };

  if (!currentYear)
    return <span className="text-muted-foreground">Select AY</span>;

  return (
    <div
      className="inline-flex items-center gap-2"
      data-testid="module-iteration-section"
    >
      {hasIteration ? (
        <>
          <Badge variant="outline">AY: {currentYear.name}</Badge>
          <Link
            href={`/courses/${String((params as any)?.id)}/iterations/${String(iteration?._id)}`}
            className="text-xs underline"
          >
            View details
          </Link>
          <Button
            data-testid="add-group-btn"
            size="sm"
            variant="secondary"
            disabled={isCreatingGroup}
            onClick={async () => {
              const name = prompt('Group name?');
              if (!name || !iteration) return;
              setIsCreatingGroup(true);
              try {
                await withToast(
                  () =>
                    createGroup({
                      moduleIterationId: iteration._id,
                      name,
                    } as any),
                  {
                    success: {
                      title: 'Group created',
                      description: `Group "${name}" has been created successfully.`,
                    },
                    error: { title: 'Failed to create group' },
                  },
                  toast
                );
              } finally {
                setIsCreatingGroup(false);
              }
            }}
          >
            {isCreatingGroup ? 'Creating...' : '+ Add Group'}
          </Button>
          {Array.isArray(groups) && groups.length > 0 ? (
            <Badge variant="secondary" data-testid="groups-count">
              {groups.length} group{groups.length > 1 ? 's' : ''}
            </Badge>
          ) : null}
          {Array.isArray(groups) && groups.length > 0 ? (
            <Dialog open={assignOpen} onOpenChange={handleDialogClose}>
              <DialogTrigger asChild>
                <Button
                  data-testid="assign-lecturer-btn"
                  size="sm"
                  variant="outline"
                >
                  Assign lecturer
                </Button>
              </DialogTrigger>
              <DialogContent data-testid="assign-lecturer-dialog">
                <DialogHeader>
                  <DialogTitle>Assign Lecturer</DialogTitle>
                </DialogHeader>

                {/* Selection Summary */}
                {(selectedGroupId || selectedLecturerId) && (
                  <div className="space-y-2 p-3 bg-muted/30 rounded-md">
                    <div className="text-sm font-medium text-muted-foreground">
                      Current Selection
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {selectedGroupId && (
                        <div>
                          <span className="text-muted-foreground">Group:</span>
                          <div className="font-medium">
                            {groups?.find(
                              (g) => String(g._id) === selectedGroupId
                            )?.name || selectedGroupId}
                          </div>
                        </div>
                      )}
                      {selectedLecturerId && (
                        <div>
                          <span className="text-muted-foreground">
                            Lecturer:
                          </span>
                          <div className="font-medium">
                            {(profiles as any[])?.find(
                              (p) => String(p._id) === selectedLecturerId
                            )?.fullName || selectedLecturerId}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4" data-testid="allocation-form">
                  <div>
                    <Label>Group</Label>
                    <Select
                      value={selectedGroupId}
                      onValueChange={setSelectedGroupId}
                    >
                      <SelectTrigger data-testid="group-select-trigger">
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {groups.map((g) => (
                          <SelectItem key={String(g._id)} value={String(g._id)}>
                            {g.name || String(g._id)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Lecturer</Label>
                    <Select
                      value={selectedLecturerId}
                      onValueChange={setSelectedLecturerId}
                    >
                      <SelectTrigger data-testid="lecturer-select-trigger">
                        <SelectValue placeholder="Select lecturer" />
                      </SelectTrigger>
                      <SelectContent>
                        {(profiles as any[] | undefined)?.map((p) => (
                          <SelectItem key={String(p._id)} value={String(p._id)}>
                            {p.fullName} ({p.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Hours override (optional)</Label>
                    <Input
                      data-testid="hours-override-input"
                      type="number"
                      inputMode="decimal"
                      value={hoursOverride}
                      onChange={(e) => setHoursOverride(e.target.value)}
                      placeholder="Enter number of hours"
                      min="0"
                      max="1000"
                    />
                    {hoursOverride.trim() && (
                      <div className="mt-1 text-xs">
                        {isNaN(Number(hoursOverride)) ? (
                          <span className="text-destructive">
                            Please enter a valid number
                          </span>
                        ) : Number(hoursOverride) < 0 ? (
                          <span className="text-destructive">
                            Hours cannot be negative
                          </span>
                        ) : Number(hoursOverride) > 1000 ? (
                          <span className="text-destructive">
                            Hours cannot exceed 1000
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            Override: {hoursOverride}h (computed:{' '}
                            {moduleHours?.computedHours || 0}h)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Computed hours preview */}
                  {moduleHours && (
                    <div className="space-y-2 p-3 bg-muted/50 rounded-md">
                      <div className="text-sm font-medium text-muted-foreground">
                        Module Hours Preview
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Module:</span>
                          <div className="font-medium">
                            {moduleHours.moduleCode} - {moduleHours.moduleName}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Credits:
                          </span>
                          <div className="font-medium">
                            {moduleHours.credits}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Computed Hours:
                          </span>
                          <div className="font-medium">
                            {moduleHours.computedHours}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Total Module Hours:
                          </span>
                          <div className="font-medium">
                            {moduleHours.totalHours}
                          </div>
                        </div>
                      </div>
                      {hoursOverride.trim() && (
                        <div className="pt-2 border-t">
                          <div className="text-xs text-muted-foreground">
                            Override Hours:{' '}
                            <span className="font-medium text-foreground">
                              {hoursOverride}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lecturer totals preview */}
                  {lecturerTotals && (
                    <div className="space-y-2 p-3 bg-blue-50 rounded-md">
                      <div className="text-sm font-medium text-blue-700">
                        Lecturer Current Allocation
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-blue-600">Teaching:</span>
                          <div className="font-medium text-blue-800">
                            {lecturerTotals.allocatedTeaching}h
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-600">Admin:</span>
                          <div className="font-medium text-blue-800">
                            {lecturerTotals.allocatedAdmin}h
                          </div>
                        </div>
                        <div>
                          <span className="text-blue-600">Total:</span>
                          <div className="font-medium text-blue-800">
                            {lecturerTotals.allocatedTotal}h
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-blue-600">
                        Active allocations: {lecturerTotals.allocationCount}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    data-testid="assign-lecturer-submit-btn"
                    disabled={
                      !selectedGroupId ||
                      !selectedLecturerId ||
                      isSubmitting ||
                      (hoursOverride.trim() !== '' &&
                        (isNaN(Number(hoursOverride)) ||
                          Number(hoursOverride) < 0 ||
                          Number(hoursOverride) > 1000))
                    }
                    onClick={async () => {
                      setIsSubmitting(true);
                      try {
                        await assign({
                          groupId: selectedGroupId as any,
                          lecturerId: selectedLecturerId as any,
                          academicYearId: (currentYear as any)._id,
                          type: 'teaching',
                          ...(hoursOverride.trim()
                            ? { hoursOverride: Number(hoursOverride) }
                            : {}),
                        } as any);
                        toast({
                          title: 'Lecturer assigned',
                          description: `Lecturer ${selectedLecturerId} assigned to group ${selectedGroupId} for ${currentYear.name}.`,
                        });
                        handleDialogClose(false);
                      } catch (e: unknown) {
                        const errorMessage =
                          e instanceof Error
                            ? e.message
                            : 'Unknown error occurred';
                        toast({
                          title: 'Error assigning lecturer',
                          description: `Failed to assign lecturer: ${errorMessage}`,
                          variant: 'destructive',
                        });
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                  >
                    {isSubmitting ? 'Assigning...' : 'Assign'}
                  </Button>
                </DialogFooter>
                {!!selectedGroupId && (
                  <div className="mt-4 border-t pt-3 space-y-2">
                    <div className="text-sm font-medium">
                      Existing allocations
                    </div>
                    {!Array.isArray(listAllocations) ? (
                      <div className="text-sm text-muted-foreground">
                        Loading...
                      </div>
                    ) : listAllocations.length === 0 ? (
                      <div className="text-sm text-muted-foreground">None</div>
                    ) : (
                      <Table data-testid="allocations-table">
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lecturer</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Hours</TableHead>
                            <TableHead className="w-24 text-right">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {listAllocations.map(({ allocation, lecturer }) => {
                            const hours =
                              typeof allocation.hoursOverride === 'number'
                                ? `${allocation.hoursOverride} (override)"`
                                : typeof allocation.hoursComputed === 'number'
                                  ? String(allocation.hoursComputed)
                                  : '-';
                            return (
                              <TableRow
                                key={String(allocation._id)}
                                data-testid={`allocation-row-${allocation._id}`}
                              >
                                <TableCell className="py-2">
                                  <div className="leading-tight">
                                    <div className="font-medium text-sm">
                                      {lecturer?.fullName ||
                                        allocation.lecturerId}
                                    </div>
                                    {lecturer?.email && (
                                      <div className="text-xs text-muted-foreground">
                                        {lecturer.email}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="py-2 text-sm capitalize">
                                  {allocation.type}
                                </TableCell>
                                <TableCell className="py-2 text-right text-sm tabular-nums">
                                  {hours}
                                </TableCell>
                                <TableCell className="py-2 text-right space-x-3">
                                  <button
                                    data-testid={`change-type-btn-${allocation._id}`}
                                    className="text-xs underline"
                                    onClick={async () => {
                                      const input = prompt(
                                        'Change allocation type (teaching/admin)',
                                        allocation.type
                                      );
                                      if (input === null) return;
                                      const next = input.trim().toLowerCase();
                                      if (
                                        next !== 'teaching' &&
                                        next !== 'admin'
                                      ) {
                                        toast({
                                          title: 'Invalid type',
                                          description:
                                            "Type must be 'teaching' or 'admin'",
                                          variant: 'destructive',
                                        });
                                        return;
                                      }
                                      await withToast(
                                        () =>
                                          updateAllocation({
                                            allocationId: allocation._id,
                                            type: next,
                                          } as any),
                                        {
                                          success: {
                                            title: 'Allocation updated',
                                            description: `Type set to ${next}`,
                                          },
                                          error: { title: 'Update failed' },
                                        },
                                        toast
                                      );
                                    }}
                                  >
                                    Type
                                  </button>
                                  <button
                                    data-testid={`edit-hours-btn-${allocation._id}`}
                                    className="text-xs underline"
                                    onClick={async () => {
                                      const input = prompt(
                                        'Set hours override (leave blank to clear)',
                                        typeof allocation.hoursOverride ===
                                          'number'
                                          ? String(allocation.hoursOverride)
                                          : ''
                                      );
                                      if (input === null) return; // cancelled
                                      const trimmed = input.trim();
                                      if (trimmed === '') {
                                        await withToast(
                                          () =>
                                            updateAllocation({
                                              allocationId: allocation._id,
                                              hoursOverride: null,
                                            } as any),
                                          {
                                            success: {
                                              title: 'Override cleared',
                                              description:
                                                'Hours override removed; using computed hours.',
                                            },
                                            error: { title: 'Update failed' },
                                          },
                                          toast
                                        );
                                      } else {
                                        const value = Number(trimmed);
                                        if (
                                          !Number.isFinite(value) ||
                                          value < 0 ||
                                          value > 1000
                                        ) {
                                          toast({
                                            title: 'Update failed',
                                            description:
                                              'Enter a number between 0 and 1000',
                                            variant: 'destructive',
                                          });
                                          return;
                                        }
                                        await withToast(
                                          () =>
                                            updateAllocation({
                                              allocationId: allocation._id,
                                              hoursOverride: value,
                                            } as any),
                                          {
                                            success: {
                                              title: 'Allocation updated',
                                              description: `Override set to ${value}h`,
                                            },
                                            error: { title: 'Update failed' },
                                          },
                                          toast
                                        );
                                      }
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    data-testid={`remove-allocation-btn-${allocation._id}`}
                                    className="text-xs text-destructive underline"
                                    onClick={async () => {
                                      if (
                                        confirm(
                                          `Are you sure you want to remove ${lecturer?.fullName || allocation.lecturerId} from this group?`
                                        )
                                      ) {
                                        await withToast(
                                          () =>
                                            removeAllocation({
                                              allocationId: allocation._id,
                                            } as any),
                                          {
                                            success: {
                                              title: 'Allocation removed',
                                              description: `Lecturer ${lecturer?.fullName || allocation.lecturerId} removed from group.`,
                                            },
                                            error: {
                                              title:
                                                'Error removing allocation',
                                            },
                                          },
                                          toast
                                        );
                                      }
                                    }}
                                  >
                                    Remove
                                  </button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                )}
              </DialogContent>
            </Dialog>
          ) : null}
          {hasIteration && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setAutoOpen(true)}
                data-testid="auto-create-groups-btn"
              >
                Auto-create groups
              </Button>
              <Dialog open={autoOpen} onOpenChange={setAutoOpen}>
                <DialogContent data-testid="auto-create-groups-dialog">
                  <DialogHeader>
                    <DialogTitle>Auto-create groups</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Configure how many groups to create for this module
                      iteration.
                    </div>
                    <div className="space-y-2">
                      {recList && recList.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Recommended</div>
                          {recList.map((r, idx) => (
                            <div
                              key={`${r.campus}-${idx}`}
                              className="grid grid-cols-12 gap-2 items-end"
                            >
                              <div className="col-span-7">
                                <Label>Campus</Label>
                                <Input value={r.campus} disabled />
                              </div>
                              <div className="col-span-5">
                                <Label>Groups</Label>
                                <Input
                                  defaultValue={String(r.groups)}
                                  data-testid={`auto-groups-${idx}`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-12 gap-2 items-end">
                          <div className="col-span-7">
                            <Label>Campus</Label>
                            <Input value="All campuses" disabled />
                          </div>
                          <div className="col-span-5">
                            <Label>Groups</Label>
                            <Input
                              defaultValue="0"
                              data-testid="auto-groups-single"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={async () => {
                        const root = document.querySelector(
                          '[data-testid="auto-create-groups-dialog"]'
                        );
                        if (!root) return;
                        const inputs = Array.from(
                          root.querySelectorAll(
                            'input[data-testid^="auto-groups-"]'
                          )
                        );
                        let campusGroups: Array<{
                          campus?: string | undefined;
                          groups: number;
                        }> = [];
                        if (inputs.length > 0) {
                          campusGroups = inputs.map((inp, idx) => ({
                            campus: recList[idx]?.campus,
                            groups: Math.max(
                              0,
                              Math.floor(Number((inp as HTMLInputElement).value || '0'))
                            ),
                          }));
                        } else {
                          const single = root.querySelector(
                            'input[data-testid="auto-groups-single"]'
                          ) as HTMLInputElement;
                          const n = Math.max(
                            0,
                            Math.floor(Number(single?.value || '0'))
                          );
                          campusGroups = [
                            { campus: undefined, groups: n } as {
                              campus?: string | undefined;
                              groups: number;
                            },
                          ];
                        }
                        await withToast(
                          () =>
                            autoCreateGroups({
                              moduleIterationId: iteration!._id,
                              campusGroups: campusGroups as any,
                            } as any),
                          {
                            success: { title: 'Groups created' },
                            error: { title: 'Failed to create groups' },
                          },
                          toast
                        );
                        setAutoOpen(false);
                      }}
                    >
                      Create
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </>
      ) : (
        <Button
          data-testid="create-iteration-btn"
          size="sm"
          variant="secondary"
          disabled={isCreating}
          onClick={async () => {
            try {
              setIsCreating(true);
              await withToast(
                () =>
                  createIteration({
                    moduleId: moduleId as any,
                    academicYearId: (currentYear as any)._id,
                  } as any),
                {
                  success: {
                    title: 'Iteration created',
                    description:
                      'Module iteration has been created successfully.',
                  },
                  error: { title: 'Failed to create iteration' },
                },
                toast
              );
            } finally {
              setIsCreating(false);
            }
          }}
        >
          {isCreating ? 'Creating…' : 'Create iteration (selected AY)'}
        </Button>
      )}
    </div>
  );
}

// Students & campuses editor dialog mounted at end of page component
function StudentsEditor({
  open,
  onOpenChange,
  studentTotal,
  setStudentTotal,
  campusRows,
  setCampusRows,
  campusOptions,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentTotal: string;
  setStudentTotal: (v: string) => void;
  campusRows: Array<{ campus: string; count: string }>;
  setCampusRows: (rows: Array<{ campus: string; count: string }>) => void;
  campusOptions: string[] | undefined;
  onSave: () => Promise<void>;
}) {
  const totalAssigned = campusRows.reduce(
    (sum, r) => sum + (Number(r.count) || 0),
    0
  );
  const remaining = (Number(studentTotal) || 0) - totalAssigned;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="students-modal">
        <DialogHeader>
          <DialogTitle>Students & Campuses</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Total students</Label>
            <Input
              value={studentTotal}
              onChange={(e) => setStudentTotal(e.target.value)}
              inputMode="numeric"
            />
            <div
              className={`text-xs ${remaining === 0 ? 'text-muted-foreground' : remaining < 0 ? 'text-destructive' : 'text-blue-600'}`}
            >
              Remaining to allocate: {remaining}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Per-campus distribution</div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  setCampusRows([...campusRows, { campus: '', count: '' }])
                }
              >
                Add campus
              </Button>
            </div>
            <div className="space-y-2">
              {campusRows.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No campuses yet.
                </div>
              ) : (
                campusRows.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-7">
                      <Label>Campus</Label>
                      <Select
                        value={row.campus}
                        onValueChange={(v) => {
                          const next = [...campusRows];
                          next[idx] = { ...row, campus: v };
                          setCampusRows(next);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select campus" />
                        </SelectTrigger>
                        <SelectContent>
                          {(campusOptions || []).map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-4">
                      <Label>Students</Label>
                      <Input
                        value={row.count}
                        onChange={(e) => {
                          const next = [...campusRows];
                          next[idx] = { ...row, count: e.target.value };
                          setCampusRows(next);
                        }}
                        inputMode="numeric"
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() =>
                          setCampusRows(campusRows.filter((_, i) => i !== idx))
                        }
                        aria-label="Remove"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={onSave} data-testid="save-students-btn">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
