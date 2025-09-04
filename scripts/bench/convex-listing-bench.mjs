import { performance } from 'perf_hooks';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Mock data for benchmarking
const createMockData = (userCount, uniqueOrgs) => {
  const users = Array.from({ length: userCount }, (_, i) => ({
    _id: `user${i}`,
    organisationId: `org${i % uniqueOrgs}`,
    subject: `subj${i}`,
  }));

  const organisations = Array.from({ length: uniqueOrgs }, (_, i) => ({
    _id: `org${i}`,
    name: `Organisation ${i}`,
    code: `ORG${i}`,
  }));

  const roles = Array.from({ length: 5 }, (_, i) => ({
    _id: `role${i}`,
    name: `Role ${i}`,
    description: `Role ${i} description`,
    isActive: true,
  }));

  return { users, organisations, roles };
};

// Mock database with performance tracking
function createMockDbWithTracking(data) {
  let getCount = 0;
  let getManyCount = 0;
  let queryCount = 0;

  return {
    async get(id) {
      getCount++;
      if (id && id.startsWith("org")) {
        return data.organisations.find(org => org._id === id) || null;
      }
      if (id && id.startsWith("role")) {
        return data.roles.find(role => role._id === id) || null;
      }
      return null;
    },
    async getMany(ids) {
      getManyCount++;
      return ids.map(id => {
        if (id && id.startsWith("org")) {
          return data.organisations.find(org => org._id === id) || null;
        }
        if (id && id.startsWith("role")) {
          return data.roles.find(role => role._id === id) || null;
        }
        return null;
      });
    },
    query: () => ({
      withIndex: () => ({
        eq: () => ({
          collect: () => {
            queryCount++;
            return Promise.resolve(data.users);
          },
          first: () => {
            queryCount++;
            return Promise.resolve(data.users[0]);
          },
        }),
        filter: () => ({
          collect: () => {
            queryCount++;
            return Promise.resolve(data.users);
          },
        }),
      }),
      filter: () => ({
        collect: () => {
          queryCount++;
          return Promise.resolve(data.users);
        },
      }),
      collect: () => {
        queryCount++;
        return Promise.resolve(data.users);
      },
    }),
    getStats: () => ({ getCount, getManyCount, queryCount, total: getCount + getManyCount + queryCount }),
    resetStats: () => { getCount = 0; getManyCount = 0; queryCount = 0; },
  };
}

// Simple ID loader implementation for benchmarking
function createIdLoader(tableName) {
  const cache = new Map();
  let queue = null;

  async function flush(ctx) {
    if (!queue) return;
    const ids = [...new Set(queue.ids)];
    const resolvers = queue.resolvers;
    queue = null;

    const supportsGetMany = typeof ctx.db.getMany === "function";
    let map = new Map();

    if (supportsGetMany) {
      const docs = await ctx.db.getMany(ids);
      ids.forEach((id, i) => {
        map.set(id, docs[i] || null);
      });
    } else {
      const docs = await Promise.all(ids.map(id => ctx.db.get(id)));
      ids.forEach((id, i) => {
        map.set(id, docs[i] || null);
      });
    }

    for (const [id, doc] of map) {
      cache.set(id, Promise.resolve(doc));
    }
    resolvers.forEach(r => r(map));
  }

  async function load(ctx, id) {
    if (!id) return null;
    const key = String(id);
    const cached = cache.get(key);
    if (cached) return cached;

    if (!queue) queue = { ids: [], resolvers: [] };
    queue.ids.push(key);

    const p = new Promise(resolve => {
      queue.resolvers.push(map => resolve(map.get(key) || null));
    });

    cache.set(key, p);
    queueMicrotask(() => flush(ctx));

    return p;
  }

  async function loadMany(ctx, ids) {
    const valid = [...new Set(ids.filter(Boolean))];
    const results = await Promise.all(valid.map(id => load(ctx, id)));
    const map = new Map();
    valid.forEach((id, i) => map.set(String(id), results[i] || null));
    return map;
  }

  return { load, loadMany };
}

