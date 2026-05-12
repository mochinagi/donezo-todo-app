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
    "rounded-lg font-medium whitespace-nowrap",
    "transition-colors transition-transform duration-150",
    "outline-none select-none",
    "active:scale-[0.98]",
    "focus-visible:ring-2 focus-visible:ring-zinc-400/60 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-zinc-900 text-white hover:bg-zinc-800",

        secondary:
          "bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700",

        outline:
          "border border-zinc-300 bg-white hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800",

        ghost:
          "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800",

        destructive:
          "bg-red-600 text-white hover:bg-red-700",

        subtle:
          "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700",

        link:
          "text-blue-600 underline-offset-4 hover:underline dark:text-blue-400",
      },

      size: {
        sm: "h-8 px-3 text-sm",

        md: "h-9 px-4 text-sm",

        lg: "h-11 px-6 text-base",

        icon: "size-9 p-0",
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
  VariantProps<
    typeof buttonVariants
  > {
  asChild?: boolean;

  loading?: boolean;

  leadingIcon?: React.ReactNode;

  trailingIcon?: React.ReactNode;
}

export const Button =
  React.forwardRef<
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
      const Comp = asChild
        ? Slot
        : "button";

      const isDisabled =
        disabled || loading;

      return (
        <Comp
          ref={ref}
          type={
            !asChild
              ? type ??
              "button"
              : undefined
          }
          disabled={
            !asChild
              ? isDisabled
              : undefined
          }
          aria-busy={
            loading ||
            undefined
          }
          aria-live="polite"
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
          <span className="flex items-center gap-2">
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              leadingIcon
            )}

            {children && (
              <span className="truncate">
                {children}
              </span>
            )}

            {!loading &&
              trailingIcon}
          </span>
        </Comp>
      );
    }
  );

Button.displayName =
  "Button";

export { buttonVariants };