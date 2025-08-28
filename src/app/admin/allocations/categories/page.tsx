"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { StandardizedSidebarLayout } from "@/components/layout/StandardizedSidebarLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { withToast } from "@/lib/utils";
import { z } from "zod";

export default function AdminAllocationCategoriesPage() {
  const { toast } = useToast();
  const categories = useQuery((api as any).allocations.listAdminCategories, {});
  const upsert = useMutation((api as any).allocations.upsertAdminCategory);
  const remove = useMutation((api as any).allocations.removeAdminCategory);
  const pushToOrgs = useMutation(
    (api as any).allocations.pushAdminCategoriesToOrganisations,
  );

  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [form, setForm] = useState<{
    id?: string;
    name: string;
    description: string;
    minHours?: string;
    maxHours?: string;
  }>({ name: "", description: "" });

  const handleEdit = (cat: any) => {
    setForm({
      id: String(cat._id),
      name: cat.name,
      description: cat.description || "",
      minHours: typeof cat.minHours === "number" ? String(cat.minHours) : "",
      maxHours: typeof cat.maxHours === "number" ? String(cat.maxHours) : "",
    });
  };

  const handleReset = () => setForm({ name: "", description: "" });

  const Schema = z.object({
    id: z.string().optional(),
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Max 100 chars"),
    description: z
      .string()
      .trim()
      .max(200, "Max 200 chars")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    minHours: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
      .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), {
        message: "minHours must be a non-negative number",
      }),
    maxHours: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === "" ? undefined : Number(v)))
      .refine((v) => v === undefined || (Number.isFinite(v) && v >= 0), {
        message: "maxHours must be a non-negative number",
      }),
  });

  const handleSave = async () => {
    const parsed = Schema.safeParse(form);
    if (!parsed.success) {
      const first = parsed.error.issues[0];
      toast({
        title: "Validation error",
        description: first
          ? `${first.path.join(".")}: ${first.message}`
          : "Invalid form",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(form.id || "new");
    try {
      await withToast(
        () =>
          upsert({
            ...(parsed.data.id ? { id: parsed.data.id as any } : {}),
            name: parsed.data.name,
            ...(parsed.data.description
              ? { description: parsed.data.description }
              : {}),
            ...(parsed.data.minHours !== undefined
              ? { minHours: parsed.data.minHours as any }
              : {}),
            ...(parsed.data.maxHours !== undefined
              ? { maxHours: parsed.data.maxHours as any }
              : {}),
          } as any),
        {
          success: { title: form.id ? "Category updated" : "Category created" },
          error: { title: "Save failed" },
        },
        toast,
      );
      handleReset();
    } finally {
      setIsSaving(null);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    setIsRemoving(id);
    try {
      await withToast(
        () => remove({ id: id as any }),
        {
          success: { title: "Category deleted" },
          error: { title: "Delete failed" },
        },
        toast,
      );
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <StandardizedSidebarLayout
      breadcrumbs={[
        { label: "Admin", href: "/admin" },
        { label: "Admin Allocation Categories" },
      ]}
      title="Admin Allocation Categories"
      subtitle="Manage categories for per-lecturer admin allocations"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>
              {form.id ? "Edit Category" : "Create Category"}
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
                    value={form.minHours ?? ""}
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
                    value={form.maxHours ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, maxHours: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={!!isSaving}>
                  {isSaving ? "Saving…" : form.id ? "Update" : "Create"}
                </Button>
                {form.id && (
                  <Button variant="outline" onClick={handleReset}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Categories</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    await withToast(
                      () => pushToOrgs({} as any),
                      {
                        success: {
                          title: "Pushed to organisations (non-destructive)",
                        },
                        error: { title: "Push failed" },
                      },
                      toast,
                    );
                  }}
                >
                  Push to orgs
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={async () => {
                    if (
                      !confirm(
                        "Force apply will overwrite existing org categories with these defaults where names match. Continue?",
                      )
                    )
                      return;
                    await withToast(
                      () => pushToOrgs({ forceApply: true } as any),
                      {
                        success: { title: "Synced to organisations (force)" },
                        error: { title: "Sync failed" },
                      },
                      toast,
                    );
                  }}
                >
                  Force sync to orgs
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!Array.isArray(categories) ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : categories.length === 0 ? (
              <div className="text-sm text-muted-foreground">No categories</div>
            ) : (
              <ul className="divide-y border rounded">
                {categories.map((c: any) => (
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
  );
}
