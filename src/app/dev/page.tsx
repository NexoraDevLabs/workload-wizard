import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Flag, Shield, Settings, Database } from 'lucide-react';
import Link from 'next/link';
import { StandardizedSidebarLayout } from '@/components/layout/StandardizedSidebarLayout';

const devTools = [
  {
    title: 'Permission Tests',
    description:
      'Test permissions and their default roles across all organisations',
    href: '/dev/permission-test',
    icon: Shield,
    status: 'active',
    category: 'Features',
  },
  {
    title: 'Feature Flag Management',
    description:
      'Manage and preview all feature flags (PostHog and local) with comprehensive controls',
    href: '/dev/features',
    icon: Flag,
    status: 'active',
    category: 'Features',
  },
  {
    title: 'Statsig Test',
    description: 'Test Statsig feature flags and user targeting',
    href: '/dev/statsig-test',
    icon: Flag,
    status: 'active',
    category: 'Features',
  },
];

const breadcrumbs = [
  { label: 'Home', href: '/' },
  { label: 'Dev', href: '/dev' },
];

const categories = [
  'All',
  'Analytics',
  'Features',
  'UI',
  'Database',
  'Security',
];

export default function DevPage() {
  return (
    <StandardizedSidebarLayout
      breadcrumbs={breadcrumbs}
      title="Dev Tools"
      subtitle="Testing and development utilities for WorkloadWizard"
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Total Tools</span>
            </div>
            <p className="text-2xl font-bold">{devTools.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Active</span>
            </div>
            <p className="text-2xl font-bold">
              {devTools.filter((tool) => tool.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Categories</span>
            </div>
            <p className="text-2xl font-bold">{categories.length - 1}</p>
          </CardContent>
        </Card>
      </div>

      {/* Development Tools */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Available Tools</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devTools.map((tool) => (
            <Card key={tool.href} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <tool.icon className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-base">{tool.title}</CardTitle>
                  </div>
                  <Badge
                    variant={tool.status === 'active' ? 'default' : 'secondary'}
                  >
                    {tool.status}
                  </Badge>
                </div>
                <Badge variant="outline" className="w-fit text-xs">
                  {tool.category}
                </Badge>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4">
                  {tool.description}
                </p>
                <Button asChild size="sm" className="w-full">
                  <Link href={tool.href || '/'}>Open Tool</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database & Backend
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Convex Dashboard</li>
                <li>• Database Schema</li>
                <li>• API Endpoints</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Security & Auth
              </h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Clerk Dashboard</li>
                <li>• Permission System</li>
                <li>• Audit Logs</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </StandardizedSidebarLayout>
  );
}
