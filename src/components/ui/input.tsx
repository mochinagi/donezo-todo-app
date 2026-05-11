"use client";

import * as React from "react";

import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type InputSize =
  | "sm"
  | "md"
  | "lg";

type InputProps =
  React.InputHTMLAttributes<HTMLInputElement> & {
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    onRightIconClick?: () => void;
    clearable?: boolean;
    error?: string;
    size?: InputSize;
    loading?: boolean;
  };

const sizeClasses: Record<
  InputSize,
  string
> = {
  sm: "h-8 px-2 text-sm",
  md: "h-10 px-3 text-sm",
  lg: "h-12 px-4 text-base",
};

export const Input =
  React.forwardRef<
    HTMLInputElement,
    InputProps
  >(
    (
      {
        className,
        type = "text",
        leftIcon,
        rightIcon,
        onRightIconClick,
        clearable = false,
        error,
        size = "md",
        value,
        onChange,
        disabled,
        loading = false,
        ...props
      },
      ref
    ) => {
      const innerRef =
        React.useRef<HTMLInputElement | null>(
          null
        );

      const currentValue =
        typeof value === "string"
          ? value
          : "";

      const showClear =
        clearable &&
        currentValue.length > 0 &&
        !disabled &&
        !loading;

      const setRefs = (
        node: HTMLInputElement | null
      ) => {
        innerRef.current = node;

        if (
          typeof ref === "function"
        ) {
          ref(node);

          return;
        }

        if (ref) {
          ref.current = node;
        }
      };

      const handleClear = () => {
        if (
          disabled ||
          loading ||
          !onChange
        ) {
          return;
        }

        const event = {
          target: {
            value: "",
          },
        } as React.ChangeEvent<HTMLInputElement>;

        onChange(event);

        requestAnimationFrame(() => {
          innerRef.current?.focus();
        });
      };

      return (
        <div className="w-full">
          <div className="relative">
            {leftIcon && (
              <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
                {leftIcon}
              </div>
            )}

            <input
              ref={setRefs}
              type={type}
              value={value}
              onChange={onChange}
              disabled={disabled}
              aria-invalid={
                !!error ||
                undefined
              }
              className={cn(
                "w-full rounded-lg border bg-white outline-none transition-colors",
                "placeholder:text-zinc-400",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "focus-visible:ring-2 focus-visible:ring-blue-400",
                sizeClasses[size],
                leftIcon &&
                "pl-10",
                (
                  rightIcon ||
                  showClear
                ) &&
                "pr-10",
                error
                  ? "border-red-400"
                  : "border-zinc-300",
                loading &&
                "cursor-wait",
                className
              )}
              {...props}
            />

            {(showClear ||
              rightIcon) && (
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
                  {showClear && (
                    <button
                      type="button"
                      onClick={
                        handleClear
                      }
                      className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                      tabIndex={
                        -1
                      }
                    >
                      <X
                        size={
                          14
                        }
                      />
                    </button>
                  )}

                  {rightIcon && (
                    <button
                      type="button"
                      onClick={
                        onRightIconClick
                      }
                      className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                    >
                      {
                        rightIcon
                      }
                    </button>
                  )}
                </div>
              )}
          </div>

          {error && (
            <p className="mt-1 text-xs text-red-500">
              {error}
            </p>
          )}
        </div>
      );
    }
  );

Input.displayName = "Input";