import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";
import { ApiError } from "@/lib/api.ts";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner.tsx";

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const redirect = params.get("redirect") ?? "/account";

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (isAuthenticated) {
    navigate(redirect, { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.phone || undefined);
      toast.success("Account created — welcome to Labi!");
      navigate(redirect, { replace: true });
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Registration failed. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [field]: e.target.value });

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
            Join Labi
          </p>
          <h1
            className="text-4xl font-light text-foreground mb-10"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Create an account
          </h1>

          {error && (
            <div className="mb-6 bg-destructive/10 border border-destructive/30 px-4 py-3 text-xs text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="field-label">Full Name *</label>
              <input
                required
                value={form.name}
                onChange={set("name")}
                placeholder="Amara Okafor"
                className="checkout-input"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="field-label">Email Address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={set("email")}
                placeholder="amara@example.com"
                className="checkout-input"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="field-label">Phone Number</label>
              <input
                type="tel"
                value={form.phone}
                onChange={set("phone")}
                placeholder="+234 800 000 0000"
                className="checkout-input"
                autoComplete="tel"
              />
            </div>

            <div>
              <label className="field-label">Password * (min. 8 characters)</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="Choose a strong password"
                  className="checkout-input pr-11"
                  autoComplete="new-password"
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

            <div>
              <label className="field-label">Confirm Password *</label>
              <input
                type={showPw ? "text" : "password"}
                required
                value={form.confirmPassword}
                onChange={set("confirmPassword")}
                placeholder="Repeat your password"
                className="checkout-input"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em]
                         uppercase font-semibold hover:bg-primary/90 transition-colors
                         disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {loading ? (
                <>
                  <Spinner className="size-4" /> Creating account…
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-border text-center">
            <p
              className="text-xs text-muted-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Already have an account?{" "}
              <Link
                to={`/auth/signin${redirect !== "/account" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
