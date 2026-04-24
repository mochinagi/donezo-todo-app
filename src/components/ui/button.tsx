"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ================= STYLES ================= */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600",
        destructive:
          "bg-red-500 text-white hover:bg-red-600",
        outline:
          "border border-gray-300 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800",
        secondary:
          "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600",
        ghost:
          "hover:bg-gray-100 dark:hover:bg-gray-800",
        link:
          "text-blue-600 underline-offset-4 hover:underline dark:text-blue-400",
        success:
          "bg-green-500 text-white hover:bg-green-600",
        warning:
          "bg-yellow-400 text-black hover:bg-yellow-500",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3 text-sm",
        lg: "h-10 px-6 text-base",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/* ================= TYPES ================= */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

/* ================= COMPONENT ================= */

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      children,
      disabled,
      onClick,
      type,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const isDisabled = loading || disabled;
    const isIconOnly = size === "icon";

    const loaderSize = size === "sm" ? 14 : size === "lg" ? 18 : 16;

    /* ===== dev warning ===== */
    if (process.env.NODE_ENV !== "production") {
      if (isIconOnly && !props["aria-label"]) {
        console.warn(
          "Button: icon-only button should have aria-label"
        );
      }
    }

    /* ===== click guard ===== */
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isDisabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClick?.(e);
    };

    return (
      <Comp
        ref={ref}
        type={type ?? "button"}
        data-slot="button"
        data-disabled={isDisabled ? "" : undefined}
        aria-busy={loading || undefined}
        aria-disabled={isDisabled || undefined}
        aria-label={isIconOnly ? props["aria-label"] : undefined}
        className={cn(
          buttonVariants({ variant, size }),
          "transition-transform duration-150 hover:scale-105 active:scale-95",
          isDisabled && "pointer-events-none",
          className
        )}
        disabled={!asChild ? isDisabled : undefined}
        onClick={handleClick}
        {...props}
      >
        <span className="flex items-center gap-2">
          {loading && (
            <Loader2
              className="animate-spin shrink-0"
              size={loaderSize}
            />
          )}

          {!isIconOnly && (
            <span>
              {loading ? loadingText ?? children : children}
            </span>
          )}
        </span>

        {loading && (
          <span className="sr-only" aria-live="polite">
            読み込み中
          </span>
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };