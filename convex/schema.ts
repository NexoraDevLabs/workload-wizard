import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  // 🧠 Academic Year
  academic_years: defineTable({
    name: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    isActive: v.boolean(),
    staging: v.boolean(),
    organisationId: v.id('organisations'),
    status: v.union(
      v.literal('draft'),
      v.literal('published'),
      v.literal('archived')
    ),
    isDefaultForOrg: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index('by_organisation', ['organisationId']) // filter by org
    .index('by_org_status', ['organisationId', 'status']) // filter by org + status
    .index('by_status', ['status']), // sometimes filter by status alone

  // 🏛️ Organisation
  organisations: defineTable({
    name: v.string(),
    code: v.string(),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    domain: v.optional(v.string()),
    isActive: v.boolean(),
    status: v.string(), // 'active' | 'inactive' | 'suspended'
    website: v.optional(v.string()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }),

  // 👥 Users
  users: defineTable({
    email: v.string(),
    username: v.optional(v.string()),
    givenName: v.string(),
    familyName: v.string(),
    fullName: v.string(),
    systemRoles: v.array(v.string()), // ['sysadmin', 'developer'], etc.
    jobRole: v.optional(v.string()), // User's job role from onboarding
    department: v.optional(v.string()),
    phone: v.optional(v.string()),
    organisationId: v.id('organisations'),
    pictureUrl: v.optional(v.string()),
    subject: v.string(), // Clerk ID
    tokenIdentifier: v.optional(v.string()),
    isActive: v.boolean(),
    lastSignInAt: v.optional(v.float64()),
    onboardingCompleted: v.optional(v.boolean()),
    onboardingData: v.optional(
      v.object({
        jobRole: v.optional(v.string()),
        department: v.optional(v.string()),
        phone: v.optional(v.string()),
        preferences: v.optional(
          v.object({
            theme: v.optional(v.string()),
            notifications: v.optional(v.boolean()),
          })
        ),
      })
    ),
    onboardingCompletedAt: v.optional(v.float64()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index('by_subject', ['subject'])
    .index('by_email', ['email']),

  // 👤 User Preferences (per user per organisation)
  user_preferences: defineTable({
    userId: v.string(), // Clerk subject ID
    organisationId: v.id('organisations'),
    selectedAcademicYearId: v.optional(v.id('academic_years')),
    includeDrafts: v.optional(v.boolean()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index('by_user', ['userId']) // list all preferences for a user
    .index('by_user_org', ['userId', 'organisationId']), // upsert/keyed by pair

  // 👥 User ↔ Organisation memberships (supports multi-org membership)
  user_organisations: defineTable({
    userId: v.string(),
    organisationId: v.id('organisations'),
    isPrimary: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index('by_user', ['userId']) // list orgs for a user
    .index('by_org', ['organisationId']) // list users for an org
    .index('by_user_org', ['userId', 'organisationId']), // membership existence check

  // 📋 Audit Logs
  audit_logs: defineTable({
    action: v.string(), // 'create', 'update', 'delete', 'login', 'logout', 'permission_change', etc.
    entityType: v.string(), // 'user', 'organisation', 'module', 'academic_year', etc.
    entityId: v.string(), // ID of the affected entity
    entityName: v.optional(v.string()), // Human-readable name of the entity
    performedBy: v.string(), // User ID who performed the action
    performedByName: v.optional(v.string()), // Human-readable name of the user who performed the action
    organisationId: v.optional(v.id('organisations')), // Organisation context
    details: v.optional(v.string()), // Additional details about the action
    metadata: v.optional(v.string()), // JSON string for additional structured data
    ipAddress: v.optional(v.string()), // IP address of the request
    userAgent: v.optional(v.string()), // User agent of the request
    timestamp: v.float64(),
    severity: v.optional(v.string()), // 'info', 'warning', 'error', 'critical'
    type: v.optional(v.union(v.literal('sys'), v.literal('org'))), // scope of action
  }).index('by_timestamp', ['timestamp']),

  // 👤 User Profile
  user_profiles: defineTable({
    userId: v.string(),
    jobTitle: v.optional(v.string()),
    specialism: v.optional(v.string()),
    organisationId: v.id('organisations'),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }),

  // 🔐 Roles
  user_roles: defineTable({
    name: v.string(),
    description: v.string(),
    isDefault: v.boolean(),
    isSystem: v.boolean(),
    permissions: v.array(v.string()),
    organisationId: v.id('organisations'),
    isActive: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }),

  user_role_assignments: defineTable({
    userId: v.string(),
    roleId: v.id('user_roles'),
    organisationId: v.id('organisations'),
    assignedBy: v.string(),
    isActive: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_user_org', ['userId', 'organisationId']),

  // 📘 Courses
  courses: defineTable({
    code: v.string(),
    name: v.string(),
    organisationId: v.id('organisations'),
    leaderProfileId: v.optional(v.id('lecturer_profiles')),
    studentCount: v.optional(v.float64()),
    campuses: v.optional(v.array(v.string())),
    studentDistributionByCampus: v.optional(
      v.array(
        v.object({
          campus: v.string(),
          count: v.float64(),
        })
      )
    ),
    groupsInitialisedInAys: v.optional(v.array(v.id('academic_years'))),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_organisation', ['organisationId']),

  // 📘 Course Years (Y1/Y2/... for a course)
  course_years: defineTable({
    courseId: v.id('courses'),
    yearNumber: v.float64(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_course', ['courseId']),

  // 📚 Module Definitions
  modules: defineTable({
    code: v.string(),
    name: v.string(),
    credits: v.optional(v.number()),
    leaderProfileId: v.optional(v.id('lecturer_profiles')),
    level: v.optional(v.number()),
    teachingHours: v.optional(v.number()),
    markingHours: v.optional(v.number()),
    campuses: v.optional(v.array(v.string())),
    organisationId: v.id('organisations'),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_organisation', ['organisationId']),

  // 🔗 Course Year <> Module links (junction table)
  course_year_modules: defineTable({
    courseYearId: v.id('course_years'),
    moduleId: v.id('modules'),
    isCore: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index('by_course_year', ['courseYearId']) // list modules for a course year
    .index('by_module', ['moduleId']) // list years using a module
    .index('by_course_year_module', ['courseYearId', 'moduleId']), // enforce uniqueness in code

  // 🎓 Module Iterations
  module_iterations: defineTable({
    moduleId: v.id('modules'),
    academicYearId: v.id('academic_years'),
    totalHours: v.float64(),
    weeks: v.array(v.number()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index('by_module', ['moduleId']) // list iterations for a module
    .index('by_year', ['academicYearId']) // list iterations for a year
    .index('by_module_year', ['moduleId', 'academicYearId']), // enforce uniqueness in code

  // 👥 Module Groups (under a specific module iteration)
  module_groups: defineTable({
    moduleIterationId: v.id('module_iterations'),
    name: v.string(),
    sizePlanned: v.optional(v.float64()),
    campusId: v.optional(v.string()),
    dayOfWeek: v.optional(v.string()),
    weekPattern: v.optional(v.string()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_iteration', ['moduleIterationId']),

  // 👨‍🏫 Lecturer Profiles
  lecturer_profiles: defineTable({
    fullName: v.string(),
    email: v.string(),
    contract: v.string(), // 'FT', 'PT', 'Bank'
    fte: v.float64(),
    maxTeachingHours: v.float64(),
    totalContract: v.float64(),
    userSubject: v.optional(v.string()), // Optional link to Clerk subject / users.subject
    role: v.optional(v.string()),
    teamName: v.optional(v.string()),
    contractFamily: v.optional(v.string()),
    prefWorkingLocation: v.optional(v.string()),
    prefWorkingTime: v.optional(
      v.union(v.literal('am'), v.literal('pm'), v.literal('all_day'))
    ),
    prefSpecialism: v.optional(v.string()),
    prefNotes: v.optional(v.string()),
    organisationId: v.id('organisations'),
    isActive: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_organisation', ['organisationId']),

  // 🧑‍🏫 Lecturer Instances
  lecturers: defineTable({
    profileId: v.id('lecturer_profiles'),
    academicYearId: v.id('academic_years'),
    teamId: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }),

  // 👥 Group Allocations (lecturer ↔ group for AY)
  group_allocations: defineTable({
    groupId: v.id('module_groups'),
    lecturerId: v.id('lecturer_profiles'),
    academicYearId: v.id('academic_years'),
    organisationId: v.id('organisations'),
    type: v.union(v.literal('teaching'), v.literal('admin')),
    hoursComputed: v.float64(),
    hoursOverride: v.optional(v.float64()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index('by_group', ['groupId']) // list allocations for a group
    .index('by_lecturer', ['lecturerId']) // list allocations for a lecturer
    .index('by_year', ['academicYearId']) // list allocations for a year
    .index('by_org_year', ['organisationId', 'academicYearId']),

  // 🧮 Module Allocations
  module_allocations: defineTable({
    staffId: v.string(),
    moduleIterationId: v.id('module_iterations'),
    type: v.string(), // 'teaching' | 'admin'
    hours: v.float64(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }),

  // 🏢 Admin Allocations
  admin_allocations: defineTable({
    staffId: v.string(),
    categoryId: v.string(),
    hours: v.float64(),
    academicYearId: v.id('academic_years'),
    // Custom per-lecturer options
    isCustom: v.optional(v.boolean()),
    customLabel: v.optional(v.string()),
    comment: v.optional(v.string()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_year', ['academicYearId']),

  admin_allocation_categories: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    isDefault: v.boolean(),
    minHours: v.optional(v.float64()),
    maxHours: v.optional(v.float64()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }),

  // 🏢 Organisation-specific Admin Allocation Categories (copied from system defaults at org creation)
  organisation_admin_allocation_categories: defineTable({
    organisationId: v.id('organisations'),
    name: v.string(),
    description: v.optional(v.string()),
    minHours: v.optional(v.float64()),
    maxHours: v.optional(v.float64()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_organisation', ['organisationId']),

  // 🏢 Organisation Settings (per-organisation configurable options)
  organisation_settings: defineTable({
    organisationId: v.id('organisations'),
    staffRoleOptions: v.array(v.string()),
    teamOptions: v.array(v.string()),
    campusOptions: v.optional(v.array(v.string())),
    maxClassSizePerGroup: v.optional(v.float64()),
    baseMaxTeachingAtFTE1: v.float64(),
    baseTotalContractAtFTE1: v.float64(),
    // Optional mapping to derive default module hours from credits
    moduleHoursByCredits: v.optional(
      v.array(
        v.object({
          credits: v.number(),
          teaching: v.number(),
          marking: v.number(),
        })
      )
    ),
    roleMaxTeachingRules: v.optional(
      v.array(
        v.object({
          role: v.string(),
          mode: v.union(v.literal('percent'), v.literal('fixed')),
          value: v.float64(),
        })
      )
    ),
    contractFamilyOptions: v.optional(v.array(v.string())),
    familyMaxTeachingRules: v.optional(
      v.array(
        v.object({
          family: v.string(),
          mode: v.union(v.literal('percent'), v.literal('fixed')),
          value: v.float64(),
        })
      )
    ),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_organisation', ['organisationId']),

  // 🔐 System Permissions Registry
  system_permissions: defineTable({
    id: v.string(), // e.g. 'staff.create', 'users.invite'
    group: v.string(), // e.g. 'staff', 'users', 'modules'
    description: v.string(),
    defaultRoles: v.array(v.string()), // Array of role names that get this permission by default
    isActive: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_permission_id', ['id']),

  // 🧩 System Role Templates (used as defaults when creating organisations)
  system_role_templates: defineTable({
    name: v.string(), // e.g. 'Admin', 'Manager'
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_name', ['name']),

  // 🏢 Organisation Roles
  organisation_roles: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    organisationId: v.id('organisations'),
    isDefault: v.boolean(), // Whether this is a default role for the org
    isActive: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_organisation', ['organisationId']),

  // 🔗 Organisation Role Permissions (Junction Table)
  // NOTE: We use `user_roles` as the single source of truth for org-scoped roles.
  organisation_role_permissions: defineTable({
    organisationId: v.id('organisations'),
    roleId: v.id('user_roles'),
    permissionId: v.string(), // FK to system_permissions.id
    isGranted: v.boolean(), // true = granted, false = explicitly denied
    isOverride: v.boolean(), // Whether this overrides the system default
    staged: v.optional(v.boolean()), // When true, represents a staged change not yet applied
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index('by_role', ['roleId'])
    .index('by_role_permission', ['roleId', 'permissionId'])
    .index('by_organisation', ['organisationId']),

  // 🧪 Early Access Features (Admin-managed metadata)
  feature_flags: defineTable({
    key: v.string(), // Statsig gate key
    name: v.string(),
    description: v.optional(v.string()),
    stage: v.union(
      v.literal('draft'),
      v.literal('alpha'),
      v.literal('beta'),
      v.literal('concept')
    ),
    isActive: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_key', ['key']),

  // 🧪 Per-user feature enrollments (drives Statsig user custom props)
  feature_enrollments: defineTable({
    userId: v.string(), // Clerk subject
    featureKey: v.string(), // matches feature_flags.key / Statsig gate key
    enabled: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  })
    .index('by_user', ['userId']) // list all for user
    .index('by_user_key', ['userId', 'featureKey']), // upsert key

  // ⭐ Per-user Quick Access preferences
  quick_access_prefs: defineTable({
    userId: v.string(), // Clerk subject
    links: v.array(v.object({ name: v.string(), url: v.string() })),
    showNames: v.boolean(),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_user', ['userId']),

  // 📩 Waitlist signups (for quick de-dupe before hitting external services)
  waitlist_signups: defineTable({
    email: v.string(), // store lower-cased
    name: v.optional(v.string()),
    organisation: v.optional(v.string()),
    source: v.optional(v.string()),
    createdAt: v.float64(),
    updatedAt: v.float64(),
  }).index('by_email', ['email']),

  // 🛡️ CSP Violation Reports
  csp_reports: defineTable({
    timestamp: v.float64(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    effectiveDirective: v.string(), // The directive that was violated
    violatedDirective: v.string(), // The specific directive that was violated
    blockedURI: v.optional(v.string()), // The URI that was blocked
    documentURI: v.optional(v.string()), // The document where the violation occurred
    referrer: v.optional(v.string()),
    sourceFile: v.optional(v.string()),
    lineNumber: v.optional(v.number()),
    columnNumber: v.optional(v.number()),
    scriptSample: v.optional(v.string()),
    disposition: v.optional(v.string()), // 'enforce' or 'report'
    originalPolicy: v.optional(v.string()), // The original CSP policy
    organisationId: v.optional(v.id('organisations')), // Organisation context if available
    userId: v.optional(v.string()), // User ID if available
    createdAt: v.float64(),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_directive', ['effectiveDirective'])
    .index('by_blocked_uri', ['blockedURI'])
    .index('by_organisation', ['organisationId'])
    .index('by_user', ['userId']),
});
