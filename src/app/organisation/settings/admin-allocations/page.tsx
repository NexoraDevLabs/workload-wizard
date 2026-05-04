'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { withToast } from '@/lib/utils';
import { z } from 'zod';
import { PermissionGate } from '@/components/common/PermissionGate';
import { useAuthUser } from '@/hooks/useAuthUser';

interface AdminCategory {
  _id: Id<'organisation_admin_allocation_categories'>;
  name: string;
  description?: string;
  minHours?: number;
  maxHours?: number;
}

export default function OrganisationAdminAllocationsSettingsPage() {
  const { toast } = useToast();
  const { isLoaded, user } = useAuthUser();
  const categories = useQuery(
    api.allocations.listOrganisationAdminCategories,
    isLoaded && user?.id ? { userId: user.id } : 'skip'
  ) as AdminCategory[] | undefined;
  const upsert = useMutation(api.allocations.upsertOrganisationAdminCategory);
  const remove = useMutation(api.allocations.removeOrganisationAdminCategory);

  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [form, setForm] = useState<{
    id?: string;
    name: string;
    description: string;
    minHours?: string;
    maxHours?: string;
  }>({ name: '', description: '' });

  const handleEdit = (cat: AdminCategory) => {
    setForm({
      id: String(cat._id),
      name: cat.name,
      description: cat.description || '',
      minHours: typeof cat.minHours === 'number' ? String(cat.minHours) : '',
      maxHours: typeof cat.maxHours === 'number' ? String(cat.maxHours) : '',
    });
  };

  const handleReset = () => setForm({ name: '', description: '' });

  const Schema = z.object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'Name is required').max(100),
    description: z
      .string()
      .trim()
      .max(200)
      .optional()
      .or(z.literal('').transform(() => undefined)),
    minHours: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === '' ? undefined : Number(v)))
      .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), {
        message: 'minHours must be a non-negative number',
      }),
    maxHours: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === '' ? undefined : Number(v)))
      .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), {
        message: 'maxHours must be a non-negative number',
      }),
  });

  const handleSave = async () => {
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast({
        title: 'Validation error',
        description: first
          ? `${first.path.join('.')}: ${first.message}`
          : 'Invalid form',
        variant: 'destructive',
      });
      return;
    }
    if (
      parsed.data.minHours !== undefined &&
      parsed.data.maxHours !== undefined &&
      parsed.data.minHours > parsed.data.maxHours
    ) {
      toast({
        title: 'Validation error',
        description: 'Min cannot exceed Max',
        variant: 'destructive',
      });
      return;
    }
    setIsSaving(form.id || 'new');
    try {
      await withToast(
        () =>
          upsert({
            userId: user!.id,
            ...(parsed.data.id
              ? {
                  id: parsed.data
                    .id as Id<'organisation_admin_allocation_categories'>,
                }
              : {}),
            name: parsed.data.name,
            ...(parsed.data.description
              ? { description: parsed.data.description }
              : {}),
            ...(parsed.data.minHours !== undefined
              ? { minHours: parsed.data.minHours }
              : {}),
            ...(parsed.data.maxHours !== undefined
              ? { maxHours: parsed.data.maxHours }
              : {}),
          }),
        {
          success: { title: form.id ? 'Category updated' : 'Category created' },
          error: { title: 'Save failed' },
        },
        toast
      );
      handleReset();
    } finally {
      setIsSaving(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    setIsRemoving(id);
    try {
      await withToast(
        () =>
          remove({
            userId: user!.id,
            id: id as Id<'organisation_admin_allocation_categories'>,
          }),
        {
          success: { title: 'Category deleted' },
          error: { title: 'Delete failed' },
        },
        toast
      );
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <PermissionGate permission="organisations.manage" fallback={null}>
      <StandardizedSidebarLayout
        breadcrumbs={[
          { label: 'Organisation', href: '/organisation' },
          { label: 'Settings', href: '/organisation/settings' },
          { label: 'Admin Allocations' },
        ]}
        title="Admin Allocations"
        subtitle="Configure categories for admin allocation calculations"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>
                {form.id ? 'Edit Category' : 'Create Category'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Input
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label>Min hours (optional)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.minHours ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, minHours: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Max hours (optional)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.maxHours ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, maxHours: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} disabled={!!isSaving}>
                    {isSaving ? 'Saving…' : form.id ? 'Update' : 'Create'}
                  </Button>
                  {form.id && (
                    <Button variant="outline" onClick={() => handleReset()}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {!Array.isArray(categories) ? (
                <div className="text-sm text-muted-foreground">Loading…</div>
              ) : categories.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No categories
                </div>
              ) : (
                <ul className="divide-y border rounded">
                  {categories.map((c: AdminCategory) => (
                    <li
                      key={String(c._id)}
                      className="p-3 flex items-center justify-between text-sm"
                    >
                      <div>
                        <div className="font-medium">{c.name}</div>
                        {c.description && (
                          <div className="text-xs text-muted-foreground">
                            {c.description}
                          </div>
                        )}
                        {(c.minHours !== undefined ||
                          c.maxHours !== undefined) && (
                          <div className="text-xs text-muted-foreground">
                            Limits: {c.minHours ?? '—'} – {c.maxHours ?? '—'} h
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(c)}
                          disabled={!!isSaving}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRemove(String(c._id))}
                          disabled={isRemoving === String(c._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </StandardizedSidebarLayout>
    </PermissionGate>
  );
}
