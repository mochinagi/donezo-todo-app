"use client";

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
  { className, type = "text", leftIcon, rightIcon, error, size = "md", ...props },
  ref
) {

  const sizeStyles = {
    sm: "h-8 text-sm px-2",
    md: "h-9 text-sm px-3",
    lg: "h-11 text-base px-4",
  };

  return (
    <div className="relative w-full group">

      {/* 左アイコン */}
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors">
          {leftIcon}
        </div>
      )}

      <input
        ref={ref}
        type={type}
        data-slot="input"
        aria-invalid={error || undefined}
        className={cn(
          "w-full min-w-0 rounded-md border bg-transparent outline-none transition-all ease-in-out duration-200",
          "placeholder:text-muted-foreground transition-colors",
          "disabled:cursor-not-allowed disabled:opacity-50",
          sizeStyles[size],
          leftIcon && "pl-10",
          rightIcon && "pr-10",
          // 通常状态
          "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:ring-offset-1",
          // 错误状态
          error && "border-red-500 focus:border-red-500 focus:ring-red-200",
          className
        )}
        {...props}
      />

      {/* 右アイコン */}
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" aria-hidden="true">
          {rightIcon}
        </div>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };