/**
 * ConvexProvider stub — Convex is no longer used.
 * The app uses the NestJS JWT backend directly via src/lib/api.ts.
 * This file is kept so any lingering imports don't break, but it simply
 * passes children through.
 */
export function ConvexProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
