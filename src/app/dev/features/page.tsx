'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';

type Stage = 'draft' | 'alpha' | 'beta' | 'concept';

export default function AdminFeaturesPage() {
  const { user } = useUser();
  const list = useQuery(api.featureFlags.listAll, {});
  const upsert = useMutation(api.featureFlags.upsert);
  const remove = useMutation(api.featureFlags.remove);

  const [form, setForm] = useState({
    id: undefined as undefined | string,
    key: '',
    name: '',
    description: '',
    stage: 'draft' as Stage,
    isActive: true,
  });
  const [updating, setUpdating] = useState<string | null>(null);

  const getStageBadgeVariant = (stage: string) => {
    switch (stage.toLowerCase()) {
      case 'concept':
        return 'secondary' as const;
      case 'beta':
        return 'default' as const;
      case 'alpha':
        return 'destructive' as const;
      default:
        return 'outline' as const;
    }
  };

  const capitalizeStage = (stage: string) =>
    stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Dev', href: '/dev' },
    { label: 'Features' },
  ];

  const resetForm = () =>
    setForm({
      id: undefined,
      key: '',
      name: '',
      description: '',
      stage: 'draft',
      isActive: true,
    });

  const save = async () => {
    await upsert({
      ...(form.id ? { id: form.id as any } : {}),
      key: form.key.trim(),
      name: form.name.trim(),
      ...(form.description.trim()
        ? { description: form.description.trim() }
        : {}),
      stage: form.stage,
      isActive: form.isActive,
      ...(user?.id ? { performedBy: user.id } : {}),
      ...(user?.fullName ? { performedByName: user.fullName } : {}),
    });
    resetForm();
  };

  const edit = (row: any) =>
    setForm({
      id: row._id,
      key: row.key,
      name: row.name,
      description: row.description || '',
      stage: row.stage,
      isActive: row.isActive,
    });

  const changeStage = async (row: any, stage: Stage) => {
    try {
      setUpdating(row._id as string);
      await upsert({
        id: row._id,
        key: row.key,
        name: row.name,
        ...(row.description ? { description: row.description as string } : {}),
        stage,
        isActive: row.isActive,
        ...(user?.id ? { performedBy: user.id } : {}),
        ...(user?.fullName ? { performedByName: user.fullName } : {}),
      });
    } finally {
      setUpdating(null);
    }
  };

  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Feature Flags"
      subtitle="Create and stage early-access features. Draft = internal only. Alpha/Beta/Concept show to users on /account/features."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>New / Edit Feature</CardTitle>
            <CardDescription>
              Define a name, description, Statsig key, and stage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm">Statsig Gate Key</label>
              <Input
                value={form.key}
                onChange={(e) =>
                  setForm((f) => ({ ...f, key: e.target.value }))
                }
                placeholder="e.g. quick_access_beta"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Display Name</label>
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="Quick Access (Beta)"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Description</label>
              <Textarea
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm">Stage</label>
              <Select
                value={form.stage}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, stage: v as Stage }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="alpha">Alpha</SelectItem>
                  <SelectItem value="beta">Beta</SelectItem>
                  <SelectItem value="concept">Concept</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={save} disabled={!form.key || !form.name}>
                Save
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Features</CardTitle>
            <CardDescription>Manage visibility and details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(list || []).map((row) => (
              <div key={row._id} className="border rounded p-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      <span>{row.name}</span>
                      <Badge
                        variant={getStageBadgeVariant(row.stage as string)}
                        className="text-xs"
                      >
                        {capitalizeStage(row.stage as string)}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {row.key}
                    </div>
                    {row.description ? (
                      <div className="text-sm mt-1">{row.description}</div>
                    ) : null}
                    <div className="mt-2">
                      <label className="text-xs mr-2">Stage</label>
                      <Select
                        value={row.stage as Stage}
                        onValueChange={(v) => changeStage(row, v as Stage)}
                        disabled={updating === (row._id as string)}
                      >
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="alpha">Alpha</SelectItem>
                          <SelectItem value="beta">Beta</SelectItem>
                          <SelectItem value="concept">Concept</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => edit(row)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => remove({ id: row._id })}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </StandardizedSidebarLayout>
  );
}
