<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

## Table of contents

- [Password Management](#password-management)
  - [Options](#options)
  - [Best Practices](#best-practices)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Password Management

Admin-created users can be onboarded via email invitation (recommended) or temporary password.

## Options

- Email Invitation (default): user sets password via link
- Temporary Password: fallback; require change on first login

## Best Practices

- Prefer invitations to avoid sharing passwords
- Ensure Clerk email templates are configured
- Enforce complexity and length via Clerk

_See UI examples in `PASSWORD_MANAGEMENT_GUIDE.md` (now consolidated into this document)._
