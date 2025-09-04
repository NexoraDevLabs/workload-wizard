import type { Id, DocumentByName } from "convex/server";

type AnyCtx = { db: { get: (id: string) => Promise<any>; getMany?: (ids: string[]) => Promise<any[]> } };

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function createIdLoader<TableName extends string>(_table: TableName) {
  // Per-request cache
  const cache = new Map<string, Promise<DocumentByName<TableName> | null>>();

  // Micro-batch queue
  let queue: {
    ids: string[];
    resolvers: Array<(map: Map<string, DocumentByName<TableName> | null>) => void>;
  } | null = null;

  async function flush(ctx: AnyCtx) {
    if (!queue) return;
    const ids = uniq(queue.ids);
    const resolvers = queue.resolvers;
    queue = null;

    // Prefer Convex db.getMany if present
    const supportsGetMany = typeof ctx.db.getMany === "function";
    let map = new Map<string, DocumentByName<TableName> | null>();

    if (supportsGetMany) {
      const convexIds = ids as unknown as Id<TableName>[];
      const docs = await ctx.db.getMany(convexIds);
      ids.forEach((id, i) => {
        map.set(id, (docs[i] as DocumentByName<TableName> | null) ?? null);
      });
    } else {
      // Fallback: parallel db.get (still deduped)
      const docs = await Promise.all(ids.map((id) => ctx.db.get(id as unknown as Id<TableName>)));
      ids.forEach((id, i) => {
        map.set(id, (docs[i] as DocumentByName<TableName> | null) ?? null);
      });
    }

    // Resolve all batched callers and seed cache
    for (const [id, doc] of map) {
      cache.set(id, Promise.resolve(doc));
    }
    resolvers.forEach((r) => r(map));
  }

  async function load(ctx: AnyCtx, id: Id<TableName> | null | undefined) {
    if (!id) return null;
    const key = id as unknown as string;
    const cached = cache.get(key);
    if (cached) return cached;

    // Enqueue and schedule a microtask flush
    if (!queue) queue = { ids: [], resolvers: [] };
    queue.ids.push(key);

    const p = new Promise<DocumentByName<TableName> | null>((resolve) => {
      queue!.resolvers.push((m) => resolve(m.get(key) ?? null));
    });

    cache.set(key, p);
    // Schedule flush at end of current tick to coalesce multiple .load calls
    queueMicrotask(() => {
      void flush(ctx);
    });

    return p;
  }

  async function loadMany(ctx: AnyCtx, ids: (Id<TableName> | null | undefined)[]) {
    const valid = uniq(ids.filter(Boolean) as Id<TableName>[]);
    const results = await Promise.all(valid.map((id) => load(ctx, id)));
    const map = new Map<string, DocumentByName<TableName> | null>();
    valid.forEach((id, i) => map.set(id as unknown as string, results[i] ?? null));
    return map;
  }

  return { load, loadMany };
}
