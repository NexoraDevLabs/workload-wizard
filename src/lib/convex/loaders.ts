import { createIdLoader } from './createIdLoader';

export const makeLoaders = () => ({
  usersById: createIdLoader('users'),
  orgsById: createIdLoader('organisations'),
  modulesById: createIdLoader('modules'),
  groupsById: createIdLoader('module_groups'),
  lecturersById: createIdLoader('lecturer_profiles'),
  allocationsById: createIdLoader('group_allocations'),
  rolesById: createIdLoader('user_roles'),
  iterationsById: createIdLoader('module_iterations'),
  // add other tables here as needed
});

export type Loaders = ReturnType<typeof makeLoaders>;
