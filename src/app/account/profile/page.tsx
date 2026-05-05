'use client';

import { useAuthUser } from '@/hooks/useAuthUser';
import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import type { Id } from '@/convex/_generated/dataModel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings,
  User,
  Shield,
  Mail,
  Calendar,
  Camera,
  Save,
  X,
  RefreshCw,
  Building2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const dynamic = 'force-dynamic';

type UpdatedAccountResponse = {
  user?: {
    givenName?: string;
    familyName?: string;
    username?: string;
    email?: string;
  };
};

const allowedImageTypes = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

const maxImageSizeBytes = 5 * 1024 * 1024;

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useAuthUser({
    redirectOnUnauthenticated: true,
  });

  const { toast } = useToast();

  const accountDetails = useQuery(
    api.users.getAccountManagementDetails,
    user ? { subject: user.id } : 'skip'
  );

  const generateUploadUrl = useMutation(
    api.users.generateProfilePictureUploadUrl
  );
  const updateOwnProfilePicture = useMutation(
    api.users.updateOwnProfilePicture
  );

  const profilePictureUrl = useQuery(
    api.users.getOwnProfilePictureUrl,
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
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);

  const organisationName =
    accountDetails?.organisation?.name ?? 'No organisation assigned';

  const userEmail =
    accountDetails?.user.email || user?.emailAddresses[0]?.emailAddress || '';

  const userName =
    accountDetails?.user.fullName || user?.fullName || user?.firstName || 'User';

  const userRole = user?.publicMetadata?.role as string | undefined;
  const workosAvatarUrl = user?.imageUrl || '';
  const convexAvatarUrlValue = profilePictureUrl || null;

  const avatarUrl = convexAvatarUrlValue
    ? `${convexAvatarUrlValue}?r=${avatarRefreshKey}`
    : workosAvatarUrl
      ? `${workosAvatarUrl}?r=${avatarRefreshKey}`
      : '';

  const createdAt = user?.createdAt ?? null;

  useEffect(() => {
    if (!user || !accountDetails?.user || isEditing) return;

    setFormData({
      firstName: accountDetails.user.givenName || user.firstName || '',
      lastName: accountDetails.user.familyName || user.lastName || '',
      username: accountDetails.user.username || '',
      email: accountDetails.user.email || userEmail,
    });
  }, [user, accountDetails, userEmail, isEditing]);

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn || !user) {
    return null;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';

    return new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a JPG, PNG, GIF, or WebP image.',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > maxImageSizeBytes) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5 MB.',
        variant: 'destructive',
      });
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();

    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };

    reader.onerror = () => {
      toast({
        title: 'File read error',
        description: 'Failed to read the selected file. Please try again.',
        variant: 'destructive',
      });
    };

    reader.readAsDataURL(file);
  };

  const uploadProfilePicture = async () => {
    if (!avatarFile) return null;

    const uploadUrl = await generateUploadUrl({
      subject: user.id,
    });

    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': avatarFile.type,
      },
      body: avatarFile,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload profile picture');
    }

    const { storageId } = (await uploadResponse.json()) as {
      storageId: string;
    };

    return await updateOwnProfilePicture({
      subject: user.id,
      storageId: storageId as Id<'_storage'>,
    });
  };

  const updateAccount = async (pictureUrl?: string | null) => {
    const response = await fetch('/api/account/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        givenName: formData.firstName,
        familyName: formData.lastName,
        username: formData.username,
        email: formData.email,
        ...(pictureUrl ? { pictureUrl } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { error?: string };
      throw new Error(errorData.error || 'Failed to update account');
    }

    return (await response.json()) as UpdatedAccountResponse;
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      if (!user.id) {
        toast({
          title: 'Authentication error',
          description: 'Please sign in again to update your account.',
          variant: 'destructive',
        });
        return;
      }

      let pictureUrl: string | null = null;

      if (avatarFile) {
        pictureUrl = await uploadProfilePicture();
      }

      const updatedAccount = await updateAccount(pictureUrl);

      setIsEditing(false);
      setFormData({
        firstName: updatedAccount.user?.givenName || formData.firstName,
        lastName: updatedAccount.user?.familyName || formData.lastName,
        username: updatedAccount.user?.username || formData.username,
        email: updatedAccount.user?.email || formData.email,
      });
      setAvatarFile(null);
      setAvatarPreview('');

      if (pictureUrl) {
        setAvatarRefreshKey((prev) => prev + 1);
      }

      toast({
        title: pictureUrl ? 'Changes saved' : 'Account updated',
        description: pictureUrl
          ? 'Your account and profile picture have been updated.'
          : 'Your account has been successfully updated.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: 'Update failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to update account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      firstName: accountDetails?.user.givenName || user.firstName || '',
      lastName: accountDetails?.user.familyName || user.lastName || '',
      username: accountDetails?.user.username || '',
      email: accountDetails?.user.email || userEmail,
    });
    setAvatarFile(null);
    setAvatarPreview('');
  };

  const handleRefreshAvatar = () => {
    setAvatarRefreshKey((prev) => prev + 1);

    toast({
      title: 'Profile picture refreshed',
      description: 'Your profile picture has been refreshed.',
      variant: 'success',
    });
  };

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Account', href: '/account' },
    { label: 'Overview' },
  ];

  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Account Management"
      subtitle="Manage your account information"
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Overview
            </CardTitle>
            <CardDescription>Your current account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={avatarPreview || avatarUrl} alt={userName} />
                <AvatarFallback className="text-lg">
                  {getInitials(userName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{userName}</h3>
                <p className="text-sm text-muted-foreground">{userEmail}</p>
                {userRole && (
                  <Badge variant="secondary" className="mt-1">
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </Badge>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{userEmail}</span>
              </div>

              {userRole && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Role:</span>
                  <span className="font-medium">
                    {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Member since:</span>
                <span className="font-medium">{formatDate(createdAt)}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Organisation:</span>
                <span>{organisationName}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Account Management
            </CardTitle>
            <CardDescription>Update your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={avatarPreview || avatarUrl}
                      alt={userName}
                    />
                    <AvatarFallback className="text-xl">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="space-y-2">
                    <Label htmlFor="avatar" className="text-sm font-medium">
                      Profile picture
                    </Label>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById('avatar')?.click()
                        }
                        disabled={!isEditing || isLoading}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Change photo
                      </Button>

                      {avatarFile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAvatarFile(null);
                            setAvatarPreview('');
                          }}
                          disabled={isLoading}
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

                    <input
                      id="avatar"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={!isEditing || isLoading}
                    />

                    <p className="text-xs text-muted-foreground">
                      JPG, PNG, GIF or WebP. Max size 5 MB.
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange('firstName', e.target.value)
                      }
                      disabled={!isEditing || isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange('lastName', e.target.value)
                      }
                      disabled={!isEditing || isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) =>
                        handleInputChange('username', e.target.value)
                      }
                      disabled={!isEditing || isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      disabled={!isEditing || isLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      disabled={isLoading}
                    >
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
                          Save changes
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit account
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardizedSidebarLayout>
  );
}