import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Cardコンポーネント
 * 汎用コンテナ（variant / size / interactive対応）
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    variant?: "default" | "outline" | "elevated" | "ghost";
    size?: "sm" | "md" | "lg";
    interactive?: boolean;
  }
>(function Card(
  {
    className,
    variant = "default",
    size = "md",
    interactive = false,
    ...props
  },
  ref
) {

  const variantStyles = {
    default: "bg-white border border-gray-200",
    outline: "border border-gray-300 bg-transparent",
    elevated: "bg-white shadow-md border border-gray-100",
    ghost: "bg-transparent border-none shadow-none",
  };

  const sizeStyles = {
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  };

  return (
    <div
      ref={ref}
      data-slot="card"
      className={cn(
        "rounded-xl flex flex-col gap-4 transition-all",
        variantStyles[variant],
        sizeStyles[size],
        interactive &&
        "hover:shadow-lg hover:-translate-y-1 cursor-pointer",
        className
      )}
      {...props}
    />
  );
});

Card.displayName = "Card";

/**
 * ヘッダー
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardHeader({ className, ...props }, ref) {
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
 * タイトル
 */
const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardTitle({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card-title"
      className={cn("font-semibold text-lg", className)}
      {...props}
    />
  );
});

CardTitle.displayName = "CardTitle";

/**
 * 説明テキスト
 */
const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardDescription({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card-description"
      className={cn("text-sm text-gray-500", className)}
      {...props}
    />
  );
});

CardDescription.displayName = "CardDescription";

/**
 * アクション（右上ボタンなど）
 */
const CardAction = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardAction({ className, ...props }, ref) {
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
 * コンテンツ
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardContent({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card-content"
      className={cn("", className)}
      {...props}
    />
  );
});

CardContent.displayName = "CardContent";

/**
 * フッター
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      data-slot="card-footer"
      className={cn("flex items-center justify-between", className)}
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