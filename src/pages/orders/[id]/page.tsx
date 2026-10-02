import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Package,
  Scissors,
  CheckCircle,
  Truck,
  Home,
  ArrowLeft,
  MapPin,
  Calendar,
  MessageCircle,
  Spool,
} from "lucide-react";
import { useOrder } from "@/hooks/use-api.ts";
import { formatPrice } from "@/lib/products.ts";
import { formatMinorUnits } from "@/lib/currency.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import Header from "../_components/Header.tsx";
import Footer from "../_components/Footer.tsx";
import type { ApiOrder } from "@/lib/api.ts";

// ── WhatsApp number (replace with real number or load from env) ───────────────
const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER ?? "2348000000000";

// ── Production stage ordering ─────────────────────────────────────────────────
type Stage = {
  key: ApiOrder["productionStage"] | "received";
  label: string;
  description: string;
  icon: React.ReactNode;
};

const STAGES: Stage[] = [
  {
    key: "received",
    label: "Order Received",
    description: "Your order has been confirmed and is queued for production.",
    icon: <Package size={15} />,
  },
  {
    key: "cutting",
    label: "Cutting",
    description: "Fabric is being measured and cut to your specifications.",
    icon: <Scissors size={15} />,
  },
  {
    key: "sewing",
    label: "Sewing",
    description: "Our artisans are assembling your garment.",
    icon: <Spool size={15} />,
  },
  {
    key: "quality_check",
    label: "Quality Check",
    description: "Final inspection to ensure every detail meets our standard.",
    icon: <CheckCircle size={15} />,
  },
  {
    key: "ready",
    label: "Ready",
    description: "Your order is packed and ready for dispatch.",
    icon: <Package size={15} />,
  },
  {
    key: "delivered",
    label: "Delivered",
    description: "Your order is on its way or has been delivered.",
    icon: <Truck size={15} />,
  },
];

