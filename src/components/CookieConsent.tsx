/**
 * CookieConsent
 *
 * Shown once per browser until the user accepts or declines.
 * Consent state is stored in localStorage under "labi_cookie_consent"
 * (this is the ONLY thing we keep in localStorage — it is not a token or
 * personal data, just a UI preference flag).
 *
 * "Accept" — sets consent to "accepted", hides the banner.
 * "Decline" — sets consent to "declined", hides the banner.
 *             We still use essential session cookies regardless (they are
 *             required for the site to function).
 */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Cookie, X } from "lucide-react";

const CONSENT_KEY = "labi_cookie_consent";

type ConsentValue = "accepted" | "declined" | null;

function getStoredConsent(): ConsentValue {
  try {
    return (localStorage.getItem(CONSENT_KEY) as ConsentValue) ?? null;
  } catch {
    return null;
  }
}

function setStoredConsent(value: "accepted" | "declined") {
  try {
    localStorage.setItem(CONSENT_KEY, value);
  } catch {
    // Private browsing / quota exceeded — fail silently
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Short delay so it doesn't flash during SSR hydration or initial paint
    const t = setTimeout(() => {
      if (getStoredConsent() === null) setVisible(true);
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  const accept = () => {
    setStoredConsent("accepted");
    setVisible(false);
  };

  const decline = () => {
    setStoredConsent("declined");
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Subtle backdrop blur on mobile so banner stands out */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 z-[90] pointer-events-none md:hidden"
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            role="dialog"
            aria-live="polite"
            aria-label="Cookie consent"
            className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-6 md:right-auto md:max-w-md z-[100] bg-card border border-border shadow-2xl"
          >
            {/* Gold accent line */}
            <div className="h-[2px] w-full bg-primary" />

            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <Cookie size={16} className="text-primary shrink-0 mt-0.5" />
                  <p
                    className="text-xs tracking-[0.2em] uppercase text-foreground font-semibold"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Cookies & Privacy
                  </p>
                </div>
                <button
                  onClick={decline}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                  aria-label="Dismiss"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <p
                className="text-sm font-light text-muted-foreground leading-relaxed mb-5"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                We use <strong className="text-foreground font-normal">essential cookies</strong> to
                keep your session secure and your cart intact. We also use analytics
                cookies to understand how you shop so we can make LABI better.
              </p>

              <p
                className="text-[10px] text-muted-foreground/70 mb-5 leading-relaxed"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                By continuing to use this site you agree to our use of cookies.{" "}
                <Link
                  to="/about"
                  className="underline underline-offset-2 hover:text-primary transition-colors"
                >
                  Learn more
                </Link>
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={accept}
                  className="flex-1 bg-primary text-primary-foreground py-3 text-[10px] tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Accept All
                </button>
                <button
                  onClick={decline}
                  className="flex-1 border border-border text-muted-foreground py-3 text-[10px] tracking-[0.2em] uppercase hover:border-foreground/40 hover:text-foreground transition-colors cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Essential Only
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
