/**
 * LabiSplash — first-launch branded splash screen for the installed PWA.
 *
 * Shows an Aso oke-inspired weave animation with the Lábí brand mark.
 * Only appears when:
 *  - Running in standalone mode (installed to Home Screen), AND
 *  - localStorage key "labi-splash-seen" is not set.
 *
 * Sets the flag immediately when the splash starts (not when it finishes)
 * so it can never repeat even if the user closes the app mid-animation.
 *
 * Dev-only override: add ?forceSplash=1 to the URL to preview on desktop.
 * This bypass is guarded by import.meta.env.DEV and cannot ship to production.
 *
 * SSR-safe: all detection happens inside useEffect with initial state hidden.
 */
import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "labi-splash-seen";

// ── Types ────────────────────────────────────────────────────────────────────

declare global {
  interface Navigator {
    /** Safari-only: true when running as an installed PWA. */
    standalone?: boolean;
  }
}

// ── Aso oke strip definitions ─────────────────────────────────────────────────

type Strip = { flex: number; bg: string; pattern: boolean };

const STRIPS: Strip[] = [
  { flex: 3, bg: "#000000", pattern: false },
  { flex: 1, bg: "#FED700", pattern: false },
  { flex: 4, bg: "#7A1F1F", pattern: true },
  { flex: 1, bg: "#000000", pattern: false },
  { flex: 3, bg: "#FFF4C2", pattern: true },
  { flex: 2, bg: "#000000", pattern: true },
  { flex: 1, bg: "#7A1F1F", pattern: false },
  { flex: 4, bg: "#FED700", pattern: true },
  { flex: 1, bg: "#000000", pattern: false },
  { flex: 3, bg: "#7A1F1F", pattern: true },
  { flex: 2, bg: "#FFF4C2", pattern: false },
  { flex: 3, bg: "#000000", pattern: true },
];

// Diamond / lozenge pattern — yellow lines on dark strips at ±45°
const DIAMOND =
  "repeating-linear-gradient(45deg, rgba(254,215,0,.85) 0 5px, transparent 5px 10px), repeating-linear-gradient(-45deg, rgba(254,215,0,.85) 0 5px, transparent 5px 10px)";

// ── Weave band component ──────────────────────────────────────────────────────

function WeaveBand({ position }: { position: "top" | "bottom" }) {
  return (
    <div
      className={`absolute inset-x-0 flex h-[22%] overflow-hidden ${
        position === "top" ? "top-0" : "bottom-0"
      }`}
    >
      {STRIPS.map((s, i) => (
        <div
          key={i}
          className={`labi-strip ${
            i % 2 === 0 ? "labi-from-top" : "labi-from-bottom"
          }`}
          style={{
            flexGrow: s.flex,
            backgroundColor: s.bg,
            backgroundImage: s.pattern ? DIAMOND : undefined,
            animationDelay: `${(position === "top" ? i : STRIPS.length - i) * 0.08}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Detection helpers (all called from useEffect, never during render) ────────

function isStandalone(): boolean {
  return (
    navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function shouldShow(): boolean {
  // Dev-only override: ?forceSplash=1 bypasses standalone check + localStorage
  if (import.meta.env.DEV) {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("forceSplash") === "1") return true;
    } catch {
      // ignore
    }
  }

  if (!isStandalone()) return false;

  try {
    if (localStorage.getItem(STORAGE_KEY)) return false;
    // Set immediately so it never repeats even if the app closes mid-animation
    localStorage.setItem(STORAGE_KEY, "1");
    return true;
  } catch {
    // localStorage unavailable (private mode) — do not show
    return false;
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export function LabiSplash() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Detection — runs after mount, SSR-safe
  useEffect(() => {
    if (shouldShow()) setVisible(true);
  }, []);

  // Auto-dismiss timers
  useEffect(() => {
    if (!visible) return;

    let reduce = false;
    try {
      reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      // ignore
    }

    const t1 = setTimeout(() => setLeaving(true), reduce ? 1200 : 3400);
    const t2 = setTimeout(() => setVisible(false), reduce ? 1500 : 4100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [visible]);

  // Skip on tap
  const skip = useCallback(() => {
    setLeaving(true);
    setTimeout(() => setVisible(false), 300);
  }, []);

  // Escape key also skips
  useEffect(() => {
    if (!visible) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") skip();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [visible, skip]);

  if (!visible) return null;

  return (
    <div
      role="presentation"
      onClick={skip}
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-[#FED700] ${
        leaving ? "labi-out" : ""
      }`}
    >
      <style>{`
        @keyframes labiFromTop {
          from { transform: translateY(-110%) }
          to   { transform: translateY(0) }
        }
        @keyframes labiFromBottom {
          from { transform: translateY(110%) }
          to   { transform: translateY(0) }
        }
        @keyframes labiFadeUp {
          from { opacity: 0; transform: translateY(14px) }
          to   { opacity: 1; transform: translateY(0) }
        }
        @keyframes labiOut {
          to { opacity: 0; transform: scale(1.04) }
        }

        .labi-strip {
          animation-duration: 0.7s;
          animation-fill-mode: both;
          animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
        }
        .labi-from-top    { animation-name: labiFromTop }
        .labi-from-bottom { animation-name: labiFromBottom }

        .labi-logo { animation: labiFadeUp 0.9s 0.9s both ease-out }
        .labi-sub  { animation: labiFadeUp 0.9s 1.3s both ease-out }
        .labi-tag  { animation: labiFadeUp 0.9s 1.8s both ease-out }

        .labi-out { animation: labiOut 0.6s ease-in forwards }

        @media (prefers-reduced-motion: reduce) {
          .labi-strip,
          .labi-logo,
          .labi-sub,
          .labi-tag { animation: none }
        }
      `}</style>

      {/* Aso oke weave bands */}
      <WeaveBand position="top" />
      <WeaveBand position="bottom" />

      {/* Centre content */}
      <div className="relative z-10 px-6 text-center text-black">
        <h1
          className="labi-logo text-7xl font-extrabold tracking-tight"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Lábí
        </h1>
        <p
          className="labi-sub mt-2 text-2xl font-medium italic"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          ẹ̀wà ọmọlúàbí
        </p>
        <p
          className="labi-tag mt-6 text-xs uppercase tracking-[0.3em] text-black/70"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Woven with character
        </p>
      </div>
    </div>
  );
}

export default LabiSplash;