// Map API status → display stage key
function resolveStageKey(order: ApiOrder): Stage["key"] {
  if (order.status === "fulfilled") return "delivered";
  if (order.productionStage) return order.productionStage;
  if (order.status === "paid") return "received";
  return "received";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatAddr(addr: ApiOrder["shippingAddress"]): string {
  return [addr.line1, addr.line2, addr.city, addr.state, addr.country]
    .filter(Boolean)
    .join(", ");
}

// ── Status badge label ────────────────────────────────────────────────────────
const STATUS_LABELS: Partial<Record<ApiOrder["status"], string>> = {
  pending_payment: "Awaiting Payment",
  paid: "Order Confirmed",
  fulfilled: "Delivered",
  cancelled: "Cancelled",
  failed: "Payment Failed",
};

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError } = useOrder(id ?? "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-[65px] flex items-center justify-center min-h-[70vh]">
          <Spinner className="size-8 text-primary" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-[65px] flex items-center justify-center min-h-[70vh]">
          <div className="text-center space-y-6">
            <p
              className="text-4xl font-light text-muted-foreground"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Order not found
            </p>
            <p
              className="text-xs tracking-wide text-muted-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Order <span className="text-primary">{id}</span> could not be
              located.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary underline underline-offset-4"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              <ArrowLeft size={12} /> Back to Shop
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const currentStageKey = resolveStageKey(order);
  const currentIdx = STAGES.findIndex((s) => s.key === currentStageKey);
  const progressPct = Math.round(((currentIdx + 1) / STAGES.length) * 100);
  const statusLabel =
    order.productionStage === "cutting" ||
    order.productionStage === "sewing" ||
    order.productionStage === "quality_check"
      ? "In Production"
      : (STATUS_LABELS[order.status] ?? "Order Confirmed");

  const whatsappText = encodeURIComponent(
    `Hi LABI, I have a question about my order ${order.orderNumber}`,
  );
  const whatsappHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-[65px]">
        {/* Top bar */}
        <div className="border-b border-border bg-card">
          <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p
                className="text-[10px] tracking-[0.3em] uppercase text-primary mb-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Order Tracking
              </p>
              <h1
                className="text-4xl font-light text-foreground"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {order.orderNumber}
              </h1>
              <p
                className="text-muted-foreground mt-1 text-sm font-light"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Placed {formatDate(order.createdAt)}
              </p>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-[#25D366] text-[#25D366] px-5 py-3 text-xs tracking-[0.15em] uppercase hover:bg-[#25D366]/10 transition-colors cursor-pointer self-start sm:self-auto"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              <MessageCircle size={14} />
              Ask on WhatsApp
            </a>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-[1fr_360px] gap-12">
            {/* Left — timeline */}
            <div className="space-y-10">
              {/* Status badge */}
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary animate-pulse" />
                <span
                  className="text-xs tracking-[0.2em] uppercase text-primary font-semibold"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Progress bar */}
              {order.status === "paid" || order.status === "fulfilled" ? (
                <div>
                  <div className="flex justify-between mb-2">
                    <span
                      className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Production Progress
                    </span>
                    <span
                      className="text-[10px] tracking-[0.15em] uppercase text-primary"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {currentIdx + 1} / {STAGES.length} stages
                    </span>
                  </div>
                  <div className="h-1 bg-muted w-full">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPct}%` }}
                      transition={{
                        duration: 1.2,
                        ease: "easeOut",
                        delay: 0.2,
                      }}
                    />
                  </div>
                </div>
              ) : null}

              {/* Pending payment notice */}
              {order.status === "pending_payment" && order.checkoutUrl && (
                <div className="bg-primary/5 border border-primary/20 px-5 py-4 flex gap-3 items-start">
                  <div className="w-2 h-2 bg-primary mt-1 shrink-0" />
                  <div>
                    <p
                      className="text-sm font-light text-foreground leading-relaxed mb-2"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      Your order is awaiting payment. Complete payment to begin
                      production.
                    </p>
                    <a
                      href={order.checkoutUrl}
                      className="text-xs tracking-[0.2em] uppercase text-primary underline underline-offset-4"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Complete Payment →
                    </a>
                  </div>
                </div>
              )}

              {/* Production timeline */}
              {(order.status === "paid" || order.status === "fulfilled") && (
                <div>
                  <p
                    className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-6 font-semibold"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Production Timeline
                  </p>
                  <div className="relative">
                    <div className="absolute left-[15px] top-0 bottom-0 w-[1px] bg-border" />
                    <div className="space-y-0">
                      {STAGES.map((stage, i) => {
                        const isCompleted = i < currentIdx;
                        const isCurrent = i === currentIdx;
                        const isPending = i > currentIdx;
                        return (
                          <motion.div
                            key={stage.key}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.07, duration: 0.4 }}
                            className={`relative flex gap-5 ${i < STAGES.length - 1 ? "pb-8" : ""}`}
                          >
                            <div className="relative z-10 shrink-0">
                              <div
                                className={`w-8 h-8 flex items-center justify-center border-2 transition-all ${
                                  isCompleted
                                    ? "bg-primary border-primary text-primary-foreground"
                                    : isCurrent
                                      ? "bg-primary/10 border-primary text-primary"
                                      : "bg-background border-border text-muted-foreground"
                                }`}
                              >
                                {isCompleted ? (
                                  <CheckCircle
                                    size={14}
                                    className="text-primary-foreground"
                                  />
                                ) : (
                                  <span className="text-current">
                                    {stage.icon}
                                  </span>
                                )}
                              </div>
                              {isCurrent && (
                                <div className="absolute inset-0 border-2 border-primary animate-ping opacity-30" />
                              )}
                            </div>
                            <div
                              className={`pt-1 pb-2 ${isPending ? "opacity-40" : ""}`}
                            >
                              <p
                                className={`text-xs font-semibold tracking-wide mb-0.5 ${
                                  isCompleted || isCurrent
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }`}
                                style={{
                                  fontFamily: "'Montserrat', sans-serif",
                                }}
                              >
                                {stage.label}
                                {isCurrent && (
                                  <span className="ml-2 text-[9px] tracking-[0.2em] uppercase text-primary bg-primary/10 px-2 py-0.5">
                                    Current
                                  </span>
                                )}
                              </p>
                              <p
                                className="text-sm text-muted-foreground font-light leading-relaxed"
                                style={{
                                  fontFamily: "'Cormorant Garamond', serif",
                                }}
                              >
                                {stage.description}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Estimated delivery */}
              {order.fulfilledAt && (
                <div className="flex items-start gap-4 border border-border px-5 py-5">
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Calendar size={16} className="text-primary" />
                  </div>
                  <div>
                    <p
                      className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Delivered
                    </p>
                    <p
                      className="text-xl font-light text-foreground"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {formatDate(order.fulfilledAt)}
                    </p>
                  </div>
                </div>
              )}

              {/* Shipping address */}
              <div className="flex items-start gap-4 border border-border px-5 py-5">
                <div className="w-10 h-10 bg-muted/60 border border-border flex items-center justify-center shrink-0">
                  <MapPin size={16} className="text-muted-foreground" />
                </div>
                <div>
                  <p
                    className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Delivering to
                  </p>
                  <p
                    className="text-base font-light text-foreground leading-snug"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {order.shippingAddress.fullName}
                  </p>
                  <p
                    className="text-sm font-light text-muted-foreground leading-snug mt-0.5"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {formatAddr(order.shippingAddress)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right — order summary */}
            <div className="space-y-6">
              <div className="bg-card border border-border p-6">
                <p
                  className="text-[10px] tracking-[0.3em] uppercase text-primary mb-5 font-semibold"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Items in This Order
                </p>
                <div className="space-y-4 mb-5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="w-16 h-20 shrink-0 overflow-hidden bg-muted">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-light text-foreground leading-snug"
                          style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                          {item.title}
                        </p>
                        <p
                          className="text-[10px] tracking-wide text-muted-foreground mt-0.5 uppercase"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          Qty {item.qty} · {item.sku}
                        </p>
                        <p
                          className="text-sm font-semibold text-primary mt-1"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {formatPrice(item.unitPrice * item.qty)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="border-t border-border pt-4 space-y-2.5">
                  <div className="flex justify-between">
                    <span
                      className="text-xs uppercase tracking-wide text-muted-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Subtotal
                    </span>
                    <span
                      className="text-sm text-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formatPrice(order.subtotal)}
                    </span>
                  </div>
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span
                        className="text-xs uppercase tracking-wide text-muted-foreground"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        Discount
                      </span>
                      <span
                        className="text-sm text-primary"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        −{formatPrice(order.discountAmount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span
                      className="text-xs uppercase tracking-[0.15em] text-foreground font-semibold"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Total
                    </span>
                    <div className="text-right">
                      {order.chargeTotal &&
                      order.chargeCurrency &&
                      order.chargeCurrency !== "NGN" ? (
                        <>
                          <span
                            className="text-xl font-semibold text-primary block"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {formatMinorUnits(
                              order.chargeTotal,
                              order.chargeCurrency,
                            )}
                          </span>
                          <span
                            className="text-xs text-muted-foreground"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            ≈ {formatPrice(order.total)}
                          </span>
                        </>
                      ) : (
                        <span
                          className="text-xl font-semibold text-primary"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {formatPrice(order.total)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Need help */}
              <div className="bg-card border border-border p-6 space-y-4">
                <p
                  className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-semibold"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Need Help?
                </p>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-[#25D366] text-[#25D366] py-3 text-xs tracking-[0.15em] uppercase hover:bg-[#25D366]/10 transition-colors cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  <MessageCircle size={14} /> Chat on WhatsApp
                </a>
                <Link
                  to="/shop"
                  className="flex items-center justify-center gap-2 w-full border border-border text-muted-foreground py-3 text-xs tracking-[0.15em] uppercase hover:border-foreground hover:text-foreground transition-colors cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  <Home size={12} /> Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
