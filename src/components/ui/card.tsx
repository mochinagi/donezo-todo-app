import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Card styles（Buttonと統一🔥）
 */
const cardVariants = cva(
  "rounded-xl flex flex-col gap-4 transition-all duration-200",
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
      size: {
        sm: "p-3",
        md: "p-5",
        lg: "p-6",
      },
      interactive: {
        true: "hover:shadow-lg hover:-translate-y-1 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: false,
    },
  }
);

type CardProps = React.ComponentProps<"div"> &
  VariantProps<typeof cardVariants>;

/**
 * Card
 */
const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, ...props }, ref) => {
    return (
      <div
        ref={ref}
        data-slot="card"
        className={cn(cardVariants({ variant, size, interactive }), className)}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

/**
 * Header
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    />
  );
});

CardHeader.displayName = "CardHeader";

/**
 * Title（よりセマンティック🔥）
 */
const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.ComponentProps<"h3">
>(({ className, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      data-slot="card-title"
      className={cn("font-semibold text-lg tracking-tight", className)}
      {...props}
    />
  );
});

CardTitle.displayName = "CardTitle";

/**
 * Description
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<"p">
>(({ className, ...props }, ref) => {
  return (
    <p
      ref={ref}
      data-slot="card-description"
      className={cn("text-sm text-gray-500 dark:text-gray-400", className)}
      {...props}
    />
  );
});

CardDescription.displayName = "CardDescription";

/**
 * Action
 */
const CardAction = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="card-action"
      className={cn("self-end", className)}
      {...props}
    />
  );
});

CardAction.displayName = "CardAction";

/**
 * Content（padding統一🔥）
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="card-content"
      className={cn("text-sm", className)}
      {...props}
    />
  );
});

CardContent.displayName = "CardContent";

/**
 * Footer
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn(
        "flex items-center justify-between pt-2",
        className
      )}
      {...props}
    />
  );
});

CardFooter.displayName = "CardFooter";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};