"use client";

import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import {
  cva,
  type VariantProps,
} from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  "flex flex-col rounded-2xl border bg-white text-zinc-900 transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "border-zinc-200",

        muted:
          "border-zinc-100 bg-zinc-50/60",

        elevated:
          "border-zinc-100 shadow-sm",

        floating:
          "border-transparent shadow-md",
      },

      interactive: {
        true:
          "cursor-pointer hover:-translate-y-[1px] hover:border-zinc-300 hover:shadow-md active:translate-y-0",

        false: "",
      },

      selected: {
        true:
          "border-zinc-900 ring-1 ring-zinc-900/10",

        false: "",
      },
    },

    defaultVariants: {
      variant: "default",
      interactive: false,
      selected: false,
    },
  }
);

type CardProps =
  React.ComponentProps<"div"> &
  VariantProps<
    typeof cardVariants
  > & {
    asChild?: boolean;
  };

const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(
  (
    {
      className,
      variant,
      interactive,
      selected,
      asChild,
      ...props
    },
    ref
  ) => {
    const Comp = asChild
      ? Slot
      : "div";

    return (
      <Comp
        ref={ref}
        className={cn(
          cardVariants({
            variant,
            interactive,
            selected,
          }),
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

function CardHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 px-5 pt-5",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ...props
}: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn(
        "text-base font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      className={cn(
        "text-sm leading-relaxed text-zinc-500",
        className
      )}
      {...props}
    />
  );
}

function CardContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex-1 px-5 py-4",
        className
      )}
      {...props}
    />
  );
}

function CardFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex items-center justify-between border-t border-zinc-100 px-5 py-4",
        className
      )}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};