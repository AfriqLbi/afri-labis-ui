import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "@/hooks/use-auth.ts";
import { ApiError } from "@/lib/api.ts";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner.tsx";

export default function AdminLoginPage() {
  const { login, isAuthenticated, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") ?? "/admin";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  // Already signed in — redirect
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirect, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirect]);

  if (isLoading || isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Sign-in failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0a0a] border-r border-border items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 opacity-10 bg-cover bg-center"
          style={{ backgroundImage: `url("https://images.unsplash.com/photo-1552710307-537199cd41c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200")` }}
        />
        <div className="relative z-10 text-center px-12 space-y-4">
          <p
            className="text-5xl font-bold tracking-[0.3em] text-primary"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            LABI
          </p>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <ShieldCheck size={14} className="text-primary" />
            <p
              className="text-xs tracking-[0.2em] uppercase"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Admin Portal
            </p>
          </div>
          <p
            className="text-muted-foreground text-base font-light max-w-xs mx-auto"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Restricted access. This portal is for authorised LABI staff only.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors mb-10"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <ArrowLeft size={11} /> Back to Store
          </Link>

          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck size={18} className="text-primary" />
            <p
              className="text-[10px] tracking-[0.3em] uppercase text-primary"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Admin Portal
            </p>
          </div>

          <h1
            className="text-4xl font-light text-foreground mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Staff Sign In
          </h1>
          <p
            className="text-sm text-muted-foreground mb-10 font-light"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Use your LABI staff credentials. Customer accounts are not accepted here.
          </p>

          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/30 px-4 py-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Staff Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@labi.ng"
                className="checkout-input"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div>
              <label
                className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="checkout-input pr-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {loading ? <><Spinner className="size-4" /> Signing in…</> : "Sign In to Admin"}
            </button>
          </form>

          <p
            className="mt-8 pt-6 border-t border-border text-[10px] text-muted-foreground text-center tracking-wide"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Not a staff member?{" "}
            <Link to="/auth/signin" className="text-primary hover:underline underline-offset-2">
              Go to customer sign-in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
