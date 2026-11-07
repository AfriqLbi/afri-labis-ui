/**
 * IosInstallPrompt
 *
 * iOS Safari does not support the `beforeinstallprompt` event, so we detect
 * iOS devices and show our own bottom banner that guides the user through
 * Share → Add to Home Screen.
 *
 * Behaviour:
 *  - Shows only on iOS (iPhone, iPad, iPod, and iPadOS reporting as MacIntel).
 *  - Never shows if the app is already running standalone (home screen).
 *  - Never shows if the user previously dismissed it (localStorage flag).
 *  - All detection runs inside useEffect — SSR-safe, no hydration mismatch.
 */
import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Share, Plus, ArrowRight } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

declare global {
  interface Navigator {
    /** Safari-only property; true when running as an installed PWA. */
    standalone?: boolean;
  }
}

const STORAGE_KEY = "ios-install-prompt-dismissed";
const APP_NAME = "LÁBí";
const APP_ICON = "/apple-touch-icon.png";

// ── Detection helpers ────────────────────────────────────────────────────────

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const platform = navigator.platform ?? "";

  // Classic iOS devices
  if (/iPhone|iPad|iPod/i.test(ua)) return true;

  // iPadOS 13+ reports as MacIntel but has touch support
  if (platform === "MacIntel" && navigator.maxTouchPoints > 1) return true;

  return false;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function isDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    // localStorage is unavailable (private mode) — treat as dismissed
    return true;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore — best effort
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function IosInstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (isStandalone() || isDismissed() || !isIOS()) return;
    // Small delay so it doesn't flash during page load
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setDismissed();
  }, []);

  const handleInstall = useCallback(() => {
    setSheetOpen(true);
  }, []);

  const closeSheet = useCallback(() => {
    setSheetOpen(false);
    dismiss();
  }, []);

  // Escape key closes the sheet
  useEffect(() => {
    if (!sheetOpen) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [sheetOpen, closeSheet]);

  if (!visible && !sheetOpen) return null;

  return (
    <>
      {/* ── Bottom banner ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && !sheetOpen && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-2xl"
            style={{
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
              {/* App icon */}
              <img
                src={APP_ICON}
                alt=""
                width={44}
                height={44}
                className="w-11 h-11 rounded-lg shrink-0"
              />

              {/* Title + subtitle */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-xs font-semibold text-foreground"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Install {APP_NAME}
                </p>
                <p
                  className="text-[11px] text-muted-foreground truncate"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Add to your Home Screen for a faster, app-like experience
                </p>
              </div>

              {/* Install button */}
              <button
                onClick={handleInstall}
                className="bg-primary text-primary-foreground px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Install
              </button>

              {/* Close */}
              <button
                onClick={dismiss}
                aria-label="Dismiss"
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Instructions sheet ───────────────────────────────────────────── */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeSheet}
              className="fixed inset-0 z-[60] bg-black/70"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              role="dialog"
              aria-modal="true"
              aria-label={`Install ${APP_NAME} instructions`}
              className="fixed bottom-0 left-0 right-0 z-[60] bg-card border-t border-border rounded-t-2xl"
              style={{
                paddingBottom: "env(safe-area-inset-bottom, 0px)",
              }}
            >
              <div className="max-w-2xl mx-auto px-6 pt-6 pb-8">
                {/* Drag handle */}
                <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-6" />

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <img
                    src={APP_ICON}
                    alt=""
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-lg shrink-0"
                  />
                  <div>
                    <p
                      className="text-sm font-semibold text-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Add {APP_NAME} to your Home Screen
                    </p>
                    <p
                      className="text-[11px] text-muted-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Follow these steps in Safari
                    </p>
                  </div>
                </div>

                {/* Step 1 — Share */}
                <div className="flex items-start gap-4 mb-5">
                  <span
                    className="w-7 h-7 bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 rounded-full"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    1
                  </span>
                  <div className="flex-1 pt-0.5">
                    <p
                      className="text-sm text-foreground flex items-center gap-2 flex-wrap"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Tap the{" "}
                      <span className="inline-flex items-center gap-1 text-primary font-semibold">
                        <Share size={14} /> Share
                      </span>{" "}
                      button in Safari's toolbar
                    </p>
                  </div>
                </div>

                {/* Step 2 — Add to Home Screen */}
                <div className="flex items-start gap-4 mb-5">
                  <span
                    className="w-7 h-7 bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 rounded-full"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    2
                  </span>
                  <div className="flex-1 pt-0.5">
                    <p
                      className="text-sm text-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Scroll down and tap{" "}
                      <span className="inline-flex items-center gap-1 text-primary font-semibold">
                        <Plus size={14} /> Add to Home Screen
                      </span>
                    </p>
                  </div>
                </div>

                {/* Step 3 — Add */}
                <div className="flex items-start gap-4 mb-7">
                  <span
                    className="w-7 h-7 bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0 rounded-full"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    3
                  </span>
                  <div className="flex-1 pt-0.5">
                    <p
                      className="text-sm text-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Tap{" "}
                      <span className="text-primary font-semibold">Add</span>{" "}
                      in the top right
                    </p>
                  </div>
                </div>

                {/* Got it button */}
                <button
                  onClick={closeSheet}
                  className="w-full bg-primary text-primary-foreground py-3.5 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default IosInstallPrompt;
