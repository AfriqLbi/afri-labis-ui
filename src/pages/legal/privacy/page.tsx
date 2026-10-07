import Header from "../../_components/Header.tsx";
import Footer from "../../_components/Footer.tsx";
import PageMeta from "@/components/PageMeta.tsx";
import LegalLayout from "../_components/LegalLayout.tsx";

const LAST_UPDATED = "1 October 2026";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Privacy Policy — LÁBí"
        description="How LÁBí collects, uses, and protects your personal data."
        canonical="https://labiafrica.com/legal/privacy"
        noIndex={false}
      />
      <Header />
      <LegalLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>

        <Section title="1. Who We Are">
          <p>
            LÁBí Africa ("LÁBí", "we", "our", or "us") is an indigenous
            African textile and fashion brand incorporated in Nigeria. Our
            registered address is Lagos, Nigeria. We operate the website at{" "}
            <strong>labiafrica.com</strong> (the "Site") and the associated
            storefront, mobile experience, and customer accounts.
          </p>
          <p>
            For all questions about this policy, contact us at{" "}
            <a
              href="mailto:privacy@labiafrica.com"
              className="text-primary underline underline-offset-2"
            >
              privacy@labiafrica.com
            </a>
            .
          </p>
        </Section>

        <Section title="2. What Personal Data We Collect">
          <p>We collect personal data in the following ways:</p>
          <SubSection title="Data you give us directly">
            <ul>
              <li>
                <strong>Account registration:</strong> name, email address,
                phone number, and password hash.
              </li>
              <li>
                <strong>Orders and checkout:</strong> name, delivery address,
                phone number, email, payment reference, and order details.
                We do not store full card numbers — payment processing is
                handled by Paystack, Flutterwave, or Stripe.
              </li>
              <li>
                <strong>Custom orders:</strong> measurements, garment
                descriptions, fabric preferences, and reference images you
                upload.
              </li>
              <li>
                <strong>Measurement profiles:</strong> body measurements saved
                to your account for reuse at checkout.
              </li>
              <li>
                <strong>Communications:</strong> email content, WhatsApp
                messages, or any support queries you send us.
              </li>
            </ul>
          </SubSection>
          <SubSection title="Data we collect automatically">
            <ul>
              <li>
                <strong>IP address</strong> — used solely to detect your
                country and suggest the appropriate display currency. Raw IPs
                are not stored after currency detection.
              </li>
              <li>
                <strong>Browser and device type</strong> — through standard
                HTTP headers.
              </li>
              <li>
                <strong>Cookies and local storage</strong> — session
                authentication, currency preference, and shopping-cart state.
                See our Cookie Policy for details.
              </li>
              <li>
                <strong>Order and browsing activity</strong> — pages visited,
                products viewed, cart actions, and purchase history, to
                improve the shopping experience and power our analytics.
              </li>
            </ul>
          </SubSection>
        </Section>

        <Section title="3. How We Use Your Data">
          <Table
            rows={[
              ["Process and fulfil your orders", "Contract performance"],
              ["Create and manage your account", "Contract performance"],
              [
                "Send transactional emails (order confirmation, shipping quote, payment link)",
                "Contract performance",
              ],
              [
                "Detect your country to suggest a display currency",
                "Legitimate interest",
              ],
              [
                "Provide customer support via email and WhatsApp",
                "Legitimate interest",
              ],
              [
                "Analyse sales, product performance, and site usage via our internal analytics dashboard",
                "Legitimate interest",
              ],
              [
                "Prevent fraud and ensure platform security",
                "Legitimate interest / Legal obligation",
              ],
              [
                "Comply with applicable Nigerian law and tax obligations",
                "Legal obligation",
              ],
              [
                "Send marketing emails if you opt in",
                "Consent (you can opt out at any time)",
              ],
            ]}
          />
        </Section>

        <Section title="4. How We Share Your Data">
          <p>
            We do not sell your personal data. We share it only with the
            following categories of third parties, under contractual data
            protection obligations:
          </p>
          <ul>
            <li>
              <strong>Payment processors</strong> — Paystack, Flutterwave, and
              Stripe receive the minimum data required to process a payment.
            </li>
            <li>
              <strong>Email delivery</strong> — Resend processes outbound
              transactional emails on our behalf.
            </li>
            <li>
              <strong>Image hosting</strong> — Cloudinary stores product and
              reference images.
            </li>
            <li>
              <strong>Geolocation</strong> — ipapi.co or ipinfo.io receives
              anonymised IP addresses solely to detect country. We do not store
              or share raw IPs beyond this use.
            </li>
            <li>
              <strong>Infrastructure</strong> — the Site runs on Vercel
              (frontend) and Render (backend API), both with data-processing
              agreements.
            </li>
            <li>
              <strong>Legal requirements</strong> — we may disclose data if
              required by law, court order, or to protect the rights and safety
              of LÁBí or others.
            </li>
          </ul>
        </Section>

        <Section title="5. International Transfers">
          <p>
            LÁBí is based in Nigeria. Some of our service providers (Stripe,
            Cloudinary, Resend, Vercel, Render) process data on servers
            outside Nigeria, primarily in the United States and European Union.
            When we transfer data internationally we rely on standard
            contractual clauses or equivalent transfer mechanisms.
          </p>
        </Section>

        <Section title="6. Data Retention">
          <p>
            We keep your personal data only as long as necessary for the
            purposes described in this policy or as required by law:
          </p>
          <ul>
            <li>
              <strong>Order records</strong> — 7 years, to meet Nigerian tax
              and accounting obligations.
            </li>
            <li>
              <strong>Account data</strong> — for the life of your account,
              plus 90 days after deletion to allow recovery.
            </li>
            <li>
              <strong>Custom orders and measurements</strong> — retained while
              your account is active. You may delete them at any time.
            </li>
            <li>
              <strong>Audit logs</strong> — 2 years for security and
              fraud-prevention purposes.
            </li>
          </ul>
        </Section>

        <Section title="7. Your Rights">
          <p>
            Depending on your location, you may have the following rights
            regarding your personal data:
          </p>
          <ul>
            <li>
              <strong>Access</strong> — request a copy of the data we hold
              about you.
            </li>
            <li>
              <strong>Correction</strong> — ask us to correct inaccurate data.
            </li>
            <li>
              <strong>Deletion</strong> — ask us to delete your data (subject
              to legal retention requirements).
            </li>
            <li>
              <strong>Portability</strong> — receive your data in a structured,
              machine-readable format.
            </li>
            <li>
              <strong>Objection</strong> — object to processing based on
              legitimate interests, including direct marketing.
            </li>
            <li>
              <strong>Withdrawal of consent</strong> — withdraw consent for
              marketing emails at any time using the unsubscribe link in any
              email.
            </li>
          </ul>
          <p>
            To exercise any of these rights, email{" "}
            <a
              href="mailto:privacy@labiafrica.com"
              className="text-primary underline underline-offset-2"
            >
              privacy@labiafrica.com
            </a>
            . We will respond within 30 days.
          </p>
        </Section>

        <Section title="8. Security">
          <p>
            We implement technical and organisational measures to protect your
            data:
          </p>
          <ul>
            <li>All data in transit is encrypted via HTTPS / TLS.</li>
            <li>
              Passwords are hashed with bcrypt before storage; we never store
              plaintext passwords.
            </li>
            <li>
              Authentication uses short-lived JWT access tokens (15 minutes)
              plus long-lived refresh tokens stored in httpOnly cookies, not
              accessible to JavaScript.
            </li>
            <li>
              Payment card details are handled entirely by PCI-DSS certified
              payment processors — they never reach our servers.
            </li>
            <li>
              Admin access is protected by separate authentication and
              role-based access controls.
            </li>
          </ul>
          <p>
            No transmission over the internet is 100% secure. If you believe
            your account has been compromised, contact us immediately.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            The LÁBí Site is not directed at children under 13. We do not
            knowingly collect personal data from children. If you believe a
            child has provided us with their data, please contact us and we
            will delete it promptly.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this policy from time to time. When we make material
            changes, we will update the "Last updated" date at the top of this
            page and, where appropriate, notify you by email. Continued use of
            the Site after a change constitutes your acceptance of the revised
            policy.
          </p>
        </Section>

      </LegalLayout>
      <Footer />
    </div>
  );
}

// ── Section helpers ────────────────────────────────────────────────────────────

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
      <div className="space-y-3 text-muted-foreground leading-relaxed text-sm legal-body">
        {children}
      </div>
    </section>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3
        className="text-sm font-semibold text-foreground"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {title}
      </h3>
      {children}
    </div>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th
              className="text-left py-2 pr-6 text-foreground font-semibold w-2/3"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Purpose
            </th>
            <th
              className="text-left py-2 text-foreground font-semibold"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Legal basis
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([purpose, basis], i) => (
            <tr key={i} className="border-b border-border/40">
              <td className="py-2 pr-6 text-muted-foreground align-top">
                {purpose}
              </td>
              <td className="py-2 text-muted-foreground align-top">{basis}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
