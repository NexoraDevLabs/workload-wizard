import { mutation, query } from './_generated/server';
import { v } from 'convex/values';
import { requireOrgPermission } from './permissions';
import { writeAudit } from './audit';
import { getAuthContext } from './lib/auth';

// List courses for an organisation
export const listByOrganisation = query({
  args: { userId: v.string(), organisationId: v.id('organisations') },
  handler: async (ctx, args) => {
    // Only allow listing courses in your own organisation (or system roles)
    const authContext = await getAuthContext(ctx, args);
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', authContext.userId))
      .first();
    if (!actor) return [];
    await requireOrgPermission(
      ctx,
      authContext.userId,
      'courses.view',
      args.organisationId
    );
    const courses = await ctx.db
      .query('courses')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', args.organisationId)
      )
      .order('asc')
      .collect();
    return courses;
  },
});

// List courses for the authenticated actor's organisation (no args)
export const listForActor = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', authContext.userId))
      .first();
    if (!actor) return [];
    await requireOrgPermission(
      ctx,
      authContext.userId,
      'courses.view',
      authContext.organisationId
    );
    const courses = await ctx.db
      .query('courses')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', authContext.organisationId)
      )
      .order('asc')
      .collect();
    return courses;
  },
});

// Get a single course
export const getById = query({
  args: { id: v.id('courses') },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.id);
    return course;
  },
});

// Create a new course in the actor's organisation
export const create = mutation({
  args: {
    userId: v.string(),
    code: v.string(),
    name: v.string(),
    leaderProfileId: v.optional(v.id('lecturer_profiles')),
    studentCount: v.optional(v.number()),
    campuses: v.optional(v.array(v.string())),
    studentDistributionByCampus: v.optional(
      v.array(v.object({ campus: v.string(), count: v.number() }))
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const authContext = await getAuthContext(ctx, args);

    // derive organisation from actor
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', authContext.userId))
      .first();
    if (!actor) throw new Error('User not found');

    await requireOrgPermission(
      ctx,
      authContext.userId,
      'courses.create',
      authContext.organisationId
    );

    // Check uniqueness of code within organisation
    const existing = await ctx.db
      .query('courses')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', authContext.organisationId)
      )
      .filter((q) => q.eq(q.field('code'), args.code))
      .first();
    if (existing) {
      throw new Error('Course code already exists in this organisation');
    }

    const id = await ctx.db.insert('courses', {
      code: args.code,
      name: args.name,
      organisationId: authContext.organisationId,
      ...(args.leaderProfileId
        ? { leaderProfileId: args.leaderProfileId }
        : {}),
      ...(typeof args.studentCount === 'number'
        ? { studentCount: args.studentCount }
        : {}),
      ...(args.campuses && args.campuses.length > 0
        ? { campuses: args.campuses }
        : {}),
      ...(args.studentDistributionByCampus
        ? { studentDistributionByCampus: args.studentDistributionByCampus }
        : {}),
      createdAt: now,
      updatedAt: now,
    });

    try {
      await writeAudit(ctx, {
        action: 'create',
        entityType: 'course',
        entityId: String(id),
        entityName: `${args.code} ${args.name}`,
        performedBy: authContext.userId,
        organisationId: authContext.organisationId,
        details: `Course created (${args.code})`,
        severity: 'info',
        type: 'org',
      });
    } catch (e) {
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Error writing audit for course creation:', e);
    }

    return id;
  },
});

// Update course
export const update = mutation({
  args: {
    userId: v.string(),
    id: v.id('courses'),
    code: v.string(),
    name: v.string(),
    leaderProfileId: v.optional(v.id('lecturer_profiles')),
    studentCount: v.optional(v.number()),
    campuses: v.optional(v.array(v.string())),
    studentDistributionByCampus: v.optional(
      v.array(v.object({ campus: v.string(), count: v.number() }))
    ),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const course = await ctx.db.get(args.id);
    if (!course) throw new Error('Course not found');

    await requireOrgPermission(
      ctx,
      authContext.userId,
      'courses.edit',
      course.organisationId
    );

    // Uniqueness: prevent duplicate codes within the same organisation if code changed
    if (args.code !== course.code) {
      const conflict = await ctx.db
        .query('courses')
        .withIndex('by_organisation', (q) =>
          q.eq('organisationId', course.organisationId)
        )
        .filter((q) => q.eq(q.field('code'), args.code))
        .first();
      if (conflict && String(conflict._id) !== String(args.id)) {
        throw new Error('Course code already exists in this organisation');
      }
    }

    const now = Date.now();
    const updates: Record<string, unknown> = {
      code: args.code,
      name: args.name,
      updatedAt: now,
    };
    if ('leaderProfileId' in args)
      updates.leaderProfileId = args.leaderProfileId;
    if ('studentCount' in args) updates.studentCount = args.studentCount;
    if ('campuses' in args) updates.campuses = args.campuses;
    if ('studentDistributionByCampus' in args)
      updates.studentDistributionByCampus = args.studentDistributionByCampus;
    await ctx.db.patch(args.id, updates);

    try {
      await writeAudit(ctx, {
        action: 'update',
        entityType: 'course',
        entityId: String(args.id),
        entityName: `${args.code} ${args.name}`,
        performedBy: authContext.userId,
        organisationId: course.organisationId,
        details: `Course updated (${args.code})`,
        severity: 'info',
        type: 'org',
      });
    } catch (e) {
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Error writing audit for course update:', e);
    }

    return args.id;
  },
});

