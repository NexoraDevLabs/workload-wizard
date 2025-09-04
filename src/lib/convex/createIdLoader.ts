import type { GenericQueryCtx } from "convex/server";

type AnyCtx = GenericQueryCtx<any>;

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function createIdLoader<TableName extends string>(_table: TableName) {
  // Per-request cache
  const cache = new Map<string, Promise<any | null>>();

  // Micro-batch queue
  let queue: {
    ids: string[];
    resolvers: Array<(map: Map<string, any | null>) => void>;
  } | null = null;

  async function flush(ctx: AnyCtx) {
    if (!queue) return;
    const ids = uniq(queue.ids);
    const resolvers = queue.resolvers;
    queue = null;

    // Prefer Convex db.getMany if present
    const supportsGetMany = 'getMany' in ctx.db && typeof (ctx.db as any).getMany === "function";
    let map = new Map<string, any | null>();

    if (supportsGetMany) {
      const convexIds = ids as any[];
      const docs = await (ctx.db as any).getMany(convexIds);
      ids.forEach((id, i) => {
        map.set(id, docs[i] ?? null);
      });
    } else {
      // Fallback: parallel db.get (still deduped)
      const docs = await Promise.all(ids.map((id) => ctx.db.get(id as any)));
      ids.forEach((id, i) => {
        map.set(id, docs[i] ?? null);
      });
    }

    // Resolve all batched callers and seed cache
    for (const [id, doc] of map) {
      cache.set(id, Promise.resolve(doc));
    }
    resolvers.forEach((r) => r(map));
  }

  async function load(ctx: AnyCtx, id: any) {
    if (!id) return null;
    const key = String(id);
    const cached = cache.get(key);
    if (cached) return cached;

    // Enqueue and schedule a microtask flush
    if (!queue) queue = { ids: [], resolvers: [] };
    queue.ids.push(key);

    const p = new Promise<any | null>((resolve) => {
      queue!.resolvers.push((m) => resolve(m.get(key) ?? null));
    });

    cache.set(key, p);
    // Schedule flush at end of current tick to coalesce multiple .load calls
    queueMicrotask(() => {
      void flush(ctx);
    });

    return p;
  }

  async function loadMany(ctx: AnyCtx, ids: any[]) {
    const valid = uniq(ids.filter(Boolean));
    const results = await Promise.all(valid.map((id) => load(ctx, id)));
    const map = new Map<string, any | null>();
    valid.forEach((id, i) => map.set(String(id), results[i] ?? null));
    return map;
  }

  return { load, loadMany };
}
