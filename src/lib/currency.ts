/**
 * Currency utility functions — pure, no React dependencies.
 *
 * All prices in Labi are stored in NGN (as full naira, not kobo) in the
 * frontend state (CartProvider.subtotal, product.price, etc.).
 * The backend stores kobo; the CurrencyProvider handles the ÷100 conversion.
 *
 * Conversion formula (PRD §1.10.2):
 *   displayAmount = (ngnKobo / 100) × rate × (1 + fxBuffer / 100)
 *
 * The buffer absorbs volatility between when rates are fetched and when the
 * customer pays. Default: 2%.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type CurrencyRate = {
  currency: string;
  rate: number;   // 1 NGN = rate units of currency
  symbol: string;
  flag: string;
};

// ── Constants ──────────────────────────────────────────────────────────────────

/** Decimal places per currency for display. */
export const CURRENCY_DECIMALS: Record<string, number> = {
  NGN: 0,
  USD: 2,
  GBP: 2,
  EUR: 2,
  CAD: 2,
  GHS: 0,
  KES: 0,
  ZAR: 0,
};

/** Currency symbols. */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  CAD: "CA$",
  GHS: "GH₵",
  KES: "KSh",
  ZAR: "R",
};

/** Fallback rates (1 NGN = X) used before the API responds. */
export const FALLBACK_RATES: CurrencyRate[] = [
  { currency: "NGN", rate: 1,          symbol: "₦",   flag: "🇳🇬" },
  { currency: "USD", rate: 1 / 1550,   symbol: "$",   flag: "🇺🇸" },
  { currency: "GBP", rate: 1 / 1980,   symbol: "£",   flag: "🇬🇧" },
  { currency: "EUR", rate: 1 / 1700,   symbol: "€",   flag: "🇪🇺" },
  { currency: "GHS", rate: 1 / 118,    symbol: "GH₵", flag: "🇬🇭" },
  { currency: "KES", rate: 1 / 12,     symbol: "KSh", flag: "🇰🇪" },
  { currency: "ZAR", rate: 1 / 85,     symbol: "R",   flag: "🇿🇦" },
];

// ── Pure helpers ───────────────────────────────────────────────────────────────

export function getRateForCurrency(
  rates: CurrencyRate[],
  currency: string,
): CurrencyRate {
  return (
    rates.find((r) => r.currency === currency) ??
    FALLBACK_RATES.find((r) => r.currency === currency) ??
    FALLBACK_RATES[0]
  );
}

/**
 * Converts an NGN-kobo amount to a display string in the target currency.
 *
 * @param ngnKobo - Amount in NGN minor units (100 kobo = ₦1)
 * @param currency - ISO 4217 target currency
 * @param rate     - 1 NGN = `rate` units of `currency`
 * @param fxBuffer - Buffer percentage (e.g. 2 for 2%)
 * @param symbol   - Currency symbol prefix
 *
 * Property: formatAmount(kobo, "NGN", 1, 0, "₦") === "₦{kobo/100}"
 */
export function formatAmount(
  ngnKobo: number,
  currency: string,
  rate: number,
  fxBuffer: number,
  symbol: string,
): string {
  const displayAmount = (ngnKobo / 100) * rate * (1 + fxBuffer / 100);
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  return `${symbol}${displayAmount.toLocaleString("en-NG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Formats an amount already in the currency's minor units (e.g. cents for USD).
 * Used on the order tracking page to display chargeTotal.
 *
 * @param minorAmount - Amount in the currency's minor unit
 * @param currency    - ISO 4217 code
 */
export function formatMinorUnits(
  minorAmount: number,
  currency: string,
): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const decimals = CURRENCY_DECIMALS[currency] ?? 2;
  const displayAmount = minorAmount / 100;
  return `${symbol}${displayAmount.toLocaleString("en-NG", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/**
 * Reads the labi_currency cookie without React.
 * Used on first render before the CurrencyProvider mounts.
 */
export function readCurrencyCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)labi_currency=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Writes the labi_currency cookie.
 * SameSite=Lax, NOT HttpOnly (UI preference, not a security token).
 */
export function writeCurrencyCookie(code: string): void {
  if (typeof document === "undefined") return;
  const maxAge = 30 * 24 * 60 * 60; // 30 days
  document.cookie = `labi_currency=${encodeURIComponent(code)}; max-age=${maxAge}; path=/; SameSite=Lax`;
}
