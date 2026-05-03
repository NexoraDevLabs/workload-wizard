'use client';

import posthog from 'posthog-js';
import { useUser } from '@clerk/nextjs';
import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  User,
  Mail,
  Calendar,
  Camera,
  Save,
  X,
  RefreshCw,
  AtSign,
  Pencil,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getUserRoles } from '@/lib/utils';

// Force dynamic rendering to prevent Clerk authentication errors during build
export const dynamic = 'force-dynamic';

const getRoleLabel = (role: string) => {
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
};

const getRoleBadgeVariant = (role: string): NonNullable<BadgeProps['variant']> => {
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
};

const formatDate = (date: Date | null) => {
  if (!date) return 'Unknown';
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((p) => p.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const updateUserAvatar = useMutation(api.users.updateUserAvatar);
  const convexAvatarUrl = useQuery(
    api.users.getUserAvatar,
    user ? { subject: user.id } : 'skip'
  );

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [avatarRefreshKey, setAvatarRefreshKey] = useState<number>(0);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please sign in to view your account.</p>
      </div>
    );
  }

  const userName = user.fullName || user.firstName || 'User';
  const userEmail = user.emailAddresses[0]?.emailAddress || '';
  const userRoles = getUserRoles(user);
  const clerkAvatarUrl = user.imageUrl;
  const convexAvatarUrlValue = convexAvatarUrl || null;
  const avatarUrl = clerkAvatarUrl
    ? `${clerkAvatarUrl}?r=${avatarRefreshKey}`
    : convexAvatarUrlValue
      ? `${convexAvatarUrlValue}?r=${avatarRefreshKey}`
      : '';
  const createdAt = user.createdAt;
  const initials = getInitials(userName);

  if (!isEditing && formData.firstName === '') {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      username: user.username || '',
      email: userEmail,
    });
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: 'Invalid File Type', description: 'Please select a JPG, PNG, GIF, or WebP image.', variant: 'destructive' });
        return;
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({ title: 'File Too Large', description: 'Please select an image smaller than 5MB.', variant: 'destructive' });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target?.result as string);
      reader.onerror = () => toast({ title: 'File Read Error', description: 'Failed to read the selected file. Please try again.', variant: 'destructive' });
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        toast({ title: 'Authentication Error', description: 'Please sign in again to update your profile.', variant: 'destructive' });
        return;
      }
      await user.update({ firstName: formData.firstName, lastName: formData.lastName, username: formData.username });

      if (formData.email !== userEmail) {
        try {
          const response = await fetch('/api/update-user-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, newEmail: formData.email.trim() }),
          });
          if (!response.ok) {
            const errorData = (await response.json()) as { error?: string };
            throw new Error(errorData.error || 'Failed to update email');
          }
          toast({ title: 'Email Updated', description: 'Your email address has been updated successfully.', variant: 'success' });
          await user.reload();
        } catch (emailError) {
          toast({ title: 'Email Update Failed', description: emailError instanceof Error ? emailError.message : 'Failed to update email. Please try again.', variant: 'destructive' });
          return;
        }
      }

      if (avatarFile && avatarFile.size > 0) {
        try {
          await user.setProfileImage({ file: avatarFile });
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const updatedImageUrl = user.imageUrl;
          if (updatedImageUrl && updatedImageUrl !== avatarUrl) {
            await updateUserAvatar({ subject: user.id, pictureUrl: updatedImageUrl });
            toast({ title: 'Avatar Updated', description: 'Your profile picture has been updated successfully.', variant: 'success' });
            await user.reload();
            setAvatarRefreshKey((prev) => prev + 1);
          } else {
            toast({ title: 'Avatar Update', description: 'Avatar uploaded. It may take a moment to appear.', variant: 'success' });
          }
        } catch (avatarError) {
          let errorMessage = 'Failed to update avatar. Please try again.';
          if (avatarError instanceof Error) {
            if (avatarError.message.includes('network')) errorMessage = 'Network error. Please check your connection and try again.';
            else if (avatarError.message.includes('unauthorized')) errorMessage = 'Authentication error. Please sign in again.';
            else if (avatarError.message.includes('file')) errorMessage = 'Invalid file. Please select a valid image file.';
          }
          toast({ title: 'Avatar Update Failed', description: errorMessage, variant: 'destructive' });
        }
      }

      if (typeof posthog !== 'undefined' && posthog.capture) {
        posthog.capture('profile-updated', { user_id: user.id, avatar_updated: !!(avatarFile && avatarFile.size > 0) });
      }

      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.', variant: 'success' });
      setIsEditing(false);
      setFormData({ firstName: user.firstName || '', lastName: user.lastName || '', username: user.username || '', email: userEmail });
      setAvatarFile(null);
      setAvatarPreview('');
    } catch {
      toast({ title: 'Error', description: 'Failed to update profile. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (typeof posthog !== 'undefined' && posthog.capture) {
      posthog.capture('profile-edit-cancelled', { user_id: user.id });
    }
    setIsEditing(false);
    setFormData({ firstName: user.firstName || '', lastName: user.lastName || '', username: user.username || '', email: userEmail });
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const handleRefreshAvatar = async () => {
    try {
      await user.reload();
      setAvatarRefreshKey((prev) => prev + 1);
      toast({ title: 'Avatar Refreshed', description: 'Profile picture has been refreshed.', variant: 'success' });
    } catch {
      toast({ title: 'Refresh Failed', description: 'Failed to refresh avatar. Please try again.', variant: 'destructive' });
    }
  };

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Account', href: '/account' },
    { label: 'Profile' },
  ];

  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Profile"
      subtitle="Manage your personal information and profile picture"
    >
      <div className="flex flex-col gap-6">
        {/* ── Hero Identity Card ───────────────────────────────── */}
        <Card className="overflow-hidden border-border/60">
          <div className="h-24 bg-primary/8 relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 50%, var(--color-primary) 0%, transparent 60%), radial-gradient(circle at 80% 20%, var(--color-accent-foreground) 0%, transparent 50%)',
              }}
            />
          </div>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between -mt-10">
              {/* Avatar upload area */}
              <div className="flex items-end gap-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20 ring-4 ring-background shadow-md">
                    <AvatarImage src={avatarPreview || avatarUrl} alt={userName} />
                    <AvatarFallback className="text-2xl font-semibold bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => document.getElementById('avatar')?.click()}
                      className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Change profile picture"
                    >
                      <Camera className="h-5 w-5 text-white" />
                    </button>
                  )}
                </div>
                <div className="mb-1">
                  <h2 className="text-xl font-semibold leading-tight">{userName}</h2>
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                </div>
              </div>
              {/* Roles + actions */}
              <div className="flex flex-wrap items-center gap-2 sm:mb-1">
                {userRoles && userRoles.length > 0 ? (
                  userRoles.map((role, i) => (
                    <Badge key={i} variant={getRoleBadgeVariant(role)}>
                      {getRoleLabel(role)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="neutral">No roles</Badge>
                )}
                {!isEditing && (
                  <Button
                    size="sm"
                    variant="soft"
                    className="ml-1"
                    onClick={() => {
                      if (typeof posthog !== 'undefined' && posthog.capture) {
                        posthog.capture('profile-edit-started', { user_id: user.id });
                      }
                      setIsEditing(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 mr-1.5" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
            {/* Metadata row */}
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-border/50 pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {userEmail}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Member since {formatDate(createdAt)}
              </span>
              {user.username && (
                <span className="flex items-center gap-1.5">
                  <AtSign className="h-3.5 w-3.5" />
                  {user.username}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ── Personal Information ─────────────────────────────── */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Personal Information
          </h3>
          <Card className="border-border/60">
            <CardContent className="px-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="First name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    disabled={!isEditing}
                    placeholder="Last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    disabled={!isEditing}
                    placeholder="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              {isEditing && (
                <>
                  <Separator className="mt-6 mb-5" />

                  {/* Avatar upload controls (inline when editing) */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Profile Picture</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('avatar')?.click()}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Change Photo
                      </Button>
                      {avatarFile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setAvatarFile(null); setAvatarPreview(''); }}
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefreshAvatar}
                        disabled={isLoading}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">JPG, PNG, GIF or WebP. Max 5 MB.</p>
                  </div>

                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />

                  <Separator className="mt-5 mb-5" />

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Account Details ──────────────────────────────────── */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Account Details
          </h3>
          <Card className="border-border/60">
            <CardContent className="px-6 py-5">
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-28 shrink-0">Email</span>
                  <span className="font-medium">{userEmail}</span>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground w-28 shrink-0">Member since</span>
                  <span className="font-medium">{formatDate(createdAt)}</span>
                </div>
                {user.username && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <AtSign className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground w-28 shrink-0">Username</span>
                      <span className="font-medium">{user.username}</span>
                    </div>
                  </>
                )}
                {userRoles.length > 0 && (
                  <>
                    <Separator />
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-muted-foreground w-28 shrink-0">Roles</span>
                      <div className="flex flex-wrap gap-1.5">
                        {userRoles.map((role, i) => (
                          <Badge key={i} variant={getRoleBadgeVariant(role)}>
                            {getRoleLabel(role)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </StandardizedSidebarLayout>
  );
}
