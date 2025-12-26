import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-gradient-to-r from-primary to-neon-pink text-primary-foreground shadow-sm hover:shadow-glow",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:shadow-glow-pink",
        outline: "border-primary/50 text-primary hover:bg-primary/10",
        success: "border-transparent bg-gradient-to-r from-accent to-neon-cyan text-accent-foreground shadow-sm hover:shadow-glow-lime",
        info: "border-transparent bg-info text-info-foreground",
        warning: "border-transparent bg-warning text-warning-foreground",
        pulse: "border-transparent bg-accent/20 text-accent animate-glow-pulse",
        gaming: "border-transparent bg-gradient-to-r from-primary via-neon-pink to-accent text-primary-foreground animate-shimmer bg-[length:200%_100%]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };