"use client";

import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import { Loader2 } from "lucide-react";

import {
  cva,
  type VariantProps,
} from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-lg font-medium",
    "transition-all duration-150",
    "outline-none",
    "focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-white hover:bg-zinc-800",
        secondary:
          "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
        outline:
          "border border-zinc-300 bg-white hover:bg-zinc-100",
        ghost:
          "text-zinc-700 hover:bg-zinc-100",
        destructive:
          "bg-red-500 text-white hover:bg-red-600",
        link:
          "text-blue-600 underline-offset-4 hover:underline",
      },

      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-sm",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9 p-0",
      },

      fullWidth: {
        true: "w-full",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      asChild = false,
      loading = false,
      leadingIcon,
      trailingIcon,
      children,
      disabled,
      type,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const isDisabled =
      disabled || loading;

    return (
      <Comp
        ref={ref}
        type={
          !asChild
            ? type ?? "button"
            : undefined
        }
        disabled={
          !asChild
            ? isDisabled
            : undefined
        }
        aria-busy={
          loading || undefined
        }
        className={cn(
          buttonVariants({
            variant,
            size,
            fullWidth,
          }),
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2
              size={16}
              className="animate-spin"
            />

            {children && (
              <span className="truncate">
                {children}
              </span>
            )}
          </>
        ) : (
          <>
            {leadingIcon}

            {children && (
              <span className="truncate">
                {children}
              </span>
            )}

            {trailingIcon}
          </>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };