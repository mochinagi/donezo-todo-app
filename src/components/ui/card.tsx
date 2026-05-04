"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/* ================= VARIANTS ================= */

const cardVariants = cva(
  "rounded-lg flex flex-col border outline-none transition",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-200",
        outline: "border-gray-300 bg-transparent",
        elevated: "bg-white border-gray-100 shadow-sm",
        ghost: "bg-transparent border-none",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
      disabled: {
        true: "opacity-50 pointer-events-none",
        false: "",
      },
      density: {
        compact: "text-sm",
        comfortable: "text-sm",
        spacious: "text-base",
      },
    },
    compoundVariants: [
      {
        interactive: true,
        disabled: false,
        class: "hover:shadow-md",
      },
    ],
    defaultVariants: {
      variant: "default",
      interactive: false,
      disabled: false,
      density: "comfortable",
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
      interactive,
      disabled,
      density,
      asChild = false,
      onClick,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "div";

    const clickable = interactive && !disabled;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!clickable) return;

      if (e.currentTarget !== e.target) return;

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
        tabIndex={clickable && !asChild ? 0 : undefined}
        role={clickable && !asChild ? "button" : undefined}
        aria-disabled={disabled || undefined}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        className={cn(
          cardVariants({ variant, interactive, disabled, density }),
          clickable && "focus-visible:ring-2 focus-visible:ring-blue-400",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

/* ================= SUB ================= */

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-header"
    className={cn("px-4 pt-4 pb-2 flex flex-col gap-1", className)}
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
    className={cn("font-semibold leading-tight", className)}
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
    className={cn("text-gray-500 text-sm", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-content"
    className={cn("px-4 py-2", className)}
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
      "px-4 pt-2 pb-4 flex items-center justify-between border-t border-gray-100",
      className
    )}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

const CardAction = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="card-action"
    className={cn("ml-auto", className)}
    {...props}
  />
));
CardAction.displayName = "CardAction";

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