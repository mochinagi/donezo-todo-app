import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* -----------------------------
   className 合并（修正版）
----------------------------- */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

/* -----------------------------
   debounce（通用版）
----------------------------- */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay = 300
) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}

/* -----------------------------
   SSR 安全判断
----------------------------- */
export const isBrowser =
  typeof window !== "undefined" &&
  typeof document !== "undefined";

/* -----------------------------
   no-op（占位函数）
----------------------------- */
export const noop = () => { };

/* -----------------------------
   invariant（开发调试用）
----------------------------- */
export function invariant(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    if (process.env.NODE_ENV !== "production") {
      throw new Error(`Invariant failed: ${message}`);
    }
  }
}