'use client';

import posthog from 'posthog-js';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Key,
  Save,
  Eye,
  EyeOff,
  Lock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Force dynamic rendering to prevent Clerk authentication errors during build
export const dynamic = 'force-dynamic';

export default function SecurityPage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) router.push('/');
  }, [isLoaded, user, router]);

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
        <p>Please sign in to view your security settings.</p>
      </div>
    );
  }

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '', color: '' };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    const strengthMap = [
      { strength: 0, label: 'Very Weak', color: 'text-red-500', bg: 'bg-red-500' },
      { strength: 1, label: 'Weak', color: 'text-orange-500', bg: 'bg-orange-500' },
      { strength: 2, label: 'Fair', color: 'text-yellow-500', bg: 'bg-yellow-500' },
      { strength: 3, label: 'Good', color: 'text-blue-500', bg: 'bg-blue-500' },
      { strength: 4, label: 'Strong', color: 'text-green-500', bg: 'bg-green-500' },
      { strength: 5, label: 'Very Strong', color: 'text-green-600', bg: 'bg-green-600' },
    ];
    return strengthMap[Math.min(score, 5)] ?? strengthMap[0]!;
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePasswordSave = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        toast({ title: 'Authentication Error', description: 'Please sign in again to update your password.', variant: 'destructive' });
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast({ title: 'Password Mismatch', description: 'New password and confirm password do not match.', variant: 'destructive' });
        return;
      }
      if (passwordData.newPassword.length < 8) {
        toast({ title: 'Password Too Short', description: 'Password must be at least 8 characters long.', variant: 'destructive' });
        return;
      }
      if (!passwordData.currentPassword) {
        toast({ title: 'Current Password Required', description: 'Please enter your current password to change it.', variant: 'destructive' });
        return;
      }

      await user.updatePassword({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword });
      await user.reload();

      toast({ title: 'Password Updated', description: 'Your password has been successfully updated.', variant: 'success' });

      if (typeof posthog !== 'undefined' && posthog.capture) {
        posthog.capture('password-updated', { user_id: user.id });
      }

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsEditingPassword(false);
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (passwordError) {
      let errorMessage = 'Failed to update password. Please check your current password.';
      if (passwordError instanceof Error) {
        if (passwordError.message.includes('current password')) errorMessage = 'Current password is incorrect. Please try again.';
        else if (passwordError.message.includes('weak')) errorMessage = 'Password is too weak. Please choose a stronger password.';
        else if (passwordError.message.includes('recent')) errorMessage = 'Cannot reuse a recent password. Please choose a different password.';
        else if (passwordError.message.includes('breach') || passwordError.message.includes('compromised')) errorMessage = 'This password has been found in online breaches. Please choose a different, more secure password.';
        else if (passwordError.message.includes('_baseFetch')) errorMessage = 'Network error occurred. Please check your connection and try again.';
      }
      toast({ title: 'Password Update Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordCancel = () => {
    setIsEditingPassword(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);
  const passwordsMatch =
    passwordData.newPassword &&
    passwordData.confirmPassword &&
    passwordData.newPassword === passwordData.confirmPassword;

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Account', href: '/account' },
    { label: 'Security & Privacy' },
  ];

  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Security & Privacy"
      subtitle="Manage your password, authentication, and privacy settings"
    >
      <div className="flex flex-col gap-6">
        {/* ── Security Status Overview ─────────────────────────── */}
        <Card className="overflow-hidden border-border/60">
          <div className="h-20 bg-primary/8 relative">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 10% 50%, var(--color-primary) 0%, transparent 55%), radial-gradient(circle at 90% 30%, var(--color-accent-foreground) 0%, transparent 50%)',
              }}
            />
          </div>
          <CardContent className="px-6 pb-6 pt-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/60 bg-muted shadow-xs">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold leading-tight">Security Status</h2>
                <p className="text-sm text-muted-foreground">Your account security at a glance</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="success" className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" />
                  Password set
                </Badge>
                <Badge variant="warning" className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3" />
                  2FA not enabled
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Password Management ──────────────────────────────── */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Password
          </h3>
          <Card className="border-border/60">
            <CardContent className="px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted">
                    <Key className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Change Password</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Update your password to keep your account secure
                    </p>
                  </div>
                </div>
                {!isEditingPassword && (
                  <Button
                    size="sm"
                    variant="soft"
                    onClick={() => {
                      setIsEditingPassword(true);
                      if (typeof posthog !== 'undefined' && posthog.capture) {
                        posthog.capture('password-edit-started', { user_id: user.id });
                      }
                    }}
                  >
                    <Key className="h-3.5 w-3.5 mr-1.5" />
                    Change
                  </Button>
                )}
              </div>

              {isEditingPassword && (
                <>
                  <Separator className="mt-5 mb-5" />
                  <div className="space-y-4">
                    {/* Current password */}
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-sm font-medium">Current Password</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                          placeholder="Enter current password"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* New + Confirm */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="newPassword" className="text-sm font-medium">New Password</Label>
                        <div className="relative">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? 'text' : 'password'}
                            value={passwordData.newPassword}
                            onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                            placeholder="Enter new password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirm New Password</Label>
                        <div className="relative">
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            value={passwordData.confirmPassword}
                            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                            placeholder="Confirm new password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Password strength */}
                    {passwordData.newPassword && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Password strength</span>
                          <span className={passwordStrength.color}>{passwordStrength.label}</span>
                        </div>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                level <= passwordStrength.strength ? passwordStrength.bg : 'bg-muted'
                              }`}
                            />
                          ))}
                        </div>
                        <div className="space-y-1 text-xs">
                          {passwordData.newPassword.length < 8 && (
                            <p className="text-destructive">Password must be at least 8 characters long</p>
                          )}
                          {passwordData.newPassword && passwordData.confirmPassword && !passwordsMatch && (
                            <p className="text-destructive">Passwords do not match</p>
                          )}
                          {passwordsMatch && passwordData.newPassword.length >= 8 && (
                            <p className="text-green-600 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Password is valid
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <Button variant="outline" onClick={handlePasswordCancel} disabled={isLoading}>
                        Cancel
                      </Button>
                      <Button
                        onClick={handlePasswordSave}
                        disabled={Boolean(
                          isLoading ||
                            (passwordData.newPassword &&
                              (passwordData.newPassword !== passwordData.confirmPassword ||
                                passwordData.newPassword.length < 8 ||
                                !passwordData.currentPassword))
                        )}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Update Password
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Additional Security ──────────────────────────────── */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Additional Security
          </h3>
          <div className="flex flex-col gap-3">
            {/* 2FA tile */}
            <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 opacity-60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Two-Factor Authentication</span>
                  <Badge variant="neutral" className="text-[10px] py-0 px-1.5">Soon</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                  Add an extra layer of security with TOTP or SMS verification
                </p>
              </div>
            </div>

            {/* Privacy tile */}
            <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 opacity-60">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted">
                <Lock className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">Privacy Settings</span>
                  <Badge variant="neutral" className="text-[10px] py-0 px-1.5">Soon</Badge>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground leading-snug">
                  Manage your privacy preferences and data settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StandardizedSidebarLayout>
  );
}
