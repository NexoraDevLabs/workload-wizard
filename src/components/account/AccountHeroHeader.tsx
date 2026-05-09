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
    <Card className="overflow-hidden border-border/60 py-0">
      {/* Banner */}
      <div
        className="relative h-28 overflow-hidden select-none bg-blue-100 dark:bg-blue-950/40"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(219, 234, 254, 0.65) 0%, rgba(147, 197, 253, 0.72) 18%, rgba(191, 219, 254, 0.42) 100%), linear-gradient(90deg, rgba(59, 130, 246, 0.36) 0%, rgba(99, 102, 241, 0.24) 45%, rgba(147, 197, 253, 0.38) 100%), radial-gradient(circle at 18% 45%, rgba(37, 99, 235, 0.28) 0%, transparent 46%), radial-gradient(circle at 82% 20%, rgba(59, 130, 246, 0.24) 0%, transparent 52%)',
          }}
        />

        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-card/90 to-transparent" />
      </div>
  
      <CardContent className="px-6 pb-6 pt-0">
        {/* Identity row */}
        <div className="-mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Avatar + name/email */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <Avatar className="-mt-8 h-24 w-24 shrink-0 ring-4 ring-background shadow-md">
              <AvatarImage src={avatarUrl} alt={`${userName} profile picture`} />
              <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>
  
            <div className="min-w-0 pt-2 sm:pt-3">
              <h2 className="text-balance text-2xl font-semibold leading-tight">
                {userName}
              </h2>
              {username && (
                <p className="font-mono text-sm text-muted-foreground">
                  @{username}
                </p>
              )}
              <p className="mt-0.5 text-sm text-muted-foreground">{userEmail}</p>
            </div>
          </div>
  
          {/* Roles + quick actions */}
          <div className="flex flex-wrap items-center gap-2 sm:pt-5">
            {userRoles.length > 0 ? (
              userRoles.map((role, i) => (
                <Badge key={i} variant={getRoleBadgeVariant(role)}>
                  {getRoleLabel(role)}
                </Badge>
              ))
            ) : (
              <Badge variant="neutral">No roles</Badge>
            )}
  
            <div className="ml-1 flex items-center gap-2">
              <Button
                size="sm"
                variant="soft"
                onClick={onEditDetails}
                className="gap-1.5"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit details
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onChangePhoto}
                className="gap-1.5"
              >
                <Camera className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Change photo</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onSecuritySettings}
                className="gap-1.5"
              >
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
