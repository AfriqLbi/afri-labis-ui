/**
 * RequireAuth — route guard that redirects to /auth/signin if the user is
 * not authenticated, or to / if they lack the required role.
 *
 * Usage:
 *   <Route element={<RequireAuth />}>           — any authenticated user
 *   <Route element={<RequireAuth roles={[…]} />}> — restricted by role
 */
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import type { UserRole } from "@/lib/api.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

type Props = {
  roles?: UserRole[];
};

export function RequireAuth({ roles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner className="size-8 text-primary" />
      </div>
    );
  }

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
