import { query, mutation } from './_generated/server';
import { v } from 'convex/values';
import { getAuthContext } from './lib/auth';

export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const authContext = await getAuthContext(ctx);
    const row = await ctx.db
      .query('quick_access_prefs')
      .withIndex('by_user', (q) => q.eq('userId', authContext.userId))
      .first();
    return (
      row || {
        links: [] as Array<{ name: string; url: string }>,
        showNames: true,
      }
    );
  },
});

export const saveForCurrentUser = mutation({
  args: {
    links: v.array(v.object({ name: v.string(), url: v.string() })),
    showNames: v.boolean(),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const now = Date.now();
    const existing = await ctx.db
      .query('quick_access_prefs')
      .withIndex('by_user', (q) => q.eq('userId', authContext.userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        links: args.links,
        showNames: args.showNames,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert('quick_access_prefs', {
      userId: authContext.userId,
      links: args.links,
      showNames: args.showNames,
      createdAt: now,
      updatedAt: now,
    });
  },
});