// Delete course
export const remove = mutation({
  args: { userId: v.string(), id: v.id('courses') },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const existing = await ctx.db.get(args.id);
    if (!existing) return args.id;

    await requireOrgPermission(
      ctx,
      authContext.userId,
      'courses.delete',
      existing.organisationId
    );

    await ctx.db.delete(args.id);

    try {
      await writeAudit(ctx, {
        action: 'delete',
        entityType: 'course',
        entityId: String(args.id),
        entityName: existing.name,
        performedBy: authContext.userId,
        organisationId: existing.organisationId,
        details: `Course deleted (${existing.code})`,
        severity: 'warning',
        type: 'org',
      });
    } catch (e) {
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Error writing audit for course deletion:', e);
    }

    return args.id;
  },
});

// ===== Course Years =====

// List years for a course
export const listYears = query({
  args: { userId: v.string(), courseId: v.id('courses') },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return [];
    // Permission: courses.view (same org as course)
    const authContext = await getAuthContext(ctx, args);
    await requireOrgPermission(
      ctx,
      authContext.userId,
      'courses.view',
      course.organisationId
    );
    const years = await ctx.db
      .query('course_years')
      .withIndex('by_course', (q) => q.eq('courseId', args.courseId))
      .order('asc')
      .collect();
    return years;
  },
});

// Check if a course code is available within the actor's organisation
export const isCodeAvailable = query({
  args: { userId: v.string(), code: v.string(), excludeId: v.optional(v.id('courses')) },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);

    // Derive organisation from actor
    const actor = await ctx.db
      .query('users')
      .withIndex('by_subject', (q) => q.eq('subject', authContext.userId))
      .first();
    if (!actor) return { available: false };

    const existing = await ctx.db
      .query('courses')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', authContext.organisationId)
      )
      .filter((q) => q.eq(q.field('code'), args.code))
      .first();

    if (!existing) return { available: true };
    if (args.excludeId && String(existing._id) === String(args.excludeId)) {
      return { available: true };
    }
    return { available: false };
  },
});

// Add a year to a course
export const addYear = mutation({
  args: { userId: v.string(), courseId: v.id('courses'), yearNumber: v.number() },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error('Course not found');

    await requireOrgPermission(
      ctx,
      authContext.userId,
      'courses.years.add',
      course.organisationId
    );

    // Ensure unique yearNumber per course
    const exists = await ctx.db
      .query('course_years')
      .withIndex('by_course', (q) => q.eq('courseId', args.courseId))
      .filter((q) => q.eq(q.field('yearNumber'), args.yearNumber))
      .first();
    if (exists) throw new Error('Year already exists for this course');

    const now = Date.now();
    const id = await ctx.db.insert('course_years', {
      courseId: args.courseId,
      yearNumber: args.yearNumber,
      createdAt: now,
      updatedAt: now,
    });

    try {
      await writeAudit(ctx, {
        action: 'create',
        entityType: 'course_year',
        entityId: String(id),
        entityName: `${course.code} Y${args.yearNumber}`,
        performedBy: authContext.userId,
        organisationId: course.organisationId,
        details: `Year ${args.yearNumber} added to course ${course.code}`,
        severity: 'info',
        type: 'org',
      });
    } catch (e) {
      // Note: Using console.error here as this is server-side Convex code
      // eslint-disable-next-line no-console
      console.error('Error writing audit for course year creation:', e);
    }

    return id;
  },
});

// Initialise recommended groups for a course in a specific AY based on org maxClassSizePerGroup.
// Creates N groups per module iteration campus split is not yet module-aware; this is per-course/year helper.
export const initialiseRecommendedGroups = mutation({
  args: {
    userId: v.string(),
    courseId: v.id('courses'),
    academicYearId: v.id('academic_years'),
  },
  handler: async (ctx, args) => {
    const authContext = await getAuthContext(ctx, args);
    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error('Course not found');

    await requireOrgPermission(
      ctx,
      authContext.userId,
      'groups.create',
      course.organisationId
    );

    // Guard: only once per AY
    const already = Array.isArray(course.groupsInitialisedInAys)
      ? course.groupsInitialisedInAys.includes(args.academicYearId)
      : false;
    if (already) return { created: 0, skipped: true };

    // Settings
    const settings = await ctx.db
      .query('organisation_settings')
      .withIndex('by_organisation', (q) =>
        q.eq('organisationId', course.organisationId)
      )
      .first();
    const maxSize = settings?.maxClassSizePerGroup || 25;

    // Compute per campus recommended counts
    const dist: Array<{ campus: string; count: number }> =
      course.studentDistributionByCampus || [];
    if (dist.length === 0 && typeof course.studentCount === 'number') {
      dist.push({ campus: 'Main Campus', count: course.studentCount });
    }

    // Create a placeholder course-level grouping record by creating module_groups under a virtual iteration is out of scope here.
    // For now we just record that the course has been initialised to prevent repeats.
    await ctx.db.patch(args.courseId, {
      groupsInitialisedInAys: [
        ...(course.groupsInitialisedInAys || []),
        args.academicYearId,
      ],
      updatedAt: Date.now(),
    });

    // Return recommended numbers for client to display
    const recommended = dist.map((d) => ({
      campus: d.campus,
      groups: Math.ceil((d.count || 0) / maxSize),
    }));
    return { created: 0, recommended };
  },
});
