'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Loader2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { friendlyErrorMessage } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type FormData = {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
};

type FieldError = Partial<Record<keyof FormData, string>>;

interface AccountDetailsTabProps {
  initialData: FormData;
  onSaved?: (updated: FormData) => void;
}

// ── Validation ────────────────────────────────────────────────────────────────

const USERNAME_REGEX = /^[a-z0-9._-]+$/;

function validateForm(data: FormData): FieldError {
  const errors: FieldError = {};

  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required.';
  }

  if (!data.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'A valid email address is required.';
  }

  if (!data.username.trim()) {
    errors.username = 'Username is required.';
  } else if (!USERNAME_REGEX.test(data.username)) {
    errors.username =
      'Username may only contain lowercase letters, numbers, dots, hyphens, and underscores.';
  }

  return errors;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AccountDetailsTab({ initialData, onSaved }: AccountDetailsTabProps) {
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>(initialData);
  const [fieldErrors, setFieldErrors] = useState<FieldError>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync if parent data changes (e.g. Convex query resolves later)
  useEffect(() => {
    if (!isEditing) {
      setFormData(initialData);
    }
  }, [initialData, isEditing]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCancel = () => {
    setFormData(initialData);
    setFieldErrors({});
    setIsEditing(false);
  };

  const handleSave = async () => {
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch('/api/account/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          givenName: formData.firstName.trim(),
          familyName: formData.lastName.trim(),
          username: formData.username.trim().toLowerCase(),
          email: formData.email.trim().toLowerCase(),
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        throw new Error(body.error ?? 'Failed to update account.');
      }

      setIsEditing(false);
      setFieldErrors({});

      toast({
        title: 'Account updated',
        description: 'Your account details have been saved successfully.',
        variant: 'success',
      });

      onSaved?.(formData);
    } catch (err) {
      const msg = friendlyErrorMessage(err) ?? 'Failed to update account.';
      toast({ title: 'Update failed', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Personal information</CardTitle>
            <CardDescription>
              Update your name, username, and email address. Your email and name are also
              held in WorkOS and will be synchronised on save.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <fieldset disabled={!isEditing || isSaving} className="space-y-5">
              <legend className="sr-only">Personal information form</legend>

              {/* Name row */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="det-firstName">First name</Label>
                  <Input
                    id="det-firstName"
                    value={formData.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    autoComplete="given-name"
                    aria-describedby={fieldErrors.firstName ? 'err-firstName' : undefined}
                    aria-invalid={Boolean(fieldErrors.firstName)}
                    className={fieldErrors.firstName ? 'border-destructive' : ''}
                  />
                  {fieldErrors.firstName && (
                    <p id="err-firstName" role="alert" className="flex items-center gap-1 text-xs text-destructive">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                      {fieldErrors.firstName}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="det-lastName">Last name</Label>
                  <Input
                    id="det-lastName"
                    value={formData.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    autoComplete="family-name"
                  />
                </div>
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="det-username">Username</Label>
                <Input
                  id="det-username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value.toLowerCase())}
                  autoComplete="username"
                  aria-describedby="hint-username"
                  aria-invalid={Boolean(fieldErrors.username)}
                  className={fieldErrors.username ? 'border-destructive' : ''}
                  placeholder="e.g. jane.doe"
                />
                {fieldErrors.username ? (
                  <p id="hint-username" role="alert" className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.username}
                  </p>
                ) : (
                  <p id="hint-username" className="text-xs text-muted-foreground">
                    Lowercase letters, numbers, dots (<code>.</code>), hyphens (<code>-</code>), and underscores (<code>_</code>) only.
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="det-email">Email address</Label>
                <Input
                  id="det-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  autoComplete="email"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'err-email' : undefined}
                  className={fieldErrors.email ? 'border-destructive' : ''}
                />
                {fieldErrors.email && (
                  <p id="err-email" role="alert" className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            </fieldset>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isSaving}
                  >
                    <X className="mr-1.5 h-3.5 w-3.5" />
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Saving&hellip;
                      </>
                    ) : (
                      <>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        Save changes
                      </>
                    )}
                  </Button>
                </>
              ) : (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  Edit details
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right-hand guidance card */}
      <div>
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">About account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Your <strong className="text-foreground">name</strong> and{' '}
              <strong className="text-foreground">email</strong> are synchronised with
              WorkOS, which is used for authentication across WorkloadWizard.
            </p>
            <p>
              Your <strong className="text-foreground">username</strong> is your unique
              in-app identifier and is stored in Convex. It must be lowercase and can
              include letters, numbers, dots, hyphens, and underscores.
            </p>
            <p>
              Changes to your email address may require you to verify the new address
              before they take effect.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
