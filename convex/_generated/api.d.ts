/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as academicYears from '../academicYears.js';
import type * as allocations from '../allocations.js';
import type * as allocationsMath from '../allocationsMath.js';
import type * as audit from '../audit.js';
import type * as courses from '../courses.js';
import type * as csp from '../csp.js';
import type * as groups from '../groups.js';
import type * as modules from '../modules.js';
import type * as organisationSettings from '../organisationSettings.js';
import type * as organisationalRoles from '../organisationalRoles.js';
import type * as organisations from '../organisations.js';
import type * as permissions from '../permissions.js';
import type * as permissions_constants from '../permissions/constants.js';
import type * as permissions_guards from '../permissions/guards.js';
import type * as permissions_index from '../permissions/index.js';
import type * as permissions_mutations from '../permissions/mutations.js';
import type * as permissions_predicates from '../permissions/predicates.js';
import type * as permissions_queries from '../permissions/queries.js';
import type * as permissions_rules from '../permissions/rules.js';
import type * as permissions_types from '../permissions/types.js';
import type * as permissions_utils from '../permissions/utils.js';
import type * as quickAccess from '../quickAccess.js';
import type * as staff from '../staff.js';
import type * as users from '../users.js';
import type * as waitlist from '../waitlist.js';

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from 'convex/server';

declare const fullApi: ApiFromModules<{
  academicYears: typeof academicYears;
  allocations: typeof allocations;
  allocationsMath: typeof allocationsMath;
  audit: typeof audit;
  courses: typeof courses;
  csp: typeof csp;
  groups: typeof groups;
  modules: typeof modules;
  organisationSettings: typeof organisationSettings;
  organisationalRoles: typeof organisationalRoles;
  organisations: typeof organisations;
  permissions: typeof permissions;
  'permissions/constants': typeof permissions_constants;
  'permissions/guards': typeof permissions_guards;
  'permissions/index': typeof permissions_index;
  'permissions/mutations': typeof permissions_mutations;
  'permissions/predicates': typeof permissions_predicates;
  'permissions/queries': typeof permissions_queries;
  'permissions/rules': typeof permissions_rules;
  'permissions/types': typeof permissions_types;
  'permissions/utils': typeof permissions_utils;
  quickAccess: typeof quickAccess;
  staff: typeof staff;
  users: typeof users;
  waitlist: typeof waitlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'public'>
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'internal'>
>;

export declare const components: {};
