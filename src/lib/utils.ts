import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/* ================= UI ================= */

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

/* ================= DEBOUNCE ================= */

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300,
  options: { leading?: boolean; trailing?: boolean } = {}
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const { leading = false, trailing = true } = options;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;

    if (timer) clearTimeout(timer);

    if (leading && !timer) {
      fn(...args);
    }

    timer = setTimeout(() => {
      if (trailing && lastArgs) {
        fn(...lastArgs);
      }
      timer = null;
      lastArgs = null;
    }, delay);
  };

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timer && lastArgs) {
      fn(...lastArgs);
      debounced.cancel();
    }
  };

  return debounced as T & {
    cancel: () => void;
    flush: () => void;
  };
}

/* ================= THROTTLE ================= */

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  delay = 300
) {
  let last = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();

    if (now - last >= delay) {
      last = now;
      fn(...args);
    } else if (!timer) {
      timer = setTimeout(() => {
        last = Date.now();
        fn(...args);
        timer = null;
      }, delay - (now - last));
    }
  };

  throttled.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };

  return throttled as T & { cancel: () => void };
}

/* ================= BASICS ================= */

export const sleep = (ms: number): Promise<void> =>
  new Promise((res) => setTimeout(res, ms));

export const isBrowser =
  typeof window !== "undefined" &&
  typeof document !== "undefined";

export const noop = () => { };

/* ================= ASSERT ================= */

export function invariant(
  condition: unknown,
  message: string | (() => string)
): asserts condition {
  if (!condition) {
    const msg =
      typeof message === "function" ? message() : message;

    throw new Error(
      process.env.NODE_ENV === "production"
        ? "Something went wrong"
        : msg
    );
  }
}

/* ================= TYPE HELPERS ================= */

export function isDefined<T>(
  value: T | null | undefined
): value is T {
  return value != null;
}

export function isEmpty(value: unknown) {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object")
    return Object.keys(value).length === 0;
  return false;
}

/* ================= MATH ================= */

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function range(length: number, start = 0) {
  return Array.from({ length }, (_, i) => i + start);
}

/* ================= ARRAY ================= */

export function uniqueBy<T>(
  arr: T[],
  key: (item: T) => string | number
) {
  const map = new Map();
  for (const item of arr) {
    map.set(key(item), item);
  }
  return Array.from(map.values());
}

/* ================= DATE ================= */

export function formatDate(
  date: Date | number,
  format: "YYYY-MM-DD" | "YYYY/MM/DD" = "YYYY-MM-DD"
) {
  const d = new Date(date);

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  if (format === "YYYY/MM/DD") {
    return `${y}/${m}/${day}`;
  }

  return `${y}-${m}-${day}`;
}