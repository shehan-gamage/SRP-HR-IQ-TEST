'use client';

/**
 * Submit button that asks for confirmation first. Wrap destructive server-
 * action forms with this instead of a plain <button> so a stray click cannot
 * delete a record.
 */
export default function ConfirmButton({
  message,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { message: string }) {
  return (
    <button
      type="submit"
      {...props}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
