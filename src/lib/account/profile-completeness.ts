import type { LucideIcon } from 'lucide-react';
import {  Camera, 
          Mail, 
          User, 
          UserRound,
          BriefcaseBusiness, } from 'lucide-react';

export const PROFILE_COMPLETENESS_VERSION = '2026-05-account-v1';

export type AccountTab = 'overview' | 'details' | 'picture' | 'security' | 'preferences' | 'staff-profile';

export type ProfileCompletenessContext = {
  userEmail: string;
  username: string | null | undefined;
  hasProfilePicture: boolean;
  hasFirstName: boolean;
  hasLastName: boolean;
  hasStaffPreferences: boolean;
};

export type ProfileCompletenessItem = {
  id: string;
  label: string;
  description: string;
  complete: boolean;
  targetTab: AccountTab;
  icon: LucideIcon;
};

type ProfileCompletenessRule = {
  id: string;
  label: string;
  description: string;
  targetTab: AccountTab;
  icon: LucideIcon;
  isComplete: (context: ProfileCompletenessContext) => boolean;
};

const PROFILE_COMPLETENESS_RULES: ProfileCompletenessRule[] = [
  {
    id: 'first-name',
    label: 'First name set',
    description: 'Add your first name to personalise your account.',
    targetTab: 'details',
    icon: UserRound,
    isComplete: (context) => context.hasFirstName,
  },
  {
    id: 'last-name',
    label: 'Last name set',
    description: 'Add your last name so your account details are complete.',
    targetTab: 'details',
    icon: UserRound,
    isComplete: (context) => context.hasLastName,
  },
  {
    id: 'username',
    label: 'Username set',
    description: 'Choose a username for easier account identification.',
    targetTab: 'details',
    icon: User,
    isComplete: (context) => Boolean(context.username),
  },
  {
    id: 'profile-picture',
    label: 'Profile picture uploaded',
    description: 'Upload a profile picture to make your account easier to recognise.',
    targetTab: 'picture',
    icon: Camera,
    isComplete: (context) => context.hasProfilePicture,
  },
  {
    id: 'email',
    label: 'Email address available',
    description: 'Your email address is required for account access and notifications.',
    targetTab: 'details',
    icon: Mail,
    isComplete: (context) => Boolean(context.userEmail),
  },
  {
    id: 'staff-preferences',
    label: 'Staff preferences set',
    description:
      'Add your preferred location, working time, specialism or notes to help with workload planning.',
    targetTab: 'staff-profile',
    icon: BriefcaseBusiness,
    isComplete: (context) => context.hasStaffPreferences,
  },
];

export function getProfileCompletenessItems(
  context: ProfileCompletenessContext
): ProfileCompletenessItem[] {
  return PROFILE_COMPLETENESS_RULES.map((rule) => ({
    id: rule.id,
    label: rule.label,
    description: rule.description,
    targetTab: rule.targetTab,
    icon: rule.icon,
    complete: rule.isComplete(context),
  }));
}

export function getProfileCompletenessSummary(items: ProfileCompletenessItem[]) {
  const completedCount = items.filter((item) => item.complete).length;
  const totalCount = items.length;
  const percent = totalCount === 0 ? 100 : Math.round((completedCount / totalCount) * 100);

  return {
    completedCount,
    totalCount,
    percent,
    isComplete: completedCount === totalCount,
  };
}