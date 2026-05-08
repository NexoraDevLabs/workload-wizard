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
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Building2, User, X } from 'lucide-react';

type JoinWaitlistProps = {
  /** Where this signup came from (stored server-side) */
  source?: string;
  /** Custom trigger – if provided, it will be used instead of the default button */
  trigger?: React.ReactNode;
  /** Text for the default trigger button */
  buttonText?: string;
  /** Props forwarded to the default trigger button */
  buttonProps?: React.ComponentProps<typeof Button>;
  /** Fired on a successful submit (new or already on list) */
  onSuccess?: () => void;
  /** Start open (useful if you want to open from a deep link) */
  initialOpen?: boolean;
};

export default function JoinWaitlist({
  source = 'landing',
  trigger,
  buttonText = 'Join Waitlist',
  buttonProps,
  onSuccess,
  initialOpen = false,
}: JoinWaitlistProps) {
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
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          name: `${firstName} ${lastName}`.trim(),
          source,
          organisation: organisation.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error('Request failed');
      const json = (await res.json()) as { already?: boolean };

      if (json?.already) {
        toast({
          title: "You're already on the waitlist",
          description: "We'll keep you posted.",
        });
      } else {
        toast({ title: "Thanks — we'll be in touch" });
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
              size="lg"
              className="btn-waitlist rounded-2xl px-6 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
              aria-label="Join the WorkloadWizard Waitlist"
              {...buttonProps}
            >
              {buttonText}
            </Button>
          )}
        </DialogTrigger>

        <DialogContent
          className="
              waitlist-dialog
              sm:max-w-md rounded-2xl p-6
              border border-white/10
              bg-gradient-to-br from-[#0f172a]/95 via-[#111827]/92 to-[#172033]/95
              backdrop-blur-xl shadow-2xl
              [&>button]:hidden
          "
        >
          <DialogHeader className="space-y-1.5">
          <DialogClose asChild>
            <button
              className={`
                absolute right-4 top-4
                flex h-8 w-8 items-center justify-center
                rounded-full
                border border-white/10
                bg-white/10
                text-white/70
                backdrop-blur-md
                transition-all
                hover:bg-white/20
                hover:text-white
              `}
            >
              <X className="h-4 w-4" />
            </button>
          </DialogClose>
            <DialogTitle className="text-2xl font-semibold text-white">
              Join the Waitlist
            </DialogTitle>
            <p className="text-sm text-white/60">
              Be the first to try{' '}
              <span className="text-white font-medium">WorkloadWizard</span>.
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
                    transition-colors
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
                {submitting ? 'Joining…' : 'Join waitlist'}
              </Button>
            </DialogFooter>

            <p className="text-xs text-white/50 text-center">
              By joining, you agree to be contacted about early access. No spam,
              unsubscribe anytime.
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
