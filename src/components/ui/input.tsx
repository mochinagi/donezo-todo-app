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

const Input = React.forwardRef<
  HTMLInputElement,
  InputProps
>(function Input(
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
) {
  const innerRef =
    React.useRef<HTMLInputElement>(
      null
    );

  const mergedRef =
    React.useCallback(
      (
        node: HTMLInputElement | null
      ) => {
        innerRef.current = node;

        if (
          typeof ref ===
          "function"
        ) {
          ref(node);

          return;
        }

        if (ref) {
          ref.current = node;
        }
      },
      [ref]
    );

  const currentValue =
    typeof value === "string"
      ? value
      : "";

  const handleClear = () => {
    if (
      disabled ||
      !innerRef.current
    ) {
      return;
    }

    const event =
      Object.getOwnPropertyDescriptor(
        window.HTMLInputElement
          .prototype,
        "value"
      )?.set;

    event?.call(
      innerRef.current,
      ""
    );

    innerRef.current.dispatchEvent(
      new Event("input", {
        bubbles: true,
      })
    );

    innerRef.current.focus();
  };

  const showClear =
    clearable &&
    !!currentValue &&
    !disabled;

  return (
    <div className="relative w-full">
      {leftIcon ? (
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {leftIcon}
        </div>
      ) : null}

      <input
        ref={mergedRef}
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={
          error || undefined
        }
        className={cn(
          "w-full rounded-md border bg-background outline-none transition",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "focus-visible:ring-2 focus-visible:ring-ring",
          sizeClassMap[size],

          leftIcon &&
          "pl-10",

          (rightIcon ||
            showClear) &&
          "pr-16",

          error
            ? "border-destructive"
            : "border-input",

          className
        )}
        {...props}
      />

      {(showClear ||
        rightIcon) && (
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
            {showClear ? (
              <button
                type="button"
                tabIndex={-1}
                onClick={
                  handleClear
                }
                className="px-1 text-muted-foreground transition hover:opacity-70"
                aria-label="Clear input"
              >
                ×
              </button>
            ) : null}

            {rightIcon ? (
              <button
                type="button"
                tabIndex={-1}
                onClick={
                  onRightIconClick
                }
                className="px-1 text-muted-foreground transition hover:opacity-70"
                aria-label="Input action"
              >
                {
                  rightIcon
                }
              </button>
            ) : null}
          </div>
        )}
    </div>
  );
});

Input.displayName = "Input";

export { Input };