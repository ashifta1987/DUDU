import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-orange text-white hover:bg-orange-dark",
        study: "bg-blue text-white hover:bg-blue/90",
        secondary: "bg-orange-tint text-orange-dark hover:bg-orange-tint/70",
        outline: "border border-line bg-surface text-ink hover:bg-ground",
        ghost: "text-ink hover:bg-ground",
        destructive: "bg-danger text-white hover:bg-danger/90",
        link: "text-orange-dark underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-touch px-5 rounded-btn text-sm",
        sm: "min-h-9 px-3 rounded-btn-sm text-sm",
        lg: "min-h-12 px-6 rounded-btn-lg text-base",
        kid: "min-h-kid px-7 rounded-btn-lg text-lg font-child",
        icon: "size-touch rounded-btn",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
