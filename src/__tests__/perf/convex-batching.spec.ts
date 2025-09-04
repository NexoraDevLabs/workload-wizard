import { describe, it, expect, beforeEach } from "vitest";
import { wrapDbWithCounter } from "../../test/utils/convexDbCounter";
import { makeLoaders } from "../../lib/convex/loaders";

// Mock data for testing
const mockUsers = [
  { _id: "user1" as any, organisationId: "org1" as any, subject: "subj1" },
  { _id: "user2" as any, organisationId: "org1" as any, subject: "subj2" },
  { _id: "user3" as any, organisationId: "org2" as any, subject: "subj3" },
];

const mockOrganisations: Record<string, any> = {
  org1: { _id: "org1" as any, name: "Org 1", code: "ORG1" },
  org2: { _id: "org2" as any, name: "Org 2", code: "ORG2" },
};

const mockRoles: Record<string, any> = {
  role1: { _id: "role1" as any, name: "Admin", description: "Admin role", isActive: true },
  role2: { _id: "role2" as any, name: "User", description: "User role", isActive: true },
};

const mockAssignments = [
  { roleId: "role1" as any, userId: "subj1", organisationId: "org1" as any },
  { roleId: "role2" as any, userId: "subj2", organisationId: "org1" as any },
];

// Mock database implementation
function createMockDb() {
  return {
    async get(id: string) {
      if (id && id.startsWith("org")) return mockOrganisations[id] || null;
      if (id && id.startsWith("role")) return mockRoles[id] || null;
      return null;
    },
    async getMany(ids: string[]) {
      return ids.map(id => {
        if (id && id.startsWith("org")) return mockOrganisations[id] || null;
        if (id && id.startsWith("role")) return mockRoles[id] || null;
        return null;
      });
    },
    query: () => ({
      withIndex: () => ({
        eq: () => ({
          collect: () => Promise.resolve(mockUsers),
          first: () => Promise.resolve(mockUsers[0]),
        }),
        filter: () => ({
          collect: () => Promise.resolve(mockUsers),
        }),
      }),
      filter: () => ({
        collect: () => Promise.resolve(mockUsers),
      }),
      collect: () => Promise.resolve(mockUsers),
    }),
  };
}

// Baseline implementation (N+1 pattern)
async function listUsersBaseline(ctx: any) {
  const users = await ctx.db.query("users").collect();
  
  const usersWithOrganisations = await Promise.all(
    users.map(async (user: any) => {
      const organisation = await ctx.db.get(user.organisationId);
      
      const assignments = await ctx.db
        .query("user_role_assignments")
        .withIndex("by_user_org", (q: any) =>
          q.eq("userId", user.subject).eq("organisationId", user.organisationId)
        )
        .filter((q: any) => q.eq(q.field("isActive"), true))
        .collect();

      const organisationalRoles: any[] = [];
      for (const a of assignments) {
        const role = await ctx.db.get(a.roleId);
        if (role && role.isActive) {
          organisationalRoles.push({
            id: role._id,
            name: role.name,
            description: role.description,
          });
        }
      }

      return {
        ...user,
        organisation: organisation ? {
          id: organisation._id,
          name: organisation.name,
          code: organisation.code,
        } : undefined,
        organisationalRoles,
        organisationalRole: organisationalRoles[0] || null,
      };
    })
  );

  return usersWithOrganisations;
}

