'use client';

import { useUser } from '@clerk/nextjs';
import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PermissionGate } from '@/components/common/PermissionGate';

// Force dynamic rendering to prevent Clerk authentication errors during build
export const dynamic = 'force-dynamic';

interface FamilyRule {
  family: string;
  mode: 'percent' | 'fixed';
  value: number;
}

interface OrganisationSettings {
  _id: string;
  organisationId: string;
  staffRoleOptions: string[];
  teamOptions: string[];
  campusOptions?: string[];
  contractFamilyOptions?: string[];
  maxClassSizePerGroup?: number;
  baseMaxTeachingAtFTE1: number;
  baseTotalContractAtFTE1: number;
  moduleHoursByCredits?: Array<{
    credits: number;
    teaching: number;
    marking: number;
  }>;
  roleMaxTeachingRules?: Array<{
    role: string;
    mode: 'percent' | 'fixed';
    value: number;
  }>;
  familyMaxTeachingRules?: FamilyRule[];
  createdAt: number;
  updatedAt: number;
}

export default function OrganisationSettingsPage() {
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Organisation', href: '/organisation' },
    { label: 'Settings' },
  ];

  const { user } = useUser();
  const settings = useQuery(api.organisationSettings.getOrganisationSettings, {
    userId: user?.id || '',
  });
  const upsert = useMutation(
    api.organisationSettings.upsertOrganisationSettings
  );

  const [roleOptions, setRoleOptions] = useState<string[] | null>(null);
  const [teamOptions, setTeamOptions] = useState<string[] | null>(null);
  const [campusOptions, setCampusOptions] = useState<string[] | null>(null);
  const [familyOptions, setFamilyOptions] = useState<string[] | null>(null);
  const [newRole, setNewRole] = useState('');
  const [newTeam, setNewTeam] = useState('');
  const [newCampus, setNewCampus] = useState('');
  const [newFamily, setNewFamily] = useState('');
  const [fte1ContractHours, setFte1ContractHours] = useState<string | null>(
    null
  );
  const [maxGroupSize, setMaxGroupSize] = useState<string | null>(null);

  const [familyRules, setFamilyRules] = useState<FamilyRule[] | null>(null);

  // Helper functions to safely access settings properties
  const getSettingsStringArray = useCallback(
    (
      property: keyof OrganisationSettings,
      defaultValue: string[]
    ): string[] => {
      if (settings && typeof settings === 'object' && property in settings) {
        const value = (settings as OrganisationSettings)[property];
        return Array.isArray(value) ? (value as string[]) : defaultValue;
      }
      return defaultValue;
    },
    [settings]
  );

  const getSettingsNumber = useCallback(
    (property: keyof OrganisationSettings, defaultValue: number): number => {
      if (settings && typeof settings === 'object' && property in settings) {
        const value = (settings as OrganisationSettings)[property];
        return typeof value === 'number' ? value : defaultValue;
      }
      return defaultValue;
    },
    [settings]
  );

  const getSettingsFamilyRules = useCallback(
    (
      property: keyof OrganisationSettings,
      defaultValue: FamilyRule[]
    ): FamilyRule[] => {
      if (settings && typeof settings === 'object' && property in settings) {
        const value = (settings as OrganisationSettings)[property];
        return Array.isArray(value) ? (value as FamilyRule[]) : defaultValue;
      }
      return defaultValue;
    },
    [settings]
  );

  const effective = useMemo(() => {
    return {
      staffRoleOptions:
        roleOptions ?? getSettingsStringArray('staffRoleOptions', []),
      teamOptions: teamOptions ?? getSettingsStringArray('teamOptions', []),
      campusOptions:
        campusOptions ?? getSettingsStringArray('campusOptions', []),
      contractFamilyOptions:
        familyOptions ?? getSettingsStringArray('contractFamilyOptions', []),
      // Single source of truth: 1 FTE contract hours; use it for both fields on the backend
      baseMaxTeachingAtFTE1:
        fte1ContractHours !== null
          ? Number(fte1ContractHours)
          : getSettingsNumber('baseMaxTeachingAtFTE1', 400),
      baseTotalContractAtFTE1:
        fte1ContractHours !== null
          ? Number(fte1ContractHours)
          : getSettingsNumber('baseTotalContractAtFTE1', 550),
      maxClassSizePerGroup:
        maxGroupSize !== null
          ? Number(maxGroupSize)
          : getSettingsNumber('maxClassSizePerGroup', 25),
      familyMaxTeachingRules:
        familyRules ?? getSettingsFamilyRules('familyMaxTeachingRules', []),
    };
  }, [
    roleOptions,
    teamOptions,
    campusOptions,
    fte1ContractHours,
    maxGroupSize,
    familyRules,
    familyOptions,
    getSettingsStringArray,
    getSettingsNumber,
    getSettingsFamilyRules,
  ]);

  const save = async () => {
    if (!user?.id) return;
    await upsert({ userId: user.id, ...effective });
  };

  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Organisation Settings"
    >
      <PermissionGate permission="organisations.manage">
        <Card>
          <CardHeader>
            <CardTitle>Staff Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label>Role options</Label>
                <div className="flex gap-2">
                  <Input
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    placeholder="Add role (e.g. Lecturer)"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const val = newRole.trim();
                      if (!val) return;
                      const current =
                        roleOptions ??
                        getSettingsStringArray('staffRoleOptions', []);
                      if (!current.includes(val)) {
                        setRoleOptions([...current, val]);
                      }
                      setNewRole('');
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    roleOptions ??
                    getSettingsStringArray('staffRoleOptions', [])
                  ).map((r: string) => (
                    <div
                      key={r}
                      className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                    >
                      <span>{r}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setRoleOptions(
                            (
                              roleOptions ??
                              getSettingsStringArray('staffRoleOptions', [])
                            ).filter((x: string) => x !== r)
                          )
                        }
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label>Team options</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTeam}
                    onChange={(e) => setNewTeam(e.target.value)}
                    placeholder="Add team (e.g. Computing)"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const val = newTeam.trim();
                      if (!val) return;
                      const current =
                        teamOptions ??
                        getSettingsStringArray('teamOptions', []);
                      if (!current.includes(val)) {
                        setTeamOptions([...current, val]);
                      }
                      setNewTeam('');
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    teamOptions ?? getSettingsStringArray('teamOptions', [])
                  ).map((t: string) => (
                    <div
                      key={t}
                      className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                    >
                      <span>{t}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setTeamOptions(
                            (
                              teamOptions ??
                              getSettingsStringArray('teamOptions', [])
                            ).filter((x: string) => x !== t)
                          )
                        }
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label>Campuses</Label>
                <div className="flex gap-2">
                  <Input
                    value={newCampus}
                    onChange={(e) => setNewCampus(e.target.value)}
                    placeholder="Add campus (e.g. City Centre)"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const val = newCampus.trim();
                      if (!val) return;
                      const current =
                        campusOptions ??
                        getSettingsStringArray('campusOptions', []);
                      if (!current.includes(val)) {
                        setCampusOptions([...current, val]);
                      }
                      setNewCampus('');
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    campusOptions ?? getSettingsStringArray('campusOptions', [])
                  ).map((c: string) => (
                    <div
                      key={c}
                      className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                    >
                      <span>{c}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setCampusOptions(
                            (
                              campusOptions ??
                              getSettingsStringArray('campusOptions', [])
                            ).filter((x: string) => x !== c)
                          )
                        }
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <Label>Contract families</Label>
                <div className="flex gap-2">
                  <Input
                    value={newFamily}
                    onChange={(e) => setNewFamily(e.target.value)}
                    placeholder="Add family (e.g. Academic Practitioner)"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const val = newFamily.trim();
                      if (!val) return;
                      const current =
                        familyOptions ??
                        getSettingsStringArray('contractFamilyOptions', []);
                      if (!current.includes(val)) {
                        setFamilyOptions([...current, val]);
                      }
                      setNewFamily('');
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(
                    familyOptions ??
                    getSettingsStringArray('contractFamilyOptions', [])
                  ).map((f: string) => (
                    <div
                      key={f}
                      className="flex items-center gap-2 rounded-md border px-2 py-1 text-sm"
                    >
                      <span>{f}</span>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setFamilyOptions(
                            (
                              familyOptions ??
                              getSettingsStringArray(
                                'contractFamilyOptions',
                                []
                              )
                            ).filter((x: string) => x !== f)
                          )
                        }
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>1 FTE contract hours</Label>
                <Input
                  type="number"
                  value={String(
                    fte1ContractHours !== null
                      ? fte1ContractHours
                      : getSettingsNumber('baseTotalContractAtFTE1', 1498)
                  )}
                  onChange={(e) => setFte1ContractHours(e.target.value)}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Max students per group</Label>
                <Input
                  type="number"
                  value={String(
                    maxGroupSize !== null
                      ? maxGroupSize
                      : getSettingsNumber('maxClassSizePerGroup', 25)
                  )}
                  onChange={(e) => setMaxGroupSize(e.target.value)}
                  min={1}
                  data-testid="max-group-size-input"
                />
                <p className="text-xs text-muted-foreground">
                  Used in course pages to recommend group splits.
                </p>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Per-family max teaching rule</Label>
              </div>
              <div className="space-y-2">
                {(
                  familyRules ??
                  getSettingsFamilyRules('familyMaxTeachingRules', [])
                ).map((r: FamilyRule, idx: number) => (
                  <div
                    key={`${r.family}-${idx}`}
                    className="grid grid-cols-12 gap-2 items-center"
                  >
                    <div className="col-span-3">
                      <Label className="text-xs">Family</Label>
                      <Input value={r.family} disabled />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Mode</Label>
                      <select
                        className="w-full h-9 rounded-md border px-2"
                        value={r.mode}
                        onChange={(e) => {
                          const v = e.target.value as 'percent' | 'fixed';
                          const list = [
                            ...(familyRules ??
                              getSettingsFamilyRules(
                                'familyMaxTeachingRules',
                                []
                              )),
                          ];
                          list[idx] = {
                            ...list[idx],
                            mode: v,
                            family: list[idx]?.family || '',
                            value: list[idx]?.value || 0,
                          };
                          setFamilyRules(list);
                        }}
                      >
                        <option value="percent">% of 1 FTE contract</option>
                        <option value="fixed">Fixed hours</option>
                      </select>
                    </div>
                    <div className="col-span-4">
                      <Label className="text-xs">Value</Label>
                      <Input
                        type="number"
                        value={String(r.value ?? 0)}
                        onChange={(e) => {
                          const num = Number(e.target.value || 0);
                          const list = [
                            ...(familyRules ??
                              getSettingsFamilyRules(
                                'familyMaxTeachingRules',
                                []
                              )),
                          ];
                          list[idx] = {
                            ...list[idx],
                            value: num,
                            family: list[idx]?.family || '',
                            mode: list[idx]?.mode || 'percent',
                          };
                          setFamilyRules(list);
                        }}
                        min={0}
                      />
                    </div>
                    <div className="col-span-2 flex items-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const base =
                            familyRules ??
                            getSettingsFamilyRules(
                              'familyMaxTeachingRules',
                              []
                            );
                          const list = base.filter(
                            (x: FamilyRule, i: number) => i !== idx
                          );
                          setFamilyRules(list);
                        }}
                        className="w-full"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <Label className="text-xs">Family</Label>
                  <select
                    className="w-full h-9 rounded-md border px-2"
                    value={''}
                    onChange={(e) => {
                      const fam = e.target.value;
                      if (!fam) return;
                      const current = familyRules ?? [];
                      if (
                        !current.some((rr: FamilyRule) => rr.family === fam)
                      ) {
                        setFamilyRules([
                          ...current,
                          { family: fam, mode: 'percent', value: 0 },
                        ]);
                      }
                      e.currentTarget.value = '';
                    }}
                  >
                    <option value="">Select family</option>
                    {(familyOptions ?? []).map((f: string) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <Label className="text-xs">Mode</Label>
                  <select
                    className="w-full h-9 rounded-md border px-2"
                    disabled
                  >
                    <option>% of 1 FTE contract</option>
                  </select>
                </div>
                <div className="col-span-4">
                  <Label className="text-xs">Value</Label>
                  <Input
                    type="number"
                    disabled
                    placeholder="Add a family rule above"
                  />
                </div>
                <div className="col-span-2" />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={save}>Save</Button>
            </div>
          </CardContent>
        </Card>
      </PermissionGate>
    </StandardizedSidebarLayout>
  );
}
