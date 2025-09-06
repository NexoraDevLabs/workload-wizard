/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  Shield,
  Globe,
  Search,
  Download,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useState, useMemo } from 'react';

export default function CSPDashboard() {
  const [timeRange, setTimeRange] = useState(24);
  const [searchTerm, setSearchTerm] = useState('');
  const [directiveFilter, setDirectiveFilter] = useState('all');
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState('timestamp');

  const summary = useQuery(api.csp.getSummary, { hours: timeRange }) as unknown;
  const recentReports = useQuery(api.csp.getRecentReports, {
    limit: 100, // Increased limit for better filtering
    hours: timeRange,
  }) as unknown;

  // Get unique directives for filter dropdown
  const availableDirectives = useMemo(() => {
    if (!recentReports || !Array.isArray(recentReports)) return [];
    const directives = new Set(
      recentReports.map((r: unknown) => {
        if (r && typeof r === 'object' && 'effectiveDirective' in r) {
          return (r as { effectiveDirective: unknown }).effectiveDirective;
        }
        return null;
      }).filter((directive): directive is string => typeof directive === 'string')
    );
    return Array.from(directives).sort();
  }, [recentReports]);

  // Filter and sort reports
  const filteredReports = useMemo(() => {
    if (!recentReports || !Array.isArray(recentReports)) return [];

    const filtered = recentReports.filter((report: unknown) => {
      if (!report || typeof report !== 'object') return false;
      const r = report as Record<string, unknown>;
      
      const matchesSearch =
        !searchTerm ||
        (typeof r.effectiveDirective === 'string' && r.effectiveDirective
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase())) ||
        (typeof r.blockedURI === 'string' && r.blockedURI?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof r.sourceFile === 'string' && r.sourceFile?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (typeof r.userAgent === 'string' && r.userAgent?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDirective =
        directiveFilter === 'all' ||
        r.effectiveDirective === directiveFilter;

      return matchesSearch && matchesDirective;
    });

    // Sort reports
    filtered.sort((a: unknown, b: unknown) => {
      if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return 0;
      const reportA = a as Record<string, unknown>;
      const reportB = b as Record<string, unknown>;
      switch (sortBy) {
        case 'timestamp':
          return (Number(reportB.timestamp) || 0) - (Number(reportA.timestamp) || 0);
        case 'directive':
          return String(reportA.effectiveDirective || '').localeCompare(
            String(reportB.effectiveDirective || '')
          );
        case 'uri':
          return String(reportA.blockedURI || '').localeCompare(String(reportB.blockedURI || ''));
        default:
          return 0;
      }
    });

    return filtered as unknown[];
  }, [recentReports, searchTerm, directiveFilter, sortBy]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // Export functionality
  const exportToCSV = () => {
    if (!filteredReports.length) return;

    const headers = [
      'Timestamp',
      'Directive',
      'Blocked URI',
      'Source File',
      'User Agent',
      'IP Address',
    ];
    const csvContent = [
      headers.join(','),
      ...filteredReports.map((report: unknown) => {
        const r = report as Record<string, unknown>;
        return [
          formatTimestamp(Number(r.timestamp || 0)),
          `"${String(r.effectiveDirective || 'N/A')}"`,
          `"${String(r.blockedURI || 'N/A')}"`,
          `"${String(r.sourceFile || 'N/A')}"`,
          `"${String(r.userAgent || 'N/A')}"`,
          `"${String(r.ipAddress || 'N/A')}"`,
        ].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `csp-violations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get severity color for directive
  const getDirectiveColor = (directive: string) => {
    const highRisk = ['script-src', 'connect-src', 'object-src'];
    const mediumRisk = ['style-src', 'img-src', 'font-src'];

    if (highRisk.includes(directive)) return 'destructive';
    if (mediumRisk.includes(directive)) return 'secondary';
    return 'outline';
  };

  if (!summary || !recentReports) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p>Loading CSP violation data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">CSP Violation Dashboard</h1>

      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs
            value={String(timeRange)}
            onValueChange={(value) => setTimeRange(Number(value))}
          >
            <TabsList>
              <TabsTrigger value="1">Last Hour</TabsTrigger>
              <TabsTrigger value="24">Last 24 Hours</TabsTrigger>
              <TabsTrigger value="168">Last 7 Days</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              disabled={!filteredReports.length}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? (
                <EyeOff className="h-4 w-4 mr-2" />
              ) : (
                <Eye className="h-4 w-4 mr-2" />
              )}
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search violations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={directiveFilter} onValueChange={setDirectiveFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by directive" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Directives</SelectItem>
              {availableDirectives.map((directive) => (
                <SelectItem key={directive} value={directive}>
                  {directive}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="timestamp">Most Recent</SelectItem>
              <SelectItem value="directive">Directive A-Z</SelectItem>
              <SelectItem value="uri">URI A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredReports.length !== (Array.isArray(recentReports) ? recentReports.length : 0) && (
          <div className="text-sm text-muted-foreground">
            Showing {filteredReports.length} of {Array.isArray(recentReports) ? recentReports.length : 0}{' '}
            violations
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Violations
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{String((summary as Record<string, unknown>)?.totalReports || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Directives
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {(() => {
              const summaryData = summary as Record<string, unknown>;
              const byDirective = summaryData?.byDirective as unknown[] | undefined;
              if (!byDirective || !Array.isArray(byDirective) || byDirective.length === 0) return null;
              
              return (
                <ul className="text-sm space-y-1">
                  {byDirective
                    .filter((item: unknown) => {
                      if (!item || typeof item !== 'object') return false;
                      const i = item as Record<string, unknown>;
                      return i.directive && i.directive !== 'undefined';
                    })
                    .slice(0, 5)
                    .map((item: unknown, index: number) => {
                      const i = item as Record<string, unknown>;
                      return (
                        <li
                          key={index}
                          className="flex justify-between items-center"
                        >
                          <span className="truncate">
                            {String(i.directive || 'Unknown')}
                          </span>
                          <Badge variant={getDirectiveColor(String(i.directive))}>
                            {String(i.count || 0)}
                          </Badge>
                        </li>
                      );
                    })}
                </ul>
              );
            })() || (
              <p className="text-xs text-muted-foreground">
                No violations for this period.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Top Blocked URIs
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {(() => {
              const summaryData = summary as Record<string, unknown>;
              const byBlockedURI = summaryData?.byBlockedURI as unknown[] | undefined;
              if (!byBlockedURI || !Array.isArray(byBlockedURI) || byBlockedURI.length === 0) return null;
              
              return (
                <ul className="text-sm">
                  {byBlockedURI
                    .slice(0, 5)
                    .map((item: unknown, index: number) => {
                      const i = item as Record<string, unknown>;
                      return (
                        <li
                          key={index}
                          className="flex justify-between items-center truncate"
                        >
                          <span className="truncate">{String(i.uri || '')}</span>
                          <Badge variant="secondary">{String(i.count || 0)}</Badge>
                        </li>
                      );
                    })}
                </ul>
              );
            })() || (
              <p className="text-xs text-muted-foreground">
                No blocked URIs for this period.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Recent Violations</h2>
        <div className="text-sm text-muted-foreground">
          {filteredReports.length} violation
          {filteredReports.length !== 1 ? 's' : ''}
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && (
        <Alert className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Development Mode:</strong> You're seeing CSP violations from
            Next.js hot reloading and webpack. These are normal in development
            and won't occur in production. The CSP policy is automatically
            relaxed for development with <code>'unsafe-eval'</code> and
            localhost sources.
          </AlertDescription>
        </Alert>
      )}

      {filteredReports && filteredReports.length > 0 ? (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Directive</TableHead>
                <TableHead>Blocked URI</TableHead>
                <TableHead>Source File</TableHead>
                {showDetails && <TableHead>User Agent</TableHead>}
                {showDetails && <TableHead>IP Address</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReports.map((report: unknown) => {
                const r = report as Record<string, unknown>;
                return (
                <TableRow key={String(r._id || '')} className="hover:bg-muted/50">
                  <TableCell className="font-mono text-sm">
                    {formatTimestamp(Number(r.timestamp || 0))}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getDirectiveColor(String(r.effectiveDirective || ''))}
                    >
                      {String(r.effectiveDirective || 'Unknown')}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div
                      className="truncate"
                      title={String(r.blockedURI || 'N/A')}
                    >
                      {String(r.blockedURI || 'N/A')}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div
                      className="truncate"
                      title={String(r.sourceFile || 'N/A')}
                    >
                      {String(r.sourceFile || 'N/A')}
                    </div>
                  </TableCell>
                  {showDetails && (
                    <TableCell className="max-w-xs">
                      <div
                        className="truncate"
                        title={String(r.userAgent || 'N/A')}
                      >
                        {String(r.userAgent || 'N/A')}
                      </div>
                    </TableCell>
                  )}
                  {showDetails && (
                    <TableCell className="font-mono text-sm">
                      {String(r.ipAddress || 'N/A')}
                    </TableCell>
                  )}
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {searchTerm || directiveFilter !== 'all'
              ? 'No violations match your current filters.'
              : `No CSP violations reported in the last ${timeRange} hours.`}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
