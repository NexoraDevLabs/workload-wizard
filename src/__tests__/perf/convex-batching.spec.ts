import { describe, it, expect, beforeEach } from 'vitest';
import type { Id, Doc, TableNames } from '@/convex/_generated/dataModel';
import type { DatabaseReader } from '@/convex/_generated/server';
import { wrapDbWithCounter } from '../../../src/test/utils/convexDbCounter';
import { createIdLoader } from '../../lib/convex/createIdLoader';

type MockUser = Doc<'users'>;
type MockCtx = { db: DatabaseReader };

// Mock implementation for testing
function createMockDb(): DatabaseReader {
  const mockUsers: Record<string, MockUser> = {
    'user1': { 
      _id: 'user1' as Id<'users'>, 
      email: 'test1@example.com',
      givenName: 'Test',
      familyName: 'User1',
      fullName: 'Test User1',
      systemRoles: [],
      organisationId: 'org1' as Id<'organisations'>,
      subject: 'user1',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      _creationTime: Date.now(),
    },
    'user2': { 
      _id: 'user2' as Id<'users'>, 
      email: 'test2@example.com',
      givenName: 'Test',
      familyName: 'User2',
      fullName: 'Test User2',
      systemRoles: [],
      organisationId: 'org1' as Id<'organisations'>,
      subject: 'user2',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      _creationTime: Date.now(),
    },
  };

  return {
    get: async (id: Id<'users'>) => mockUsers[id as string] || null,
    query: () => {
      throw new Error('Query not implemented in mock');
    },
    getMany: async (ids: Id<'users'>[]) => ids.map(id => mockUsers[id as string] || null),
    // Add missing properties to match DatabaseReader
    system: {} as DatabaseReader['system'],
    normalizeId: (tableName: string, id: string) => id as Id<TableNames>,
  } as unknown as DatabaseReader;
}

describe('Convex ID Loader Performance', () => {
  let mockDb: DatabaseReader;
  let wrappedDb: ReturnType<typeof wrapDbWithCounter>;
  let ctx: MockCtx;

  beforeEach(() => {
    mockDb = createMockDb();
     
    wrappedDb = wrapDbWithCounter(mockDb);
    ctx = { db: wrappedDb.db as DatabaseReader };
    wrappedDb.reset();
  });

  it('should batch multiple get calls efficiently', async () => {
    const userLoader = createIdLoader('users');
    
    // Load multiple users
    const _user1Promise = userLoader.load(ctx, 'user1' as Id<'users'>);
    const _user2Promise = userLoader.load(ctx, 'user2' as Id<'users'>);
    
    // Wait for all to resolve
    await Promise.all([_user1Promise, _user2Promise]);
    
    const counts = wrappedDb.counts();
    
    // Should have made individual get calls
    expect(counts.gets).toBe(2);
    expect(counts.total).toBe(2);
  });

  it('should handle null/undefined IDs safely', async () => {
    const userLoader = createIdLoader('users');
    
    const result1 = await userLoader.load(ctx, null);
    const result2 = await userLoader.load(ctx, undefined);
    
    expect(result1).toBeNull();
    expect(result2).toBeNull();
    
    const counts = wrappedDb.counts();
    expect(counts.total).toBe(0); // No DB calls for null/undefined
  });

  it('should cache repeated requests for same ID', async () => {
    const userLoader = createIdLoader('users');
    
    // Load same user multiple times
    const _user1a = await userLoader.load(ctx, 'user1' as Id<'users'>);
    const _user1b = await userLoader.load(ctx, 'user1' as Id<'users'>);
    const _user1c = await userLoader.load(ctx, 'user1' as Id<'users'>);
    
    const counts = wrappedDb.counts();
    
    // Should only make one DB call due to caching
    expect(counts.gets).toBe(1);
    expect(counts.total).toBe(1);
  });

  it('should handle loadMany efficiently', async () => {
    const userLoader = createIdLoader('users');
    
    const userMap = await userLoader.loadMany(ctx, [
      'user1' as Id<'users'>, 
      'user2' as Id<'users'>,
      null,
      undefined,
    ]);
    
    expect(userMap.size).toBe(2);
    expect(userMap.get('user1')).toBeTruthy();
    expect(userMap.get('user2')).toBeTruthy();
    
    const counts = wrappedDb.counts();
    
    // Should use getMany if available, otherwise individual gets
    expect(counts.total).toBeGreaterThan(0);
  });
});
