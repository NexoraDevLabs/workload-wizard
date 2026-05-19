'use client';

import { Bell, Monitor, Moon, Sun } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface PreferenceRowProps {
  icon: React.ElementType;
  title: string;
  description: string;
  control: React.ReactNode;
}

function PreferenceRow({ icon: Icon, title, description, control }: PreferenceRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4">
      <div className="flex items-start gap-3 min-w-0">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="ml-4 shrink-0">{control}</div>
    </div>
  );
}

export function PreferencesTab() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {/* Main preferences */}
      <div className="lg:col-span-2 flex flex-col gap-5">
        {/* Display */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Display &amp; Theme</CardTitle>
            <CardDescription>
              Control how WorkloadWizard looks and feels.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PreferenceRow
              icon={Monitor}
              title="Colour theme"
              description="Switch between light, dark, or system default."
              control={<ThemeToggle />}
            />

            <Separator />

            <PreferenceRow
              icon={Sun}
              title="High contrast mode"
              description="Increase contrast for improved readability."
              control={<Badge variant="warning">Coming soon</Badge>}
            />

            <Separator />

            <PreferenceRow
              icon={Moon}
              title="Reduced motion"
              description="Minimise animations and transitions across the app."
              control={<Badge variant="warning">Coming soon</Badge>}
            />
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-border/60">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>
              Control which notifications WorkloadWizard sends to you.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PreferenceRow
              icon={Bell}
              title="Email notifications"
              description="Receive important updates and reminders by email."
              control={<Badge variant="warning">Coming soon</Badge>}
            />

            <Separator />

            <PreferenceRow
              icon={Bell}
              title="In-app notifications"
              description="See alerts and messages within WorkloadWizard."
              control={<Badge variant="warning">Coming soon</Badge>}
            />
          </CardContent>
        </Card>
      </div>

      {/* Info card */}
      <div>
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">About preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              The <strong className="text-foreground">colour theme</strong> toggle is
              available now. Your preference is stored locally in your browser.
            </p>
            <p>
              Notification preferences and accessibility options such as reduced motion
              and high contrast are on the roadmap and will be released in a future
              update.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
