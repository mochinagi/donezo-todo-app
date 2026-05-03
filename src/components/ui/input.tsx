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
}

const mergeRefs = <T,>(...refs: React.Ref<T>[]) => {
  return (node: T) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    });
  };
};

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
    ...props
  },
  ref
) {
  const isControlled = value !== undefined;
  const modeRef = React.useRef(isControlled);

  const [internalValue, setInternalValue] = React.useState(
    defaultValue ?? ""
  );

  const inputRef = React.useRef<HTMLInputElement>(null);

  const currentValue = modeRef.current
    ? value ?? ""
    : internalValue;

  const sizeStyles = {
    sm: "h-8 text-sm px-2",
    md: "h-9 text-sm px-3",
    lg: "h-11 text-base px-4",
  };

  const showClear = !!clearable && !!currentValue && !rightIcon;

  const emitChange = (next: string) => {
    const el = inputRef.current;
    if (!el) return;

    const prototype = Object.getPrototypeOf(el);
    const descriptor = Object.getOwnPropertyDescriptor(
      prototype,
      "value"
    );

    descriptor?.set?.call(el, next);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!modeRef.current) {
      setInternalValue(e.target.value);
    }
    onChange?.(e);
  };

  const handleClear = () => {
    if (!modeRef.current) {
      setInternalValue("");
    }

    emitChange("");

    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDownInternal = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (!disableEscapeClear && e.key === "Escape" && currentValue) {
      e.stopPropagation();
      handleClear();
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
        "relative w-full group",
        currentValue && "has-value",
        error && "has-error"
      )}
    >
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          {leftIcon}
        </div>
      )}

      <input
        ref={mergeRefs(inputRef)}
        type={type}
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDownInternal}
        aria-invalid={error || undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full min-w-0 rounded-md border bg-transparent outline-none transition-all",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          sizeStyles[size],

          leftIcon && "pl-10",
          (rightIcon || showClear) && "pr-10",

          "border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-200",

          error && "border-red-500 focus:border-red-500 focus:ring-red-200",

          className
        )}
        {...props}
      />

      {rightIcon && (
        <button
          type="button"
          onClick={onRightIconClick}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {rightIcon}
        </button>
      )}

      {showClear && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };