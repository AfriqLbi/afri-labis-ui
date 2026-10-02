/**
 * Auth Providers — cookie-based JWT auth for the Labi storefront.
 *
 * Two completely separate contexts:
 *   AuthProvider      — storefront customers  (cookie: labi_token)
 *   AdminAuthProvider — admin panel staff     (cookie: labi_admin_token)
 *
 * Neither context reads or writes localStorage. Tokens are httpOnly cookies
 * managed exclusively by the backend. On mount each provider calls /auth/me
 * (or /admin/auth/me) to discover whether a valid session already exists.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  type ReactNode,
} from "react";
import {
  auth as apiAuth,
  adminAuth as apiAdminAuth,
  onCustomerSessionExpired,
  onAdminSessionExpired,
  type AuthUser,
} from "@/lib/api.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// ── Shared context shape ───────────────────────────────────────────────────────

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
  signout: () => Promise<void>;
  profile: { name: string; email: string; avatar: string | null } | null;
};

type AdminAuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

// ── Contexts ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);
const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

// ── Customer AuthProvider ──────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoad] = useState(true);
  const navigateRef = useRef<ReturnType<typeof useNavigate> | null>(null);

  // Bootstrap: try to fetch the current customer session from the cookie
  useEffect(() => {
    apiAuth
      .me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoad(false));
  }, []);

  // Register the session-expired callback so api.ts can clear user state
  // without importing React hooks
  useEffect(() => {
    onCustomerSessionExpired(() => {
      setUser(null);
      toast.error("Your session has expired. Please sign in again.");
      try {
        navigateRef.current?.("/auth/signin");
      } catch {
        window.location.href = "/auth/signin";
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiAuth.login({ email, password });
    setUser(data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      const data = await apiAuth.register({ name, email, password, phone });
      setUser(data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiAuth.logout();
    } catch {
      /* expired — ignore */
    }
    setUser(null);
    toast.success("Signed out");
  }, []);

  const signinRedirect = useCallback(() => {
    try {
      navigateRef.current?.("/auth/signin");
    } catch {
      window.location.href = "/auth/signin";
    }
  }, []);

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

// ── Admin AdminAuthProvider ────────────────────────────────────────────────────

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setLoad] = useState(true);
  const navigateRef = useRef<ReturnType<typeof useNavigate> | null>(null);

  // Bootstrap: try to fetch the current admin session from the cookie
  useEffect(() => {
    apiAdminAuth
      .me()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoad(false));
  }, []);

  // Register the session-expired callback
  useEffect(() => {
    onAdminSessionExpired(() => {
      setUser(null);
      toast.error("Admin session expired. Please sign in again.");
      try {
        navigateRef.current?.("/admin/login");
      } catch {
        window.location.href = "/admin/login";
      }
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiAdminAuth.login({ email, password });
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiAdminAuth.logout();
    } catch {
      /* ignore */
    }
    setUser(null);
    toast.success("Admin signed out");
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>
      <NavigateCapture ref={navigateRef} />
      {children}
    </AdminAuthContext.Provider>
  );
}

// ── NavigateCapture helper ─────────────────────────────────────────────────────

const NavigateCapture = forwardRef<ReturnType<typeof useNavigate> | null>(
  (_props, ref) => {
    const navigate = useNavigate();
    useImperativeHandle(ref, () => navigate, [navigate]);
    return null;
  },
);
NavigateCapture.displayName = "NavigateCapture";

// ── Customer hooks ─────────────────────────────────────────────────────────────

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

// ── Admin hooks ────────────────────────────────────────────────────────────────

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}

// ── Drop-in Convex replacements (customer context) ────────────────────────────

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
