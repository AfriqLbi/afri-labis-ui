/**
 * PageMeta — sets per-page <title>, <meta description>, and Open Graph tags
 * without any external library. Works by directly mutating document.head
 * inside a useEffect. The base index.html carries the default/fallback values.
 *
 * Usage:
 *   <PageMeta title="Shop" description="Browse all collections." />
 *   <PageMeta title={product.title} description={product.description} image={product.images[0]} />
 */

import { useEffect } from "react";

interface PageMetaProps {
  /** Page-specific title. Appended with " | LÁBí" automatically. */
  title?: string;
  description?: string;
  /** Canonical URL for this page (full URL). Defaults to current href. */
  canonical?: string;
  /** OG / Twitter image URL. Falls back to the default OG image. */
  image?: string;
  /** "website" (default) or "product" */
  type?: "website" | "product";
  /** Extra JSON-LD structured data object to inject for this page. */
  structuredData?: object;
  /** If true, page is not indexed (e.g. admin, account, checkout). */
  noIndex?: boolean;
}

const SITE_NAME = "LÁBí";
const SITE_URL  = "https://labiafrica.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;
const DEFAULT_DESCRIPTION =
  "LÁBí (Èwà Omoluabi) — Contemporary African fashion rooted in heritage craft. Handwoven Aṣọ-Òkè, FÌLÁ and modern African pieces made in Ilorin, Nigeria.";

function setMeta(name: string, content: string, prop?: boolean) {
  const attr = prop ? "property" : "name";
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setStructuredData(id: string, data: object) {
  let el = document.querySelector<HTMLScriptElement>(`script[data-page-ld="${id}"]`);
  if (!el) {
    el = document.createElement("script");
    el.setAttribute("type", "application/ld+json");
    el.setAttribute("data-page-ld", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

function removeStructuredData(id: string) {
  document.querySelector(`script[data-page-ld="${id}"]`)?.remove();
}

export default function PageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  canonical,
  image = DEFAULT_OG_IMAGE,
  type = "website",
  structuredData,
  noIndex = false,
}: PageMetaProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Aṣọ-Òkè & African Fashion | Ilorin, Nigeria`;
    const canonicalUrl = canonical ?? window.location.href;
    const pageId = "page-meta-ld";

    document.title = fullTitle;

    // Primary
    setMeta("description", description);
    setMeta("robots", noIndex ? "noindex, nofollow" : "index, follow");

    // Canonical
    setLink("canonical", canonicalUrl);

    // Open Graph
    setMeta("og:title",       fullTitle,     true);
    setMeta("og:description", description,   true);
    setMeta("og:image",       image,         true);
    setMeta("og:url",         canonicalUrl,  true);
    setMeta("og:type",        type,          true);
    setMeta("og:site_name",   SITE_NAME,     true);

    // Twitter
    setMeta("twitter:title",       fullTitle);
    setMeta("twitter:description", description);
    setMeta("twitter:image",       image);

    // Structured data
    if (structuredData) {
      setStructuredData(pageId, structuredData);
    } else {
      removeStructuredData(pageId);
    }

    // Restore defaults on unmount (prevents stale meta when navigating away
    // to a page that doesn't declare its own PageMeta)
    return () => {
      document.title = `${SITE_NAME} — Aṣọ-Òkè & African Fashion | Ilorin, Nigeria`;
      setMeta("description", DEFAULT_DESCRIPTION);
      setMeta("robots", "index, follow");
      setLink("canonical", SITE_URL);
      setMeta("og:title",       `${SITE_NAME} — Aṣọ-Òkè & African Fashion`, true);
      setMeta("og:description", DEFAULT_DESCRIPTION, true);
      setMeta("og:image",       DEFAULT_OG_IMAGE,    true);
      setMeta("og:url",         SITE_URL,            true);
      setMeta("og:type",        "website",           true);
      removeStructuredData(pageId);
    };
  }, [title, description, canonical, image, type, structuredData, noIndex]);

  return null;
}
