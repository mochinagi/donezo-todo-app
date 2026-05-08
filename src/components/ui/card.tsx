"use client";

import * as React from "react";

import { Slot } from "@radix-ui/react-slot";

import {
  cva,
  type VariantProps,
} from "class-variance-authority";

import { cn } from "@/lib/utils";

const cardVariants = cva(
  [
    "relative flex flex-col rounded-2xl border transition-all duration-200",
    "bg-white text-zinc-900",
  ].join(" "),
  {
    variants: {
      surface: {
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
        true: [
          "cursor-pointer",
          "hover:-translate-y-[1px]",
          "hover:border-zinc-300",
          "hover:shadow-md",
          "active:translate-y-0",
        ].join(" "),

        false: "",
      },

      selected: {
        true: [
          "border-zinc-900",
          "ring-1 ring-zinc-900/10",
        ].join(" "),

        false: "",
      },

      loading: {
        true: "animate-pulse",

        false: "",
      },
    },

    defaultVariants: {
      surface: "default",
      interactive: false,
      selected: false,
      loading: false,
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
      surface,
      interactive,
      selected,
      loading,
      asChild = false,
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
        data-slot="card"
        data-selected={
          selected ||
          undefined
        }
        data-loading={
          loading ||
          undefined
        }
        className={cn(
          cardVariants({
            surface,
            interactive,
            selected,
            loading,
          }),
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName =
  "Card";

const CardHeader =
  React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
  >(
    (
      {
        className,
        ...props
      },
      ref
    ) => (
      <div
        ref={ref}
        data-slot="card-header"
        className={cn(
          "flex flex-col gap-1.5 px-5 pt-5",
          className
        )}
        {...props}
      />
    )
  );

CardHeader.displayName =
  "CardHeader";

const CardTitle =
  React.forwardRef<
    HTMLHeadingElement,
    React.ComponentProps<"h3">
  >(
    (
      {
        className,
        ...props
      },
      ref
    ) => (
      <h3
        ref={ref}
        data-slot="card-title"
        className={cn(
          "text-base font-semibold tracking-tight",
          className
        )}
        {...props}
      />
    )
  );

CardTitle.displayName =
  "CardTitle";

const CardDescription =
  React.forwardRef<
    HTMLParagraphElement,
    React.ComponentProps<"p">
  >(
    (
      {
        className,
        ...props
      },
      ref
    ) => (
      <p
        ref={ref}
        data-slot="card-description"
        className={cn(
          "text-sm leading-relaxed text-zinc-500",
          className
        )}
        {...props}
      />
    )
  );

CardDescription.displayName =
  "CardDescription";

const CardContent =
  React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
  >(
    (
      {
        className,
        ...props
      },
      ref
    ) => (
      <div
        ref={ref}
        data-slot="card-content"
        className={cn(
          "flex-1 px-5 py-4",
          className
        )}
        {...props}
      />
    )
  );

CardContent.displayName =
  "CardContent";

const CardFooter =
  React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div">
  >(
    (
      {
        className,
        ...props
      },
      ref
    ) => (
      <div
        ref={ref}
        data-slot="card-footer"
        className={cn(
          "flex items-center justify-between border-t border-zinc-100 px-5 py-4",
          className
        )}
        {...props}
      />
    )
  );

CardFooter.displayName =
  "CardFooter";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};