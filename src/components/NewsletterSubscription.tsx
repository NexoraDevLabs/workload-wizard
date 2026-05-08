'use client';

import * as React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Building2, Mail, User, X } from 'lucide-react';

type NewsletterSubscriptionProps = {
  source?: string;
  trigger?: React.ReactNode;
  buttonText?: string;
  buttonProps?: React.ComponentProps<typeof Button>;
  onSuccess?: () => void;
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
      toast({
        title: 'Please enter your first name',
      });

      return;
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: 'Please enter a valid email',
      });

      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim() || undefined,
          source,
          organisation: organisation.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error('Request failed');
      }

      const json = (await res.json()) as {
        already?: boolean;
      };

      if (json?.already) {
        toast({
          title: "You're already subscribed",
          description: "We'll keep you updated with the latest news.",
        });
      } else {
        toast({
          title: "Thanks — you're now subscribed to updates",
        });
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
              aria-label="Subscribe to WorkloadWizard updates"
              className="
                rounded-full
                border border-white/10
                bg-white/[0.08]
                px-4 py-2 h-9
                text-white/80
                backdrop-blur-md
                transition-all
                hover:bg-white/[0.14]
                hover:text-white
              "
              {...buttonProps}
            >
              <Bell className="mr-2 h-4 w-4" />
              {buttonText}
            </Button>
          )}
        </DialogTrigger>

        <DialogContent
          className="
            newsletter-dialog
            sm:max-w-md
            rounded-2xl
            border border-white/10
            bg-gradient-to-br
            from-[#0f172a]/95
            via-[#111827]/92
            to-[#172033]/95
            p-6
            shadow-2xl
            backdrop-blur-xl
          "
        >
          <DialogClose asChild>
            <button
              aria-label="Close dialog"
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

          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-2xl font-semibold text-white">
              Subscribe to WorkloadWizard Updates
            </DialogTitle>

            <p className="text-sm text-white/60">
              Stay informed about{' '}
              <span className="font-medium text-white">
                WorkloadWizard
              </span>{' '}
              features and news.
            </p>
          </DialogHeader>

          <form onSubmit={onSubmit} className="mt-4 grid gap-4">
            <div className="grid gap-2">
              <Label
                htmlFor="newsletter-first-name"
                className="text-sm text-white/80"
              >
                First name
              </Label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />

                <Input
                  id="newsletter-first-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="
                    pl-9
                    rounded-xl
                    border border-white/15
                    bg-white/[0.06]
                    text-white
                    placeholder:text-white/40
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]
                    transition-colors
                    focus-visible:border-transparent
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-primary/50
                  "
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="newsletter-last-name"
                className="text-sm text-white/80"
              >
                Last name (optional)
              </Label>

              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />

                <Input
                  id="newsletter-last-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="
                    pl-9
                    rounded-xl
                    border border-white/15
                    bg-white/[0.06]
                    text-white
                    placeholder:text-white/40
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]
                    transition-colors
                    focus-visible:border-transparent
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-primary/50
                  "
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="newsletter-organisation"
                className="text-sm text-white/80"
              >
                Organisation (optional)
              </Label>

              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />

                <Input
                  id="newsletter-organisation"
                  value={organisation}
                  onChange={(e) => setOrganisation(e.target.value)}
                  className="
                    pl-9
                    rounded-xl
                    border border-white/15
                    bg-white/[0.06]
                    text-white
                    placeholder:text-white/40
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]
                    transition-colors
                    focus-visible:border-transparent
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-primary/50
                  "
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label
                htmlFor="newsletter-email"
                className="text-sm text-white/80"
              >
                Email
              </Label>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />

                <Input
                  id="newsletter-email"
                  type="email"
                  placeholder="name@university.ac.uk"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="
                    pl-9
                    rounded-xl
                    border border-white/15
                    bg-white/[0.06]
                    text-white
                    placeholder:text-white/40
                    shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]
                    transition-colors
                    focus-visible:border-transparent
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-primary/50
                  "
                />
              </div>
            </div>

            <DialogFooter className="mt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="
                  w-full
                  rounded-xl
                  bg-white
                  py-2.5
                  text-base
                  font-semibold
                  text-neutral-900
                  shadow-md
                  transition-all
                  hover:bg-neutral-100
                  hover:shadow-lg
                  disabled:cursor-not-allowed
                  disabled:opacity-70
                "
              >
                {submitting ? 'Subscribing…' : 'Subscribe'}
              </Button>
            </DialogFooter>

            <p className="text-center text-xs text-white/50">
              By subscribing, you agree to receive updates about
              WorkloadWizard. No spam, unsubscribe anytime.
            </p>
          </form>
        </DialogContent>
      </Dialog>

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
          -webkit-box-shadow:
            0 0 0px 1000px rgba(255, 255, 255, 0.06) inset !important;

          -webkit-text-fill-color: #fff !important;

          caret-color: #fff !important;

          transition: background-color 9999s ease-out 0s;
        }
      `}</style>
    </>
  );
}