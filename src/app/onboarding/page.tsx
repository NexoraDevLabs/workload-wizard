'use client';

import { useAuthUser } from '@/hooks/useAuthUser';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/lib/logger';

// Force dynamic rendering to prevent WorkOS authentication errors during build
export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  WandSparkles,
  Check,
  User,
  Building,
  Settings,
  BookOpen,
  LogOut,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface OnboardingFormData {
  firstName: string;
  lastName: string;
  role: string;
  customRole: string;
  email: string;
  phone: string;
  department: string;
  organisationId: string;
  notifications: boolean;
  newsletter: boolean;
}

interface OnboardingProgress {
  timestamp: number;
  formData: Record<string, string | boolean>;
  currentStep: number;
}

const onboardingSteps = [
  {
    id: 'personal',
    title: 'Personal Info',
    description: 'Basic information about you',
    icon: User,
  },
  {
    id: 'organisation',
    title: 'Organisation',
    description: 'Your institution details',
    icon: Building,
  },
  {
    id: 'preferences',
    title: 'Preferences',
    description: 'Customise your experience',
    icon: Settings,
  },
  {
    id: 'complete',
    title: 'Get Started',
    description: "You're all set!",
    icon: BookOpen,
  },
];

export default function OnboardingPage() {
  const { user, isLoaded: authLoaded, isSignedIn, session } = useAuthUser({
    redirectOnUnauthenticated: true,
  });
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [progressRestored, setProgressRestored] = useState(false);
  const [error, setError] = useState<string>('');
  const organisations = useQuery(api.organisations.listForOnboarding);

  const [formData, setFormData] = useState<OnboardingFormData>({
    firstName: '',
    lastName: '',
    role: '',
    customRole: '',
    email: '',
    phone: '',
    department: '',
    organisationId: '',
    notifications: true,
    newsletter: false,
  });
  const [missingFields, setMissingFields] = useState<string[]>([]);

  // Pre-populate form data from user information
  useEffect(() => {
    if (!user) return;
  
    const userFirstName = user.firstName || '';
    const userLastName = user.lastName || '';
    const userEmail = user.emailAddresses?.[0]?.emailAddress || '';
  
    setFormData((previous) => ({
      ...previous,
      firstName: previous.firstName || userFirstName,
      lastName: previous.lastName || userLastName,
      email: previous.email || userEmail,
    }));
  
    const missing = [];
    if (!userFirstName) missing.push('firstName');
    if (!userLastName) missing.push('lastName');
    if (!userEmail) missing.push('email');
    missing.push('role');
  
    setMissingFields(missing);
  }, [user]);

  // Save progress to localStorage
  const saveProgress = useCallback(() => {
    if (!user?.id) return;

    const progressKey = `onboarding-progress-${user.id}`;

    // Filter out undefined values to match the expected type
    const cleanFormData: Record<string, string | boolean> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (
        value !== undefined &&
        (typeof value === 'string' || typeof value === 'boolean')
      ) {
        cleanFormData[key] = value;
      }
    });

    const progressData: OnboardingProgress = {
      timestamp: Date.now(),
      formData: cleanFormData,
      currentStep,
    };

    try {
      localStorage.setItem(progressKey, JSON.stringify(progressData));
    } catch {
      // Failed to save onboarding progress
      logger.warn('Failed to save onboarding progress to localStorage');
    }
  }, [user?.id, formData, currentStep]);

  // Load progress from localStorage
  const loadProgress = useCallback((): OnboardingProgress | null => {
    if (!user?.id) return null;

    const progressKey = `onboarding-progress-${user.id}`;
    try {
      const savedProgress = localStorage.getItem(progressKey);
      if (!savedProgress) return null;

      const progressData: OnboardingProgress = JSON.parse(
        savedProgress
      ) as OnboardingProgress;

      // Check if progress is recent (within 30 days)
      const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - progressData.timestamp > thirtyDaysMs) {
        localStorage.removeItem(progressKey);
        return null;
      }

      return progressData;
    } catch {
      // Failed to load onboarding progress
      return null;
    }
  }, [user?.id]);

  // Clear progress from localStorage
  const clearProgress = useCallback(() => {
    if (!user?.id) return;

    const progressKey = `onboarding-progress-${user.id}`;
    localStorage.removeItem(progressKey);
  }, [user?.id]);

  // Load saved progress on component mount
  useEffect(() => {
    if (!user?.id || isLoaded) return;

    const savedProgress = loadProgress();
    if (savedProgress) {
      // Merge saved form data with current form data (preserving pre-populated fields)
      setFormData((prevData) => ({
        ...prevData,
        ...savedProgress.formData,
        firstName:
          prevData.firstName ||
          (typeof savedProgress.formData.firstName === 'string'
            ? savedProgress.formData.firstName
            : ''),
        lastName:
          prevData.lastName ||
          (typeof savedProgress.formData.lastName === 'string'
            ? savedProgress.formData.lastName
            : ''),
        email:
          prevData.email ||
          (typeof savedProgress.formData.email === 'string'
            ? savedProgress.formData.email
            : ''),
        organisationId:
          prevData.organisationId ||
          (typeof savedProgress.formData.organisationId === 'string'
            ? savedProgress.formData.organisationId
            : ''),
      }));
      setCurrentStep(savedProgress.currentStep);
      setProgressRestored(true);

      // Auto-hide progress restored notification after 3 seconds
      setTimeout(() => setProgressRestored(false), 3000);
    }

    setIsLoaded(true);
  }, [user?.id, loadProgress, isLoaded]);

  useEffect(() => {
    if (!authLoaded || !isSignedIn || !user) return;
  
    if (!user.needsOrganisation && user.onboardingCompleted) {
      router.replace('/dashboard');
    }
  }, [authLoaded, isSignedIn, user, router]);

  // Get required fields for current step
  const getRequiredFieldsForStep = useCallback(
    (step: number) => {
      switch (step) {
        case 0: {
          const requiredFields = ['firstName', 'lastName', 'email', 'role'];
  
          if (formData.role === 'other') {
            requiredFields.push('customRole');
          }
  
          if (
            formData.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
          ) {
            requiredFields.push('invalidEmail');
          }
  
          return requiredFields;
        }
  
        case 1:
          return ['organisationId', 'department'];
  
        case 2:
          return [];
  
        case 3:
          return [];
  
        default:
          return [];
      }
    },
    [formData.role, formData.email]
  );

  // Update missing fields when step changes
  useEffect(() => {
    const requiredFields = getRequiredFieldsForStep(currentStep);
    const missing = requiredFields.filter((field) => {
      const value = formData[field as keyof OnboardingFormData];
      return typeof value !== 'string' || value.trim() === '';
    });
    setMissingFields(missing);
  }, [currentStep, formData, getRequiredFieldsForStep]);

  // Save progress whenever form data or step changes
  useEffect(() => {
    if (!isLoaded) return; // Don't save until initial load is complete
    saveProgress();
  }, [currentStep, formData, isLoaded, saveProgress]);

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setError(''); // Clear any previous errors
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
  
    if (!formData.organisationId) {
      setError('Please select your organisation.');
      setCurrentStep(1);
      return;
    }
  
    setIsCompleting(true);
    setError('');
  
    try {
      const jobRole =
        formData.role === 'other'
          ? formData.customRole.trim()
          : formData.role.trim();
  
      const response = await fetch('/api/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organisationId: formData.organisationId,
          givenName: formData.firstName.trim(),
          familyName: formData.lastName.trim(),
          jobRole,
          department: formData.department.trim(),
          phone: formData.phone.trim(),
        }),
      });
  
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  
        try {
          const errorData = (await response.json()) as { error?: string };
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Ignore invalid JSON
        }
  
        throw new Error(errorMessage);
      }
  
      await response.json();
  
      clearProgress();
      await session.reload();
  
      router.replace('/onboarding-success');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to complete onboarding. Please try again.'
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const handleLogout = () => {
    window.location.assign('/api/auth/logout');
  };

  // Check if current step is valid
  const isCurrentStepValid = () => {
    if (currentStep === 1 && organisations === undefined) {
      return false;
    }
  
    const requiredFields = getRequiredFieldsForStep(currentStep);
    return requiredFields.every((field) => {
      if (field === 'invalidEmail') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
      }
  
      const value = formData[field as keyof OnboardingFormData];
      return typeof value === 'string' && value.trim() !== '';
    });
  };

  // Update missing fields when form data changes
  const updateFormData = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };

    // Special handling for role field
    if (field === 'role') {
      if (newFormData.customRole && value !== 'other') {
        newFormData.customRole = '';
      }
    }

    // Skip validation for optional fields
    if (field === 'phone') {
      setFormData(newFormData);
      return;
    }

    // Update form data
    setFormData(newFormData);

    // Update missing fields based on current step requirements
    const requiredFields = getRequiredFieldsForStep(currentStep);
    const missing = requiredFields.filter((fieldName) => {
      const fieldValue =
        fieldName === field
          ? value
          : newFormData[fieldName as keyof OnboardingFormData];
      return typeof fieldValue !== 'string' || fieldValue.trim() === '';
    });

    setMissingFields(missing);
  };

  if (authLoaded && (!isSignedIn || !user)) {
    return null;
  }

  // Show loading state while progress is being loaded
  if (!authLoaded || !isLoaded) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center">
        <div className="w-full max-w-2xl mx-auto p-8">
          <Card className="w-full">
            <CardContent className="p-8">
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span>Loading your progress...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Welcome to WorkloadWizard!</h2>
              <p className="text-muted-foreground mt-2">
                Let&apos;s get you set up with some basic information
              </p>
              {formData.firstName || formData.lastName ? (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                  We&apos;ve pre-filled some information from your account.
                  Please complete any highlighted fields marked with{' '}
                  <span className="text-orange-500 font-medium">*</span>
                </div>
              ) : null}
            </div>

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="firstName"
                    className={
                      missingFields.includes('firstName')
                        ? 'text-orange-600'
                        : ''
                    }
                  >
                    First Name{' '}
                    {missingFields.includes('firstName') && (
                      <span className="text-orange-500">*</span>
                    )}
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      updateFormData('firstName', e.target.value)
                    }
                    placeholder="Enter your first name"
                    className={
                      missingFields.includes('firstName')
                        ? 'border-orange-300 focus:border-orange-500'
                        : ''
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="lastName"
                    className={
                      missingFields.includes('lastName')
                        ? 'text-orange-600'
                        : ''
                    }
                  >
                    Last Name{' '}
                    {missingFields.includes('lastName') && (
                      <span className="text-orange-500">*</span>
                    )}
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    placeholder="Enter your last name"
                    className={
                      missingFields.includes('lastName')
                        ? 'border-orange-300 focus:border-orange-500'
                        : ''
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="role"
                    className={
                      missingFields.includes('role') ? 'text-orange-600' : ''
                    }
                  >
                    Job Role{' '}
                    {missingFields.includes('role') && (
                      <span className="text-orange-500">*</span>
                    )}
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => updateFormData('role', value)}
                  >
                    <SelectTrigger
                      className={`w-full ${missingFields.includes('role') ? 'border-orange-300 focus:border-orange-500' : ''}`}
                    >
                      <SelectValue placeholder="Select your job role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lecturer">Lecturer</SelectItem>
                      <SelectItem value="professor">Professor</SelectItem>
                      <SelectItem value="researcher">Researcher</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="support">Support Staff</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.role === 'other' ? (
                  <div className="space-y-2">
                    <Label
                      htmlFor="customRole"
                      className={
                        missingFields.includes('customRole')
                          ? 'text-orange-600'
                          : ''
                      }
                    >
                      Custom Job Role{' '}
                      {missingFields.includes('customRole') && (
                        <span className="text-orange-500">*</span>
                      )}
                    </Label>
                    <Input
                      id="customRole"
                      value={formData.customRole}
                      onChange={(e) =>
                        updateFormData('customRole', e.target.value)
                      }
                      placeholder="Enter your job role"
                      className={
                        missingFields.includes('customRole')
                          ? 'border-orange-300 focus:border-orange-500'
                          : ''
                      }
                    />
                  </div>
                ) : (
                  <div /> // Empty div to maintain grid structure
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className={
                      missingFields.includes('email') ? 'text-orange-600' : ''
                    }
                  >
                    Email Address{' '}
                    {missingFields.includes('email') && (
                      <span className="text-orange-500">*</span>
                    )}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    readOnly
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="Enter your email address"
                    className={
                      missingFields.includes('email')
                        ? 'border-orange-300 focus:border-orange-500'
                        : ''
                    }
                  />
                  {formData.email && missingFields.includes('invalidEmail') && (
                    <p className="text-xs text-red-600">
                      Please enter a valid email address
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number{' '}
                    <span className="text-xs text-muted-foreground">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="Enter your phone number (optional)"
                  />
                </div>
              </div>
            </div>
          </div>
        );

        case 1:
          return (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Organisation Details</h2>
                <p className="text-muted-foreground mt-2">
                  Select your institution and department
                </p>
              </div>
        
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="organisationId"
                    className={
                      missingFields.includes('organisationId')
                        ? 'text-orange-600'
                        : ''
                    }
                  >
                    Organisation/Institution{' '}
                    {missingFields.includes('organisationId') && (
                      <span className="text-orange-500">*</span>
                    )}
                  </Label>
        
                  <Select
                    value={formData.organisationId}
                    onValueChange={(value) => updateFormData('organisationId', value)}
                  >
                    <SelectTrigger
                      className={`w-full ${
                        missingFields.includes('organisationId')
                          ? 'border-orange-300 focus:border-orange-500'
                          : ''
                      }`}
                    >
                      <SelectValue placeholder="Select your organisation" />
                    </SelectTrigger>
                    <SelectContent>
                      {(organisations ?? []).map((organisation) => (
                        <SelectItem key={organisation._id} value={organisation._id}>
                          {organisation.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
        
                  {organisations === undefined && (
                    <p className="text-xs text-muted-foreground">
                      Loading organisations...
                    </p>
                  )}
                </div>
        
                <div className="space-y-2">
                  <Label
                    htmlFor="department"
                    className={
                      missingFields.includes('department') ? 'text-orange-600' : ''
                    }
                  >
                    Department/Faculty{' '}
                    {missingFields.includes('department') && (
                      <span className="text-orange-500">*</span>
                    )}
                  </Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => updateFormData('department', e.target.value)}
                    placeholder="Enter your department"
                    className={
                      missingFields.includes('department')
                        ? 'border-orange-300 focus:border-orange-500'
                        : ''
                    }
                  />
                </div>
              </div>
            </div>
          );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold">Preferences</h2>
              <p className="text-muted-foreground mt-2">
                Customise your WorkloadWizard experience
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifications"
                  checked={formData.notifications}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      notifications: checked as boolean,
                    })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="notifications"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Email notifications
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Receive updates about your workload and schedule changes
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="newsletter"
                  checked={formData.newsletter}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, newsletter: checked as boolean })
                  }
                />
                <div className="grid gap-1.5 leading-none">
                  <Label
                    htmlFor="newsletter"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Product updates
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Get notified about new features and improvements
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold">You&apos;re All Set!</h2>
              <p className="text-muted-foreground mt-2">
                Welcome to WorkloadWizard. Let&apos;s start managing your
                academic workload.
              </p>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What&apos;s next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Set up your first course or project</li>
                <li>• Explore the dashboard and features</li>
                <li>• Invite colleagues to collaborate</li>
                <li>• Customise your workload preferences</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="flex min-h-screen">
        {/* Sidebar Navigation */}
        <div className="w-80 bg-card border-r border-border p-6 flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div
                className="flex aspect-square size-10 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: '#0F59FF' }}
              >
                <WandSparkles className="size-5" />
              </div>
              <div>
                <h1 className="font-semibold text-lg">WorkloadWizard</h1>
                <p className="text-xs text-muted-foreground">
                  Setup & Onboarding
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {onboardingSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg transition-colors',
                    isCurrent && 'bg-primary text-primary-foreground',
                    isCompleted && 'bg-muted',
                    !isCurrent && !isCompleted && 'hover:bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors',
                      isCompleted && 'bg-green-500 border-green-500 text-white',
                      isCurrent &&
                        'border-primary-foreground text-primary-foreground',
                      !isCurrent && !isCompleted && 'border-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        'font-medium text-sm',
                        isCurrent && 'text-primary-foreground'
                      )}
                    >
                      {step.title}
                    </p>
                    <p
                      className={cn(
                        'text-xs',
                        isCurrent
                          ? 'text-primary-foreground/80'
                          : 'text-muted-foreground'
                      )}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="mt-auto pt-6">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            <Card className="w-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      Step {currentStep + 1} of {onboardingSteps.length}
                    </CardTitle>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {Math.round(
                      ((currentStep + 1) / onboardingSteps.length) * 100
                    )}
                    % Complete
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((currentStep + 1) / onboardingSteps.length) * 100}%`,
                    }}
                  />
                </div>
              </CardHeader>
              <CardContent>
                {progressRestored && (
                  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Progress restored!</strong> You can continue from
                      where you left off.
                    </p>
                  </div>
                )}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      <strong>Error:</strong> {error}
                    </p>
                  </div>
                )}
                <div className="min-h-[400px] flex flex-col">
                  <div className="flex-1">{renderStepContent()}</div>

                  <div className="flex justify-between mt-8">
                    {currentStep === 0 ? (
                      <div /> // Empty div to maintain spacing
                    ) : (
                      <Button variant="outline" onClick={handlePrevious}>
                        Previous
                      </Button>
                    )}

                    {currentStep === onboardingSteps.length - 1 ? (
                      <Button onClick={handleComplete} disabled={isCompleting}>
                        {isCompleting ? 'Setting up...' : 'Get Started'}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={!isCurrentStepValid()}
                      >
                        Next
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
