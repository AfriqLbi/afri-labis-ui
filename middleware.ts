/**
 * Vercel Routing Middleware — Product OG tag injection
 *
 * Problem: This is a Vite SPA. Every URL is served as the same static
 * index.html. Social media crawlers (WhatsApp, iMessage, Twitter/X, Telegram,
 * Slack, Facebook, LinkedIn) don't execute JavaScript, so PageMeta's
 * useEffect never fires for them — they always see the generic site-level
 * OG tags regardless of which product URL is shared.
 *
 * Solution: This middleware runs at the Vercel Node.js runtime layer before
 * the static file is served. When it detects a known bot User-Agent visiting
 * a /shop/:slug URL, it:
 *   1. Fetches the product data from the backend API
 *   2. Reads the static index.html from the same origin
 *   3. Strips the generic OG/Twitter meta tags and injects product-specific ones
 *   4. Returns the patched HTML — the bot sees the right image + title
 *
 * Normal browser requests call next() and pass straight through with zero
 * added latency.
 *
 * Runtime: nodejs (default for middleware.ts file convention on Vercel)
 */

import { next } from "@vercel/functions";

export const config = {
  // Only intercept /shop/* — everything else (static assets, API proxies,
  // homepage, checkout, etc.) passes through untouched.
  matcher: "/shop/:slug*",
  runtime: "nodejs",
};

// ── Bot detection ─────────────────────────────────────────────────────────────
// These are the UA fragments used by the major social share crawlers.
// We deliberately keep this narrow — real browsers must NOT hit the SSR path.
const BOT_UA_PATTERNS = [
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "whatsapp",
  "slackbot",
  "slack-imgproxy",
  "telegrambot",
  "linkedinbot",
  "pinterest",
  "discordbot",
  "applebot",
  "googlebot",
  "bingbot",
  "embedly",
  "outbrain",
  "quora link preview",
  "rogerbot",
  "showyoubot",
  "skypeuripreview",
  "vkshare",
  "w3c_validator",
  "xing-contenttabreceiver",
];

function isBot(userAgent: string): boolean {
  const ua = userAgent.toLowerCase();
  return BOT_UA_PATTERNS.some((p) => ua.includes(p));
}

// ── Cloudinary OG image transform ────────────────────────────────────────────
// Inserts w_1200,h_630,c_fill,g_center transformations into Cloudinary upload
// URLs to produce a properly-sized OG image from whatever the backend stored.
const CLOUDINARY_UPLOAD_RE =
  /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

function toOgImage(src: string): string {
  const match = CLOUDINARY_UPLOAD_RE.exec(src);
  if (match) {
    return `${match[1]}w_1200,h_630,c_fill,g_center,f_jpg,q_auto/${match[2]}`;
  }
  // Non-Cloudinary URL (Unsplash, absolute, etc.) — use as-is
  return src;
}

// ── HTML attribute escape ─────────────────────────────────────────────────────
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ── Slim API product type ─────────────────────────────────────────────────────
interface ApiProductSlim {
  title?: string;
  description?: string;
  images?: string[];
  price?: number; // full NGN naira (not kobo)
  priceBase?: number; // new API field name alias
  slug?: string;
  _id?: string;
  id?: string;
  brandName?: string;
  brand?: { name?: string };
  stock?: number;
  reserved?: number;
}

// ── OG meta block builder ─────────────────────────────────────────────────────
function buildOgBlock(product: ApiProductSlim, pageUrl: string): string {
  const title = product.title ?? "LÁBí Product";
  const description =
    (product.description ?? "").slice(0, 200) ||
    `${title} — Contemporary African fashion made in Nigeria.`;
  const rawImage =
    product.images?.[0] ?? "https://labiafrica.com/og-image-1200x630.png";
  const ogImage = toOgImage(rawImage);
  const fullTitle = `${esc(title)} | LÁBí`;
  const price = product.priceBase ?? product.price ?? 0; // naira

  const priceBlock =
    price > 0
      ? `\n    <meta property="product:price:amount" content="${price}" />` +
        `\n    <meta property="product:price:currency" content="NGN" />`
      : "";

  const ldJson = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: product.description ?? "",
    image: product.images ?? [],
    url: pageUrl,
    brand: {
      "@type": "Brand",
      name: product.brandName ?? product.brand?.name ?? "LÁBí",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: price,
      availability:
        (product.stock ?? 0) - (product.reserved ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "LÁBí" },
    },
  });

  return `<title>${fullTitle}</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${esc(pageUrl)}" />

    <!-- Open Graph -->
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="LÁBí" />
    <meta property="og:url" content="${esc(pageUrl)}" />
    <meta property="og:title" content="${fullTitle}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${esc(ogImage)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(title)}" />
    <meta property="og:locale" content="en_NG" />${priceBlock}

    <!-- Twitter / X -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@labiiafrica" />
    <meta name="twitter:title" content="${fullTitle}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${esc(ogImage)}" />
    <meta name="twitter:image:alt" content="${esc(title)}" />

    <!-- Schema.org Product structured data -->
    <script type="application/ld+json">${ldJson}</script>`;
}

// ── Main middleware export ────────────────────────────────────────────────────
export default async function middleware(request: Request): Promise<Response> {
  const ua = request.headers.get("user-agent") ?? "";

  // Fast path: not a bot — pass straight through to static file serving
  if (!isBot(ua)) {
    return next();
  }

  // Extract slug from /shop/<slug>
  const url = new URL(request.url);
  const slug = url.pathname
    .replace(/^\/shop\//, "")
    .split("?")[0]
    .trim();

  // /shop or /shop/ with no slug — nothing product-specific to inject
  if (!slug || slug === "shop") {
    return next();
  }

  try {
    // 1. Fetch product from the backend API
    const apiRes = await fetch(
      `https://api.labiafrica.com/v1/catalog/products/${encodeURIComponent(slug)}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(4000),
      },
    );

    if (!apiRes.ok) {
      // Product not found or API error — serve unpatched index.html
      return next();
    }

    const json = (await apiRes.json()) as {
      success: boolean;
      data?: Record<string, unknown>;
    };

    // Handle both response envelopes the backend may return:
    //   { success: true, data: { product: {...}, similar: [...] } }
    //   { success: true, data: { ...productFields... } }
    const data = json?.data;
    let product: ApiProductSlim | undefined;
    if (data) {
      product =
        (data.product as ApiProductSlim | undefined) ??
        (data as ApiProductSlim);
    }

    if (!product?.title) {
      return next();
    }

    // 2. Fetch the static index.html from the same Vercel deployment origin
    const originUrl = new URL("/index.html", request.url);
    const htmlRes = await fetch(originUrl.href, {
      signal: AbortSignal.timeout(3000),
    });
    const originalHtml = await htmlRes.text();

    // 3. Canonical product URL
    const productSlug = product.slug ?? product._id ?? product.id ?? slug;
    const pageUrl = `https://labiafrica.com/shop/${productSlug}`;

    // 4. Strip every existing title / OG / Twitter / canonical tag from <head>
    //    so we end up with exactly one set, then inject ours right before </head>.
    const cleanedHtml = originalHtml
      .replace(/<title>[^<]*<\/title>/gi, "")
      .replace(/<meta\s+name="description"[^>]*>/gi, "")
      .replace(/<meta\s+name="robots"[^>]*>/gi, "")
      .replace(/<link\s+rel="canonical"[^>]*>/gi, "")
      .replace(/<meta\s+property="og:[^"]*"[^>]*>/gi, "")
      .replace(/<meta\s+name="twitter:[^"]*"[^>]*>/gi, "")
      .replace(/<meta\s+property="product:[^"]*"[^>]*>/gi, "");

    const ogBlock = buildOgBlock(product, pageUrl);
    const patchedHtml = cleanedHtml.replace(
      "</head>",
      `    ${ogBlock}\n  </head>`,
    );

    return new Response(patchedHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // CDN-cached for 5 minutes; stale served for up to 10 more while
        // revalidating — keeps latency low for repeated shares of the same product
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    // Any error (timeout, network, JSON parse) — fall back to normal serving
    return next();
  }
}
