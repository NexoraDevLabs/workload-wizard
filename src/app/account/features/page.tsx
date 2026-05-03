'use client';

import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { useStatsigClient } from '@statsig/react-bindings';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Crown,
  Loader2,
  RefreshCw,
  Sparkles,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Force dynamic rendering to prevent Clerk authentication errors during build
export const dynamic = 'force-dynamic';

interface EarlyAccessFeature {
  flagKey: string;
  name: string;
  description?: string;
  stage: string;
  enrolled?: boolean;
}

const LOCAL_FLAG_OVERRIDES_KEY = 'feature-flag-overrides';

function getLocalFlagOverrides(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(LOCAL_FLAG_OVERRIDES_KEY);
    if (!stored) return {};
    const parsed: unknown = JSON.parse(stored);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      const result: Record<string, boolean> = {};
      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'boolean') result[key] = value;
      }
      return result;
    }
    return {};
  } catch {
    return {};
  }
}

function _setLocalFlagOverride(flagKey: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    const overrides = getLocalFlagOverrides();
    overrides[flagKey] = enabled;
    localStorage.setItem(LOCAL_FLAG_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // Failed to set local flag override
  }
}

const getStageBadgeVariant = (stage: string) => {
  switch (stage.toLowerCase()) {
    case 'concept': return 'secondary' as const;
    case 'beta': return 'default' as const;
    case 'alpha': return 'danger' as const;
    default: return 'neutral' as const;
  }
};

const capitalizeStage = (stage: string) =>
  stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();

