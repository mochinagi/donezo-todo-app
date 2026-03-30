import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Inputコンポーネント
 * 汎用入力フィールド（アイコン・サイズ・エラー状態対応）
 */
const Input = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    error?: boolean;
    size?: "sm" | "md" | "lg";
  }
>(function Input(
  {
    className,
    type = "text",
    leftIcon,
    rightIcon,
    error,
    size = "md",
    ...props
  },
  ref
) {

  // サイズ別スタイル
  const sizeStyles = {
    sm: "h-8 text-sm px-2",
    md: "h-9 text-sm px-3",
    lg: "h-11 text-base px-4",
  };

  return (
    <div className="relative w-full">

      {/* 左アイコン */}
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {leftIcon}
        </div>
      )}

      <input
        ref={ref}
        type={type}
        data-slot="input"
        aria-invalid={error || undefined}
        className={cn(
          "w-full min-w-0 rounded-md border bg-transparent outline-none transition-all",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",

          // サイズ
          sizeStyles[size],

          // padding（アイコン対応）
          leftIcon && "pl-10",
          rightIcon && "pr-10",

          // 通常状態
          "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200",

          // エラー状態
          error &&
          "border-red-500 focus:border-red-500 focus:ring-red-200",

          className
        )}
        {...props}
      />

      {/* 右アイコン */}
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {rightIcon}
        </div>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };