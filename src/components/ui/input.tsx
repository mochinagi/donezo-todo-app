"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ================= TYPES ================= */

interface InputProps extends React.ComponentProps<"input"> {
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
      defaultValue,
      onChange,
      onKeyDown,
      ...props
    },
    ref
  ) {
    const isControlled = value !== undefined;

    const [internalValue, setInternalValue] = React.useState(
      defaultValue ?? ""
    );

    const inputRef = React.useRef<HTMLInputElement>(null);

    const mergedRef = (node: HTMLInputElement) => {
      inputRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as any).current = node;
    };

    const currentValue = isControlled ? value : internalValue;

    const sizeStyles = {
      sm: "h-8 text-sm px-2",
      md: "h-9 text-sm px-3",
      lg: "h-11 text-base px-4",
    };

    const showClear =
      clearable && !!currentValue && !rightIcon;

    const hasRightAction = rightIcon || showClear;

    /* ===== change ===== */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
      }
      onChange?.(e);
    };

    /* ===== clear ===== */
    const handleClear = () => {
      if (!isControlled) {
        setInternalValue("");
      }

      onClear?.();

      onChange?.({
        target: { value: "" },
      } as any);

      inputRef.current?.focus();
    };

    /* ===== keyboard ===== */
    const handleKeyDownInternal = (
      e: React.KeyboardEvent<HTMLInputElement>
    ) => {
      if (e.key === "Escape" && currentValue) {
        handleClear();
      }

      onKeyDown?.(e);
    };

    return (
      <div className="relative w-full group">
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
          ref={mergedRef}
          type={type}
          value={currentValue}
          onChange={handleChange}
          onKeyDown={handleKeyDownInternal}
          aria-invalid={error || undefined}
          aria-describedby={describedBy}
          className={cn(
            "w-full min-w-0 rounded-md border bg-transparent outline-none transition-all duration-200",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            sizeStyles[size],

            leftIcon && "pl-10",
            hasRightAction && "pr-10",

            "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200 focus:ring-offset-1",

            error &&
            "border-red-500 focus:border-red-500 focus:ring-red-200",

            className
          )}
          {...props}
        />

        {/* right icon */}
        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="input action"
          >
            {rightIcon}
          </button>
        )}

        {/* clear */}
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
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