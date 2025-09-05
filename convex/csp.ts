import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

/**
 * Add a CSP violation report
 */
export const addReport = mutation({
  args: {
    timestamp: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    effectiveDirective: v.string(),
    violatedDirective: v.string(),
    blockedURI: v.optional(v.string()),
    documentURI: v.optional(v.string()),
    referrer: v.optional(v.string()),
    sourceFile: v.optional(v.string()),
    lineNumber: v.optional(v.number()),
    columnNumber: v.optional(v.number()),
    scriptSample: v.optional(v.string()),
    disposition: v.optional(v.string()),
    originalPolicy: v.optional(v.string()),
    organisationId: v.optional(v.id('organisations')),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    return await ctx.db.insert('csp_reports', {
      ...args,
      timestamp: args.timestamp,
      createdAt: now,
    });
  },
});

/**
 * Get CSP violation summary for the last 24 hours
 */
export const getSummary = query({
  args: {
    hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hours = args.hours || 24;
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    const reports = await ctx.db
      .query('csp_reports')
      .withIndex('by_timestamp', (q) => q.gte('timestamp', cutoff))
      .collect();
    
    // Group by directive
    const byDirective = reports.reduce((acc, report) => {
      const directive = report.effectiveDirective;
      if (!acc[directive]) {
        acc[directive] = {
          count: 0,
          blockedURIs: new Set<string>(),
          reports: [] as typeof reports,
        };
      }
      acc[directive].count++;
      if (report.blockedURI) {
        acc[directive].blockedURIs.add(report.blockedURI);
      }
      acc[directive].reports.push(report);
      return acc;
    }, {} as Record<string, { count: number; blockedURIs: Set<string>; reports: typeof reports }>);
    
    // Group by blocked URI
    const byBlockedURI = reports.reduce((acc, report) => {
      if (report.blockedURI) {
        const uri = report.blockedURI;
        if (!acc[uri]) {
          acc[uri] = {
            count: 0,
            directives: new Set<string>(),
            reports: [] as typeof reports,
          };
        }
        acc[uri].count++;
        acc[uri].directives.add(report.effectiveDirective);
        acc[uri].reports.push(report);
      }
      return acc;
    }, {} as Record<string, { count: number; directives: Set<string>; reports: typeof reports }>);
    
    return {
      totalReports: reports.length,
      timeRange: { hours, cutoff, now: Date.now() },
      byDirective: Object.entries(byDirective).map(([directive, data]) => ({
        directive,
        count: data.count,
        blockedURIs: Array.from(data.blockedURIs),
        topReports: data.reports
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5),
      })),
      byBlockedURI: Object.entries(byBlockedURI)
        .map(([uri, data]) => ({
          uri,
          count: data.count,
          directives: Array.from(data.directives),
          topReports: data.reports
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 5),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20), // Top 20 blocked URIs
    };
  },
});

/**
 * Get recent CSP violation reports
 */
export const getRecentReports = query({
  args: {
    limit: v.optional(v.number()),
    hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const hours = args.hours || 24;
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    return await ctx.db
      .query('csp_reports')
      .withIndex('by_timestamp', (q) => q.gte('timestamp', cutoff))
      .order('desc')
      .take(limit);
  },
});

/**
 * Get CSP violation reports by directive
 */
export const getReportsByDirective = query({
  args: {
    directive: v.string(),
    limit: v.optional(v.number()),
    hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const hours = args.hours || 24;
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    return await ctx.db
      .query('csp_reports')
      .withIndex('by_directive', (q) => q.eq('effectiveDirective', args.directive))
      .filter((q) => q.gte(q.field('timestamp'), cutoff))
      .order('desc')
      .take(limit);
  },
});

/**
 * Get CSP violation reports by blocked URI
 */
export const getReportsByBlockedURI = query({
  args: {
    blockedURI: v.string(),
    limit: v.optional(v.number()),
    hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const hours = args.hours || 24;
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    
    return await ctx.db
      .query('csp_reports')
      .withIndex('by_blocked_uri', (q) => q.eq('blockedURI', args.blockedURI))
      .filter((q) => q.gte(q.field('timestamp'), cutoff))
      .order('desc')
      .take(limit);
  },
});

/**
 * Delete old CSP reports (cleanup)
 */
export const cleanupOldReports = mutation({
  args: {
    daysToKeep: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const daysToKeep = args.daysToKeep || 30;
    const cutoff = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const oldReports = await ctx.db
      .query('csp_reports')
      .withIndex('by_timestamp', (q) => q.lt('timestamp', cutoff))
      .collect();
    
    let deletedCount = 0;
    for (const report of oldReports) {
      await ctx.db.delete(report._id);
      deletedCount++;
    }
    
    return { deletedCount };
  },
});
