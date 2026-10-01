/**
 * CurrencyProvider — manages the active display/charge currency for the
 * entire Labi storefront.
 *
 * On first mount, it calls GET /v1/geo/context to detect the visitor's
 * country and fetch live FX rates + the admin-configured settings (enabled
 * currencies, FX buffer %).  The result is cached by TanStack Query for 4 h,
 * matching the backend's BullMQ FX-refresh interval.
 *
 * Manual override: the customer can change currency via the CurrencySwitcher.
 * The choice is stored in a `labi_currency` cookie so it survives page reloads
 * without requiring another API call.
 *
 * All monetary formatting goes through `formatAmount(ngnKobo)` — no component
 * should call the legacy `formatPrice()` from products.ts directly.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { geo } from "@/lib/api.ts";
import {
  formatAmount as pureFormatAmount,
  FALLBACK_RATES,
  readCurrencyCookie,
  writeCurrencyCookie,
  getRateForCurrency,
  type CurrencyRate,
} from "@/lib/currency.ts";
import { formatPrice } from "@/lib/products.ts";

// ── Context type ───────────────────────────────────────────────────────────────

export type CurrencyContextValue = {
  activeCurrency: string;
  rates: CurrencyRate[];
  enabledCurrencies: string[];
  fxBuffer: number;
  isLoading: boolean;
  staleRates: boolean;
  setCurrency: (code: string) => void;
  /**
   * Converts an NGN-kobo amount to the active (or specified) currency string.
   *
   * @param ngnKobo - Amount in NGN kobo (100 kobo = ₦1)
   * @param currency - Override currency; defaults to activeCurrency
   *
   * While loading, falls back to formatPrice(ngnKobo / 100) for NGN amounts.
   */
  formatAmount: (ngnKobo: number, currency?: string) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────────

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Seed from cookie so first render is already correct (avoids flash of NGN)
  const [activeCurrency, setActiveCurrencyState] = useState<string>(
    () => readCurrencyCookie() ?? "NGN",
  );

  const { data, isLoading } = useQuery({
    queryKey: ["geo-context"],
    queryFn: () => geo.getContext(),
    staleTime: 4 * 60 * 60 * 1000,   // 4 hours — matches backend refresh cron
    retry: 1,
    // Don't refetch on window focus — rates are updated by the backend cron
    refetchOnWindowFocus: false,
  });

  // Once geo data arrives, apply the detected currency ONLY when the user
  // hasn't already made a manual choice (no cookie override).
  useEffect(() => {
    if (data && !readCurrencyCookie()) {
      setActiveCurrencyState(data.currency);
    }
  }, [data]);

  const rates: CurrencyRate[] = data?.rates ?? FALLBACK_RATES;
  const enabledCurrencies: string[] = data?.enabledCurrencies ?? ["NGN"];
  const fxBuffer: number = data?.fxBuffer ?? 2;
  const staleRates: boolean = data?.staleRates ?? false;

  const setCurrency = useCallback((code: string) => {
    setActiveCurrencyState(code);
    writeCurrencyCookie(code);
  }, []);

  const formatAmount = useCallback(
    (ngnKobo: number, currency?: string): string => {
      const c = currency ?? activeCurrency;
      // While loading fall back to raw NGN display for NGN amounts
      if (isLoading && c === "NGN") {
        return formatPrice(ngnKobo / 100);
      }
      const rateEntry = getRateForCurrency(rates, c);
      return pureFormatAmount(
        ngnKobo,
        c,
        rateEntry.rate,
        fxBuffer,
        rateEntry.symbol,
      );
    },
    [activeCurrency, rates, fxBuffer, isLoading],
  );

  const value = useMemo<CurrencyContextValue>(
    () => ({
      activeCurrency,
      rates,
      enabledCurrencies,
      fxBuffer,
      isLoading,
      staleRates,
      setCurrency,
      formatAmount,
    }),
    [
      activeCurrency,
      rates,
      enabledCurrencies,
      fxBuffer,
      isLoading,
      staleRates,
      setCurrency,
      formatAmount,
    ],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used inside CurrencyProvider");
  }
  return ctx;
}
