import { Link } from "react-router-dom";

const FOOTER_LINKS: Record<string, { label: string; href: string }[]> = {
  Shop: [
    { label: "New Arrivals", href: "/shop" },
    { label: "Women", href: "/shop?category=women" },
    { label: "Men", href: "/shop?category=men" },
    { label: "Custom Order", href: "/custom-order" },
    { label: "Sale", href: "/shop" },
  ],
  Company: [
    { label: "Our Story", href: "#" },
    { label: "Artisans", href: "#" },
    { label: "Sustainability", href: "#" },
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
              Contemporary African fashion rooted in heritage craft and bold expression.
            </p>
            <div className="flex gap-4 mt-8">
              {["IG", "TW", "FB", "TK"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="w-9 h-9 border border-border flex items-center justify-center text-[10px] tracking-widest text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {social}
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
            © {new Date().getFullYear()} LABI. All rights reserved. Lagos, Nigeria.
          </p>
          <div className="flex gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-muted-foreground hover:text-primary text-xs tracking-wide transition-colors"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
