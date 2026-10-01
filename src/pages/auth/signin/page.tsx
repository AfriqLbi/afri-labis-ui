import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";
import { ApiError } from "@/lib/api.ts";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner.tsx";

export default function SignInPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") ?? "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already signed in
  if (isAuthenticated) {
    navigate(redirect, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left — decorative */}
      <div
        className="hidden lg:flex lg:w-1/2 relative bg-card border-r border-border
                   items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80')] bg-cover bg-center opacity-30" />
        <div className="relative z-10 text-center px-12">
          <p
            className="text-5xl font-bold tracking-[0.3em] text-primary mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            LABI
          </p>
          <p
            className="text-muted-foreground text-lg font-light"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Rooted in Heritage.
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" as const }}
          className="w-full max-w-md"
        >
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase
                       text-muted-foreground hover:text-primary transition-colors mb-10"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <ArrowLeft size={11} /> Back to Store
          </Link>

          <p
            className="text-[10px] tracking-[0.3em] uppercase text-primary mb-3"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Welcome back
          </p>
          <h1
            className="text-4xl font-light text-foreground mb-10"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Sign in
          </h1>

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
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="amara@example.com"
                className="checkout-input"
                autoComplete="email"
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
              className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em]
                         uppercase font-semibold hover:bg-primary/90 transition-colors
                         disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {loading ? (
                <>
                  <Spinner className="size-4" /> Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p
              className="text-xs text-muted-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Don&apos;t have an account?{" "}
              <Link
                to={`/auth/register${redirect !== "/account" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Create one
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
