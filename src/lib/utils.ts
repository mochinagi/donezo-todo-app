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
  let lastResolve: ((value: ReturnType<T>) => void) | null = null;

  const { leading = false, trailing = true } = options;

  const debounced = (...args: Parameters<T>) => {
    return new Promise<ReturnType<T>>((resolve) => {
      const callNow = leading && !timer;

      lastArgs = args;
      lastResolve = resolve;

      if (timer) clearTimeout(timer);

      timer = setTimeout(() => {
        if (trailing && !callNow && lastArgs) {
          const result = fn(...lastArgs);
          lastResolve?.(result);
        }
        timer = null;
        lastArgs = null;
        lastResolve = null;
      }, delay);

      if (callNow) {
        const result = fn(...args);
        resolve(result);
      }
    });
  };

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    lastArgs = null;
    lastResolve = null;
  };

  debounced.flush = () => {
    if (timer && lastArgs) {
      const result = fn(...lastArgs);
      lastResolve?.(result);
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
  delay = 300,
  options: { trailing?: boolean } = {}
) {
  let lastCall = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const { trailing = true } = options;

  const throttled = (...args: Parameters<T>) => {
    const now = Date.now();
    const remaining = delay - (now - lastCall);

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastCall = now;
      fn(...args);
    } else if (trailing) {
      lastArgs = args;

      if (!timer) {
        timer = setTimeout(() => {
          lastCall = Date.now();
          if (lastArgs) fn(...lastArgs);
          timer = null;
          lastArgs = null;
        }, remaining);
      }
    }
  };

  throttled.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
    lastArgs = null;
  };

  return throttled as T & { cancel: () => void };
}

/* ================= BASICS ================= */

export const sleep = (ms: number) =>
  new Promise<void>((res) => setTimeout(res, ms));

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

/* ================= TYPE ================= */

export function isDefined<T>(
  value: T | null | undefined
): value is T {
  return value != null;
}

/* ================= SAFE JSON ================= */

export function safeParse<T>(str: string, fallback: T): T {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

/* ================= ARRAY ================= */

export function uniqueBy<T>(
  arr: T[],
  key: (item: T) => string | number
) {
  const map = new Map<string | number, T>();
  for (const item of arr) {
    map.set(key(item), item);
  }
  return Array.from(map.values());
}

export function arrayMove<T>(arr: T[], from: number, to: number) {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

/* ================= OBJECT ================= */

export function deepClone<T>(obj: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((k) => {
    if (k in obj) result[k] = obj[k];
  });
  return result;
}

export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((k) => {
    delete result[k];
  });
  return result;
}

/* ================= FUNCTION ================= */

export function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false;
  let result: any;

  return ((...args: Parameters<T>) => {
    if (!called) {
      called = true;
      result = fn(...args);
    }
    return result;
  }) as T;
}

/* ================= ID ================= */

export function uid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

/* ================= DATE ================= */

export function formatDate(
  date: Date | number,
  format: "YYYY-MM-DD" | "YYYY/MM/DD" = "YYYY-MM-DD"
) {
  const d = new Date(date);

  if (isNaN(d.getTime())) return "";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  if (format === "YYYY/MM/DD") {
    return `${y}/${m}/${day}`;
  }

  return `${y}-${m}-${day}`;
}