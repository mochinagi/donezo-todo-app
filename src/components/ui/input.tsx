"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputRef {
  focus: () => void;
  clear: () => void;
  value: string;
}

interface InputProps extends React.ComponentProps<"input"> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;

  clearable?: boolean;
  onClear?: () => void;

  error?: boolean;
  size?: "sm" | "md" | "lg";

  describedBy?: string;
  disableEscapeClear?: boolean;

  onEnter?: (value: string) => void;
  onEscape?: () => void;
}

const Input = React.forwardRef<InputRef, InputProps>(function Input(
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
    disableEscapeClear,
    onEnter,
    onEscape,
    ...props
  },
  ref
) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const isControlled = value !== undefined;

  const [internalValue, setInternalValue] = React.useState(
    defaultValue ?? ""
  );

  const isComposingRef = React.useRef(false);

  const currentValue = isControlled ? value ?? "" : internalValue;

  const sizeStyles = {
    sm: "h-8 px-2 text-sm",
    md: "h-9 px-3 text-sm",
    lg: "h-11 px-4 text-base",
  };

  const showClear = clearable && !!currentValue;

  const emitChange = (next: string) => {
    const el = inputRef.current;
    if (!el) return;

    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value"
    )?.set;

    nativeSetter?.call(el, next);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue("");
    }

    emitChange("");

    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDownInternal = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (isComposingRef.current) return;

    if (e.key === "Enter") {
      onEnter?.(currentValue);
    }

    if (e.key === "Escape") {
      onEscape?.();

      if (!disableEscapeClear && currentValue) {
        e.stopPropagation();
        handleClear();
      }
    }

    onKeyDown?.(e);
  };

  React.useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: handleClear,
    value: String(currentValue ?? ""),
  }));

  return (
    <div
      className={cn(
        "relative w-full",
        error && "text-red-500"
      )}
    >
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {leftIcon}
        </div>
      )}

      <input
        ref={inputRef}
        type={type}
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDownInternal}
        onCompositionStart={() => (isComposingRef.current = true)}
        onCompositionEnd={() => (isComposingRef.current = false)}
        aria-invalid={error || undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full rounded-md border bg-transparent outline-none transition",
          "placeholder:text-gray-400",
          "disabled:cursor-not-allowed disabled:opacity-50",
          sizeStyles[size],

          leftIcon && "pl-10",
          (rightIcon || showClear) && "pr-16",

          error
            ? "border-red-500 focus:ring-2 focus:ring-red-200"
            : "border-gray-300 focus:ring-2 focus:ring-blue-200 focus:border-blue-400",

          className
        )}
        {...props}
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {showClear && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="clear input"
            className="text-gray-400 hover:text-gray-600 px-1"
          >
            ×
          </button>
        )}

        {rightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            aria-label="action"
            className="text-gray-400 hover:text-gray-600 px-1"
          >
            {rightIcon}
          </button>
        )}
      </div>
    </div>
  );
});

Input.displayName = "Input";

export { Input };