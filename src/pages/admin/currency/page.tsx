/**
 * Admin Currency Config page — GET/PATCH /v1/admin/currency-config
 *
 * Lets admins change:
 *  - enabled currencies list
 *  - FX buffer %
 *  - stale-rate alert threshold
 *
 * Uses the same design tokens as every other admin page.
 * Matches the pattern of other admin pages (no extra libraries, just fetch + toast).
 */
import { useEffect, useState } from "react";
import { Check, RefreshCw, AlertTriangle } from "lucide-react";
import {
  adminCurrencyConfig,
  type ApiCurrencyConfig,
  ApiError,
} from "@/lib/api.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";

const ALL_CURRENCIES = [
  "NGN",
  "USD",
  "GBP",
  "EUR",
  "GHS",
  "KES",
  "ZAR",
] as const;

export default function AdminCurrencyPage() {
  const [config, setConfig] = useState<ApiCurrencyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Editable fields
  const [enabledCurrencies, setEnabledCurrencies] = useState<string[]>([]);
  const [fxBuffer, setFxBuffer] = useState<number>(2);
  const [staleThreshold, setStaleThreshold] = useState<number>(240);

  // ── Load on mount ──────────────────────────────────────────────────────────

  useEffect(() => {
    adminCurrencyConfig
      .get()
      .then((cfg) => {
        setConfig(cfg);
        setEnabledCurrencies(cfg.enabledCurrencies);
        setFxBuffer(cfg.fxBuffer);
        setStaleThreshold(cfg.staleRateThresholdMinutes);
      })
      .catch((err: unknown) => {
        const msg =
          err instanceof ApiError
            ? err.message
            : "Could not load currency config";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enabledCurrencies.length === 0) {
      toast.error("At least one currency must be enabled");
      return;
    }
    if (!enabledCurrencies.includes("NGN")) {
      toast.error(
        "NGN (Nigerian Naira) must always be enabled — it is the store's base currency",
      );
      return;
    }
    setSaving(true);
    try {
      const updated = await adminCurrencyConfig.update({
        enabledCurrencies,
        fxBuffer,
        staleRateThresholdMinutes: staleThreshold,
      });
      setConfig(updated);
      toast.success("Currency settings saved");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleCurrency = (code: string) => {
    setEnabledCurrencies((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <p
          className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Admin
        </p>
        <h1
          className="text-3xl font-light text-foreground"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Currency Settings
        </h1>
        <p
          className="text-xs text-muted-foreground mt-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Configure which currencies customers can pay in, the FX buffer margin,
          and the stale-rate alert threshold.
        </p>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span
            className="text-sm"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Loading…
          </span>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 border border-destructive/30 px-4 py-3 flex items-start gap-3">
          <AlertTriangle
            size={14}
            className="text-destructive mt-0.5 shrink-0"
          />
          <p
            className="text-xs text-destructive"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {error}
          </p>
        </div>
      )}

      {config && !loading && (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Enabled currencies */}
          <Section
            title="Enabled Currencies"
            desc="Customers will be able to browse and pay in these currencies. NGN is always required."
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
              {ALL_CURRENCIES.map((code) => {
                const active = enabledCurrencies.includes(code);
                const isBase = code === "NGN";
                return (
                  <label
                    key={code}
                    className={`flex items-center gap-2.5 px-3 py-2.5 border cursor-pointer transition-all ${
                      active
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:border-foreground/40"
                    } ${isBase ? "opacity-60 pointer-events-none" : ""}`}
                  >
                    <div
                      className={`w-4 h-4 border flex items-center justify-center shrink-0 ${active ? "border-primary" : "border-muted-foreground"}`}
                    >
                      {active && <div className="w-2 h-2 bg-primary" />}
                    </div>
                    <span
                      className="text-xs"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {code}
                      {isBase && (
                        <span className="text-[9px] text-muted-foreground ml-1">
                          (base)
                        </span>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={active}
                      onChange={() => !isBase && toggleCurrency(code)}
                      aria-label={`Enable ${code}`}
                    />
                  </label>
                );
              })}
            </div>
          </Section>

          {/* FX Buffer */}
          <Section
            title="FX Buffer"
            desc="Percentage margin added on top of live rates to absorb volatility between rate fetch and customer payment. Default: 2%."
          >
            <div className="flex items-center gap-4 mt-3">
              <div className="relative w-36">
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={fxBuffer}
                  onChange={(e) => setFxBuffer(parseFloat(e.target.value) || 0)}
                  className="checkout-input pr-8"
                  aria-label="FX buffer percentage"
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  %
                </span>
              </div>
              <p
                className="text-xs text-muted-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Range: 0–20%. A higher buffer offers more protection but makes
                prices less competitive.
              </p>
            </div>
          </Section>

          {/* Stale rate threshold */}
          <Section
            title="Stale Rate Alert Threshold"
            desc="If FX rates haven't been refreshed within this many minutes, the storefront shows a staleness warning."
          >
            <div className="flex items-center gap-4 mt-3">
              <div className="relative w-36">
                <input
                  type="number"
                  min={30}
                  max={1440}
                  step={30}
                  value={staleThreshold}
                  onChange={(e) =>
                    setStaleThreshold(parseInt(e.target.value, 10) || 240)
                  }
                  className="checkout-input pr-10"
                  aria-label="Stale rate threshold in minutes"
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground pointer-events-none"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  min
                </span>
              </div>
              <p
                className="text-xs text-muted-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Recommended: 240 (4 h) to match the BullMQ refresh cron.
              </p>
            </div>
          </Section>

          {/* Current rates summary (read-only) */}
          {config.updatedAt && (
            <div className="bg-muted/40 border border-border px-4 py-3 flex items-start gap-3">
              <RefreshCw
                size={13}
                className="text-muted-foreground mt-0.5 shrink-0"
              />
              <p
                className="text-xs text-muted-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Config last updated:{" "}
                {new Date(config.updatedAt).toLocaleString("en-NG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {/* Save */}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {saving ? (
              <>
                <Spinner className="size-4" /> Saving…
              </>
            ) : (
              <>
                <Check size={13} /> Save Settings
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Shared primitive ───────────────────────────────────────────────────────────

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-1">
        <div className="w-5 h-[1px] bg-primary" />
        <h2
          className="text-xs tracking-[0.3em] uppercase text-primary font-semibold"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {title}
        </h2>
      </div>
      <p
        className="text-xs text-muted-foreground ml-9"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {desc}
      </p>
      <div className="ml-9">{children}</div>
    </div>
  );
}
