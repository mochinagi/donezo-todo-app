"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/* ================= VARIANTS ================= */

const cardVariants = cva(
  "rounded-xl flex flex-col transition-all duration-200 outline-none",
  {
    variants: {
      variant: {
        default:
          "bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-700",
        outline:
          "border border-gray-300 bg-transparent dark:border-gray-700",
        elevated:
          "bg-white shadow-md border border-gray-100 dark:bg-gray-900 dark:border-gray-800",
        ghost:
          "bg-transparent border-none shadow-none",
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-5",
        lg: "p-6",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
      disabled: {
        true: "opacity-50 pointer-events-none",
        false: "",
      },
    },
    compoundVariants: [
      {
        interactive: true,
        disabled: false,
        class:
          "hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]",
      },
    ],
    defaultVariants: {
      variant: "default",
      padding: "md",
      interactive: false,
      disabled: false,
    },
  }
);

type CardProps = React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants> & {
    asChild?: boolean;
  };

/* ================= CARD ================= */

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant,
      padding,
      interactive,
      disabled,
      asChild = false,
      onClick,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div";

    const isClickable = interactive && !disabled && !asChild;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!isClickable) return;

      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        (e.currentTarget as HTMLElement).click();
      }

      onKeyDown?.(e);
    };

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      onClick?.(e);
    };

    return (
      <Comp
        ref={ref}
        data-slot="card"
        data-variant={variant}
        data-interactive={interactive ? "true" : "false"}
        data-disabled={disabled ? "true" : "false"}
        tabIndex={isClickable ? 0 : undefined}
        role={isClickable ? "button" : undefined}
        aria-disabled={disabled || undefined}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        className={cn(
          cardVariants({ variant, padding, interactive, disabled }),
          isClickable &&
          "focus-visible:ring-2 focus-visible:ring-blue-400",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

/* ================= SUB COMPONENTS ================= */

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-header"
    className={cn("flex flex-col gap-1.5", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentProps<"h3">
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    data-slot="card-title"
    className={cn("font-semibold text-lg tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<"p">
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    data-slot="card-description"
    className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardAction = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-action"
    className={cn("self-end", className)}
    {...props}
  />
));
CardAction.displayName = "CardAction";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-content"
    className={cn("text-sm", className)}
    {...props}
  />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-footer"
    className={cn(
      "flex items-center justify-between pt-2",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

/* ================= EXPORT ================= */

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};