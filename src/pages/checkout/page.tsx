import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  Check,
  ArrowLeft,
  ExternalLink,
  Clock,
} from "lucide-react";
import { useCart } from "@/hooks/use-cart.tsx";
import { formatPrice } from "@/lib/products.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { useCurrency } from "@/components/providers/currency.tsx";
import { formatMinorUnits } from "@/lib/currency.ts";
import {
  orders as ordersApi,
  type ShippingAddress,
  ApiError,
} from "@/lib/api.ts";
import Header from "../_components/Header.tsx";
import Footer from "../_components/Footer.tsx";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner.tsx";

// ── Types ──────────────────────────────────────────────────────────────────────

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
  method: "standard" | "express";
};

// ── Constants ──────────────────────────────────────────────────────────────────

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

// ── Main Component ─────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { activeCurrency, rates, fxBuffer, formatAmount } = useCurrency();

  const [step, setStep] = useState<Step>("contact");
  const [submitting, setSubmitting] = useState(false);

  // Confirmation state
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [confirmedOrderNumber, setConfirmedOrderNumber] = useState<
    string | null
  >(null);
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
    method: "standard",
  });

  // Gateway selection — driven by currency
  const isNgn = activeCurrency === "NGN";
  const stripeEnabled = import.meta.env.VITE_STRIPE_ENABLED === "true";

  // For NGN: user chooses paystack or flutterwave
  // For non-NGN with Stripe: only stripe
  // For non-NGN without Stripe: only flutterwave
  const [paymentProvider, setPaymentProvider] = useState<
    "paystack" | "flutterwave" | "stripe"
  >(isNgn ? "paystack" : stripeEnabled ? "stripe" : "flutterwave");

  // Keep provider in sync when currency changes
  useEffect(() => {
    if (!isNgn) {
      setPaymentProvider(stripeEnabled ? "stripe" : "flutterwave");
    } else {
      setPaymentProvider((p) => (p === "stripe" ? "paystack" : p));
    }
  }, [isNgn, stripeEnabled]);

  const shippingCost =
    shipping.method === "express" ? 8500 : subtotal >= 50_000 ? 0 : 3500;
  const total = subtotal + shippingCost;
  const currentStepIdx = STEPS.findIndex((s) => s.id === step);

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

  // ── Place order (calls backend, opens payment gateway) ────────────────────

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
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
      // Build FX snapshot from current CurrencyProvider state
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

      // result.order has the order doc; result.checkoutUrl is the gateway URL
      const url = result.checkoutUrl ?? (result as any).data?.checkoutUrl;
      const orderId = (result as any).order?._id ?? (result as any)._id ?? "";
      const orderNumber =
        (result as any).order?.orderNumber ?? (result as any).orderNumber ?? "";

      setConfirmedOrderId(orderId);
      setConfirmedOrderNumber(orderNumber);
      setCheckoutUrl(url ?? null);
      clearCart();
      setStep("confirmation");
      toast.success("Order created! Redirecting to payment…");

      // Redirect to hosted payment gateway immediately
      if (url) {
        setTimeout(() => {
          window.location.href = url;
        }, 1200);
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Could not create your order. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-[65px]">
        {step === "confirmation" ? (
          <Confirmation
            contact={contact}
            orderId={confirmedOrderId}
            orderNumber={confirmedOrderNumber}
            checkoutUrl={checkoutUrl}
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

                  {step === "shipping" && (
                    <StepPanel key="shipping">
                      <StepTitle>Shipping Address</StepTitle>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setStep("payment");
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
                          <Field label="State" required>
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
                          </Field>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="Country">
                            <input
                              value="Nigeria"
                              readOnly
                              className="checkout-input opacity-60"
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

                        {/* Shipping method */}
                        <div>
                          <p
                            className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-3"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            Shipping Method
                          </p>
                          <div className="space-y-3">
                            {[
                              {
                                id: "standard" as const,
                                label: "Standard Delivery",
                                sub: "3–5 business days",
                                price:
                                  subtotal >= 50000
                                    ? "Free"
                                    : formatPrice(3500),
                              },
                              {
                                id: "express" as const,
                                label: "Express Delivery",
                                sub: "1–2 business days",
                                price: formatPrice(8500),
                              },
                            ].map((opt) => (
                              <label
                                key={opt.id}
                                className={`flex items-center justify-between px-4 py-4 border cursor-pointer transition-all ${shipping.method === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-foreground/40"}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`w-4 h-4 border flex items-center justify-center ${shipping.method === opt.id ? "border-primary" : "border-border"}`}
                                  >
                                    {shipping.method === opt.id && (
                                      <div className="w-2 h-2 bg-primary" />
                                    )}
                                  </div>
                                  <div>
                                    <p
                                      className="text-xs text-foreground font-medium"
                                      style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                      }}
                                    >
                                      {opt.label}
                                    </p>
                                    <p
                                      className="text-[10px] text-muted-foreground"
                                      style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                      }}
                                    >
                                      {opt.sub}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className="text-sm font-semibold text-primary"
                                  style={{
                                    fontFamily: "'Montserrat', sans-serif",
                                  }}
                                >
                                  {opt.price}
                                </span>
                                <input
                                  type="radio"
                                  className="hidden"
                                  checked={shipping.method === opt.id}
                                  onChange={() =>
                                    setShipping({ ...shipping, method: opt.id })
                                  }
                                />
                              </label>
                            ))}
                          </div>
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

                  {step === "payment" && (
                    <StepPanel key="payment">
                      <StepTitle>Payment</StepTitle>
                      <form onSubmit={handlePlaceOrder} className="space-y-6">
                        {/* Gateway notice */}
                        <div className="bg-primary/5 border border-primary/20 px-4 py-3 flex items-start gap-3">
                          <div className="w-2 h-2 bg-primary mt-1 shrink-0" />
                          <p
                            className="text-xs text-muted-foreground leading-relaxed"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            You will be redirected to a secure payment page to
                            complete your purchase. Your card details never
                            touch our servers.
                          </p>
                        </div>

                        {/* Price-lock banner for non-NGN orders */}
                        {!isNgn && (
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

                        {/* Provider selection */}
                        <Field label="Payment Provider">
                          <div className="space-y-3">
                            {isNgn ? (
                              // NGN: customer chooses Paystack or Flutterwave
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
                                        fontFamily: "'Montserrat', sans-serif",
                                      }}
                                    >
                                      {opt.label}
                                    </p>
                                    <p
                                      className="text-[10px] text-muted-foreground"
                                      style={{
                                        fontFamily: "'Montserrat', sans-serif",
                                      }}
                                    >
                                      {opt.sub}
                                    </p>
                                  </div>
                                  <input
                                    type="radio"
                                    className="hidden"
                                    checked={paymentProvider === opt.id}
                                    onChange={() => setPaymentProvider(opt.id)}
                                  />
                                </label>
                              ))
                            ) : (
                              // Non-NGN: gateway determined by currency
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

                        <div className="flex gap-3 pt-2">
                          <BackBtn onClick={() => setStep("shipping")} />
                          <button
                            type="submit"
                            disabled={submitting}
                            className="flex-[2] bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {submitting ? (
                              <>
                                <Spinner className="size-4" /> Processing…
                              </>
                            ) : (
                              <>Pay {formatAmount(total * 100)} →</>
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
                  shippingCost={shippingCost}
                  total={total}
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

// ── Confirmation screen ────────────────────────────────────────────────────────

function Confirmation({
  contact,
  orderId,
  orderNumber,
  checkoutUrl,
}: {
  contact: ContactInfo;
  orderId: string | null;
  orderNumber: string | null;
  checkoutUrl: string | null;
}) {
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
          Order Created
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
          {checkoutUrl
            ? "Redirecting you to the secure payment page now…"
            : "Your order has been received and is awaiting payment confirmation."}
        </p>
        {contact.email && (
          <p
            className="text-xs tracking-wide text-muted-foreground mb-3"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Confirmation to{" "}
            <span className="text-primary">{contact.email}</span>
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
          {checkoutUrl && (
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
              Track Order
            </Link>
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

function OrderSummary({
  items,
  subtotal,
  shippingCost,
  total,
}: {
  items: import("@/hooks/use-cart.tsx").CartItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
}) {
  const { formatAmount } = useCurrency();
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
              className="text-sm text-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {shippingCost === 0 ? "Free" : formatAmount(shippingCost * 100)}
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
              {formatAmount(total * 100)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
