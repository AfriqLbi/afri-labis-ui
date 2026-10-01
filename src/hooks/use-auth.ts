/**
 * useAuth — JWT auth hook backed by the Labi NestJS backend.
 *
 * Replaces @usehercules/auth. Stores tokens in localStorage via api.ts helpers.
 * Exposes: user, isAuthenticated, isLoading, login, register, logout, signinRedirect.
 *
 * signinRedirect() is kept as an alias for login flow initiation so existing
 * components (Header.tsx) don't need to change.
 */
export {
  useAuth,
  useAuthUser,
  AuthProvider,
  useIsAuthenticated,
} from "@/components/providers/auth.tsx";
