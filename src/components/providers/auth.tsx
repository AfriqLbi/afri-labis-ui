/**
 * JWT Auth Provider — backs the Labi storefront with the NestJS backend.
 *
 * Replaces the Hercules OIDC provider.  Keeps the same surface area so
 * existing components that import useAuth() continue to work without change.
 *
 * Convex's <Authenticated> / <Unauthenticated> / <AuthLoading> components
 * are re-exported here as simple wrappers so the account page and header
 * don't require changes.
 */

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  auth as apiAuth,
  type AuthUser,
  clearTokens,
  getStoredUser,
  setStoredUser,
  setTokens,
} from "@/lib/api.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// ── Context ────────────────────────────────────────────────────────────────────

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  /** Legacy alias — navigates to /auth/signin */
  signinRedirect: () => void;
  /** Legacy alias for logout */
  signout: () => Promise<void>;
  /** Legacy — returns { profile: { name, email, avatar } } to match Hercules shape */
  profile: { name: string; email: string; avatar: string | null } | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigateRef = useRef<ReturnType<typeof useNavigate> | null>(null);

  // Bootstrap: load persisted user on mount
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) setUser(stored);
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiAuth.login({ email, password });
    setTokens(data.accessToken, data.refreshToken);
    setStoredUser(data.user);
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      const data = await apiAuth.register({ name, email, password, phone });
      setTokens(data.accessToken, data.refreshToken);
      setStoredUser(data.user);
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiAuth.logout();
    } catch {
      // Ignore — token may already be expired
    }
    clearTokens();
    setUser(null);
    toast.success("Signed out");
  }, []);

  const signinRedirect = useCallback(() => {
    // Navigate to the sign-in page. useNavigate can't be called outside a
    // Router context, so we use window.location as a fallback.
    try {
      navigateRef.current?.("/auth/signin");
    } catch {
      window.location.href = "/auth/signin";
    }
  }, []);

  // Legacy Hercules shape: user.profile.name / user.profile.email
  const profile = user
    ? { name: user.name, email: user.email, avatar: null }
    : null;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      signinRedirect,
      signout: logout,
      profile,
    }),
    [user, isLoading, login, register, logout, signinRedirect, profile],
  );

  return (
    <AuthContext.Provider value={value}>
      <NavigateCapture ref={navigateRef} />
      {children}
    </AuthContext.Provider>
  );
}

// Tiny component that captures the navigate function inside Router context
const NavigateCapture = forwardRef<ReturnType<typeof useNavigate> | null>(
  (_props, ref) => {
    const navigate = useNavigate();
    useImperativeHandle(ref, () => navigate, [navigate]);
    return null;
  },
);
NavigateCapture.displayName = "NavigateCapture";

// ── Hooks ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function useAuthUser(): AuthUser | null {
  return useAuth().user;
}

export function useIsAuthenticated(): boolean {
  return useAuth().isAuthenticated;
}

// ── Drop-in Convex replacements ────────────────────────────────────────────────
// The account page uses <Authenticated>, <Unauthenticated>, <AuthLoading>.
// These replacements make the migration zero-diff for existing JSX.

export function Authenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading || !isAuthenticated) return null;
  return <>{children}</>;
}

export function Unauthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading || isAuthenticated) return null;
  return <>{children}</>;
}

export function AuthLoading({ children }: { children: ReactNode }) {
  const { isLoading } = useAuth();
  if (!isLoading) return null;
  return <>{children}</>;
}
