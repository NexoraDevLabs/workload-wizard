import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

export const getByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase();
    return await ctx.db
      .query('waitlist_signups')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();
  },
});

export const upsert = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    organisation: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const email = args.email.toLowerCase();
    const existing = await ctx.db
      .query('waitlist_signups')
      .withIndex('by_email', (q) => q.eq('email', email))
      .first();
    if (existing) {
      const updates: Partial<{
        name: string;
        organisation: string;
        source: string;
        updatedAt: number;
      }> = { updatedAt: now };
      if (args.name !== undefined) updates.name = args.name;
      if (args.organisation !== undefined)
        updates.organisation = args.organisation;
      if (args.source !== undefined) updates.source = args.source;
      await ctx.db.patch(existing._id, updates as any);
      return { already: true, id: existing._id };
    }
    const toInsert: any = {
      email,
      createdAt: now,
      updatedAt: now,
    };
    if (args.name !== undefined) toInsert.name = args.name;
    if (args.organisation !== undefined)
      toInsert.organisation = args.organisation;
    if (args.source !== undefined) toInsert.source = args.source;
    const id = await ctx.db.insert('waitlist_signups', toInsert);
    return { already: false, id };
  },
});
