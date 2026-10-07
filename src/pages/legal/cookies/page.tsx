import Header from "../../_components/Header.tsx";
import Footer from "../../_components/Footer.tsx";
import PageMeta from "@/components/PageMeta.tsx";
import LegalLayout from "../_components/LegalLayout.tsx";

const LAST_UPDATED = "1 October 2026";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Cookie Policy — LÁBí"
        description="How LÁBí uses cookies and similar technologies on its website."
        canonical="https://labiafrica.com/legal/cookies"
        noIndex={false}
      />
      <Header />
      <LegalLayout title="Cookie Policy" lastUpdated={LAST_UPDATED}>

        <Section title="1. What Are Cookies?">
          <p>
            Cookies are small text files that a website places on your device
            when you visit. They are widely used to make websites work
            efficiently and to provide information to website owners. Similar
            technologies — such as localStorage and sessionStorage — work in
            comparable ways and are covered by this policy.
          </p>
        </Section>

        <Section title="2. How LÁBí Uses Cookies">
          <p>
            We use cookies for three purposes: to make the Site work correctly
            (strictly necessary), to remember your preferences (functional),
            and to understand how customers use the Site so we can improve it
            (analytics). We do not use cookies to serve you advertising on
            other websites.
          </p>
        </Section>

        <Section title="3. The Cookies We Set">
          <CookieTable
            title="Strictly Necessary"
            description="These cookies are required for the Site to function. You cannot opt out of them."
            cookies={[
              {
                name: "labi_at",
                purpose:
                  "Stores your short-lived authentication access token (15 min expiry). httpOnly — not accessible to JavaScript.",
                expiry: "15 minutes",
                type: "Session",
              },
              {
                name: "labi_rt",
                purpose:
                  "Stores your long-lived refresh token so you stay logged in across sessions. httpOnly — not accessible to JavaScript.",
                expiry: "7 days",
                type: "Persistent",
              },
              {
                name: "labi_admin_at",
                purpose:
                  "Admin-panel access token. Only set when you log in to the admin dashboard.",
                expiry: "15 minutes",
                type: "Session",
              },
              {
                name: "labi_admin_rt",
                purpose:
                  "Admin-panel refresh token. Only set when you log in to the admin dashboard.",
                expiry: "7 days",
                type: "Persistent",
              },
            ]}
          />
          <CookieTable
            title="Functional"
            description="These cookies remember your preferences to give you a better experience."
            cookies={[
              {
                name: "labi_currency",
                purpose:
                  "Stores your selected display currency (e.g. USD, GBP). Without this cookie the Site detects your currency from your IP address on every visit.",
                expiry: "1 year",
                type: "Persistent",
              },
            ]}
          />
          <CookieTable
            title="Local Storage (not cookies)"
            description="We also use browser localStorage for the following purposes. localStorage is cleared when you clear your browser data."
            cookies={[
              {
                name: "labi_cart",
                purpose:
                  "Persists your shopping cart (items, quantities, sizes, colours) across page reloads for guest and logged-in customers.",
                expiry: "Until cleared",
                type: "localStorage",
              },
            ]}
          />
        </Section>

        <Section title="4. Third-Party Cookies">
          <p>
            Some third-party services integrated into the Site may set their
            own cookies. We do not control these and they are governed by each
            provider's own privacy and cookie policies:
          </p>
          <ul>
            <li>
              <strong>Paystack / Flutterwave / Stripe</strong> — payment
              processing. These providers may set session cookies on their
              hosted payment pages.
            </li>
            <li>
              <strong>Cloudinary</strong> — image delivery CDN. May set
              performance cookies on image requests.
            </li>
          </ul>
          <p>
            We do not integrate advertising networks, retargeting pixels
            (Facebook Pixel, Google Ads, etc.), or social-media tracking
            scripts.
          </p>
        </Section>

        <Section title="5. Managing Cookies">
          <p>
            Most browsers let you refuse or delete cookies via their settings:
          </p>
          <ul>
            <li>
              <strong>Chrome:</strong> Settings → Privacy and security →
              Cookies and other site data
            </li>
            <li>
              <strong>Firefox:</strong> Settings → Privacy & Security →
              Cookies and Site Data
            </li>
            <li>
              <strong>Safari:</strong> Preferences → Privacy → Manage Website
              Data
            </li>
            <li>
              <strong>Edge:</strong> Settings → Cookies and site permissions
            </li>
          </ul>
          <p>
            If you disable strictly necessary cookies, parts of the Site will
            not function — for example, you will not be able to log in or
            complete checkout. Disabling functional cookies means we cannot
            remember your currency preference.
          </p>
          <p>
            You can also clear localStorage and sessionStorage from your
            browser's developer tools (Application tab) or by clearing all
            browser data.
          </p>
        </Section>

        <Section title="6. Your Currency Preference">
          <p>
            On your first visit, we detect your location using your IP address
            (see our{" "}
            <a
              href="/legal/privacy"
              className="text-primary underline underline-offset-2"
            >
              Privacy Policy
            </a>
            ) and set a default display currency. When you change currency
            manually, your choice is stored in the <code>labi_currency</code>{" "}
            cookie. We do not use this cookie for tracking — it exists solely
            to avoid repeating the geo-detection call on every page load.
          </p>
        </Section>

        <Section title="7. Changes to This Policy">
          <p>
            We may update this Cookie Policy to reflect changes in the
            technologies we use or in applicable laws. We will update the
            "Last updated" date at the top of this page when we do so.
          </p>
        </Section>

        <Section title="8. Contact">
          <p>
            If you have any questions about how we use cookies, email us at{" "}
            <a
              href="mailto:privacy@labiafrica.com"
              className="text-primary underline underline-offset-2"
            >
              privacy@labiafrica.com
            </a>
            .
          </p>
        </Section>

      </LegalLayout>
      <Footer />
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2
        className="text-xl font-light text-foreground border-b border-border pb-2"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {title}
      </h2>
      <div className="space-y-3 text-muted-foreground leading-relaxed text-sm">
        {children}
      </div>
    </section>
  );
}

type CookieRow = {
  name: string;
  purpose: string;
  expiry: string;
  type: string;
};

function CookieTable({
  title,
  description,
  cookies,
}: {
  title: string;
  description: string;
  cookies: CookieRow[];
}) {
  return (
    <div className="space-y-2">
      <h3
        className="text-sm font-semibold text-foreground"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border">
              {["Name", "Purpose", "Expiry", "Type"].map((h) => (
                <th
                  key={h}
                  className="text-left py-2 pr-4 text-foreground font-semibold text-xs tracking-wide"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cookies.map((c) => (
              <tr key={c.name} className="border-b border-border/40 align-top">
                <td className="py-2 pr-4 text-primary font-mono text-xs whitespace-nowrap">
                  {c.name}
                </td>
                <td className="py-2 pr-4 text-muted-foreground">{c.purpose}</td>
                <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                  {c.expiry}
                </td>
                <td className="py-2 text-muted-foreground whitespace-nowrap">
                  {c.type}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
