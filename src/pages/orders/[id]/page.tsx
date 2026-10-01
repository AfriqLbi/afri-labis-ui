import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  Package,
  Scissors,
  Spool,
  CheckCircle,
  Truck,
  Home,
  ArrowLeft,
  MapPin,
  Calendar,
  MessageCircle,
} from "lucide-react";
import {
  getOrderById,
  type ProductionStage,
  type StageEntry,
} from "@/lib/mock-orders.ts";
import { formatPrice } from "@/lib/products.ts";
import Header from "../_components/Header.tsx";
import Footer from "../_components/Footer.tsx";
import { formatMinorUnits } from "@/lib/currency.ts";

/* ── Stage config ── */

const STAGE_CONFIG: Record<
  ProductionStage,
  { icon: React.ReactNode; color: string }
> = {
  received: { icon: <Package size={16} />, color: "text-primary" },
  cutting: { icon: <Scissors size={16} />, color: "text-primary" },
  sewing: { icon: <Spool size={16} />, color: "text-primary" },
  quality_check: { icon: <CheckCircle size={16} />, color: "text-primary" },
  ready: { icon: <Package size={16} />, color: "text-primary" },
  delivered: { icon: <Truck size={16} />, color: "text-primary" },
};

const WHATSAPP_NUMBER = "2348000000000"; // configurable

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderTrackingPage() {
  const { id } = useParams<{ id: string }>();
  const order = id ? getOrderById(id) : null;

  if (!order) {
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
              Order ID <span className="text-primary">{id}</span> could not be
              located.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary underline underline-offset-4 cursor-pointer"
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

  const stageIndex = order.stages.findIndex(
    (s) => s.stage === order.currentStage,
  );

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
                {order.id}
              </h1>
              <p
                className="text-muted-foreground mt-1 text-sm font-light"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Placed {formatDate(order.placedAt)}
              </p>
            </div>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20LABI%2C%20I%20have%20a%20question%20about%20my%20order%20${order.id}`}
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
            {/* Left column — timeline + note */}
            <div className="space-y-10">
              {/* Status badge */}
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-primary animate-pulse" />
                <span
                  className="text-xs tracking-[0.2em] uppercase text-primary font-semibold"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {order.status === "in_production"
                    ? "In Production"
                    : order.status === "ready"
                      ? "Ready for Delivery"
                      : order.status === "delivered"
                        ? "Delivered"
                        : "Order Confirmed"}
                </span>
              </div>

              {/* Progress bar */}
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
                    {stageIndex + 1} / {order.stages.length} stages
                  </span>
                </div>
                <div className="h-1 bg-muted w-full">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((stageIndex + 1) / order.stages.length) * 100}%`,
                    }}
                    transition={{
                      duration: 1.2,
                      ease: "easeOut" as const,
                      delay: 0.2,
                    }}
                  />
                </div>
              </div>

              {/* Tracker note */}
              {order.trackingNote && (
                <div className="bg-primary/5 border border-primary/20 px-5 py-4 flex gap-3 items-start">
                  <div className="w-2 h-2 bg-primary mt-1 shrink-0" />
                  <p
                    className="text-sm font-light text-foreground leading-relaxed"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {order.trackingNote}
                  </p>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p
                  className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-6 font-semibold"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Production Timeline
                </p>
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[15px] top-0 bottom-0 w-[1px] bg-border" />

                  <div className="space-y-0">
                    {order.stages.map((stage, i) => (
                      <TimelineStage
                        key={stage.stage}
                        stage={stage}
                        index={i}
                        stageIndex={stageIndex}
                        isLast={i === order.stages.length - 1}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Estimated delivery */}
              <div className="flex items-start gap-4 border border-border px-5 py-5">
                <div className="w-10 h-10 bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <Calendar size={16} className="text-primary" />
                </div>
                <div>
                  <p
                    className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Estimated Ready
                  </p>
                  <p
                    className="text-xl font-light text-foreground"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {formatDate(order.estimatedReady)}
                  </p>
                </div>
              </div>

              {/* Delivery address */}
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
                    {order.shippingAddress}
                  </p>
                  <p
                    className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {order.shippingMethod === "express"
                      ? "Express Delivery"
                      : "Standard Delivery"}
                    {order.shippingCost === 0
                      ? " · Free"
                      : ` · ${formatPrice(order.shippingCost)}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Right column — order summary */}
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
                      <div className="w-16 h-20 shrink-0 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-light text-foreground leading-snug"
                          style={{ fontFamily: "'Cormorant Garamond', serif" }}
                        >
                          {item.name}
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
                          {formatPrice(item.price * item.quantity)}
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
                  <div className="flex justify-between">
                    <span
                      className="text-xs uppercase tracking-wide text-muted-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Shipping
                    </span>
                    <span
                      className="text-sm text-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {order.shippingCost === 0
                        ? "Free"
                        : formatPrice(order.shippingCost)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span
                      className="text-xs uppercase tracking-[0.15em] text-foreground font-semibold"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Total
                    </span>
                    <div className="text-right">
                      {/* Show chargeTotal in chargeCurrency for real API orders */}
                      {(order as any).chargeTotal &&
                      (order as any).chargeCurrency &&
                      (order as any).chargeCurrency !== "NGN" ? (
                        <>
                          <span
                            className="text-xl font-semibold text-primary block"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {formatMinorUnits(
                              (order as any).chargeTotal,
                              (order as any).chargeCurrency,
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
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20LABI%2C%20I%20have%20a%20question%20about%20my%20order%20${order.id}`}
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

/* ── Timeline Stage Component ── */

function TimelineStage({
  stage,
  index,
  stageIndex,
  isLast,
}: {
  stage: StageEntry;
  index: number;
  stageIndex: number;
  isLast: boolean;
}) {
  const isCompleted = index < stageIndex;
  const isCurrent = index === stageIndex;
  const isPending = index > stageIndex;

  const cfg = STAGE_CONFIG[stage.stage];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.4,
        ease: "easeOut" as const,
      }}
      className={`relative flex gap-5 ${isLast ? "" : "pb-8"}`}
    >
      {/* Icon node */}
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
            <CheckCircle size={14} className="text-primary-foreground" />
          ) : (
            <span className={cfg.color}>{cfg.icon}</span>
          )}
        </div>
        {/* Pulse for active */}
        {isCurrent && (
          <div className="absolute inset-0 border-2 border-primary animate-ping opacity-30" />
        )}
      </div>

      {/* Content */}
      <div className={`pt-1 pb-2 ${isPending ? "opacity-40" : ""}`}>
        <p
          className={`text-xs font-semibold tracking-wide mb-0.5 ${
            isCompleted || isCurrent
              ? "text-foreground"
              : "text-muted-foreground"
          }`}
          style={{ fontFamily: "'Montserrat', sans-serif" }}
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
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {stage.description}
        </p>
        {stage.completedAt && (
          <p
            className="text-[10px] text-muted-foreground/70 mt-1"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Completed {formatDateTime(stage.completedAt)}
          </p>
        )}
        {!stage.completedAt && stage.estimatedAt && (
          <p
            className="text-[10px] text-muted-foreground/50 mt-1"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Est. {formatDate(stage.estimatedAt)}
          </p>
        )}
      </div>
    </motion.div>
  );
}
