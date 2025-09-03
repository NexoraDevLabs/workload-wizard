'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Building2, User, Bell } from 'lucide-react';

type NewsletterSubscriptionProps = {
  /** Where this signup came from (stored server-side) */
  source?: string;
  /** Custom trigger – if provided, it will be used instead of the default button */
  trigger?: React.ReactNode;
  /** Text for the default trigger button */
  buttonText?: string;
  /** Props forwarded to the default trigger button */
  buttonProps?: React.ComponentProps<typeof Button>;
  /** Fired on a successful submit (new or already subscribed) */
  onSuccess?: () => void;
  /** Start open (useful if you want to open from a deep link) */
  initialOpen?: boolean;
};

export default function NewsletterSubscription({
  source = 'header',
  trigger,
  buttonText = 'Subscribe to updates',
  buttonProps,
  onSuccess,
  initialOpen = false,
}: NewsletterSubscriptionProps) {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(initialOpen);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [organisation, setOrganisation] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!firstName.trim()) {
      toast({ title: 'Please enter your first name' });
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Please enter a valid email' });
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          firstName: firstName.trim(),
          lastName: lastName?.trim() || undefined,
          source,
          organisation: organisation?.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      const json = (await res.json()) as { already?: boolean };

      if (json?.already) {
        toast({
          title: "You're already subscribed",
          description: "We'll keep you updated with the latest news.",
        });
      } else {
        toast({ title: "Thanks — you're now subscribed to updates" });
      }

      setFirstName('');
      setLastName('');
      setOrganisation('');
      setEmail('');
      setOpen(false);
      onSuccess?.();
    } catch {
      toast({
        title: 'Something went wrong',
        description: 'Please try again later',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger ?? (
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:text-white hover:bg-white/10 rounded-full px-4 py-2 h-8"
              aria-label="Subscribe to WorkloadWizard updates"
              {...buttonProps}
            >
              <Bell className="w-4 h-4 mr-2" />
              {buttonText}
            </Button>
          )}
        </DialogTrigger>

        <DialogContent
          className="
            sm:max-w-md rounded-2xl p-6
            border border-white/10
            bg-gradient-to-br from-neutral-900/75 via-neutral-900/70 to-neutral-900/70
            backdrop-blur-xl shadow-2xl
          "
        >
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-2xl font-semibold text-white">
              Subscribe to Blog Updates
            </DialogTitle>
            <p className="text-sm text-white/60">
              Stay informed about{' '}
              <span className="text-white font-medium">WorkloadWizard</span>{' '}
              features and news.
            </p>
          </DialogHeader>

          <form onSubmit={onSubmit} className="mt-4 grid gap-4">
            {/* First name */}
            <div className="grid gap-2">
              <Label htmlFor="firstName" className="text-sm text-white/80">
                First name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="
                    pl-9 rounded-xl bg-white/[0.06] border border-white/15
                    text-white placeholder:text-white/40
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-transparent
                    transition-colors
                  "
                />
              </div>
            </div>

            {/* Last name */}
            <div className="grid gap-2">
              <Label htmlFor="lastName" className="text-sm text-white/80">
                Last name (optional)
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="
                    pl-9 rounded-xl bg-white/[0.06] border border-white/15
                    text-white placeholder:text-white/40
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-transparent
                  "
                />
              </div>
            </div>

            {/* Organisation */}
            <div className="grid gap-2">
              <Label htmlFor="organisation" className="text-sm text-white/80">
                Organisation (optional)
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="organisation"
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  className="
                    pl-9 rounded-xl bg-white/[0.06] border border-white/15
                    text-white placeholder:text-white/40
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-transparent
                  "
                />
              </div>
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-sm text-white/80">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@university.ac.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="
                    pl-9 rounded-xl bg-white/[0.06] border border-white/15
                    text-white placeholder:text-white/40
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-transparent
                  "
                />
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="
                  w-full rounded-xl py-2.5 text-base font-medium
                  shadow-md hover:shadow-lg
                  bg-white text-neutral-900 hover:bg-neutral-100
                  disabled:opacity-70 disabled:cursor-not-allowed
                  transition-all
                "
              >
                {submitting ? 'Subscribing…' : 'Subscribe'}
              </Button>
            </DialogFooter>

            <p className="text-xs text-white/50 text-center">
              By subscribing, you agree to receive updates about WorkloadWizard.
              No spam, unsubscribe anytime.
            </p>
          </form>
        </DialogContent>
      </Dialog>

      {/* Darker overlay & autofill clean-up */}
      <style jsx global>{`
        .fixed.inset-0[data-state='open'] {
          background: rgba(2, 6, 23, 0.55);
        }
        input:focus {
          outline: none;
        }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.06) inset !important;
          -webkit-text-fill-color: #fff !important;
          caret-color: #fff !important;
          transition: background-color 9999s ease-out 0s;
        }
      `}</style>
    </>
  );
}
