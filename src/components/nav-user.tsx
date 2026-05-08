'use client';

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  LogOut,
  Palette,
  Settings,
  Shield,
  Sparkles,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/hooks/useAuthUser';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Skeleton } from '@/components/ui/skeleton';

export function NavUser() {
  const { user, isLoaded } = useAuthUser();
  const { isMobile } = useSidebar();
  const router = useRouter();

  const profilePictureUrl = useQuery(
    api.users.getOwnProfilePictureUrl,
    user ? { subject: user.id } : 'skip'
  );

  const handleLogout = () => {
    window.location.assign('/api/auth/logout');
  };

  const navigateTo = (path: string) => {
    router.push(path);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!isLoaded) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg">
            <Skeleton className="size-8 rounded-lg" />
            <div className="grid flex-1 gap-1">
              <Skeleton className="h-4 rounded" />
              <Skeleton className="h-3 rounded" />
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (!user) return null;

  const userName = user.fullName || user.firstName || 'User';
  const userEmail = user.emailAddresses[0]?.emailAddress || '';
  const userRole =
    typeof user.publicMetadata?.role === 'string'
      ? user.publicMetadata.role
      : '';
  const avatarUrl = profilePictureUrl || user.imageUrl || '';
  const formattedRole = userRole
    ? userRole.charAt(0).toUpperCase() + userRole.slice(1)
    : '';

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={avatarUrl} alt={userName} />
                <AvatarFallback className="rounded-lg">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{userName}</span>
                <span className="truncate text-xs text-sidebar-foreground/65">
                  {formattedRole || userEmail}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            {/* User identity header */}
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarImage src={avatarUrl} alt={userName} />
                  <AvatarFallback className="rounded-lg">
                    {getInitials(userName)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Quick upgrade / pro prompt */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => navigateTo('/account?tab=overview')}
                className="gap-2"
              >
                <Sparkles />
                Account hub
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Account navigation — each maps to a specific tab */}
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => navigateTo('/account?tab=details')}
                className="gap-2"
              >
                <User />
                Account details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigateTo('/account?tab=security')}
                className="gap-2"
              >
                <Shield />
                Security &amp; privacy
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigateTo('/account?tab=preferences')}
                className="gap-2"
              >
                <Settings />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigateTo('/support')}
                className="gap-2"
              >
                <Bell />
                Support
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Theme toggle */}
            <DropdownMenuGroup>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="
                flex items-center justify-between gap-2
                cursor-default
                focus:bg-transparent
                data-[highlighted]:bg-transparent
              "
            >
                <div className="flex items-center gap-2">
                  <Palette />
                  <span>Theme</span>
                </div>
                <div
                  className="
                    flex h-9 w-9 items-center justify-center
                    rounded-full
                    border border-border/70
                    bg-background/80
                    shadow-sm
                    backdrop-blur-md
                  "
                >
                  <ThemeToggle />
                </div>
              </DropdownMenuItem>

              {formattedRole && (
                <DropdownMenuItem disabled className="gap-2">
                  <BadgeCheck />
                  Role: {formattedRole}
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="gap-2 text-destructive focus:text-destructive"
            >
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
