'use client';

import * as React from 'react';
import { ChevronsUpDown, GraduationCap, Plus, WandSparkles } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useAcademicYear } from '@/components/providers/AcademicYearProvider';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

type OrgItem = {
  _id: string;
  name: string;
  code?: string;
};

export function TeamSwitcher() {
  const { isMobile } = useSidebar();
  const { user } = useAuthUser();
  const {
    years,
    currentYearId,
    setCurrentYearId,
  } = useAcademicYear();

  // Fetch all organisations the user belongs to
  const authContext = useQuery(
    api.users.getAuthContext,
    user?.id ? { subject: user.id } : 'skip'
  );

  const memberships = (authContext?.memberships ?? []) as Array<{
    orgId: string;
    isPrimary: boolean;
    role: string;
  }>;

  // Fetch org details for each membership
  const currentOrgId = authContext?.organisationId
    ? String(authContext.organisationId)
    : null;

  const allOrgs = useQuery(api.organisations.list) as OrgItem[] | undefined;

  // Filter to only orgs the user is a member of
  const userOrgIds = new Set([
    ...(memberships.map((m) => String(m.orgId))),
    ...(currentOrgId ? [currentOrgId] : []),
  ]);
  const userOrgs: OrgItem[] = (allOrgs ?? []).filter((o) =>
    userOrgIds.has(String(o._id))
  );

  const activeOrg: OrgItem | null =
    userOrgs.find((o) => String(o._id) === currentOrgId) ?? userOrgs[0] ?? null;

  const currentYear = years.find((y) => String(y._id) === currentYearId) ?? null;
  const hasMultipleOrgs = userOrgs.length > 1;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <WandSparkles className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {activeOrg?.name ?? 'WorkloadWizard'}
                </span>
                <span className="truncate text-xs text-sidebar-foreground/70">
                  {currentYear?.name ?? (activeOrg?.code ?? 'No year selected')}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-64 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            {/* Organisation section */}
            {hasMultipleOrgs && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Organisations
                  </DropdownMenuLabel>
                  {userOrgs.map((org, index) => (
                    <DropdownMenuItem
                      key={org._id}
                      className="gap-2 p-2"
                      disabled={String(org._id) === currentOrgId}
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                        <WandSparkles className="size-3.5 shrink-0" />
                      </div>
                      <span className="flex-1 truncate">{org.name}</span>
                      {String(org._id) === currentOrgId && (
                        <span className="text-xs text-muted-foreground">
                          Active
                        </span>
                      )}
                      {index < 9 && (
                        <DropdownMenuShortcut>
                          ⌘{index + 1}
                        </DropdownMenuShortcut>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Academic year section */}
            {years.length > 0 && (
              <>
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Academic Year
                  </DropdownMenuLabel>
                  {years.map((year) => (
                    <DropdownMenuItem
                      key={String(year._id)}
                      className="gap-2 p-2"
                      onClick={() => setCurrentYearId(String(year._id))}
                    >
                      <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                        <GraduationCap className="size-3.5 shrink-0" />
                      </div>
                      <span className="flex-1 truncate">
                        {year.name}
                        {year.status !== 'published' ? ' (draft)' : ''}
                      </span>
                      {String(year._id) === currentYearId && (
                        <span className="text-xs text-muted-foreground">
                          Active
                        </span>
                      )}
                      {year.isDefaultForOrg && String(year._id) !== currentYearId && (
                        <span className="text-xs text-muted-foreground">
                          Default
                        </span>
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
              </>
            )}

            {/* No content state */}
            {years.length === 0 && !hasMultipleOrgs && (
              <DropdownMenuItem disabled className="gap-2 p-2 text-muted-foreground">
                <GraduationCap className="size-4" />
                No academic years configured
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
