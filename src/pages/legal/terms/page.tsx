import Header from "../../_components/Header.tsx";
import Footer from "../../_components/Footer.tsx";
import PageMeta from "@/components/PageMeta.tsx";
import LegalLayout from "../_components/LegalLayout.tsx";

const LAST_UPDATED = "1 October 2026";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Terms of Service — LÁBí"
        description="The terms and conditions that govern your use of the LÁBí platform and purchase of products."
        canonical="https://labiafrica.com/legal/terms"
        noIndex={false}
      />
      <Header />
      <LegalLayout title="Terms of Service" lastUpdated={LAST_UPDATED}>

        <Section title="1. Acceptance of Terms">
          <p>
            By accessing or using the LÁBí website at{" "}
            <strong>labiafrica.com</strong> (the "Site"), creating an account,
            or placing an order, you agree to be bound by these Terms of
            Service ("Terms") and our{" "}
            <a href="/legal/privacy" className="text-primary underline underline-offset-2">
              Privacy Policy
            </a>
            . If you do not agree, you must not use the Site.
          </p>
          <p>
            These Terms apply to all visitors, customers, and account holders.
            References to "LÁBí", "we", "us", or "our" mean LÁBí Africa and
            its authorised representatives.
          </p>
        </Section>

        <Section title="2. Eligibility">
          <p>
            You must be at least 18 years old, or the age of majority in your
            jurisdiction, to place an order on the Site. By using the Site you
            confirm that you meet this requirement.
          </p>
        </Section>

        <Section title="3. Products and Availability">
          <p>
            All products are subject to availability. We reserve the right to
            limit quantities, discontinue products, or refuse orders at our
            discretion. Product images are for illustrative purposes; actual
            colours and textures may vary slightly due to hand-crafting and
            screen calibration.
          </p>
          <p>
            <strong>Made-to-order items:</strong> some products are made after
            your order is placed. Lead times are shown on the product page.
            Made-to-order items cannot be returned unless faulty (see
            Section 8).
          </p>
          <p>
            <strong>Custom orders:</strong> bespoke garments are created to
            your specification. Once a custom order is approved and payment
            made, changes can only be accommodated at our discretion before
            production begins.
          </p>
        </Section>

        <Section title="4. Pricing and Currency">
          <p>
            Prices are displayed in your detected local currency for reference.
            All transactions are settled in the currency selected at checkout.
            Exchange rates are indicative; final charged amounts in non-NGN
            currencies depend on the rate locked at the time of order creation.
            LÁBí is not responsible for foreign-currency conversion fees
            charged by your bank or card issuer.
          </p>
          <p>
            Prices do not include import duties, customs fees, or local taxes
            that may apply in your country. These are the buyer's
            responsibility and are payable on delivery.
          </p>
        </Section>

        <Section title="5. Orders and Payment">
          <SubSection title="Placing an order">
            <p>
              Your order is an offer to purchase. We accept your offer only
              when we send you an order confirmation email. We reserve the
              right to cancel any order before dispatch — in which case you
              will receive a full refund.
            </p>
          </SubSection>
          <SubSection title="Payment">
            <p>
              Payment is processed securely by Paystack, Flutterwave, or
              Stripe. LÁBí does not store card numbers. Payment must be
              completed for your order to be confirmed and production to begin.
            </p>
          </SubSection>
          <SubSection title="Quoted-shipping orders">
            <p>
              For international destinations, the shipping fee is set by our
              team after your order is placed. You will receive an email with
              the quoted fee and a payment link. The quote is valid for the
              period stated in the email. If you do not pay within the validity
              window, the quote expires, reserved stock is released, and you
              may request a new quote.
            </p>
          </SubSection>
          <SubSection title="Price errors">
            <p>
              If a product is listed at an obviously incorrect price due to a
              technical error, we reserve the right to cancel the order and
              offer you the product at the correct price.
            </p>
          </SubSection>
        </Section>

        <Section title="6. Shipping and Delivery">
          <p>
            We ship from Lagos, Nigeria. Estimated delivery times shown at
            checkout are indicative and may be affected by customs, courier
            delays, or events beyond our control. Risk of loss and title pass
            to you upon dispatch.
          </p>
          <p>
            For international orders, you are the importer of record and are
            responsible for complying with all applicable laws and for paying
            any import duties or taxes. LÁBí is not liable for items seized by
            customs.
          </p>
        </Section>

        <Section title="7. Stock Reservations and Cancellations">
          <p>
            When you place an order, stock is reserved for your order for a
            limited period. If payment is not completed within this window, the
            reservation expires and the stock may be released.
          </p>
          <p>
            You may cancel an unpaid order at any time before payment. Paid
            orders may be cancelled before dispatch; once dispatched,
            cancellation is not possible and you must use the returns process
            instead.
          </p>
        </Section>

        <Section title="8. Returns and Exchanges">
          <SubSection title="Ready-to-wear items (in stock)">
            <p>
              We accept returns within <strong>14 days</strong> of delivery for
              items that are unworn, unwashed, with original tags attached, and
              in original packaging. Return shipping costs are borne by the
              customer unless the item is faulty.
            </p>
          </SubSection>
          <SubSection title="Made-to-order and custom items">
            <p>
              Made-to-order and bespoke custom garments are non-returnable
              unless they arrive damaged or materially differ from what was
              agreed. Please contact us within 48 hours of receipt with
              photographic evidence.
            </p>
          </SubSection>
          <SubSection title="Refunds">
            <p>
              Approved refunds are processed to the original payment method
              within 10 business days of us receiving the returned item.
              Shipping costs are non-refundable unless the return is due to our
              error.
            </p>
          </SubSection>
          <SubSection title="Exchanges">
            <p>
              If you need a different size, please place a new order and return
              the original item. We process exchanges as a new order subject to
              availability.
            </p>
          </SubSection>
        </Section>

        <Section title="9. Intellectual Property">
          <p>
            All content on the Site — including text, photography, graphics,
            logos, product designs, and the LÁBí brand identity — is owned by
            LÁBí Africa or its licensors and is protected by copyright and
            trademark law. You may not reproduce, distribute, or create
            derivative works without our prior written permission.
          </p>
          <p>
            You may share links to product pages and tag us on social media.
            Any content you submit to us (e.g. custom order reference images,
            reviews) grants us a non-exclusive, royalty-free licence to use
            that content for marketing and operational purposes.
          </p>
        </Section>

        <Section title="10. Accounts">
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activity under your account. Notify
            us immediately at{" "}
            <a
              href="mailto:hello@labiafrica.com"
              className="text-primary underline underline-offset-2"
            >
              hello@labiafrica.com
            </a>{" "}
            if you suspect unauthorised access.
          </p>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these Terms, engage in fraudulent activity, or abuse our team or
            other customers.
          </p>
        </Section>

        <Section title="11. Limitation of Liability">
          <p>
            To the fullest extent permitted by applicable law, LÁBí's total
            liability for any claim arising from your use of the Site or
            purchase of products is limited to the amount you paid for the
            specific order giving rise to the claim.
          </p>
          <p>
            LÁBí is not liable for indirect, incidental, special, or
            consequential losses, including loss of profit, loss of data, or
            reputational harm.
          </p>
          <p>
            Nothing in these Terms excludes liability for death or personal
            injury caused by our negligence, fraud, or any liability that
            cannot be excluded by law.
          </p>
        </Section>

        <Section title="12. Governing Law and Disputes">
          <p>
            These Terms are governed by the laws of the Federal Republic of
            Nigeria. Any disputes that cannot be resolved amicably will be
            referred to the courts of Lagos State, Nigeria, which shall have
            exclusive jurisdiction.
          </p>
          <p>
            If you are a consumer in the United Kingdom or European Union,
            nothing in this clause affects your right to bring proceedings in
            your local courts under applicable consumer protection laws.
          </p>
        </Section>

        <Section title="13. Changes to These Terms">
          <p>
            We may update these Terms at any time. We will notify you of
            material changes by updating the "Last updated" date and, where
            appropriate, by email. Continued use of the Site after the
            effective date of any change constitutes acceptance of the revised
            Terms.
          </p>
        </Section>

        <Section title="14. Contact">
          <p>
            For any questions about these Terms, contact us at{" "}
            <a
              href="mailto:hello@labiafrica.com"
              className="text-primary underline underline-offset-2"
            >
              hello@labiafrica.com
            </a>{" "}
            or write to us at LÁBí Africa, Lagos, Nigeria.
          </p>
        </Section>

      </LegalLayout>
      <Footer />
    </div>
  );
}

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

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
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
