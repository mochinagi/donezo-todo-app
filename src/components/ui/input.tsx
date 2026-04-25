"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

interface InputProps
  extends React.ComponentProps<"input"> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  onRightIconClick?: () => void;

  clearable?: boolean;
  onClear?: () => void;

  error?: boolean;
  size?: "sm" | "md" | "lg";

  describedBy?: string;
}

/* ================= COMPONENT ================= */

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      className,
      type = "text",
      leftIcon,
      rightIcon,
      onRightIconClick,
      clearable,
      onClear,
      error,
      size = "md",
      describedBy,
      value,
      onChange,
      ...props
    },
    ref
  ) {
    const [focused, setFocused] = React.useState(false);

    const isControlled = value !== undefined;

    const sizeStyles = {
      sm: "h-8 text-sm px-2",
      md: "h-9 text-sm px-3",
      lg: "h-11 text-base px-4",
    };

    const hasRightAction =
      rightIcon || (clearable && value);

    return (
      <div
        className="relative w-full group"
        data-state={focused ? "focused" : "idle"}
      >
        {/* left icon */}
        {leftIcon && (
          <div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-600 transition-colors pointer-events-none"
            aria-hidden="true"
          >
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          type={type}
          data-slot="input"
          value={value}
          onChange={onChange}
          aria-invalid={error || undefined}
          aria-describedby={describedBy}
          aria-label={props["aria-label"] || props.placeholder}
          className={cn(
            "w-full min-w-0 rounded-md border bg-transparent outline-none transition-all duration-200",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            sizeStyles[size],

            leftIcon && "pl-10",
            hasRightAction && "pr-10",

            "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:ring-offset-1 focus:shadow-sm",

            error &&
            "border-red-500 focus:border-red-500 focus:ring-red-200",

            className
          )}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />

        {/* right icon */}
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="action"
          >
            {rightIcon}
          </button>
        )}

        {/* clear button */}
        {clearable && value && !rightIcon && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            aria-label="clear input"
          >
            ×
          </button>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };