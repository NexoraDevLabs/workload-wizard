import { Bell } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <section className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border bg-muted">
          <Bell className="h-6 w-6" aria-hidden="true" />
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          Notifications coming soon
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          This inbox will show workload updates, approvals, allocation changes,
          reminders and important organisation messages.
        </p>
      </section>
    </main>
  );
}