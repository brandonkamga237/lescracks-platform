import { ApiError } from './apiError';
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * A thrown value is `unknown` in TypeScript, so reading `.message` off it needs a check.
 * Falls back to the caller's wording when whatever was thrown carries no message.
 */
export function errorMessage(error: unknown, fallback: string): string {
  // An ApiError that is our fault carries a reference; showing it is what turns a shrug
  // into a report we can act on.
  if (error instanceof ApiError) {
    return error.reference && error.isOurFault
      ? `${error.message}`
      : error.message || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'string' && error) return error;
  return fallback;
}
