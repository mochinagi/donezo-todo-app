"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type InputProps =
  React.InputHTMLAttributes<HTMLInputElement> & {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconClick?: () => void;
    clearable?: boolean;
    error?: boolean;
    size?: "sm" | "md" | "lg";
  };

const sizeClassMap = {
  sm: "h-8 px-2 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
};

function mergeRefs<T>(
  ref: React.ForwardedRef<T>,
  innerRef: React.MutableRefObject<T | null>
) {
  return (node: T | null) => {
    innerRef.current = node;

    if (typeof ref === "function") {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      leftIcon,
      rightIcon,
      onRightIconClick,
      clearable,
      error,
      size = "md",
      value,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);

    const currentValue = typeof value === "string" ? value : "";

    const showClear = clearable && !!currentValue && !disabled;

    const handleChange = (nextValue: string) => {
      if (!onChange) return;

      onChange({
        target: { value: nextValue },
      } as React.ChangeEvent<HTMLInputElement>);
    };

    const handleClear = () => {
      if (disabled) return;

      handleChange("");
      innerRef.current?.focus();
    };

    const mergedRef = mergeRefs(ref, innerRef);

    return (
      <div className="relative w-full">
        {leftIcon && (
          <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}

        <input
          ref={mergedRef}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={error || undefined}
          className={cn(
            "w-full rounded-md border bg-background outline-none transition",
            "placeholder:text-muted-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:ring-2 focus-visible:ring-ring",
            sizeClassMap[size],
            leftIcon && "pl-10",
            (rightIcon || showClear) && "pr-10",
            error ? "border-destructive" : "border-input",
            className
          )}
          {...props}
        />

        {(showClear || rightIcon) && (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {showClear && (
              <button
                type="button"
                onClick={handleClear}
                className="px-1 text-muted-foreground transition hover:opacity-70"
                aria-label="Clear input"
              >
                ×
              </button>
            )}

            {rightIcon && (
              <button
                type="button"
                onClick={onRightIconClick}
                className="px-1 text-muted-foreground transition hover:opacity-70"
                aria-label="Input action"
              >
                {rightIcon}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };