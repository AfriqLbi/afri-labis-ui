/**
 * RequireAuth  — guards customer routes. Redirects unauthenticated users to
 *                /auth/signin, and users with wrong role to /.
 *
 * RequireAdmin — guards admin routes. Redirects unauthenticated admins to
 *                /admin/login, and users with wrong role to /.
 *                Uses the separate AdminAuthContext — completely isolated from
 *                the customer auth context.
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

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
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

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return (
      <Navigate
        to={`/admin/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // Default allowed admin roles — can be narrowed further via props
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
