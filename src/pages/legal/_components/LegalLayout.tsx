import { Link } from "react-router-dom";

const LEGAL_PAGES = [
  { label: "Privacy Policy", href: "/legal/privacy" },
  { label: "Terms of Service", href: "/legal/terms" },
  { label: "Cookie Policy", href: "/legal/cookies" },
];

interface Props {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}

export default function LegalLayout({ title, lastUpdated, children }: Props) {
  return (
    <div className="pt-[65px]">
      {/* Page header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <p
            className="text-[10px] tracking-[0.3em] uppercase text-primary mb-3"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Legal
          </p>
          <h1
            className="text-5xl font-light text-foreground"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {title}
          </h1>
          <p
            className="text-xs text-muted-foreground mt-3 tracking-wide"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Last updated: {lastUpdated}
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[200px_1fr] gap-12 items-start">
          {/* Sticky sidebar nav */}
          <nav className="lg:sticky lg:top-24 space-y-1 hidden lg:block">
            <p
              className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Legal Docs
            </p>
            {LEGAL_PAGES.map((page) => (
              <Link
                key={page.href}
                to={page.href}
                className={`block text-xs tracking-wide py-2 px-3 transition-colors border-l-2 ${
                  page.label === title
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {page.label}
              </Link>
            ))}
          </nav>

          {/* Content */}
          <article className="space-y-10 legal-article">
            {children}
          </article>
        </div>
      </div>
    </div>
  );
}
