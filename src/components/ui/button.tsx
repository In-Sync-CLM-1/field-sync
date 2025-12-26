import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1 whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0 btn-press relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-primary to-neon-pink text-primary-foreground hover:shadow-glow hover:scale-[1.02] active:scale-[0.98]",
        gradient: "bg-gradient-to-r from-accent to-neon-cyan text-accent-foreground font-semibold hover:shadow-glow-lime hover:scale-[1.02] active:scale-[0.98]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-glow-pink",
        outline: "border-2 border-primary/50 bg-transparent text-primary hover:border-primary hover:bg-primary/10 hover:shadow-glow",
        secondary: "bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary",
        ghost: "hover:bg-primary/10 hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
        gaming: "bg-gradient-to-r from-primary via-neon-pink to-accent text-primary-foreground font-semibold hover:shadow-glow animate-shimmer bg-[length:200%_100%]",
      },
      size: {
        default: "h-5 px-2 py-0.5",
        sm: "h-5 rounded-md px-1.5",
        lg: "h-6 rounded-md px-3",
        icon: "h-5 w-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };