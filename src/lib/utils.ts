import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ZodError } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type PublicMetadata = { role?: string; roles?: string[] } & Record<
  string,
  unknown
>;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Get user roles from Clerk metadata, supporting both single role and multiple roles
 */
export function getUserRoles(user: unknown): string[] {
  if (!isObject(user)) return [];
  const publicMetadata = user.publicMetadata as PublicMetadata | undefined;
  if (!publicMetadata) return [];

  if (Array.isArray(publicMetadata.roles)) {
    return publicMetadata.roles;
  }

  if (
    typeof publicMetadata.role === "string" &&
    publicMetadata.role.length > 0
  ) {
    return [publicMetadata.role];
  }

  return [];
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: unknown, roles: string[]): boolean {
  const userRoles = getUserRoles(user);
  return userRoles.some((role) => roles.includes(role));
}

/**
 * Check if user has all of the specified roles
 */
export function hasAllRoles(user: unknown, roles: string[]): boolean {
  const userRoles = getUserRoles(user);
  return roles.every((role) => userRoles.includes(role));
}

// Mutation helper: wraps async actions with success/error toasts
export async function withToast<T>(
  action: () => Promise<T>,
  options: {
    success?: { title: string; description?: string };
    error: { title: string; description?: string };
  },
  toast: (opts: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive" | "success";
  }) => any,
): Promise<T> {
  try {
    const result = await action();
    if (options.success) {
      toast({ ...options.success, variant: "success" });
    }
    return result;
  } catch (e) {
    const desc =
      friendlyErrorMessage(e) ?? options.error.description ?? undefined;
    toast({
      title: options.error.title,
      ...(desc ? { description: desc } : {}),
      variant: "destructive",
    });
    throw e;
  }
}

export function isZodError(error: unknown): error is ZodError {
  return (
    typeof error === "object" &&
    error !== null &&
    "issues" in (error as any) &&
    Array.isArray((error as any).issues)
  );
}

export function formatZodError(error: ZodError): string {
  const first = error.issues?.[0];
  if (!first) return "Validation failed";
  const path = first.path?.length ? String(first.path.join(".")) + ": " : "";
  return path + (first.message || "Invalid value");
}

export function errorMessageFromUnknown(error: unknown): string | undefined {
  if (isZodError(error)) return formatZodError(error);
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return undefined;
  }
}

// Extract a concise, user-friendly message from noisy server errors (e.g., Convex)
export function friendlyErrorMessage(error: unknown): string | undefined {
  const raw = errorMessageFromUnknown(error);
  if (!raw) return undefined;
  // Convex style: "... Server Error Uncaught Error: <msg> at handler ..."
  const uncaughtIdx = raw.indexOf("Uncaught Error:");
  if (uncaughtIdx >= 0) {
    let msg = raw.slice(uncaughtIdx + "Uncaught Error:".length).trim();
    // Cut only if it looks like a stack frame (avoid cutting phrases like "at most")
    const stackIdx = msg.search(/\s+at\s+(handler|\.{2}\/|\/|file:|https?:)/);
    if (stackIdx >= 0) msg = msg.slice(0, stackIdx).trim();
    return msg;
  }
  // Generic "Error: <msg>" pattern
  const errIdx = raw.indexOf("Error:");
  if (errIdx >= 0) {
    let msg = raw.slice(errIdx + "Error:".length).trim();
    const stackIdx = msg.search(/\s+at\s+(handler|\.{2}\/|\/|file:|https?:)/);
    if (stackIdx >= 0) msg = msg.slice(0, stackIdx).trim();
    return msg;
  }
  // If multi-line, prefer first non-bracketed, non-technical line
  const lines = raw
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const simple = lines.find((l) => !l.startsWith("[") && !l.includes(" at "));
  return simple || raw;
}

export function toastError(
  toast: (opts: {
    title?: string;
    description?: string;
    variant?: "default" | "destructive" | "success";
  }) => any,
  error: unknown,
  title: string = "Error",
): void {
  const desc = errorMessageFromUnknown(error);
  toast({
    title,
    ...(desc ? { description: desc } : {}),
    variant: "destructive",
  });
}
