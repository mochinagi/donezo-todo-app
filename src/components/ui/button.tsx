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
    "relative inline-flex items-center justify-center whitespace-nowrap rounded-lg font-medium",
    "transition-all duration-150",
    "outline-none",
    "focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.985]",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "bg-zinc-900 text-white hover:bg-zinc-800",

        danger:
          "bg-red-500 text-white hover:bg-red-600",

        secondary:
          "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",

        outline:
          "border border-zinc-300 bg-white hover:bg-zinc-100",

        ghost:
          "hover:bg-zinc-100",

        link:
          "text-blue-600 underline-offset-4 hover:underline",
      },

      size: {
        sm: "h-8 px-3 text-sm",

        md: "h-9 px-4 text-sm",

        lg: "h-11 px-6 text-base",

        icon: "h-9 w-9 p-0",
      },
    },

    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

const iconSizeMap = {
  sm: 14,
  md: 16,
  lg: 18,
  icon: 16,
} as const;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<
    typeof buttonVariants
  > {
  asChild?: boolean;

  loading?: boolean;

  loadingText?: string;

  leadingIcon?: React.ReactNode;

  trailingIcon?: React.ReactNode;
}

const Button = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
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

    const [
      mounted,
      setMounted,
    ] = React.useState(false);

    const contentRef =
      React.useRef<HTMLSpanElement>(
        null
      );

    const [
      lockedWidth,
      setLockedWidth,
    ] = React.useState<
      number | null
    >(null);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    React.useEffect(() => {
      if (
        !loading &&
        contentRef.current
      ) {
        setLockedWidth(
          contentRef.current
            .offsetWidth
        );
      }
    }, [children, loading]);

    const iconSize =
      iconSizeMap[
      size ?? "md"
      ];

    const isDisabled =
      disabled || loading;

    return (
      <Comp
        ref={ref}
        {...(!asChild && {
          type:
            type ??
            "button",
        })}
        data-slot="button"
        data-loading={
          loading ||
          undefined
        }
        aria-busy={
          loading ||
          undefined
        }
        aria-disabled={
          isDisabled ||
          undefined
        }
        disabled={
          !asChild
            ? isDisabled
            : undefined
        }
        className={cn(
          buttonVariants({
            variant,
            size,
          }),
          className
        )}
        style={{
          minWidth:
            lockedWidth ??
            undefined,
        }}
        {...props}
      >
        <span
          ref={contentRef}
          className="inline-flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2
                size={
                  iconSize
                }
                className="animate-spin"
              />

              <span className="truncate">
                {loadingText ??
                  children}
              </span>
            </>
          ) : (
            <>
              {leadingIcon}

              {children && (
                <span className="truncate">
                  {
                    children
                  }
                </span>
              )}

              {trailingIcon}
            </>
          )}
        </span>
      </Comp>
    );
  }
);

Button.displayName =
  "Button";

export {
  Button,
  buttonVariants,
};