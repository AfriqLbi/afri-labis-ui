import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  Check,
  ArrowLeft,
  ExternalLink,
  Clock,
  Truck,
  MessageCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart.tsx";
import { formatPrice } from "@/lib/products.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { useCurrency } from "@/components/providers/currency.tsx";
import { useShippingEstimate } from "@/hooks/use-api.ts";
import {
  orders as ordersApi,
  type ShippingAddress,
  ApiError,
} from "@/lib/api.ts";
import Header from "../_components/Header.tsx";
import Footer from "../_components/Footer.tsx";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner.tsx";
import PageMeta from "@/components/PageMeta.tsx";

// ── Constants ──────────────────────────────────────────────────────────────────

type Step = "contact" | "shipping" | "payment" | "confirmation";

type ContactInfo = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

type ShippingInfo = {
  address: string;
  city: string;
  state: string;
  country: string;
  zip: string;
};

const STEPS: { id: Step; label: string }[] = [
  { id: "contact", label: "Contact" },
  { id: "shipping", label: "Shipping" },
  { id: "payment", label: "Payment" },
];

const NIGERIAN_STATES = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER ?? "2348000000000";

// Map full country name → ISO alpha-2 (mirrors backend utility)
function toIso(country: string): string {
  const map: Record<string, string> = {
    nigeria: "NG",
    ghana: "GH",
    "united kingdom": "GB",
    canada: "CA",
    "united states": "US",
    "united states of america": "US",
    usa: "US",
    germany: "DE",
    france: "FR",
    australia: "AU",
  };
  if (country.length === 2) return country.toUpperCase();
  return map[country.toLowerCase()] ?? country.toUpperCase();
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeCurrency, rates, fxBuffer, formatAmount } = useCurrency();

  const [step, setStep] = useState<Step>("contact");
  const [submitting, setSubmitting] = useState(false);

  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<
    string | null
  >(null);
  const [confirmedIsQuote, setConfirmedIsQuote] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);

  const [contact, setContact] = useState<ContactInfo>({
    firstName: user?.name.split(" ")[0] ?? "",
    lastName: user?.name.split(" ").slice(1).join(" ") ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });

  const [shipping, setShipping] = useState<ShippingInfo>({
    address: "",
    city: "",
    state: "Lagos",
    country: "Nigeria",
    zip: "",
  });

  // ISO address for the estimate query — only set once the user moves off
  // the shipping step so we don't spam the API on every keystroke.
  const [estimateAddress, setEstimateAddress] = useState<{
    country: string;
    state: string;
  } | null>(null);

  const isNgn = activeCurrency === "NGN";
  const stripeEnabled = import.meta.env.VITE_STRIPE_ENABLED === "true";
  const [paymentProvider, setPaymentProvider] = useState<
    "paystack" | "flutterwave" | "stripe"
  >(isNgn ? "paystack" : stripeEnabled ? "stripe" : "flutterwave");

  useEffect(() => {
    if (!isNgn) setPaymentProvider(stripeEnabled ? "stripe" : "flutterwave");
    else setPaymentProvider((p) => (p === "stripe" ? "paystack" : p));
  }, [isNgn, stripeEnabled]);

  // ── Shipping estimate ──────────────────────────────────────────────────────

  const { data: shippingEst, isLoading: estLoading } =
    useShippingEstimate(estimateAddress);

  // Compute the shipping fee and UI state from the estimate
  const shippingFeeNaira = (() => {
    if (!shippingEst) return null;
    if (shippingEst.status === "CALCULATED")
      return shippingEst.fee.amount / 100;
    if (shippingEst.status === "PICKUP") return 0;
    return null; // QUOTE_REQUIRED or NO_ZONE
  })();

  const isQuoteZone = shippingEst?.status === "QUOTE_REQUIRED";
  const isNoZone = shippingEst?.status === "NO_ZONE";

  const total =
    shippingFeeNaira != null ? subtotal + shippingFeeNaira : subtotal;
  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

  // Trigger estimate when entering the payment step
  const handleShippingNext = useCallback(() => {
    setEstimateAddress({
      country: toIso(shipping.country),
      state: shipping.state,
    });
    setStep("payment");
  }, [shipping.country, shipping.state]);

  // ── Empty cart guard ───────────────────────────────────────────────────────

  if (items.length === 0 && step !== "confirmation") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-[65px] flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <p
              className="text-4xl font-light text-muted-foreground"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Your cart is empty
            </p>
            <button
              onClick={() => navigate("/shop")}
              className="text-xs tracking-[0.2em] uppercase text-primary underline underline-offset-4 cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Browse the Collection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Place order ────────────────────────────────────────────────────────────

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isNoZone) {
      toast.error(
        "Shipping to this destination is not configured. Please contact us via WhatsApp.",
      );
      return;
    }
    setSubmitting(true);

    const shippingAddress: ShippingAddress = {
      fullName: `${contact.firstName} ${contact.lastName}`.trim(),
      phone: contact.phone,
      line1: shipping.address,
      city: shipping.city,
      state: shipping.state,
      country: shipping.country,
      line2: "",
    };

    try {
      const rateEntry = rates.find((r) => r.currency === activeCurrency);
      const fxRateSnapshot =
        !isNgn && rateEntry
          ? { rate: rateEntry.rate, buffer: fxBuffer }
          : undefined;

      const result = await ordersApi.create({
        customerEmail: contact.email,
        customerName: `${contact.firstName} ${contact.lastName}`.trim(),
        paymentProvider,
        shippingAddress,
        chargeCurrency: activeCurrency !== "NGN" ? activeCurrency : undefined,
        fxRateSnapshot,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = result as any;
      const url = raw.checkoutUrl ?? raw.data?.checkoutUrl ?? null;
      const orderId = raw.order?._id ?? raw._id ?? "";
      const orderNumber = raw.order?.orderNumber ?? raw.orderNumber ?? "";
      const orderStatus = raw.order?.status ?? raw.status ?? "";

      const isQuote = orderStatus === "awaiting_shipping_quote";

      setConfirmedOrderId(orderId);
      setConfirmedOrderNumber(orderNumber);
      setConfirmedIsQuote(isQuote);
      setCheckoutUrl(url);
      clearCart();
      setStep("confirmation");

      if (isQuote) {
        toast.success(
          "Order placed! We'll email you a shipping quote within 24 hours.",
        );
      } else {
        toast.success("Order created! Redirecting to payment…");
        if (url)
          setTimeout(() => {
            window.location.href = url;
          }, 1200);
      }
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : "Could not create your order. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Checkout" noIndex={true} />
      <Header />
      <div className="pt-[65px]">
        {step === "confirmation" ? (
          <Confirmation
            contact={contact}
            orderId={confirmedOrderId}
            orderNumber={confirmedOrderNumber}
            checkoutUrl={checkoutUrl}
            isQuote={confirmedIsQuote}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="grid md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_420px] gap-8 lg:gap-16">
              {/* Left — form */}
              <div>
                <button
                  onClick={() => navigate("/shop")}
                  className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors mb-8 cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  <ArrowLeft size={12} /> Back to Shop
                </button>

                <p
                  className="text-3xl font-bold text-primary tracking-[0.3em] mb-10"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  LABI
                </p>

                {/* Step indicators */}
                <div className="flex items-center gap-0 mb-10">
                  {STEPS.map((s, i) => {
                    const done = i < currentStepIdx;
                    const active = s.id === step;
                    return (
                      <div key={s.id} className="flex items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold transition-all ${done || active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                          >
                            {done ? <Check size={10} /> : i + 1}
                          </div>
                          <span
                            className={`text-[10px] tracking-[0.2em] uppercase hidden sm:block ${active ? "text-foreground" : "text-muted-foreground"}`}
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {s.label}
                          </span>
                        </div>
                        {i < STEPS.length - 1 && (
                          <ChevronRight
                            size={14}
                            className="text-border mx-3"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <AnimatePresence mode="wait">
                  {/* ── Contact ── */}
                  {step === "contact" && (
                    <StepPanel key="contact">
                      <StepTitle>Contact Information</StepTitle>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setStep("shipping");
                        }}
                        className="space-y-5"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="First Name" required>
                            <input
                              required
                              value={contact.firstName}
                              onChange={(e) =>
                                setContact({
                                  ...contact,
                                  firstName: e.target.value,
                                })
                              }
                              placeholder="Amara"
                              className="checkout-input"
                            />
                          </Field>
                          <Field label="Last Name" required>
                            <input
                              required
                              value={contact.lastName}
                              onChange={(e) =>
                                setContact({
                                  ...contact,
                                  lastName: e.target.value,
                                })
                              }
                              placeholder="Okafor"
                              className="checkout-input"
                            />
                          </Field>
                        </div>
                        <Field label="Email Address" required>
                          <input
                            type="email"
                            required
                            value={contact.email}
                            onChange={(e) =>
                              setContact({ ...contact, email: e.target.value })
                            }
                            placeholder="amara@email.com"
                            className="checkout-input"
                          />
                        </Field>
                        <Field label="Phone Number" required>
                          <input
                            required
                            value={contact.phone}
                            onChange={(e) =>
                              setContact({ ...contact, phone: e.target.value })
                            }
                            placeholder="+234 800 000 0000"
                            className="checkout-input"
                          />
                        </Field>
                        <NextBtn>Continue to Shipping</NextBtn>
                      </form>
                    </StepPanel>
                  )}

                  {/* ── Shipping address ── */}
                  {step === "shipping" && (
                    <StepPanel key="shipping">
                      <StepTitle>Shipping Address</StepTitle>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleShippingNext();
                        }}
                        className="space-y-5"
                      >
                        <Field label="Street Address" required>
                          <input
                            required
                            value={shipping.address}
                            onChange={(e) =>
                              setShipping({
                                ...shipping,
                                address: e.target.value,
                              })
                            }
                            placeholder="12 Bourdillon Road"
                            className="checkout-input"
                          />
                        </Field>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="City" required>
                            <input
                              required
                              value={shipping.city}
                              onChange={(e) =>
                                setShipping({
                                  ...shipping,
                                  city: e.target.value,
                                })
                              }
                              placeholder="Lagos"
                              className="checkout-input"
                            />
                          </Field>
                          <Field label="State / Region" required>
                            {shipping.country.toLowerCase() === "nigeria" ? (
                              <select
                                required
                                value={shipping.state}
                                onChange={(e) =>
                                  setShipping({
                                    ...shipping,
                                    state: e.target.value,
                                  })
                                }
                                className="checkout-input"
                              >
                                {NIGERIAN_STATES.map((s) => (
                                  <option key={s} value={s}>
                                    {s}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                value={shipping.state}
                                onChange={(e) =>
                                  setShipping({
                                    ...shipping,
                                    state: e.target.value,
                                  })
                                }
                                placeholder="Province / State"
                                className="checkout-input"
                              />
                            )}
                          </Field>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="Country" required>
                            <input
                              required
                              value={shipping.country}
                              onChange={(e) =>
                                setShipping({
                                  ...shipping,
                                  state: "",
                                  country: e.target.value,
                                })
                              }
                              placeholder="Nigeria"
                              className="checkout-input"
                            />
                          </Field>
                          <Field label="Postal Code">
                            <input
                              value={shipping.zip}
                              onChange={(e) =>
                                setShipping({
                                  ...shipping,
                                  zip: e.target.value,
                                })
                              }
                              placeholder="100001"
                              className="checkout-input"
                            />
                          </Field>
                        </div>
                        <div className="flex gap-3">
                          <BackBtn onClick={() => setStep("contact")} />
                          <NextBtn className="flex-[2]">
                            Continue to Payment
                          </NextBtn>
                        </div>
                      </form>
                    </StepPanel>
                  )}

                  {/* ── Payment ── */}
                  {step === "payment" && (
                    <StepPanel key="payment">
                      <StepTitle>Payment</StepTitle>
                      <form onSubmit={handlePlaceOrder} className="space-y-6">
                        {/* Shipping estimate banner */}
                        <ShippingEstimateBanner
                          isLoading={estLoading}
                          estimate={shippingEst ?? null}
                          country={shipping.country}
                          formatAmount={formatAmount}
                        />

                        {/* Gateway notice */}
                        <div className="bg-primary/5 border border-primary/20 px-4 py-3 flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary mt-1 shrink-0" />
                          <p
                            className="text-xs text-muted-foreground leading-relaxed"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {isQuoteZone
                              ? "No payment is taken now. Once we set your shipping fee, you'll receive an email with a payment link."
                              : "You will be redirected to a secure payment page to complete your purchase."}
                          </p>
                        </div>

                        {/* FX lock banner */}
                        {!isNgn && !isQuoteZone && (
                          <div className="bg-primary/5 border border-primary/20 px-4 py-3 flex items-start gap-3">
                            <Clock
                              size={14}
                              className="text-primary mt-0.5 shrink-0"
                            />
                            <p
                              className="text-xs text-muted-foreground leading-relaxed"
                              style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              Your price in{" "}
                              <span className="text-primary font-semibold">
                                {activeCurrency}
                              </span>{" "}
                              is locked for 30 minutes from when your order is
                              created.
                            </p>
                          </div>
                        )}

                        {/* Provider selection — hidden for quote orders (no payment now) */}
                        {!isQuoteZone && (
                          <Field label="Payment Provider">
                            <div className="space-y-3">
                              {isNgn ? (
                                [
                                  {
                                    id: "paystack" as const,
                                    label: "Paystack",
                                    sub: "Cards, Bank Transfer, USSD",
                                  },
                                  {
                                    id: "flutterwave" as const,
                                    label: "Flutterwave",
                                    sub: "Cards, Mobile Money, Bank Transfer",
                                  },
                                ].map((opt) => (
                                  <label
                                    key={opt.id}
                                    className={`flex items-center gap-4 px-4 py-4 border cursor-pointer transition-all ${paymentProvider === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-foreground/40"}`}
                                  >
                                    <div
                                      className={`w-4 h-4 border flex items-center justify-center shrink-0 ${paymentProvider === opt.id ? "border-primary" : "border-border"}`}
                                    >
                                      {paymentProvider === opt.id && (
                                        <div className="w-2 h-2 bg-primary" />
                                      )}
                                    </div>
                                    <div>
                                      <p
                                        className="text-xs font-semibold text-foreground"
                                        style={{
                                          fontFamily:
                                            "'Montserrat', sans-serif",
                                        }}
                                      >
                                        {opt.label}
                                      </p>
                                      <p
                                        className="text-[10px] text-muted-foreground"
                                        style={{
                                          fontFamily:
                                            "'Montserrat', sans-serif",
                                        }}
                                      >
                                        {opt.sub}
                                      </p>
                                    </div>
                                    <input
                                      type="radio"
                                      className="hidden"
                                      checked={paymentProvider === opt.id}
                                      onChange={() =>
                                        setPaymentProvider(opt.id)
                                      }
                                    />
                                  </label>
                                ))
                              ) : (
                                <div className="px-4 py-4 border border-primary/30 bg-primary/5 flex items-center gap-3">
                                  <div className="w-4 h-4 border border-primary flex items-center justify-center shrink-0">
                                    <div className="w-2 h-2 bg-primary" />
                                  </div>
                                  <div>
                                    <p
                                      className="text-xs font-semibold text-foreground"
                                      style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                      }}
                                    >
                                      {stripeEnabled ? "Stripe" : "Flutterwave"}
                                    </p>
                                    <p
                                      className="text-[10px] text-muted-foreground"
                                      style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                      }}
                                    >
                                      {stripeEnabled
                                        ? `International cards · ${activeCurrency}`
                                        : `Multi-currency · ${activeCurrency}`}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Field>
                        )}

                        <div className="flex gap-3 pt-2">
                          <BackBtn onClick={() => setStep("shipping")} />
                          <button
                            type="submit"
                            disabled={submitting || isNoZone}
                            className="flex-[2] bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {submitting ? (
                              <>
                                <Spinner className="size-4" /> Processing…
                              </>
                            ) : isQuoteZone ? (
                              <>Request Shipping Quote →</>
                            ) : (
                              <>
                                {shippingFeeNaira != null
                                  ? `Pay ${formatAmount(total * 100)}`
                                  : "Place Order"}{" "}
                                →
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </StepPanel>
                  )}
                </AnimatePresence>
              </div>

              {/* Right — order summary */}
              <div className="order-first md:order-last">
                <OrderSummary
                  items={items}
                  subtotal={subtotal}
                  shippingFeeNaira={shippingFeeNaira}
                  isQuoteZone={isQuoteZone}
                  estLoading={estLoading && step === "payment"}
                  total={total}
                  formatAmount={formatAmount}
                />
              </div>
            </div>
          </div>
        )}
      </div>
      {step !== "confirmation" && <Footer />}
    </div>
  );
}

// ── Shipping estimate banner ────────────────────────────────────────────────────

import type { ShippingEstimateResult } from "@/lib/api.ts";

function ShippingEstimateBanner({
  isLoading,
  estimate,
  country,
  formatAmount,
}: {
  isLoading: boolean;
  estimate: ShippingEstimateResult | null;
  country: string;
  formatAmount: (kobo: number) => string;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border border-border bg-muted/20">
        <Loader2 size={14} className="animate-spin text-primary shrink-0" />
        <p
          className="text-xs text-muted-foreground"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Calculating shipping…
        </p>
      </div>
    );
  }
  if (!estimate) return null;

  if (estimate.status === "NO_ZONE") {
    const waLink = `https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER ?? "2348000000000"}?text=${encodeURIComponent(`Hi LABI, I need a shipping quote to ${country}`)}`;
    return (
      <div className="flex items-start gap-3 px-4 py-3 border border-destructive/40 bg-destructive/5">
        <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
        <div>
          <p
            className="text-xs text-foreground mb-1"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Shipping to this destination isn't configured yet.
          </p>
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] tracking-[0.1em] uppercase text-[#25D366] hover:underline"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <MessageCircle size={11} /> Contact us on WhatsApp
          </a>
        </div>
      </div>
    );
  }

  if (estimate.status === "QUOTE_REQUIRED") {
    const range = estimate.estimateRange;
    return (
      <div className="flex items-start gap-3 px-4 py-3 border border-primary/30 bg-primary/5">
        <Truck size={14} className="text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p
            className="text-xs text-foreground font-medium"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Shipping to {estimate.zone} is quoted per order
          </p>
          <p
            className="text-[11px] text-muted-foreground"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {estimate.message}
          </p>
          {range && (
            <p
              className="text-[11px] text-primary"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Estimate: {formatAmount(range.minNgn)} –{" "}
              {formatAmount(range.maxNgn)}
            </p>
          )}
          {estimate.etaDays && (
            <p
              className="text-[11px] text-muted-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Typical delivery: {estimate.etaDays[0]}–{estimate.etaDays[1]} days
            </p>
          )}
          {estimate.customerNote && (
            <p
              className="text-[10px] text-muted-foreground/70 italic"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {estimate.customerNote}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (estimate.status === "CALCULATED" || estimate.status === "PICKUP") {
    return (
      <div className="flex items-start gap-3 px-4 py-3 border border-emerald-500/30 bg-emerald-500/5">
        <Truck size={14} className="text-emerald-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p
            className="text-xs text-foreground font-medium"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {estimate.status === "PICKUP"
              ? "Pickup — Free"
              : `Shipping to ${estimate.zone}`}
          </p>
          {estimate.status === "CALCULATED" && (
            <p
              className="text-sm text-primary font-semibold"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {estimate.fee.amount === 0
                ? "Free"
                : formatAmount(estimate.fee.amount)}
            </p>
          )}
          {estimate.etaDays && (
            <p
              className="text-[11px] text-muted-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Estimated delivery: {estimate.etaDays[0]}–{estimate.etaDays[1]}{" "}
              days
            </p>
          )}
          {estimate.status === "CALCULATED" && estimate.customerNote && (
            <p
              className="text-[10px] text-muted-foreground/70 italic"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {estimate.customerNote}
            </p>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// ── Confirmation screen ────────────────────────────────────────────────────────

function Confirmation({
  contact,
  orderId,
  orderNumber,
  checkoutUrl,
  isQuote,
}: {
  contact: ContactInfo;
  orderId: string | null;
  orderNumber: string | null;
  checkoutUrl: string | null;
  isQuote: boolean;
}) {
  const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`Hi LABI, I have a question about my order ${orderNumber ?? ""}`)}`;
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" as const }}
      className="min-h-[80vh] flex items-center justify-center px-6 py-24"
    >
      <div className="max-w-lg text-center">
        <div className="w-16 h-16 bg-primary flex items-center justify-center mx-auto mb-8">
          <Check size={24} className="text-primary-foreground" />
        </div>
        <p
          className="text-xs tracking-[0.3em] uppercase text-primary mb-4"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {isQuote ? "Quote Requested" : "Order Created"}
        </p>
        <h1
          className="text-5xl font-light text-foreground mb-6"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {contact.firstName
            ? `Thank you, ${contact.firstName}!`
            : "Order confirmed!"}
        </h1>
        <p
          className="text-muted-foreground text-lg font-light leading-relaxed mb-4"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {isQuote
            ? "We've received your order. An admin will set the shipping fee and email you a payment link — usually within 24 hours."
            : checkoutUrl
              ? "Redirecting you to the secure payment page now…"
              : "Your order has been received and is awaiting payment confirmation."}
        </p>
        {contact.email && (
          <p
            className="text-xs tracking-wide text-muted-foreground mb-3"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Updates to <span className="text-primary">{contact.email}</span>
          </p>
        )}
        {orderNumber && (
          <p
            className="text-xs tracking-wide text-muted-foreground mb-8"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Order:{" "}
            <span className="text-primary font-semibold">{orderNumber}</span>
          </p>
        )}
        <div className="w-12 h-[1px] bg-primary mx-auto mb-8" />
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {checkoutUrl && !isQuote && (
            <a
              href={checkoutUrl}
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              <ExternalLink size={13} /> Pay Now
            </a>
          )}
          {orderId && (
            <Link
              to={`/orders/${orderId}`}
              className="inline-flex items-center justify-center gap-2 border border-border text-muted-foreground px-8 py-4 text-xs tracking-[0.2em] uppercase hover:border-foreground hover:text-foreground transition-colors cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {isQuote ? "View Order Status" : "Track Order"}
            </Link>
          )}
          {isQuote && (
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-[#25D366] text-[#25D366] px-8 py-4 text-xs tracking-[0.2em] uppercase hover:bg-[#25D366]/10 transition-colors cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              <MessageCircle size={13} /> WhatsApp Us
            </a>
          )}
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-2 border border-border text-muted-foreground px-8 py-4 text-xs tracking-[0.2em] uppercase hover:border-foreground hover:text-foreground transition-colors cursor-pointer"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ── Order summary ──────────────────────────────────────────────────────────────

function OrderSummary({
  items,
  subtotal,
  shippingFeeNaira,
  isQuoteZone,
  estLoading,
  total,
  formatAmount,
}: {
  items: import("@/hooks/use-cart.tsx").CartItem[];
  subtotal: number;
  shippingFeeNaira: number | null;
  isQuoteZone: boolean;
  estLoading: boolean;
  total: number;
  formatAmount: (kobo: number) => string;
}) {
  return (
    <div className="lg:sticky lg:top-24 self-start">
      <div className="bg-card border border-border p-6">
        <p
          className="text-[10px] tracking-[0.3em] uppercase text-primary mb-6 font-semibold"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Order Summary
        </p>
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <div
              key={`${item.product.id}-${item.size}-${item.color}`}
              className="flex gap-3"
            >
              <div className="relative w-16 h-20 shrink-0 overflow-hidden">
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-light text-foreground leading-snug"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {item.product.name}
                </p>
                <p
                  className="text-[10px] tracking-wide text-muted-foreground mt-0.5 uppercase"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {item.color} · {item.size}
                </p>
                <p
                  className="text-sm font-semibold text-primary mt-1"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {formatAmount(item.product.price * item.quantity * 100)}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border pt-4 space-y-3">
          <div className="flex justify-between">
            <span
              className="text-xs tracking-wide uppercase text-muted-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Subtotal
            </span>
            <span
              className="text-sm text-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {formatAmount(subtotal * 100)}
            </span>
          </div>
          <div className="flex justify-between">
            <span
              className="text-xs tracking-wide uppercase text-muted-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Shipping
            </span>
            <span
              className="text-sm"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {estLoading ? (
                <Loader2
                  size={12}
                  className="animate-spin text-muted-foreground inline"
                />
              ) : isQuoteZone ? (
                <span className="text-primary italic">Quoted after order</span>
              ) : shippingFeeNaira === 0 ? (
                <span className="text-emerald-400">Free</span>
              ) : shippingFeeNaira != null ? (
                formatAmount(shippingFeeNaira * 100)
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </span>
          </div>
          <div className="flex justify-between pt-3 border-t border-border">
            <span
              className="text-xs tracking-[0.15em] uppercase text-foreground font-semibold"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Total
            </span>
            <span
              className="text-xl font-semibold text-primary"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {isQuoteZone
                ? `${formatAmount(subtotal * 100)} + shipping`
                : formatAmount(total * 100)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared primitives ──────────────────────────────────────────────────────────

function StepPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" as const }}
    >
      {children}
    </motion.div>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-3xl font-light text-foreground mb-8"
      style={{ fontFamily: "'Cormorant Garamond', serif" }}
    >
      {children}
    </h2>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function NextBtn({
  children,
  className = "w-full",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={`${className} bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer`}
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {children}
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 border border-border text-muted-foreground py-3.5 text-xs tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors cursor-pointer"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      Back
    </button>
  );
}
