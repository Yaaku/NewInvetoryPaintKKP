"use client";

import { cn } from "@/lib/utils";

/**
 * A submit button that asks for confirmation before allowing its parent
 * <form> (a server action) to submit. If the user cancels, the submit is
 * blocked — the server action is never invoked. Safe drop-in for destructive
 * operations like delete / deactivate / write-off.
 */
export default function ConfirmSubmit({
  children,
  message,
  className,
}: {
  children: React.ReactNode;
  message: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={cn(className)}
      onClick={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
