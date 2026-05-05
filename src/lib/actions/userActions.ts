/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, no-empty */
'use server';

import { randomBytes } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import type { Id } from '@/convex/_generated/dataModel';
import { sendUserInvitationEmail } from '@/lib/services/emailService';
import { can, hasRole } from '@/lib/auth/permissions';
import { getAuthUser } from '@/lib/authz';
import {
  logUserCreated,
  logUserDeleted,
  logUserUpdated,
  logUserDeactivated,
  logUserReactivated,
} from './auditActions';

let convexClient: ConvexHttpClient | null = null;

function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL not configured');
    convexClient = new ConvexHttpClient(url);
  }
  return convexClient;
}

export interface CreateUserData {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  roles: string[];
  organisationId?: string;
  sendEmailInvitation?: boolean;
  organisationalRoleId?: string;
  organisationalRoleIds?: string[];
}

function toUserRow(user: any) {
  return {
    id: user.subject,
    subject: user.subject,
    email: user.email,
    username: user.username,
    firstName: user.givenName,
    lastName: user.familyName,
    roles: user.systemRoles,
    organisationId: user.organisationId,
    createdAt: user.createdAt,
    lastSignInAt: user.lastSignInAt || null,
    isActive: user.isActive,
    organisation: user.organisation,
  };
}

async function requireUserAdmin() {
  const authUser = await getAuthUser();
  if (!can(authUser, 'users.admin')) {
    throw new Error('Unauthorised: Admin access required');
  }
  return authUser;
}

export async function createUser(data: CreateUserData) {
  const authUser = await requireUserAdmin();
  const isOrgAdmin = hasRole(authUser, 'org_admin');

  let organisationId = data.organisationId as Id<'organisations'> | undefined;
  if (isOrgAdmin) {
    if (!authUser.orgId) {
      throw new Error('Unauthorised: User must be assigned to an organisation');
    }
    if (organisationId && organisationId !== authUser.orgId) {
      throw new Error(
        'Unauthorised: Can only create users in your own organisation'
      );
    }
    organisationId = authUser.orgId as Id<'organisations'>;
  }

  if (!organisationId) {
    const organisations = await getConvexClient().query(api.organisations.list);
    if ((organisations?.length || 0) === 0) {
      throw new Error(
        'No organisations found in Convex. Please create an organisation first.'
      );
    }
    organisationId = organisations[0]!._id;
  }

  const existingUsers = await getConvexClient().query(api.users.list, {
    organisationId,
  });
  const existing = existingUsers.find((user: any) => user.email === data.email);
  if (existing) {
    return {
      success: true,
      userId: existing.subject,
      message: 'User already exists',
    };
  }

  const password =
    data.password || `${randomBytes(12).toString('base64url')}!1aA`;
  const subject = `db_${randomBytes(16).toString('hex')}`;

  await getConvexClient().mutation(api.users.create, {
    email: data.email,
    username: data.username || '',
    givenName: data.firstName,
    familyName: data.lastName,
    fullName: `${data.firstName} ${data.lastName}`,
    systemRoles: data.roles,
    organisationId,
    subject,
    tokenIdentifier: `db:${subject}`,
    userId: authUser.id,
  });

  let emailSent = false;
  if (data.sendEmailInvitation !== false) {
    try {
      const emailResult = await sendUserInvitationEmail({
        to: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        temporaryPassword: password,
        signInUrl:
          process.env.NEXT_PUBLIC_APP_URL || 'https://workload-wiz.xyz/sign-in',
        adminName: authUser.email ?? authUser.id,
      });
      emailSent = emailResult.success;
    } catch {}
  }

  const roleIds =
    data.organisationalRoleIds ??
    (data.organisationalRoleId ? [data.organisationalRoleId] : []);
  if (roleIds.length > 0) {
    try {
      await getConvexClient().mutation(
        api.organisationalRoles.assignMultipleToUser,
        {
          userId: subject,
          roleIds: roleIds.map((roleId) => roleId as Id<'user_roles'>),
          assignedBy: authUser.id,
        }
      );
    } catch {}
  }

  await logUserCreated(
    subject,
    data.email,
    `User created with roles: ${data.roles.join(', ') || 'none'}, organisation: ${organisationId}, email invitation: ${emailSent ? 'sent via Resend' : 'not sent'}`
  );

  revalidatePath('/admin/users');
  return {
    success: true,
    userId: subject,
    message: emailSent
      ? 'User created and invitation email sent'
      : 'User created',
    emailSent,
    temporaryPassword:
      data.sendEmailInvitation === false ? password : undefined,
  };
}