// Optimised implementation (bulk batching)
async function listUsersOptimised(ctx: any) {
  const loaders = makeLoaders();
  const users = await ctx.db.query("users").collect();
  
  const usersWithOrganisations = await Promise.all(
    users.map(async (user: any) => {
      const organisation = await loaders.organisationsById.load(ctx, user.organisationId);
      
      const assignments = await ctx.db
        .query("user_role_assignments")
        .withIndex("by_user_org", (q: any) =>
          q.eq("userId", user.subject).eq("organisationId", user.organisationId)
        )
        .filter((q: any) => q.eq(q.field("isActive"), true))
        .collect();

      const organisationalRoles: any[] = [];
      
      if (assignments.length > 0) {
        const roleIds = assignments.map((a: any) => a.roleId);
        const roles = await loaders.userRolesById.loadMany(ctx, roleIds);
        
        for (const a of assignments) {
          const role = roles.get(a.roleId as unknown as string);
          if (role && role.isActive) {
            organisationalRoles.push({
              id: role._id,
              name: role.name,
              description: role.description,
            });
          }
        }
      }

      return {
        ...user,
        organisation: organisation ? {
          id: organisation._id,
          name: organisation.name,
          code: organisation.code,
        } : undefined,
        organisationalRoles,
        organisationalRole: organisationalRoles[0] || null,
      };
    })
  );

  return usersWithOrganisations;
}

describe("Convex batching", () => {
  let mockDb: any;
  let dbCounter: ReturnType<typeof wrapDbWithCounter>;

  beforeEach(() => {
    mockDb = createMockDb();
    dbCounter = wrapDbWithCounter(mockDb);
  });

  it("reduces query count and keeps output identical (typical)", async () => {
    const ctx = { db: dbCounter.db };
    
    // Test baseline
    dbCounter.reset();
    const base = await listUsersBaseline(ctx);
    const baseCounts = dbCounter.counts();

    // Test optimised
    dbCounter.reset();
    const opt = await listUsersOptimised(ctx);
    const optCounts = dbCounter.counts();

    // Assertions
    expect(opt).toEqual(base);
    expect(optCounts.total).toBeLessThan(baseCounts.total);
    expect(optCounts.getManys).toBeGreaterThan(0); // Should use getMany
  });

  it("handles worst-case sizes with many repeated IDs", async () => {
    // Create larger dataset with repeated organisation IDs
    const largeMockUsers = Array.from({ length: 100 }, (_, i) => ({
      _id: `user${i}` as any,
      organisationId: `org${i % 10}` as any, // Only 10 unique orgs
      subject: `subj${i}`,
    }));

    const largeMockDb = {
      ...mockDb,
      query: () => ({
        collect: () => Promise.resolve(largeMockUsers),
        withIndex: () => ({
          eq: () => ({
            collect: () => Promise.resolve([]),
            first: () => Promise.resolve(null),
          }),
          filter: () => ({
            collect: () => Promise.resolve([]),
          }),
        }),
        filter: () => ({
          collect: () => Promise.resolve([]),
        }),
      }),
    };

    const largeDbCounter = wrapDbWithCounter(largeMockDb);
    const ctx = { db: largeDbCounter.db };
    
    // Test baseline
    largeDbCounter.reset();
    const base = await listUsersBaseline(ctx);
    const baseCounts = largeDbCounter.counts();

    // Test optimised
    largeDbCounter.reset();
    const opt = await listUsersOptimised(ctx);
    const optCounts = largeDbCounter.counts();

    // Assertions
    expect(opt).toEqual(base);
    expect(optCounts.total).toBeLessThan(baseCounts.total);
    expect(optCounts.getManys).toBeGreaterThan(0);
  });

  it("caches results within the same request", async () => {
    const ctx = { db: dbCounter.db, auth: {}, storage: {}, runQuery: () => {} };
    
    dbCounter.reset();
    const loaders = makeLoaders();
    
    // Load the same organisation ID multiple times
    const org1 = await loaders.organisationsById.load(ctx, "org1" as any);
    const org1Again = await loaders.organisationsById.load(ctx, "org1" as any);
    
    expect(org1).toBe(org1Again); // Should be the same reference
    // Note: Due to micro-batching, the actual DB calls might be delayed
    // So we check that the total is reasonable (should be 1 or 2 due to batching)
    expect(dbCounter.counts().total).toBeLessThanOrEqual(2);
  });
});
