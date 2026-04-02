/**
 * Test utilities for permissions module.
 */

export type MockId<T extends string> = T & { __tableName: T };

export const createMockId = <T extends string>(value: string): MockId<T> =>
  value as MockId<T>;

export const mockOrganisationId = (id: string) =>
  createMockId<'organisations'>(id);
export const mockUserId = (id: string) => createMockId<'users'>(id);
export const mockRoleId = (id: string) => createMockId<'user_roles'>(id);
