/**
 * SwUpdatePrompt
 *
 * Shows a small toast-style banner at the bottom of the screen when the
 * service worker has a new version ready.  The user can dismiss or click
 * "Refresh" to activate the update immediately.
 *
 * The component is rendered once inside DefaultProviders and is invisible
 * until vite-plugin-pwa signals that an update is waiting.
 */
import { useRegisterSW } from "virtual:pwa-register/react";
import { RefreshCw, X } from "lucide-react";

export default function SwUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      // Re-check for updates every hour while the tab is open
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-9999 flex items-center gap-3 bg-card border border-primary/40 shadow-lg px-5 py-3 max-w-sm w-[calc(100%-2rem)]"
    >
      <RefreshCw size={14} className="text-primary shrink-0" />
      <p
        className="flex-1 text-xs text-foreground"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        A new version is available.
      </p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="text-[10px] tracking-[0.15em] uppercase text-primary-foreground bg-primary px-3 py-1.5 hover:bg-primary/90 transition-colors cursor-pointer shrink-0"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        Refresh
      </button>
      <button
        onClick={() => setNeedRefresh(false)}
        className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
