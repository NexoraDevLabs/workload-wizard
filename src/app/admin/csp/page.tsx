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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Shield, Globe } from 'lucide-react';
import { useState } from 'react';

export default function CSPDashboard() {
  const [timeRange, setTimeRange] = useState(24);

  const summary = useQuery(api.csp.getSummary, { hours: timeRange }) as any;
  const recentReports = useQuery(api.csp.getRecentReports, { limit: 20, hours: timeRange }) as any;

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

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">CSP Violation Dashboard</h1>

      <div className="mb-6">
        <Tabs value={String(timeRange)} onValueChange={(value) => setTimeRange(Number(value))}>
          <TabsList>
            <TabsTrigger value="1">Last Hour</TabsTrigger>
            <TabsTrigger value="24">Last 24 Hours</TabsTrigger>
            <TabsTrigger value="168">Last 7 Days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Violations</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalReports}</div>
            <p className="text-xs text-muted-foreground">
              Last {timeRange} hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Directives</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summary.byDirective && summary.byDirective.length > 0 ? (
              <ul className="text-sm">
                {summary.byDirective.slice(0, 5).map((item: any, index: number) => (
                  <li key={index} className="flex justify-between items-center">
                    <span>{item.directive}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No violations for this period.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Blocked URIs</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {summary.byBlockedURI && summary.byBlockedURI.length > 0 ? (
              <ul className="text-sm">
                {summary.byBlockedURI.slice(0, 5).map((item: any, index: number) => (
                  <li key={index} className="flex justify-between items-center truncate">
                    <span className="truncate">{item.uri}</span>
                    <Badge variant="secondary">{item.count}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">No blocked URIs for this period.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mb-4">Recent Violations</h2>
      {recentReports && recentReports.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>Directive</TableHead>
              <TableHead>Blocked URI</TableHead>
              <TableHead>Source File</TableHead>
              <TableHead>User Agent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentReports.map((report: any) => (
              <TableRow key={report._id}>
                <TableCell>{formatTimestamp(report.timestamp)}</TableCell>
                <TableCell>{report.effectiveDirective}</TableCell>
                <TableCell className="max-w-xs truncate">{report.blockedURI || 'N/A'}</TableCell>
                <TableCell className="max-w-xs truncate">{report.sourceFile || 'N/A'}</TableCell>
                <TableCell className="max-w-xs truncate">{report.userAgent || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No CSP violations reported in the last {timeRange} hours.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}