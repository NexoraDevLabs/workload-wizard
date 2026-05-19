'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';

import { sendPasswordResetEmail } from '@/app/account/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

type PasswordResetState = {
  success: boolean;
  error: string | null;
};

type PasswordResetModalProps = {
  email: string;
};

const initialState: PasswordResetState = {
  success: false,
  error: null,
};

export function PasswordResetModal({ email }: PasswordResetModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const hasShownToastRef = useRef(false);

  const [state, formAction, isPending] = useActionState(
    sendPasswordResetEmail,
    initialState
  );

  useEffect(() => {
    if (!open) {
      hasShownToastRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    if (hasShownToastRef.current) {
      return;
    }

    if (state.success) {
      hasShownToastRef.current = true;

      toast({
        title: 'Password reset email sent',
        description: 'Check your inbox for the secure reset link.',
      });

      const timeout = window.setTimeout(() => {
        setOpen(false);
      }, 1200);

      return () => window.clearTimeout(timeout);
    }

    if (state.error) {
      hasShownToastRef.current = true;

      toast({
        title: 'Password reset failed',
        description: state.error,
        variant: 'destructive',
      });
    }

    return undefined;
  }, [state.success, state.error, toast]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="destructive" size="sm" disabled={!email}>
          <KeyRound className="mr-2 h-4 w-4" aria-hidden="true" />
          Send reset email
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset password</DialogTitle>
          <DialogDescription>
            We&apos;ll send a secure password reset email to {email}.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="email" value={email} />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={isPending || !email}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              )}
              Send reset email
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}