import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  Check,
  ExternalLink,
  MessageCircle,
  ArrowLeft,
  Loader2,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useOrderByReference } from "@/hooks/use-api.ts";
import type { OrderReferenceStatus } from "@/lib/api.ts";
import Header from "../../_components/Header.tsx";
import Footer from "../../_components/Footer.tsx";
import PageMeta from "@/components/PageMeta.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";

const WHATSAPP = import.meta.env.VITE_WHATSAPP_NUMBER ?? "2349019825348";

const FONT_SERIF = { fontFamily: "'Cormorant Garamond', serif" } as const;
const FONT_SANS = { fontFamily: "'Montserrat', sans-serif" } as const;

export default function CheckoutConfirmPage() {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");
  const { data: order, isLoading, isError } = useOrderByReference(ref);

  return (
    <div className="min-h-screen bg-background">
      <PageMeta title="Order Confirmation" noIndex={true} />
      <Header />
      <div className="pt-[65px] flex items-center justify-center min-h-screen px-6 py-24">
        {!ref || isError ? (
          <NotFoundBlock />
        ) : isLoading || !order ? (
          <Spinner className="size-8 text-primary" />
        ) : (
          <ConfirmContent order={order} />
        )}
      </div>
      <Footer />
    </div>
  );
}

// ── Not found ─────────────────────────────────────────────────────────────────

function NotFoundBlock() {
  return (
    <div className="max-w-lg text-center space-y-6">
      <div className="w-16 h-16 bg-muted flex items-center justify-center mx-auto mb-2">
        <AlertCircle size={24} className="text-muted-foreground" />
      </div>
      <p className="text-4xl font-light text-muted-foreground" style={FONT_SERIF}>
        Order not found
      </p>
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary underline underline-offset-4 cursor-pointer"
        style={FONT_SANS}
      >
        <ArrowLeft size={12} /> Back to Shop
      </Link>
    </div>
  );
}

// ── Confirmation content ───────────────────────────────────────────────────────

function ConfirmContent({ order }: { order: OrderReferenceStatus }) {
  const firstName = (order.customerName ?? "").split(" ")[0];
  const waLink = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `Hi LABI, I have a question about my order ${order.orderNumber}`,
  )}`;

  const isPaid = order.status === "paid" || order.status === "fulfilled";
  const isQuote = order.status === "awaiting_shipping_quote";
  const isPending = order.status === "pending_payment";
  const isFailed = order.status === "failed";
  const isClosed =
    order.status === "cancelled" ||
    order.status === "refunded" ||
    order.status === "abandoned";

  let eyebrow = "Order Confirmed";
  let headline = firstName ? `Thank you, ${firstName}!` : "Order confirmed!";
  let subtext =
    "Your payment is confirmed. We're beginning production and will email you updates.";

  if (isQuote) {
    eyebrow = "Quote Requested";
    subtext =
      "We've received your order. An admin will set the shipping fee and email you a payment link — usually within 24 hours.";
  } else if (isPending) {
    eyebrow = "Confirming Payment";
    headline = firstName ? `Thank you, ${firstName}!` : "Almost there!";
    subtext =
      "We're confirming your payment with the gateway. This usually takes a few seconds — if this page doesn't update shortly, check your order status below.";
  } else if (isFailed) {
    eyebrow = "Payment Failed";
    headline = "Payment could not be completed";
    subtext =
      "Your payment didn't go through. You can try again using the payment link below.";
  } else if (isClosed) {
    eyebrow = "Order Closed";
    headline = "This order is no longer active";
    subtext = "If you believe this is an error, please contact us and we'll help.";
  }

  const showPayLink = (isPending || isFailed) && !!order.checkoutUrl;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" as const }}
      className="max-w-2xl text-center"
    >
      {/* Status icon */}
      <div
        className={`w-16 h-16 flex items-center justify-center mx-auto mb-8 ${
          isPaid
            ? "bg-primary"
            : isPending
              ? "bg-muted"
              : isFailed || isClosed
                ? "bg-destructive/10"
                : "bg-primary/10"
        }`}
      >
        {isPaid ? (
          <Check size={24} className="text-primary-foreground" />
        ) : isPending ? (
          <Loader2 size={24} className="animate-spin text-muted-foreground" />
        ) : isFailed || isClosed ? (
          <AlertCircle size={24} className="text-destructive" />
        ) : (
          <Clock size={24} className="text-primary" />
        )}
      </div>

      <p
        className="text-xs tracking-[0.3em] uppercase text-primary mb-4"
        style={FONT_SANS}
      >
        {eyebrow}
      </p>
      <h1 className="text-5xl font-light text-foreground mb-6" style={FONT_SERIF}>
        {headline}
      </h1>
      <p
        className="text-muted-foreground text-lg font-light leading-relaxed mb-4"
        style={FONT_SERIF}
      >
        {subtext}
      </p>
      {order.customerEmail && (
        <p
          className="text-xs tracking-wide text-muted-foreground mb-3"
          style={FONT_SANS}
        >
          Updates to <span className="text-primary">{order.customerEmail}</span>
        </p>
      )}
      <p
        className="text-xs tracking-wide text-muted-foreground mb-8"
        style={FONT_SANS}
      >
        Order:{" "}
        <span className="text-primary font-semibold">{order.orderNumber}</span>
      </p>

      <div className="w-12 h-[1px] bg-primary mx-auto mb-8" />

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {showPayLink && (
          <a
            href={order.checkoutUrl!}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            style={FONT_SANS}
          >
            <ExternalLink size={13} /> Complete Payment
          </a>
        )}
        {order._id && (
          <Link
            to={`/orders/${order._id}`}
            className="text-nowrap inline-flex items-center justify-center gap-2 border border-border text-muted-foreground px-8 py-4 text-xs tracking-[0.2em] uppercase hover:border-foreground hover:text-foreground transition-colors cursor-pointer"
            style={FONT_SANS}
          >
            {isQuote ? "View Order Status" : "Track Order"}
          </Link>
        )}
        {isQuote && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-nowrap inline-flex items-center justify-center gap-2 border border-[#25D366] text-[#25D366] px-8 py-4 text-xs tracking-[0.2em] uppercase hover:bg-[#25D366]/10 transition-colors cursor-pointer"
            style={FONT_SANS}
          >
            <MessageCircle size={13} /> WhatsApp Us
          </a>
        )}
        <Link
          to="/shop"
          className="text-nowrap inline-flex items-center justify-center gap-2 border border-border text-muted-foreground px-8 py-4 text-xs tracking-[0.2em] uppercase hover:border-foreground hover:text-foreground transition-colors cursor-pointer"
          style={FONT_SANS}
        >
          Continue Shopping
        </Link>
      </div>
    </motion.div>
  );
}
