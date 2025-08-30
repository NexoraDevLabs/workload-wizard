'use client';

import { useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { useStatsigClient } from '@statsig/react-bindings';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
// Feature flags removed

// Force dynamic rendering to prevent Clerk authentication errors during build
export const dynamic = 'force-dynamic';

interface EarlyAccessFeature {
  flagKey: string;
  name: string;
  description?: string;
  stage: string;
  enrolled?: boolean;
}

// Local storage key for feature flag overrides
const LOCAL_FLAG_OVERRIDES_KEY = 'feature-flag-overrides';

function getLocalFlagOverrides(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = localStorage.getItem(LOCAL_FLAG_OVERRIDES_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (_error) {
    // Failed to get local flag overrides
    return {};
  }
}

function _setLocalFlagOverride(flagKey: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;

  try {
    const overrides = getLocalFlagOverrides();
    overrides[flagKey] = enabled;
    localStorage.setItem(LOCAL_FLAG_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (_error) {
    // Failed to set local flag override
  }
}

export default function AccountFeaturesPage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [features, setFeatures] = useState<EarlyAccessFeature[]>([]);
  const publicFeatures = useQuery(api.featureFlags.listPublic, {});
  const enrollments = useQuery(api.featureEnrollments.listForCurrentUser, {});
  const upsertEnrollment = useMutation(
    api.featureEnrollments.upsertForCurrentUser
  );
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
        description: (r.description as string) || '',
        stage: r.stage as string,
        enrolled: enrollmentMap.get(r.key) || false,
      }));
      setFeatures(rows);
      setLastRefresh(new Date());
    } catch (error) {
      // Use toast directly instead of in dependency
      toast({
        title: 'Error',
        description: 'Failed to load early access features. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [publicFeatures, enrollments, toast]); // refresh when data changes

  const toggleFeature = async (flagKey: string, enabled: boolean) => {
    try {
      setUpdating(flagKey);

      // Persist server-side enrollment
      await upsertEnrollment({ featureKey: flagKey, enabled });

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent('featureFlagChanged', {
          detail: { flagKey, enabled },
        })
      );

      // Update local state
      setFeatures((prev) =>
        prev.map((feature) =>
          feature.flagKey === flagKey
            ? { ...feature, enrolled: enabled }
            : feature
        )
      );

      const feature = features.find((f) => f.flagKey === flagKey);
      const featureName = feature?.name || flagKey;

      toast({
        title: enabled ? 'Feature Enabled' : 'Feature Disabled',
        description: `${enabled ? 'Opted into' : 'Opted out of'} ${featureName}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${enabled ? 'enable' : 'disable'} feature. Please try again.`,
        variant: 'destructive',
      });
    } finally {
      setUpdating(null);
    }
  };

  const refreshFeatures = async () => {
    await loadFeatures();
    try {
      // Build a fresh Statsig user and force client re-evaluation to reduce delay
      const enrolledMap = new Map(
        (enrollments || []).map((e) => [e.featureKey, !!e.enabled])
      );
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
              organisationId:
                (user.publicMetadata?.organisationId as string) ?? undefined,
              role: (user.publicMetadata?.role as string) ?? undefined,
              enrolled,
              ...flattened,
            },
          }
        : { userID: 'anonymous' };
      const anyClient = client as unknown as {
        updateUser?: (u: unknown) => Promise<unknown>;
      };
      await anyClient.updateUser?.(statsigUser);
      client.logEvent('features_refresh');
    } catch {
      // Ignore feature refresh errors silently
    }
    toast({
      title: 'Refreshed',
      description: 'Features and flags re-synced.',
    });
    router.refresh();
  };

  useEffect(() => {
    if (isLoaded && user) {
      void loadFeatures();
    }

    // Cleanup function to prevent memory leaks
    return () => {
      // Clear any pending state updates
      setFeatures([]);
      setLoading(false);
      setUpdating(null);
    };
  }, [isLoaded, user, loadFeatures]);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Account', href: '/account' },
    { label: 'Features' },
  ];

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={refreshFeatures}
        disabled={loading}
      >
        <RefreshCw
          className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}
        />
        Refresh
      </Button>
    </div>
  );

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

  const capitalizeStage = (stage: string) => {
    return stage.charAt(0).toUpperCase() + stage.slice(1).toLowerCase();
  };



  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Early Access Features"
      subtitle="Manage your opt-in preferences for experimental features"
      headerActions={headerActions}
    >
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Feature Status
          </CardTitle>
          <CardDescription>
            Your early access feature preferences and account information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Available Features:</span>
              <Badge variant="outline">
                {features.length}{' '}
                {features.length === 1 ? 'feature' : 'features'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Enrolled Features:</span>
              <Badge variant="outline">
                {features.filter((f) => f.enrolled).length}{' '}
                {features.filter((f) => f.enrolled).length === 1
                  ? 'feature'
                  : 'features'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Available Early Access Features
          </CardTitle>
          <CardDescription>
            Toggle features on or off to control your access to experimental
            functionality.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Loading early access features...</span>
            </div>
          ) : features.length > 0 ? (
            <div className="space-y-4">
              {features.map((feature) => (
                <div key={feature.flagKey} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{feature.name}</h3>
                        <Badge
                          variant={getStageBadgeVariant(feature.stage)}
                          className="text-xs"
                        >
                          {capitalizeStage(feature.stage)}
                        </Badge>
                        <Badge
                          variant={feature.enrolled ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {feature.enrolled ? 'Enrolled' : 'Not Enrolled'}
                        </Badge>
                      </div>

                      {feature.description && (
                        <p className="text-sm text-muted-foreground">
                          {feature.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="font-mono">{feature.flagKey}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 ml-4">
                      <div className="flex items-center gap-2">
                        {updating === feature.flagKey ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : feature.enrolled ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-gray-400" />
                        )}
                        <Switch
                          checked={feature.enrolled || false}
                          onCheckedChange={(enabled) =>
                            toggleFeature(feature.flagKey, enabled)
                          }
                          disabled={updating === feature.flagKey}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No Early Access Features Available
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                There are currently no early access features available for your
                account.
              </p>
              <Button onClick={refreshFeatures} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Check for Features
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            About Early Access Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              Early access features are experimental functionality that may not
              be fully tested or stable. These features are provided to give you
              a preview of upcoming functionality.
            </p>
            <div className="space-y-2">
              <h4 className="font-medium">Feature Stages:</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">
                    Alpha
                  </Badge>
                  <span>Very early development, may be unstable</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-xs">
                    Beta
                  </Badge>
                  <span>Feature complete, undergoing testing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Concept
                  </Badge>
                  <span>Experimental ideas, may change significantly</span>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground">
              Your preferences are saved automatically and will persist across
              all your devices and sessions.
            </p>
          </div>
        </CardContent>
      </Card>
    </StandardizedSidebarLayout>
  );
}
