'use client';

import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, RefreshCw, Edit, RefreshCcw, Rocket } from 'lucide-react';
import { EditOrganisationForm } from './EditOrganisationForm';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuthUser } from '@/hooks/useAuthUser';

export function OrganisationsList() {
  const { toast } = useToast();
  const { user } = useAuthUser();
  const organisations = useQuery(api.organisations.list);
  const deleteOrganisation = useMutation(api.organisations.remove);
  const reseedOrg = useMutation(api.organisations.reseedDefaultsForOrg);
  const reseedAll = useMutation(
    api.organisations.reseedDefaultsAcrossOrganisations
  );

  interface EditingOrganisation {
    _id: Id<'organisations'>;
    name: string;
    code: string;
    status: string;
    isActive: boolean;
  }

  const [editingOrganisation, setEditingOrganisation] =
    useState<EditingOrganisation | null>(null);
  const [isSeeding, setIsSeeding] = useState<
    Id<'organisations'> | 'all' | null
  >(null);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const [confirmOrgId, setConfirmOrgId] = useState<Id<'organisations'> | null>(
    null
  );

  // Handle case where Convex might not be ready
  if (organisations === undefined && typeof window !== 'undefined') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading organisations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleDeleteOrganisation = async (id: Id<'organisations'>) => {
    if (!confirm('Are you sure you want to delete this organisation?')) return;

    try {
      await deleteOrganisation({ userId: user!.id, id });
    } catch (err) {
      toast({
        title: 'Failed to delete organisation',
        description: err instanceof Error ? err.message : 'An error occurred',
        variant: 'destructive',
      });
    }
  };

  const handleEditOrganisation = (organisation: EditingOrganisation) => {
    setEditingOrganisation(organisation);
  };

  const handleCloseEdit = () => {
    setEditingOrganisation(null);
  };

  const handleOrganisationUpdated = () => {
    // The list will automatically refresh due to Convex reactivity
    setEditingOrganisation(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (organisations === undefined) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading organisations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Organisations</CardTitle>
            <div className="flex items-center gap-2">
              <AlertDialog
                open={confirmAllOpen}
                onOpenChange={setConfirmAllOpen}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSeeding !== null}
                    title="Seed defaults for all organisations"
                  >
                    <Rocket className="h-4 w-4 mr-2" /> Seed All Defaults
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Seed defaults for all organisations?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This will add missing roles, categories, and settings
                      across all active organisations. Existing data will not be
                      removed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        try {
                          setIsSeeding('all');
                          await reseedAll({ userId: user!.id });
                          toast({
                            title: 'Defaults seeded across organisations',
                          });
                        } catch (e) {
                          toast({
                            title: 'Seeding failed',
                            description:
                              e instanceof Error ? e.message : 'Unknown error',
                            variant: 'destructive',
                          });
                        } finally {
                          setIsSeeding(null);
                          setConfirmAllOpen(false);
                        }
                      }}
                    >
                      Confirm
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
          <CardDescription>
            Manage all organisations in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table data-testid="org-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Contact Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[160px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organisations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground"
                    >
                      No organisations found
                    </TableCell>
                  </TableRow>
                ) : (
                  organisations.map((org) => (
                    <TableRow key={org._id} data-testid={`org-row-${org.code}`}>
                      <TableCell
                        className="font-medium"
                        data-testid="org-name-cell"
                      >
                        {org.name}
                      </TableCell>
                      <TableCell data-testid="org-code-cell">
                        {org.code}
                      </TableCell>
                      <TableCell>{org.contactEmail || 'N/A'}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            org.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : org.status === 'inactive'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {org.status.charAt(0).toUpperCase() +
                            org.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(org.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="sm"
                            className="text-primary hover:text-primary hover:bg-primary/10"
                            title="View overview"
                          >
                            <a href={`/admin/organisations/${org._id}`}>View</a>
                          </Button>
                          <Button
                            onClick={() => handleEditOrganisation(org)}
                            variant="ghost"
                            size="sm"
                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="Edit organisation"
                            data-testid={`org-edit-${org.code}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog
                            open={confirmOrgId === org._id}
                            onOpenChange={(open) =>
                              setConfirmOrgId(open ? org._id : null)
                            }
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50"
                                title="Seed defaults for this organisation"
                                disabled={isSeeding !== null}
                              >
                                <RefreshCcw className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Seed defaults for {org.name}?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will add missing roles, categories, and
                                  settings for this organisation. Existing data
                                  will not be removed.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    try {
                                      setIsSeeding(org._id);
                                      await reseedOrg({
                                        userId: user!.id,
                                        organisationId: org._id,
                                      });
                                      toast({
                                        title: 'Defaults seeded',
                                        description: `${org.name} reseeded successfully`,
                                      });
                                    } catch (e) {
                                      toast({
                                        title: 'Seeding failed',
                                        description:
                                          e instanceof Error
                                            ? e.message
                                            : 'Unknown error',
                                        variant: 'destructive',
                                      });
                                    } finally {
                                      setIsSeeding(null);
                                      setConfirmOrgId(null);
                                    }
                                  }}
                                >
                                  Confirm
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <Button
                            onClick={() => handleDeleteOrganisation(org._id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                            title="Delete organisation"
                            data-testid={`org-delete-${org.code}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Organisation Modal */}
      {editingOrganisation && (
        <EditOrganisationForm
          organisation={editingOrganisation}
          onClose={handleCloseEdit}
          onUpdate={handleOrganisationUpdated}
        />
      )}
    </>
  );
}
