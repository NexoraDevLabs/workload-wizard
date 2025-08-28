export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-08-19";

// Make Sanity optional at build time. If env vars are missing, we mark it disabled
// instead of throwing. Call sites should guard on `sanityEnabled`.
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "";
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
export const sanityEnabled = Boolean(dataset && projectId);