export async function listUsers() {
  const authUser = await getAuthUser();
  if (!can(authUser, 'users.list')) {
    throw new Error('Unauthorised: Admin access required');
  }
  const convexUsers = await getConvexClient().query(api.users.list, {});
  return convexUsers.map(toUserRow);
}

export async function deleteUser(userId: string) {
  const authUser = await getAuthUser();
  if (!can(authUser, 'users.delete')) {
    throw new Error('Unauthorised: Admin access required');
  }
  const existing = await getConvexClient().query(api.users.getBySubject, {
    subject: userId,
  });
  await getConvexClient().mutation(api.users.remove, { userId });
  await logUserDeleted(
    userId,
    existing?.email ?? 'unknown',
    `User deleted by admin: ${authUser.email ?? authUser.id}`
  );
  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateUser(
  userId: string,
  updates: {
    email?: string;
    firstName?: string;
    lastName?: string;
    roles?: string[];
    organisationId?: string;
    isActive?: boolean;
    password?: string;
    organisationalRoleId?: string;
  }
) {
  const authUser = await requireUserAdmin();
  const existing = await getConvexClient().query(api.users.getBySubject, {
    subject: userId,
  });
  if (!existing) throw new Error('User not found');

  if (
    hasRole(authUser, 'org_admin') &&
    existing.organisationId !== authUser.orgId
  ) {
    throw new Error(
      'Unauthorised: Can only update users in your own organisation'
    );
  }

  await getConvexClient().mutation(api.users.update, {
    id: existing._id as Id<'users'>,
    ...(updates.email ? { email: updates.email } : {}),
    ...(updates.firstName ? { givenName: updates.firstName } : {}),
    ...(updates.lastName ? { familyName: updates.lastName } : {}),
    ...(updates.firstName && updates.lastName
      ? { fullName: `${updates.firstName} ${updates.lastName}` }
      : {}),
    ...(updates.roles ? { systemRoles: updates.roles } : {}),
    ...(updates.organisationId
      ? { organisationId: updates.organisationId as Id<'organisations'> }
      : {}),
    ...(updates.isActive !== undefined ? { isActive: updates.isActive } : {}),
    currentUserId: authUser.id,
  });

  await logUserUpdated(
    userId,
    updates.email ?? existing.email ?? 'unknown',
    updates,
    'User updated'
  );
  revalidatePath('/admin/users');
  return { success: true };
}

export async function getUsersByOrganisationId(organisationId: string) {
  const authUser = await getAuthUser();
  if (!can(authUser, 'users.list')) {
    throw new Error('Unauthorised: Admin access required');
  }
  const users = await getConvexClient().query(api.users.listByOrganisation, {
    organisationId: organisationId as Id<'organisations'>,
  });
  return users.map(toUserRow);
}

export async function deactivateUser(userId: string) {
  await updateUser(userId, { isActive: false });
  await logUserDeactivated(userId, 'unknown', 'User deactivated');
  return { success: true };
}

export async function reactivateUser(userId: string) {
  await updateUser(userId, { isActive: true });
  await logUserReactivated(userId, 'unknown', 'User reactivated');
  return { success: true };
}

export async function updateLastSignInForCurrentUser() {
  const authUser = await getAuthUser();
  await getConvexClient().mutation(api.users.updateLastSignIn, {
    userId: authUser.id,
  });
  return { success: true };
}

export async function getUsersByOrganisationIdWithOverride(
  organisationId: string
) {
  return getUsersByOrganisationId(organisationId);
}

export async function getAllUsersByOrganisationIdWithOverride(
  organisationId: string
) {
  const authUser = await getAuthUser();
  if (!can(authUser, 'users.list')) {
    throw new Error('Unauthorised: Admin access required');
  }
  const users = await getConvexClient().query(api.users.listAllByOrganisation, {
    organisationId: organisationId as Id<'organisations'>,
  });
  return users.map(toUserRow);
}

export async function getAllOrganisations() {
  await getAuthUser();
  return getConvexClient().query(api.organisations.list);
}
