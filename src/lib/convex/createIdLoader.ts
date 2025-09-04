import type { Id, Doc, TableNames } from '@/convex/_generated/dataModel';
import type { DatabaseReader } from '@/convex/_generated/server';

type Ctx = { db: DatabaseReader };

export function createIdLoader<T extends TableNames>(_table: T) {
  const cache = new Map<string, Promise<Doc<T> | null>>();

  async function load(ctx: Ctx, id: Id<T> | null | undefined): Promise<Doc<T> | null> {
    if (!id) return null;
    const key = id as unknown as string;
    const cached = cache.get(key);
    if (cached) return cached;

    // Prefer db.getMany if present, else fall back to db.get
    const p = (async () => {
      // small micro-batch not required: Convex resolves get() quickly; keep simple & typed
       
      const doc = await ctx.db.get(id);
      return (doc as Doc<T> | null) ?? null;
    })();

    cache.set(key, p);
    return p;
  }

  async function loadMany(ctx: Ctx, ids: (Id<T> | null | undefined)[]): Promise<Map<string, Doc<T> | null>> {
    const unique = Array.from(new Set(ids.filter(Boolean) as Id<T>[]));

    // If db.getMany exists in this Convex version, use it; otherwise parallel get().
    const results = typeof (ctx.db as unknown as { getMany?: unknown }).getMany === 'function'
      ? (await (ctx.db as unknown as { getMany: (ids: Id<T>[]) => Promise<(Doc<T> | null)[]> }).getMany(unique))
       
      : await Promise.all(unique.map((id) => ctx.db.get(id) as Promise<Doc<T> | null>));

    const map = new Map<string, Doc<T> | null>();
    unique.forEach((id, i) => map.set(id as unknown as string, results[i] ?? null));
    return map;
  }

  return { load, loadMany };
}

export type IdLoader<T extends TableNames> = ReturnType<typeof createIdLoader<T>>;