export default function AccountFeaturesPage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [features, setFeatures] = useState<EarlyAccessFeature[]>([]);
  const publicFeatures = useQuery(api.featureFlags.listPublic, {});
  const enrollments = useQuery(api.featureEnrollments.listForCurrentUser, {});
  const upsertEnrollment = useMutation(api.featureEnrollments.upsertForCurrentUser);
  const { client } = useStatsigClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [_lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadFeatures = useCallback(async () => {
    try {
      setLoading(true);
      const enrollmentMap = new Map(
        (enrollments || []).map((e) => [e.featureKey, !!e.enabled])
      );
      const rows: EarlyAccessFeature[] = (publicFeatures || []).map((r) => ({
        flagKey: r.key,
        name: r.name,
        description: r.description ?? '',
        stage: r.stage ?? '',
        enrolled: enrollmentMap.get(r.key) || false,
      }));
      setFeatures(rows);
      setLastRefresh(new Date());
    } catch {
      toast({ title: 'Error', description: 'Failed to load early access features. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [publicFeatures, enrollments, toast]);

  const toggleFeature = async (flagKey: string, enabled: boolean) => {
    try {
      setUpdating(flagKey);
      await upsertEnrollment({ featureKey: flagKey, enabled });
      window.dispatchEvent(new CustomEvent('featureFlagChanged', { detail: { flagKey, enabled } }));
      setFeatures((prev) =>
        prev.map((feature) =>
          feature.flagKey === flagKey ? { ...feature, enrolled: enabled } : feature
        )
      );
      const feature = features.find((f) => f.flagKey === flagKey);
      toast({
        title: enabled ? 'Feature Enabled' : 'Feature Disabled',
        description: `${enabled ? 'Opted into' : 'Opted out of'} ${feature?.name || flagKey}`,
      });
    } catch {
      toast({ title: 'Error', description: `Failed to ${enabled ? 'enable' : 'disable'} feature. Please try again.`, variant: 'destructive' });
    } finally {
      setUpdating(null);
    }
  };

  const refreshFeatures = async () => {
    await loadFeatures();
    try {
      const enrolledMap = new Map((enrollments || []).map((e) => [e.featureKey, !!e.enabled]));
      const enrolled: Record<string, boolean> = {};
      const flattened: Record<string, boolean> = {};
      for (const [k, v] of enrolledMap.entries()) {
        enrolled[k] = v;
        const safe = `enrolled_${k.replace(/[^A-Za-z0-9_]/g, '_')}`;
        flattened[safe] = v;
      }
      const statsigUser = user
        ? {
            userID: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            custom: {
              fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
              organisationId: (user.publicMetadata?.organisationId as string) ?? undefined,
              role: (user.publicMetadata?.role as string) ?? undefined,
              enrolled,
              ...flattened,
            },
          }
        : { userID: 'anonymous' };
      const anyClient = client as unknown as { updateUser?: (u: unknown) => Promise<unknown> };
      await anyClient.updateUser?.(statsigUser);
      client.logEvent('features_refresh');
    } catch {
      // Ignore feature refresh errors silently
    }
    toast({ title: 'Refreshed', description: 'Features and flags re-synced.' });
    router.refresh();
  };

  useEffect(() => {
    if (isLoaded && user) void loadFeatures();
    return () => {
      setFeatures([]);
      setLoading(false);
      setUpdating(null);
    };
  }, [isLoaded, user, loadFeatures]);

  const enrolledCount = features.filter((f) => f.enrolled).length;

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Account', href: '/account' },
    { label: 'Early Access' },
  ];

  const headerActions = (
    <Button variant="outline" size="sm" onClick={refreshFeatures} disabled={loading}>
      <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
      Refresh
    </Button>
  );

  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Early Access Features"
      subtitle="Opt into experimental features and preview upcoming functionality"
      headerActions={headerActions}
    >
      <div className="flex flex-col gap-6">
        {/* ── Status Banner ────────────────────────────────────── */}
        <Card className="overflow-hidden border-border/60">
          <div className="h-20 bg-primary/8 relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 15% 50%, var(--color-primary) 0%, transparent 55%), radial-gradient(circle at 85% 25%, var(--color-accent-foreground) 0%, transparent 50%)',
              }}
            />
          </div>
          <CardContent className="px-6 pb-6 pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted shadow-xs">
                <Crown className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold leading-tight">Early Access Status</h2>
                <p className="text-sm text-muted-foreground">
                  {features.length === 0
                    ? 'No features available at this time'
                    : `${enrolledCount} of ${features.length} feature${features.length === 1 ? '' : 's'} enrolled`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  {features.length} available
                </Badge>
                {enrolledCount > 0 && (
                  <Badge variant="success" className="flex items-center gap-1.5">
                    <CheckCircle className="h-3 w-3" />
                    {enrolledCount} enrolled
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Features List ────────────────────────────────────── */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Available Features
          </h3>
          <Card className="border-border/60">
            <CardContent className="px-6 py-6">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin mr-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Loading features...</span>
                </div>
              ) : features.length > 0 ? (
                <div className="space-y-0">
                  {features.map((feature, index) => (
                    <div key={feature.flagKey}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted mt-0.5">
                            {feature.enrolled ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{feature.name}</span>
                              <Badge variant={getStageBadgeVariant(feature.stage)} className="text-[10px] py-0 px-1.5">
                                {capitalizeStage(feature.stage)}
                              </Badge>
                              <Badge
                                variant={feature.enrolled ? 'success' : 'neutral'}
                                className="text-[10px] py-0 px-1.5"
                              >
                                {feature.enrolled ? 'Enrolled' : 'Not enrolled'}
                              </Badge>
                            </div>
                            {feature.description && (
                              <p className="text-xs text-muted-foreground leading-relaxed">
                                {feature.description}
                              </p>
                            )}
                            <p className="mt-1 text-[11px] text-muted-foreground/60 font-mono">
                              {feature.flagKey}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 mt-0.5">
                          {updating === feature.flagKey && (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          )}
                          <Switch
                            checked={feature.enrolled || false}
                            onCheckedChange={(enabled) => toggleFeature(feature.flagKey, enabled)}
                            disabled={updating === feature.flagKey}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-border/60 bg-muted mx-auto mb-4">
                    <Crown className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No Features Available</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    There are currently no early access features available for your account.
                  </p>
                  <Button onClick={refreshFeatures} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Check for Features
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Stage Guide ──────────────────────────────────────── */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Feature Stages
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Alpha', variant: 'danger' as const, desc: 'Very early development, may be unstable' },
              { label: 'Beta', variant: 'default' as const, desc: 'Feature complete, undergoing testing' },
              { label: 'Concept', variant: 'secondary' as const, desc: 'Experimental ideas, may change significantly' },
            ].map((stage) => (
              <div
                key={stage.label}
                className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4"
              >
                <Badge variant={stage.variant} className="mt-0.5 shrink-0">
                  {stage.label}
                </Badge>
                <p className="text-xs text-muted-foreground leading-relaxed">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Info Card ────────────────────────────────────────── */}
        <Card className="border-border/60">
          <CardContent className="px-6 py-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Early access features are experimental and may not be fully stable. Your preferences are saved automatically and persist across all devices and sessions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardizedSidebarLayout>
  );
}
