import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const listForCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) return [];
    return await ctx.db
      .query("feature_enrollments")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();
  },
});

export const upsertForCurrentUser = mutation({
  args: { featureKey: v.string(), enabled: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) throw new Error("Unauthenticated");
    const now = Date.now();
    const existing = await ctx.db
      .query("feature_enrollments")
      .withIndex("by_user_key", (q) =>
        q.eq("userId", identity.subject).eq("featureKey", args.featureKey),
      )
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        enabled: args.enabled,
        updatedAt: now,
      });
      return existing._id;
    }
    return await ctx.db.insert("feature_enrollments", {
      userId: identity.subject,
      featureKey: args.featureKey,
      enabled: args.enabled,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listForUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("feature_enrollments")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
