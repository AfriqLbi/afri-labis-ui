import { Link } from "react-router-dom";

// ── Brand SVG icons ────────────────────────────────────────────────────────────

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069ZM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z" />
    </svg>
  );
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06Z" />
    </svg>
  );
}

const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Shop: [
    { label: "New Arrivals", href: "/shop" },
    { label: "Women", href: "/shop?category=women" },
    { label: "Men", href: "/shop?category=men" },
    { label: "Custom Order", href: "/custom-order" },
    { label: "Sale", href: "/shop" },
  ],
  Company: [
    { label: "Our Story", href: "/about" },
    { label: "Artisans", href: "/about" },
    { label: "Sustainability", href: "/about" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  Help: [
    { label: "Sizing Guide", href: "/measurements" },
    { label: "Shipping & Returns", href: "#" },
    { label: "FAQ", href: "#" },
    { label: "Contact Us", href: "#" },
    { label: "Store Locator", href: "#" },
  ],
};

export default function Footer() {
  return (
    <footer className="bg-[#050505] border-t border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <span
              className="text-4xl font-bold text-primary tracking-[0.3em] block mb-5"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              LABI
            </span>
            <p
              className="text-muted-foreground text-base font-light leading-relaxed max-w-xs"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Contemporary African fashion rooted in heritage craft and bold
              expression.
            </p>
            <div className="flex gap-4 mt-8">
              {[
                {
                  icon: <InstagramIcon className="w-4 h-4" />,
                  label: "Instagram",
                  href: "#",
                },
                {
                  icon: <XIcon className="w-4 h-4" />,
                  label: "X (Twitter)",
                  href: "#",
                },
                {
                  icon: <FacebookIcon className="w-4 h-4" />,
                  label: "Facebook",
                  href: "#",
                },
                {
                  icon: <TikTokIcon className="w-4 h-4" />,
                  label: "TikTok",
                  href: "#",
                },
              ].map(({ icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 border border-border flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h4
                className="text-xs tracking-[0.25em] uppercase text-primary mb-5 font-semibold"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {section}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-muted-foreground hover:text-foreground text-sm font-light transition-colors"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p
            className="text-muted-foreground text-xs tracking-wide"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            © {new Date().getFullYear()} LABI. All rights reserved. Lagos,
            Nigeria.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
              (item) => (
                <a
                  key={item}
                  href="#"
                  className="text-muted-foreground hover:text-primary text-xs tracking-wide transition-colors"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {item}
                </a>
              ),
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