// Baseline implementation (N+1 pattern)
async function listUsersBaseline(ctx) {
  const users = await ctx.db.query("users").collect();
  
  const usersWithOrganisations = await Promise.all(
    users.map(async (user) => {
      const organisation = await ctx.db.get(user.organisationId);
      
      const assignments = await ctx.db
        .query("user_role_assignments")
        .withIndex("by_user_org", (q) =>
          q.eq("userId", user.subject).eq("organisationId", user.organisationId)
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      const organisationalRoles = [];
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
async function listUsersOptimised(ctx) {
  const organisationsLoader = createIdLoader("organisations");
  const rolesLoader = createIdLoader("user_roles");
  
  const users = await ctx.db.query("users").collect();
  
  const usersWithOrganisations = await Promise.all(
    users.map(async (user) => {
      const organisation = await organisationsLoader.load(ctx, user.organisationId);
      
      const assignments = await ctx.db
        .query("user_role_assignments")
        .withIndex("by_user_org", (q) =>
          q.eq("userId", user.subject).eq("organisationId", user.organisationId)
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      const organisationalRoles = [];
      
      if (assignments.length > 0) {
        const roleIds = assignments.map(a => a.roleId);
        const roles = await rolesLoader.loadMany(ctx, roleIds);
        
        for (const a of assignments) {
          const role = roles.get(String(a.roleId));
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

// Benchmark function
async function benchmark(name, fn, iterations = 10) {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  
  return { p50, p95, avg, times };
}

// Main benchmark function
async function runBenchmark() {
  const phase = process.env.BENCH_PHASE || 'after';
  const scenarios = [
    { name: 'typical', userCount: 100, uniqueOrgs: 20 },
    { name: 'worst-case', userCount: 1000, uniqueOrgs: 100 },
  ];

  const results = {};

  for (const scenario of scenarios) {
    console.log(`\n=== ${scenario.name} scenario (${scenario.userCount} users, ${scenario.uniqueOrgs} orgs) ===`);
    
    const data = createMockData(scenario.userCount, scenario.uniqueOrgs);
    const mockDb = createMockDbWithTracking(data);
    const ctx = { db: mockDb };

    // Benchmark baseline
    mockDb.resetStats();
    const baselinePerf = await benchmark('baseline', () => listUsersBaseline(ctx));
    const baselineStats = mockDb.getStats();
    
    // Benchmark optimised
    mockDb.resetStats();
    const optimisedPerf = await benchmark('optimised', () => listUsersOptimised(ctx));
    const optimisedStats = mockDb.getStats();

    results[scenario.name] = {
      baseline: {
        performance: baselinePerf,
        stats: baselineStats,
      },
      optimised: {
        performance: optimisedPerf,
        stats: optimisedStats,
      },
      improvement: {
        queryReduction: ((baselineStats.total - optimisedStats.total) / baselineStats.total * 100).toFixed(1),
        p95Improvement: ((baselinePerf.p95 - optimisedPerf.p95) / baselinePerf.p95 * 100).toFixed(1),
        avgImprovement: ((baselinePerf.avg - optimisedPerf.avg) / baselinePerf.avg * 100).toFixed(1),
      },
    };

    console.log(`Baseline: ${baselinePerf.p95.toFixed(2)}ms p95, ${baselineStats.total} queries`);
    console.log(`Optimised: ${optimisedPerf.p95.toFixed(2)}ms p95, ${optimisedStats.total} queries`);
    console.log(`Improvement: ${results[scenario.name].improvement.p95Improvement}% p95, ${results[scenario.name].improvement.queryReduction}% queries`);
  }

  // Write results to file
  const benchDir = join(__dirname, '../../.bench');
  await fs.mkdir(benchDir, { recursive: true });
  const path = join(benchDir, `convex-listing-${phase}.json`);
  await fs.writeFile(path, JSON.stringify(results, null, 2));
  
  console.log(`\nResults written to ${path}`);
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBenchmark().catch(console.error);
}

export { runBenchmark };
