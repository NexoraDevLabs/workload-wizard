import type { Id, Doc, TableNames } from '@/convex/_generated/dataModel';
import type { DatabaseReader } from '@/convex/_generated/server';

type DbLike = Pick<DatabaseReader, 'get' | 'query'> & {
  getMany?: <T extends TableNames>(ids: Id<T>[]) => Promise<(Doc<T> | null)[]>;
};

export function wrapDbWithCounter<T extends DbLike>(db: T) {
  let gets = 0;
  let getManys = 0;

  const proxy: T = {
    ...db,
    async get(id: Id<TableNames>) { 
      gets += 1; 
       
      return db.get(id); 
    },
    ...(db.getMany && {
      async getMany(ids: Id<TableNames>[]) { 
        getManys += 1;
        // Type assertion needed for generic passthrough
        return db.getMany!(ids);
      }
    }),
     
    query: db.query.bind(db),
  };

  return {
    db: proxy,
    reset: () => { gets = 0; getManys = 0; },
    counts: () => ({ gets, getManys, total: gets + getManys }),
  };
}
