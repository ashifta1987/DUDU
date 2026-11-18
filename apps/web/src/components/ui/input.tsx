import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex min-h-touch w-full rounded-btn border border-line bg-surface px-4 text-base text-ink placeholder:text-muted-text/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50 aria-[invalid=true]:border-danger",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label className={cn("mb-1.5 block text-sm font-semibold text-ink", className)} {...props} />
  );
}

export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm font-medium text-danger">
      {children}
    </p>
  );
}
