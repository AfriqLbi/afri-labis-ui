/**
 * Lightweight JSON serialisation for the TanStack Query localStorage cache.
 *
 * We store the serialised state as plain JSON.  If lz-string ever gets added
 * to the project, swap these two functions for compress/decompress and the
 * footprint will shrink by ~60 %.  For now this is a transparent pass-through
 * so the plumbing is already in place.
 */

export function compress(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return "{}";
  }
}

import type { PersistedClient } from "@tanstack/react-query-persist-client";

export function decompress(value: string): PersistedClient {
  try {
    return JSON.parse(value) as PersistedClient;
  } catch {
    return {} as PersistedClient;
  }
}
