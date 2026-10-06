/**
 * RequireAuth  — guards customer routes.
 * RequireAdmin — guards admin routes (separate AdminAuthContext).
 *
 * Key behaviour: while isLoading is true we only show the skeleton if there is
 * no cached user. If we already have a user from localStorage we render the
 * Outlet immediately — prevents the "flash to sign-in" on mobile.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, useAdminAuth } from "@/hooks/use-auth.ts";
import type { UserRole } from "@/lib/api.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

type Props = { roles?: UserRole[] };

// ── Customer route guard ───────────────────────────────────────────────────────

export function RequireAuth({ roles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading && !user) return <AuthLoadingSkeleton />;

  if (!isLoading && !isAuthenticated) {
    return (
      <Navigate
        to={`/auth/signin?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

// ── Admin route guard ──────────────────────────────────────────────────────────

export function RequireAdmin({ roles }: Props) {
  const { isAuthenticated, isLoading, user } = useAdminAuth();
  const location = useLocation();

  if (isLoading && !user) return <AdminLoadingSkeleton />;

  if (!isLoading && !isAuthenticated) {
    return (
      <Navigate
        to={`/admin/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  const allowed = roles ?? [
    "super_admin",
    "merchandiser",
    "support_agent",
    "staff",
  ];
  if (user && !allowed.includes(user.role)) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}

// ── Skeleton loading screens ───────────────────────────────────────────────────

/** Storefront account page skeleton */
function AuthLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 h-[65px] bg-background/95 border-b border-border flex items-center justify-between px-6 z-50">
        <Skeleton className="h-7 w-14" />
        <div className="hidden md:flex gap-8">
          {[80, 64, 96, 72].map((w, i) => (
            <Skeleton key={i} className="h-3" style={{ width: w }} />
          ))}
        </div>
        <div className="flex gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-4 w-4" />
          ))}
        </div>
      </div>
      {/* Account page shape */}
      <div className="pt-[65px]">
        {/* User banner */}
        <div className="bg-card border-b border-border px-6 py-8">
          <div className="max-w-5xl mx-auto flex items-center gap-5">
            <Skeleton className="w-16 h-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-3 w-56" />
            </div>
          </div>
          {/* Tabs */}
          <div className="max-w-5xl mx-auto flex gap-0 mt-6 border-t border-border pt-0">
            {[96, 80, 120, 112].map((w, i) => (
              <Skeleton
                key={i}
                className="h-12 mx-1 mt-2"
                style={{ width: w }}
              />
            ))}
          </div>
        </div>
        {/* Content */}
        <div className="max-w-5xl mx-auto px-6 py-10 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border border-border p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-3 w-48" />
              <div className="flex gap-3 pt-2">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Admin panel skeleton */
function AdminLoadingSkeleton() {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="hidden lg:flex w-56 shrink-0 border-r border-border flex-col h-screen">
        <div className="px-5 pt-6 pb-4 border-b border-border space-y-2">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="px-3 py-4 space-y-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </div>
      {/* Main */}
      <div className="flex-1 p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-9 w-36" />
        </div>
        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border p-5 space-y-3">
              <Skeleton className="w-9 h-9" />
              <Skeleton className="h-7 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
        {/* Chart */}
        <div className="bg-card border border-border p-6 space-y-4">
          <Skeleton className="h-3 w-40" />
          <div className="flex items-end gap-2 h-40">
            {[60, 80, 55, 90, 70, 95].map((h, i) => (
              <Skeleton
                key={i}
                className="flex-1"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
