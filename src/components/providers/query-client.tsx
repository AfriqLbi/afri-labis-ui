/**
 * QueryClientProvider — TanStack Query setup with localStorage persistence.
 *
 * Cache behaviour:
 *   staleTime  (gcTime)  │ Resource
 *   ─────────────────────────────────────────────────────────────
 *   5 min  (24 h)        │ Products, categories, brands
 *   4 h    (24 h)        │ Geo/FX context (matches backend refresh cron)
 *   30 s   (5 min)       │ Admin orders, quotes, analytics
 *   15 s   (2 min)       │ Cart (always fresh after mutations anyway)
 *   0      (5 min)       │ Auth /me (always refetched on mount)
 *
 * localStorage persist:
 *   All successful queries that don't opt-out are serialised to localStorage
 *   under "LABI_QUERY_CACHE" with a 24-hour max-age.  On cold page loads the
 *   persisted data is shown immediately while a background refetch runs when
 *   the entry is older than its staleTime.
 *
 *   Opt-out by setting  { meta: { persist: false } }  on the query — used for
 *   auth, checkout, cart, personal orders, and admin data.
 */

import type { Query } from "@tanstack/react-query";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { compress, decompress } from "./query-cache-compress";

// ── Persister ──────────────────────────────────────────────────────────────────

const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  key: "LABI_QUERY_CACHE",
  serialize: compress,
  deserialize: decompress,
});

// ── Persist predicate ─────────────────────────────────────────────────────────

/**
 * Returns true when a query should be written to localStorage.
 * Excludes queries that explicitly set `meta.persist = false`.
 */
function shouldPersist(query: Query): boolean {
  if (query.state.status !== "success") return false;
  const meta = query.meta as Record<string, unknown> | undefined;
  return meta?.["persist"] !== false;
}

// ── QueryClient ────────────────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 minute default — overridden per-query
      gcTime: 5 * 60 * 1000, // 5 minutes in-memory retention
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
    },
    mutations: {
      retry: 0,
    },
  },
});

// ── Provider ───────────────────────────────────────────────────────────────────

const PERSIST_MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

export function QueryClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: PERSIST_MAX_AGE,
        buster: import.meta.env.VITE_CACHE_BUSTER ?? "v1",
        dehydrateOptions: {
          shouldDehydrateQuery: shouldPersist,
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
