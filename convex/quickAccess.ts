import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const getForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return { links: [], showNames: true };
    const row = await ctx.db
      .query('quick_access_prefs')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error('Unauthenticated');
    const now = Date.now();
    const existing = await ctx.db
      .query('quick_access_prefs')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
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
      userId: identity.subject,
      links: args.links,
      showNames: args.showNames,
      createdAt: now,
      updatedAt: now,
    });
  },
});
