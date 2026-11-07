/**
 * Google Analytics 4 utility — thin typed wrapper around gtag().
 *
 * If VITE_GA_MEASUREMENT_ID is empty, the gtag script in index.html
 * loads with a blank ID and never initialises. Every function below
 * checks for `window.gtag` before calling, so it is safe to call
 * unconditionally from anywhere in the app.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GtagFn = (...args: any[]) => void;

declare global {
  interface Window {
    gtag?: GtagFn;
    dataLayer?: unknown[];
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const ENABLED = !!GA_ID && typeof window !== "undefined" && !!window.gtag;

// ── Core ──────────────────────────────────────────────────────────────────────

/** Send a GA4 event. No-op when GA is disabled or gtag isn't loaded. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function track(eventName: string, params?: Record<string, any>): void {
  if (!ENABLED || !window.gtag) return;
  window.gtag("event", eventName, params);
}

/** Manually send a page_view (used by the route-change hook). */
export function pageView(path: string, title?: string): void {
  if (!ENABLED || !window.gtag) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: title,
    page_location: window.location.origin + path,
  });
}

// ── Ecommerce helpers (GA4 spec) ─────────────────────────────────────────────

export type GtagItem = {
  item_id: string;
  item_name: string;
  item_category?: string;
  item_brand?: string;
  price?: number;
  quantity?: number;
};

/** Product detail page view. */
export function viewItem(item: GtagItem): void {
  track("view_item", {
    currency: "NGN",
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [item],
  });
}

/** Add to cart. */
export function addToCart(item: GtagItem): void {
  track("add_to_cart", {
    currency: "NGN",
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [item],
  });
}

/** Begin checkout. */
export function beginCheckout(
  items: GtagItem[],
  value: number,
  currency = "NGN",
): void {
  track("begin_checkout", { currency, value, items });
}

/** Purchase — fired after payment is confirmed. */
export function purchase(
  transactionId: string,
  items: GtagItem[],
  value: number,
  currency = "NGN",
): void {
  track("purchase", {
    transaction_id: transactionId,
    currency,
    value,
    items,
  });
}

/** Custom event — e.g. sign_up, search, share. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function trackCustom(name: string, params?: Record<string, any>): void {
  track(name, params);
}
