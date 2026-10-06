/**
 * Auth Providers — httpOnly cookie auth on .labiafrica.com
 *
 * labiafrica.com (frontend) and api.labiafrica.com (backend) share the same
 * root domain. Cookies with domain=".labiafrica.com" are sent automatically
 * by the browser on every request — no tokens in localStorage.
 *
 * The user profile (id, name, email, role) is cached in localStorage so the
 * UI renders instantly on page refresh without waiting for /auth/me.
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
  markCustomerSessionActive,
  markAdminSessionActive,
  type AuthUser,
} from "@/lib/api.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// ── localStorage helpers ───────────────────────────────────────────────────────
// Stores the user profile (id, name, email, role) so the UI renders instantly

const USER_KEY = "labi_user";
const ADMIN_USER_KEY = "labi_admin_user";

function readUser(key: string): AuthUser | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

function writeUser(key: string, user: AuthUser): void {
  try {
    localStorage.setItem(key, JSON.stringify(user));
  } catch {
    /* quota */
  }
}

function clearUser(key: string): void {
  try {
    localStorage.removeItem(key);
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
  // Hydrate synchronously from localStorage so RequireAuth never sees
  // isLoading=true with no user on page refresh or tab navigation.
  const [user, setUser] = useState<AuthUser | null>(() => readUser(USER_KEY));
  const [isLoading, setLoad] = useState(true);
  const navigateRef = useRef<ReturnType<typeof useNavigate> | null>(null);

  // Background verify — confirm the stored token is still valid.
  // Pass context:"none" so a 401 here NEVER triggers the session-expired toast.
  // For a guest with no token, a 401 just means "not logged in" — not an expiry.
  useEffect(() => {
    apiAuth
      .me("none")
      .then((u) => {
        setUser(u);
        writeUser(USER_KEY, u);
        markCustomerSessionActive(); // arm the expiry callback — session confirmed active
      })
      .catch(() => {
        clearUser(USER_KEY);
        setUser(null);
      })
      .finally(() => setLoad(false));
  }, []);

  useEffect(() => {
    onCustomerSessionExpired(() => {
      clearUser(USER_KEY);
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
    writeUser(USER_KEY, data.user);
    markCustomerSessionActive();
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string, phone?: string) => {
      const data = await apiAuth.register({ name, email, password, phone });
      setUser(data.user);
      writeUser(USER_KEY, data.user);
      markCustomerSessionActive();
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiAuth.logout();
    } catch {
      /* expired — ignore */
    }
    clearUser(USER_KEY);
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
    readUser(ADMIN_USER_KEY),
  );
  const [isLoading, setLoad] = useState(true);
  const navigateRef = useRef<ReturnType<typeof useNavigate> | null>(null);

  useEffect(() => {
    apiAdminAuth
      .me("none")
      .then((u) => {
        setUser(u);
        writeUser(ADMIN_USER_KEY, u);
        markAdminSessionActive();
      })
      .catch(() => {
        clearUser(ADMIN_USER_KEY);
        setUser(null);
      })
      .finally(() => setLoad(false));
  }, []);

  useEffect(() => {
    onAdminSessionExpired(() => {
      clearUser(ADMIN_USER_KEY);
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
    writeUser(ADMIN_USER_KEY, data.user);
    markAdminSessionActive();
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiAdminAuth.logout();
    } catch {
      /* ignore */
    }
    clearUser(ADMIN_USER_KEY);
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
