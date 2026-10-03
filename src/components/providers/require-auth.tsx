/**
 * RequireAuth  — guards customer routes.
 * RequireAdmin — guards admin routes (separate AdminAuthContext).
 *
 * Key behaviour: while isLoading is true we only show the spinner if there is
 * no cached user. If we already have a user from sessionStorage we render the
 * Outlet immediately — this prevents the "flash to sign-in" on mobile where
 * the background /auth/me call hasn't resolved yet.
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth, useAdminAuth } from "@/hooks/use-auth.ts";
import type { UserRole } from "@/lib/api.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

type Props = { roles?: UserRole[] };

// ── Customer route guard ───────────────────────────────────────────────────────

export function RequireAuth({ roles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Still loading AND no cached user → show spinner while /auth/me resolves
  if (isLoading && !user) return <LoadingScreen />;

  // Not authenticated (and not still loading) → redirect to sign-in
  if (!isLoading && !isAuthenticated) {
    return (
      <Navigate
        to={`/auth/signin?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // Role check
  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

// ── Admin route guard ──────────────────────────────────────────────────────────

export function RequireAdmin({ roles }: Props) {
  const { isAuthenticated, isLoading, user } = useAdminAuth();
  const location = useLocation();

  // Still loading AND no cached user → show spinner
  if (isLoading && !user) return <LoadingScreen />;

  // Not authenticated → redirect to admin login
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

// ── Shared ─────────────────────────────────────────────────────────────────────

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Spinner className="size-8 text-primary" />
    </div>
  );
}
