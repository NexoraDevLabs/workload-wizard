export type DbLike = { 
  get: (id: string) => Promise<any>; 
  getMany?: (ids: string[]) => Promise<any[]>; 
  query: (table: string) => any;
};

export function wrapDbWithCounter<T extends DbLike>(db: T) {
  let gets = 0;
  let getManys = 0;

  const proxy: T = {
    ...db,
    async get(id: string) {
      gets += 1;
      return db.get(id);
    },
    ...(db.getMany && {
      async getMany(ids: string[]) {
        getManys += 1;
        return db.getMany(ids);
      }
    }),
    query: db.query,
  } as T;

  return {
    db: proxy,
    reset: () => { gets = 0; getManys = 0; },
    counts: () => ({ gets, getManys, total: gets + getManys }),
  };
}
