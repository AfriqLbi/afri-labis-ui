/**
 * Auth Providers — cookie-based JWT auth for the Labi storefront.
 *
 * Two completely separate contexts:
 *   AuthProvider      — storefront customers  (cookie: labi_token)
 *   AdminAuthProvider — admin panel staff     (cookie: labi_admin_token)
 *
 * Session continuity strategy:
 *   1. On login/register the user object is written to sessionStorage
 *      under "labi_user_session" so it survives SPA navigation without
 *      re-fetching /auth/me on every route change.
 *   2. On mount we hydrate from sessionStorage immediately (synchronously),
 *      then verify with a background /auth/me call. This eliminates the flash
 *      where isLoading=true causes RequireAuth to redirect before the fetch
 *      resolves — the common cause of "kicked to sign-in on mobile navigation".
 *   3. If /auth/me fails the sessionStorage entry is cleared and the user is
 *      logged out cleanly.
 *   4. On logout both cookie (via backend) and sessionStorage are cleared.
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

// ── sessionStorage helpers (non-sensitive — user metadata only, no tokens) ─────

const SESSION_KEY = "labi_user_session";
const ADMIN_SESSION_KEY = "labi_admin_session";

function readSession(key: string): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeSession(key: string, user: AuthUser): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(user));
  } catch {
    /* quota */
  }
}

function clearSession(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// ── Context types ──────────────────────────────────────────────────────────────

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
  // Hydrate synchronously from sessionStorage so RequireAuth never sees
  // isLoading=true with no user when navigating between tabs on mobile.
  const [user, setUser] = useState<AuthUser | null>(() =>
    readSession(SESSION_KEY),
  );
  const [isLoading, setLoad] = useState(true);
  const navigateRef = useRef<ReturnType<typeof useNavigate> | null>(null);

  // Background verify — confirm the session cookie is still valid
  useEffect(() => {
    apiAuth
      .me()
      .then((u) => {
        setUser(u);
        writeSession(SESSION_KEY, u);
      })
      .catch(() => {
        // /auth/me failed — cookie expired or missing
        clearSession(SESSION_KEY);
        setUser(null);
      })
      .finally(() => setLoad(false));
  }, []);

  useEffect(() => {
    onCustomerSessionExpired(() => {
      clearSession(SESSION_KEY);
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
    writeSession(SESSION_KEY, data.user);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      const data = await apiAuth.register({ name, email, password, phone });
      setUser(data.user);
      writeSession(SESSION_KEY, data.user);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiAuth.logout();
    } catch {
      /* expired — ignore */
    }
    clearSession(SESSION_KEY);
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
  const [user, setUser] = useState<AuthUser | null>(() =>
    readSession(ADMIN_SESSION_KEY),
  );
  const [isLoading, setLoad] = useState(true);
  const navigateRef = useRef<ReturnType<typeof useNavigate> | null>(null);

  useEffect(() => {
    apiAdminAuth
      .me()
      .then((u) => {
        setUser(u);
        writeSession(ADMIN_SESSION_KEY, u);
      })
      .catch(() => {
        clearSession(ADMIN_SESSION_KEY);
        setUser(null);
      })
      .finally(() => setLoad(false));
  }, []);

  useEffect(() => {
    onAdminSessionExpired(() => {
      clearSession(ADMIN_SESSION_KEY);
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
    writeSession(ADMIN_SESSION_KEY, data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiAdminAuth.logout();
    } catch {
      /* ignore */
    }
    clearSession(ADMIN_SESSION_KEY);
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
