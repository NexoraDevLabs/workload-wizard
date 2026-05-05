'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Building2,
  CalendarDays,
  Camera,
  CheckCircle2,
  Lock,
  Mail,
  Pencil,
  Shield,
} from 'lucide-react';

// ── Role helpers ──────────────────────────────────────────────────────────────

export function getRoleLabel(role: string): string {
  switch (role) {
    case 'orgadmin':
      return 'Org Admin';
    case 'sysadmin':
      return 'System Admin';
    case 'developer':
      return 'Developer';
    case 'user':
      return 'User';
    case 'trial':
      return 'Trial';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

export function getRoleBadgeVariant(role: string): NonNullable<BadgeProps['variant']> {
  switch (role) {
    case 'orgadmin':
      return 'danger';
    case 'sysadmin':
      return 'info';
    case 'developer':
      return 'info';
    case 'user':
      return 'success';
    case 'trial':
      return 'warning';
    default:
      return 'neutral';
  }
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDateGB(date: Date | null): string {
  if (!date) return 'Unknown';
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface AccountHeroHeaderProps {
  userName: string;
  userEmail: string;
  userRoles: string[];
  avatarUrl: string;
  username: string | null | undefined;
  organisationName: string | null | undefined;
  createdAt: Date | null;
  onEditDetails: () => void;
  onChangePhoto: () => void;
  onSecuritySettings: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AccountHeroHeader({
  userName,
  userEmail,
  userRoles,
  avatarUrl,
  username,
  organisationName,
  createdAt,
  onEditDetails,
  onChangePhoto,
  onSecuritySettings,
}: AccountHeroHeaderProps) {
  const initials = getInitials(userName);
  const isSysadmin = userRoles.includes('sysadmin');
  const isOrgAdmin = userRoles.includes('orgadmin');

  return (
    <Card className="overflow-hidden border-border/60">
      {/* Banner */}
      <div className="h-28 bg-primary/8 relative select-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 50%, var(--color-primary) 0%, transparent 60%), radial-gradient(circle at 80% 20%, var(--color-accent-foreground) 0%, transparent 50%)',
          }}
        />
      </div>

      <CardContent className="px-6 pb-6 pt-0">
        {/* Identity row */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-12">
          {/* Avatar + name/email */}
          <div className="flex items-end gap-4">
            <Avatar className="h-24 w-24 ring-4 ring-background shadow-md shrink-0">
              <AvatarImage src={avatarUrl} alt={`${userName} profile picture`} />
              <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="mb-1 min-w-0">
              <h2 className="text-2xl font-semibold leading-tight text-balance">
                {userName}
              </h2>
              {username && (
                <p className="text-sm text-muted-foreground font-mono">
                  @{username}
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">{userEmail}</p>
            </div>
          </div>

          {/* Roles + quick actions */}
          <div className="flex flex-wrap items-center gap-2 sm:mb-1">
            {userRoles.length > 0 ? (
              userRoles.map((role, i) => (
                <Badge key={i} variant={getRoleBadgeVariant(role)}>
                  {getRoleLabel(role)}
                </Badge>
              ))
            ) : (
              <Badge variant="neutral">No roles</Badge>
            )}

            <div className="flex items-center gap-2 ml-1">
              <Button size="sm" variant="soft" onClick={onEditDetails} className="gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit details
              </Button>
              <Button size="sm" variant="ghost" onClick={onChangePhoto} className="gap-1.5">
                <Camera className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Change photo</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={onSecuritySettings} className="gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Security</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Metadata strip */}
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/50 pt-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            {userEmail}
          </span>

          {organisationName && (
            <span className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {organisationName}
            </span>
          )}

          <span className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            Member since {formatDateGB(createdAt)}
          </span>

          {isSysadmin && (
            <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Full system access
            </span>
          )}

          {isOrgAdmin && (
            <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              Organisation admin
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
