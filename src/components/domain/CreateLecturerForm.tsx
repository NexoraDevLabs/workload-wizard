'use client';

import { useAuthUser } from '@/hooks/useAuthUser';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { withToast } from '@/lib/utils';
import { logger } from '@/lib/logger';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CreateLecturerForm({ onSuccess }: { onSuccess?: () => void }) {
  const { user } = useAuthUser();
  const { toast } = useToast();
  const create = useMutation(api.staff.create);
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    role: 'Lecturer',
    teamName: '',
    contractFamily: '',
    fte: '1',
  });

  // Guard query until user is ready to avoid "User not found"
  const orgSettings = useQuery(
    api.organisationSettings.getOrganisationSettings,
    user?.id ? { userId: user.id } : 'skip'
  );

  const ROLE_OPTIONS = orgSettings?.staffRoleOptions ?? [
    'Professional Lead',
    'Senior Lecturer',
    'Lecturer',
    'Teaching Fellow',
    'Associate Lecturer',
    'Professor',
  ];

  const TEAM_OPTIONS = orgSettings?.teamOptions ?? [
    'Computing',
    'Engineering',
    'Business',
    'Design',
  ];

  const BASE_MAX_TEACHING_AT_FTE_1 = orgSettings?.baseMaxTeachingAtFTE1 ?? 400; // hours at FTE=1
  const BASE_TOTAL_CONTRACT_AT_FTE_1 =
    orgSettings?.baseTotalContractAtFTE1 ?? 550; // hours at FTE=1

  const FAMILY_OPTIONS = ['Academic Practitioner'];

  const fteNum = useMemo(() => {
    const n = Number(form.fte);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(1, n));
  }, [form.fte]);

  const derivedMaxTeaching = useMemo(() => {
    // Use base max teaching since family rules don't exist in current API
    const baseAtFte1 = BASE_MAX_TEACHING_AT_FTE_1;
    return Math.round(baseAtFte1 * fteNum);
  }, [fteNum, BASE_MAX_TEACHING_AT_FTE_1]);

  const derivedTotalContract = useMemo(
    () => Math.round(BASE_TOTAL_CONTRACT_AT_FTE_1 * fteNum),
    [fteNum, BASE_TOTAL_CONTRACT_AT_FTE_1]
  );

  // Ensure selected role/team remain valid on settings change
  useEffect(() => {
    const roles = ROLE_OPTIONS;
    const teams = TEAM_OPTIONS;
    setForm((prev) => {
      let next = prev;
      if (roles.length > 0 && !roles.includes(prev.role)) {
        next = { ...next, role: roles[0] || 'Lecturer' };
      }
      if (teams.length > 0 && !teams.includes(prev.teamName)) {
        next = { ...next, teamName: teams[0] || 'Computing' };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSettings?.staffRoleOptions, orgSettings?.teamOptions]);

  const canSubmit = useMemo(() => {
    return (
      !!form.fullName.trim() &&
      !!form.email.trim() &&
      !!form.role.trim() &&
      !!form.teamName.trim()
    );
  }, [form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await withToast(
        () =>
          create({
            userId: user!.id,
            fullName: form.fullName.trim(),
            email: form.email.trim(),
            role: form.role.trim(),
            teamName: form.teamName.trim(),
            contract: fteNum >= 0.995 ? 'FT' : 'PT',
            ...(form.contractFamily
              ? { contractFamily: form.contractFamily }
              : {}),
            fte: fteNum,
            maxTeachingHours: derivedMaxTeaching,
            totalContract: derivedTotalContract,
          }),
        {
          success: {
            title: 'Profile created',
            description: 'Lecturer profile created successfully!',
          },
          error: { title: 'Failed to create profile' },
        },
        toast
      );

      if (onSuccess) onSuccess();
      else window.location.href = '/staff';
    } catch (error) {
      // handled by withToast
      logger.error('Failed to create lecturer profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card data-testid="create-staff-card">
      <CardHeader>
        <CardTitle>Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={handleSubmit}
        >
          <div className="space-y-2">
            <Label htmlFor="fullName">Name</Label>
            <Input
              id="fullName"
              data-testid="staff-full-name"
              value={form.fullName}
              onChange={(e) =>
                setForm((f) => ({ ...f, fullName: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              data-testid="staff-email"
              value={form.email}
              onChange={(e) =>
                setForm((f) => ({ ...f, email: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
            >
              <SelectTrigger
                id="role"
                className="w-full"
                data-testid="staff-role-trigger"
              >
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((r: string) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="team">Team</Label>
            <Select
              value={form.teamName}
              onValueChange={(v) => setForm((f) => ({ ...f, teamName: v }))}
            >
              <SelectTrigger
                id="team"
                className="w-full"
                data-testid="staff-team-trigger"
              >
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                {TEAM_OPTIONS.map((t: string) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Contract is derived from FTE; no manual field */}
          <div className="space-y-2">
            <Label htmlFor="fte">FTE</Label>
            <Input
              id="fte"
              type="number"
              inputMode="decimal"
              value={form.fte}
              min={0}
              max={1}
              step={0.05}
              onChange={(e) => {
                const raw = e.target.value;
                const n = Number(raw);
                if (Number.isNaN(n)) {
                  setForm((f) => ({ ...f, fte: '0' }));
                  return;
                }
                const clamped = Math.max(0, Math.min(1, n));
                setForm((f) => ({ ...f, fte: String(clamped) }));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractFamily">Contract Family</Label>
            <Select
              value={form.contractFamily}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, contractFamily: v }))
              }
            >
              <SelectTrigger id="contractFamily" className="w-full">
                <SelectValue placeholder="Select family" />
              </SelectTrigger>
              <SelectContent>
                {FAMILY_OPTIONS.map((f: string) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxTeaching">Max Teaching Hours</Label>
            <Input
              id="maxTeaching"
              type="number"
              value={derivedMaxTeaching}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalContract">Total Contract Hours</Label>
            <Input
              id="totalContract"
              type="number"
              value={derivedTotalContract}
              disabled
            />
          </div>
          <div className="md:col-span-2">
            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || !user?.id || isLoading}
              data-testid="staff-submit"
            >
              {isLoading ? 'Creating...' : 'Create Profile'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
