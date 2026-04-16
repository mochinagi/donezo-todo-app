import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300,
  options?: { leading?: boolean }
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let called = false;

  const debounced = (...args: Parameters<T>) => {
    if (options?.leading && !timer && !called) {
      fn(...args);
      called = true;
    }

    if (timer) clearTimeout(timer);

    timer = setTimeout(() => {
      if (!options?.leading) {
        fn(...args);
      }
      timer = null;
      called = false;
    }, delay);
  };

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    called = false;
  };

  return debounced as T & { cancel: () => void };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
) {
  let last = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - last >= delay) {
      last = now;
      fn(...args);
    }
  };
}

export const sleep = (ms: number) =>
  new Promise((res) => setTimeout(res, ms));

export const isBrowser =
  typeof window !== "undefined" &&
  typeof document !== "undefined";

export const noop = () => { };

export function invariant(
  condition: unknown,
  message: string
): asserts condition {
  if (!condition) {
    throw new Error(
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : message
    );
  }
}

export function isDefined<T>(
  value: T | null | undefined
): value is T {
  return value != null;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function formatDate(date: Date | number) {
  const d = new Date(date);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}