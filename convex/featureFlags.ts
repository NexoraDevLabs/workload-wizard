import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { writeAudit } from "./audit";

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("feature_flags").collect();
  },
});

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    // Public = non-draft and active
    return await ctx.db
      .query("feature_flags")
      .filter((q) =>
        q.and(
          q.eq(q.field("isActive"), true),
          q.neq(q.field("stage"), "draft"),
        ),
      )
      .collect();
  },
});

export const upsert = mutation({
  args: {
    id: v.optional(v.id("feature_flags")),
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    stage: v.union(
      v.literal("draft"),
      v.literal("alpha"),
      v.literal("beta"),
      v.literal("concept"),
    ),
    isActive: v.boolean(),
    performedBy: v.optional(v.string()),
    performedByName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    if (args.id) {
      const updates: Partial<{
        key: string;
        name: string;
        description: string;
        stage: "draft" | "alpha" | "beta" | "concept";
        isActive: boolean;
        updatedAt: number;
      }> = {
        key: args.key,
        name: args.name,
        stage: args.stage,
        isActive: args.isActive,
        updatedAt: now,
      };
      if (typeof args.description === "string")
        updates.description = args.description;
      await ctx.db.patch(args.id, updates as any);
      if (args.performedBy) {
        await writeAudit(ctx, {
          action: "feature.upsert",
          entityType: "feature_flag",
          entityId: String(args.id),
          entityName: args.key,
          performedBy: args.performedBy,
          ...(args.performedByName
            ? { performedByName: args.performedByName }
            : {}),
          details: `Feature flag updated: ${args.key}`,
          severity: "info",
          type: "sys",
        });
      }
      return args.id;
    }
    // enforce uniqueness by key
    const existing = await ctx.db
      .query("feature_flags")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    if (existing) {
      const updates: Partial<{
        name: string;
        description: string;
        stage: "draft" | "alpha" | "beta" | "concept";
        isActive: boolean;
        updatedAt: number;
      }> = {
        name: args.name,
        stage: args.stage,
        isActive: args.isActive,
        updatedAt: now,
      };
      if (typeof args.description === "string")
        updates.description = args.description;
      await ctx.db.patch(existing._id, updates as any);
      if (args.performedBy) {
        await writeAudit(ctx, {
          action: "feature.upsert",
          entityType: "feature_flag",
          entityId: String(existing._id),
          entityName: args.key,
          performedBy: args.performedBy,
          ...(args.performedByName
            ? { performedByName: args.performedByName }
            : {}),
          details: `Feature flag updated by key: ${args.key}`,
          severity: "info",
          type: "sys",
        });
      }
      return existing._id;
    }
    const insertDoc: {
      key: string;
      name: string;
      stage: "draft" | "alpha" | "beta" | "concept";
      isActive: boolean;
      createdAt: number;
      updatedAt: number;
      description?: string;
    } = {
      key: args.key,
      name: args.name,
      stage: args.stage,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    };
    if (typeof args.description === "string")
      insertDoc.description = args.description;
    const id = await ctx.db.insert("feature_flags", insertDoc as any);
    if (args.performedBy) {
      await writeAudit(ctx, {
        action: "feature.create",
        entityType: "feature_flag",
        entityId: String(id),
        entityName: args.key,
        performedBy: args.performedBy,
        ...(args.performedByName
          ? { performedByName: args.performedByName }
          : {}),
        details: `Feature flag created: ${args.key}`,
        severity: "info",
        type: "sys",
      });
    }
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id("feature_flags") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const subject = identity?.subject ?? "system";
    const existing = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    try {
      await writeAudit(ctx, {
        action: "feature.delete",
        entityType: "feature_flag",
        entityId: String(args.id),
        entityName: (existing as any)?.key || String(args.id),
        performedBy: subject,
        details: `Feature flag removed`,
        severity: "warning",
        type: "sys",
      });
    } catch {}
    return true;
  },
});
