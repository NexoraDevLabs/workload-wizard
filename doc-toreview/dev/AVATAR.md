<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

## Table of contents

- [Avatar Upload & Troubleshooting](#avatar-upload--troubleshooting)
  - [Overview](#overview)
  - [Backend (Convex)](#backend-convex)
  - [Troubleshooting](#troubleshooting)
  - [Security & Validation](#security--validation)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Avatar Upload & Troubleshooting

Consolidated guide for avatar upload, sync, and troubleshooting.

## Overview

- Upload to WorkOS via `user.setProfileImage()`
- Sync to Convex `users.pictureUrl`
- Audit each change in `audit_logs`

## Backend (Convex)

See `convex/users.ts` for `updateUserAvatar` mutation and `getUserAvatar` query.

## Troubleshooting

Common issues and fixes:

- Check browser console and Network tab for errors
- Validate file type (JPG/PNG/GIF/WebP) and size (<5MB)
- Re-authenticate (sign out/in), try another browser
- Verify WorkOS env keys in `.env.local`

If uploads keep failing, consider backend upload via WorkOS server SDK or client-side compression before upload.

## Security & Validation

- Enforce file type and size limits client-side
- Users can only update their own avatar
- Rate limit uploads (middleware-based)

_Last updated: January 2025_
