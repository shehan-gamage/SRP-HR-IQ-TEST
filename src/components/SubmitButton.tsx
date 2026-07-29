'use client';

import { useFormStatus } from 'react-dom';

/**
 * Server-action submit button with a pending state. Actions that send email
 * take seconds; without this the click appears to do nothing until the
 * redirect lands.
 */
export default function SubmitButton({
  pendingLabel,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" {...props} disabled={pending || disabled} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
