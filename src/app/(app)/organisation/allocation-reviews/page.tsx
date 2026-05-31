'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthUser } from '@/hooks/useAuthUser';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Check, Clock, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

type ReviewRow = {
  request: {
    _id: string;
    type: 'assign' | 'update' | 'remove';
    status: 'pending' | 'approved' | 'rejected';
    requestedAt: number;
    reason?: string;
    payload: string;
  };
  lecturer: { fullName: string; teamName?: string };
  requester?: { fullName?: string; email?: string } | null;
  group?: { name?: string } | null;
};

export default function AllocationReviewsPage() {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>(
    'pending'
  );
  const canReviewChanges = useQuery(
    api.permissions.hasPermission,
    user?.id
      ? { userId: user.id, permissionId: 'manager.changes.review' }
      : 'skip'
  );
  const canViewWorkloadAllocations = useQuery(
    api.permissions.hasPermission,
    user?.id
      ? { userId: user.id, permissionId: 'workload.admin.allocations.view' }
      : 'skip'
  );
  const canManagePermissions = useQuery(
    api.permissions.hasPermission,
    user?.id
      ? { userId: user.id, permissionId: 'permissions.manage' }
      : 'skip'
  );
  const permissionChecksLoaded =
    canReviewChanges !== undefined &&
    canViewWorkloadAllocations !== undefined &&
    canManagePermissions !== undefined;
  const canViewReviews = Boolean(
    canReviewChanges || canViewWorkloadAllocations || canManagePermissions
  );
  const rows = useQuery(
    api.allocations.listAllocationChangeRequests,
    user?.id && canViewReviews ? { userId: user.id, status } : 'skip'
  ) as ReviewRow[] | undefined;
  const canApprove = useQuery(
    api.permissions.hasPermission,
    user?.id && canViewReviews
      ? { userId: user.id, permissionId: 'manager.changes.approve' }
      : 'skip'
  );
  const review = useMutation(api.allocations.reviewAllocationChangeRequest);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !permissionChecksLoaded) return;
    if (!canViewReviews) {
      router.replace('/unauthorised');
    }
  }, [
    canViewReviews,
    isLoaded,
    isSignedIn,
    permissionChecksLoaded,
    router,
    user,
  ]);

  const decide = async (
    requestId: string,
    decision: 'approved' | 'rejected'
  ) => {
    if (!user?.id) return;
    try {
      await review({
        userId: user.id,
        requestId: requestId as never,
        decision,
      });
      toast({
        title: decision === 'approved' ? 'Change approved' : 'Change rejected',
      });
    } catch (error) {
      toast({
        title: 'Review failed',
        description:
          error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (!isLoaded || !isSignedIn || !user) return null;

  return (
    <StandardizedSidebarLayout
      breadcrumbs={[
        { label: 'Organisation', href: '/organisation' },
        { label: 'Allocation Reviews' },
      ]}
      title="Allocation Reviews"
      subtitle="Review requested module allocation additions, changes, and removals"
      headerActions={
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected'] as const).map((item) => (
            <Button
              key={item}
              size="sm"
              variant={status === item ? 'default' : 'outline'}
              onClick={() => setStatus(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </Button>
          ))}
        </div>
      }
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!rows || rows.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No {status} allocation change requests.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Change</TableHead>
                  <TableHead>Team member</TableHead>
                  <TableHead>Requested by</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="w-36 text-right">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const payload = JSON.parse(row.request.payload) as {
                    allocationType?: string;
                    hoursOverride?: number | null;
                  };
                  return (
                    <TableRow key={row.request._id}>
                      <TableCell>
                        <div className="font-medium capitalize">
                          {row.request.type}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.group?.name || 'Existing allocation'} ·{' '}
                          {payload.allocationType || 'allocation'}
                          {typeof payload.hoursOverride === 'number'
                            ? ` · ${payload.hoursOverride}h`
                            : ''}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{row.lecturer.fullName}</div>
                        <Badge variant="secondary">
                          {row.lecturer.teamName || 'No team'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {row.requester?.fullName ||
                          row.requester?.email ||
                          'Unknown'}
                      </TableCell>
                      <TableCell className="max-w-xs text-sm text-muted-foreground">
                        {row.request.reason || 'No reason provided'}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.request.status !== 'pending' ? (
                          <Badge variant="outline">{row.request.status}</Badge>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={!canApprove}
                              onClick={() =>
                                decide(row.request._id, 'rejected')
                              }
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              disabled={!canApprove}
                              onClick={() =>
                                decide(row.request._id, 'approved')
                              }
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {!canApprove && status === 'pending' ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Approval actions require the manager.changes.approve permission.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </StandardizedSidebarLayout>
  );
}
