# Post-MVP Cleanup

- Replace compatibility login/password-reset placeholders with full WorkOS AuthKit routes.
- Add WorkOS webhook handling for user lifecycle events if product requirements need external identity sync.
- Remove legacy `subject` naming from Convex schema in favor of `authProviderUserId`.
- Revisit profile avatar upload flow and store avatars in app-owned storage.
- Tighten auth hook return types once the WorkOS session surface is final.
