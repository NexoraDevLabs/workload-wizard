import { createIdLoader } from "./createIdLoader";

// Create one loader factory per table you need to batch
export const makeLoaders = () => ({
  usersById: createIdLoader("users"),
  organisationsById: createIdLoader("organisations"),
  lecturerProfilesById: createIdLoader("lecturer_profiles"),
  moduleGroupsById: createIdLoader("module_groups"),
  moduleIterationsById: createIdLoader("module_iterations"),
  modulesById: createIdLoader("modules"),
  userRolesById: createIdLoader("user_roles"),
  academicYearsById: createIdLoader("academic_years"),
  coursesById: createIdLoader("courses"),
  courseYearsById: createIdLoader("course_years"),
});

export type Loaders = ReturnType<typeof makeLoaders>;
