import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  X,
  ChevronDown,
  MapPin,
  Package,
  User,
  CreditCard,
  Truck,
  Clock,
} from "lucide-react";
import {
  useAdminOrder,
  useAdminFulfilOrder,
  useAdminCancelOrder,
  useAdminUpdateProductionStage,
} from "@/hooks/use-api.ts";
import { formatPrice } from "@/lib/products.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";
import type { ApiOrder } from "@/lib/api.ts";

// ── Constants ─────────────────────────────────────────────────────────────────

const FONT_SERIF = { fontFamily: "'Cormorant Garamond', serif" } as const;
const FONT_SANS  = { fontFamily: "'Montserrat', sans-serif" }   as const;

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  awaiting_shipping_quote: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  paid:       "text-blue-400 bg-blue-400/10 border-blue-400/20",
  fulfilled:  "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  cancelled:  "text-muted-foreground bg-muted/60 border-border",
  failed:     "text-destructive bg-destructive/10 border-destructive/20",
  abandoned:  "text-muted-foreground bg-muted/60 border-border",
  refunded:   "text-muted-foreground bg-muted/60 border-border",
};

const SHIPPING_STATUS_LABELS: Record<ApiOrder["shippingStatus"], string> = {
  NOT_CALCULATED:  "Not calculated",
  CALCULATED:      "Calculated",
  AWAITING_QUOTE:  "Awaiting quote",
  QUOTED:          "Quote ready",
  PAID:            "Paid",
  PICKUP:          "Pickup",
  EXPIRED:         "Quote expired",
};

const STAGE_OPTIONS = [
  "cutting",
  "sewing",
  "quality_check",
  "ready",
  "delivered",
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtAddr(addr: ApiOrder["shippingAddress"]) {
  return [addr.line1, addr.line2, addr.city, addr.state, addr.country]
    .filter(Boolean)
    .join(", ");
}

// ── Section card ──────────────────────────────────────────────────────────────

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border">
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <p className="text-[10px] tracking-[0.25em] uppercase font-semibold text-muted-foreground"
          style={FONT_SANS}>
          {title}
        </p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0" style={FONT_SANS}>{label}</span>
      <span className="text-xs text-foreground text-right" style={FONT_SANS}>{value}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, refetch } = useAdminOrder(id ?? "");

  const fulfil      = useAdminFulfilOrder();
  const cancel      = useAdminCancelOrder();
  const updateStage = useAdminUpdateProductionStage();

  const [stageNote, setStageNote] = useState("");

  if (isLoading) {
    return (
      <div className="p-8 flex items-center gap-3 text-muted-foreground">
        <Spinner className="size-5" />
        <span className="text-sm" style={FONT_SANS}>Loading order…</span>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="p-8 space-y-4">
        <p className="text-muted-foreground text-sm" style={FONT_SANS}>Order not found.</p>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-xs tracking-[0.15em] uppercase text-primary underline underline-offset-2"
          style={FONT_SANS}
        >
          <ArrowLeft size={12} /> Back to Orders
        </Link>
      </div>
    );
  }

  const sc = STATUS_COLORS[order.status] ?? "";

  const handleFulfil = () => {
    fulfil.mutate(order._id, {
      onSuccess: () => { toast.success("Order marked as fulfilled"); refetch(); },
      onError:   (e: any) => toast.error(e.message ?? "Could not fulfil order"),
    });
  };

  const handleCancel = () => {
    if (!window.confirm("Cancel this order? This will release reserved stock.")) return;
    cancel.mutate(order._id, {
      onSuccess: () => { toast.success("Order cancelled"); refetch(); },
      onError:   (e: any) => toast.error(e.message ?? "Could not cancel order"),
    });
  };

  const handleStageUpdate = (stage: string) => {
    updateStage.mutate(
      { id: order._id, stage, note: stageNote || undefined },
      {
        onSuccess: () => {
          toast.success(`Stage updated to ${stage.replace(/_/g, " ")}`);
          setStageNote("");
          refetch();
        },
        onError: (e: any) => toast.error(e.message ?? "Could not update stage"),
      },
    );
  };

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      {/* ── Header ── */}
      <div>
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors mb-5"
          style={FONT_SANS}
        >
          <ArrowLeft size={11} /> All Orders
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1" style={FONT_SANS}>
              Admin — Order Detail
            </p>
            <h1 className="text-3xl font-light text-foreground" style={FONT_SERIF}>
              {order.orderNumber}
            </h1>
            <p className="text-muted-foreground text-sm mt-1" style={FONT_SANS}>
              Placed {fmtDate(order.createdAt)}
              {order.paidAt ? ` · Paid ${fmtDateTime(order.paidAt)}` : ""}
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`text-[10px] tracking-[0.15em] uppercase px-3 py-1 border font-semibold ${sc}`}
              style={FONT_SANS}>
              {order.status.replace(/_/g, " ")}
            </span>
            {/* Customer-facing tracking link */}
            <a
              href={`/orders/${order._id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
              style={FONT_SANS}
            >
              Customer view ↗
            </a>
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex gap-3 flex-wrap">
        {order.status === "paid" && (
          <button
            onClick={handleFulfil}
            disabled={fulfil.isPending}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2.5 text-xs tracking-[0.15em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
            style={FONT_SANS}
          >
            <Check size={13} /> Mark Fulfilled
          </button>
        )}
        {["paid", "pending_payment", "awaiting_shipping_quote"].includes(order.status) && (
          <button
            onClick={handleCancel}
            disabled={cancel.isPending}
            className="flex items-center gap-1.5 border border-destructive/40 text-destructive px-4 py-2.5 text-xs tracking-[0.15em] uppercase hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-60"
            style={FONT_SANS}
          >
            <X size={13} /> Cancel Order
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-6">
        {/* ── Left column ── */}
        <div className="space-y-6">

          {/* Line items */}
          <Section icon={<Package size={14} />} title="Items">
            <div className="divide-y divide-border/50">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-12 h-16 object-cover shrink-0 bg-muted"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate" style={FONT_SANS}>{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5" style={FONT_SANS}>
                      SKU: {item.sku} · Qty: {item.qty}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-primary shrink-0" style={FONT_SANS}>
                    {formatPrice(item.unitPrice * item.qty)}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          {/* Production stage (paid orders only) */}
          {(order.status === "paid" || order.status === "fulfilled") && (
            <Section icon={<Clock size={14} />} title="Production Stage">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <select
                      defaultValue={order.productionStage ?? ""}
                      onChange={(e) => handleStageUpdate(e.target.value)}
                      disabled={updateStage.isPending || order.status === "fulfilled"}
                      className="checkout-input text-xs py-2 appearance-none pr-8 w-48"
                    >
                      <option value="" disabled>Set stage…</option>
                      {STAGE_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                  {updateStage.isPending && <Spinner className="size-4 text-primary" />}
                </div>
                <input
                  type="text"
                  value={stageNote}
                  onChange={(e) => setStageNote(e.target.value)}
                  placeholder="Optional stage note…"
                  className="checkout-input text-xs w-full"
                  disabled={order.status === "fulfilled"}
                />
              </div>
            </Section>
          )}

          {/* Shipping address */}
          <Section icon={<MapPin size={14} />} title="Shipping Address">
            <p className="text-sm text-foreground leading-relaxed" style={FONT_SANS}>
              {order.shippingAddress.fullName}
              <br />
              {fmtAddr(order.shippingAddress)}
              <br />
              {order.shippingAddress.phone}
            </p>
          </Section>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-6">

          {/* Customer */}
          <Section icon={<User size={14} />} title="Customer">
            <Row label="Name"  value={order.customerName  ?? "—"} />
            <Row label="Email" value={order.customerEmail ?? "—"} />
            <Row label="Account" value={order.customerId ? "Registered" : "Guest"} />
          </Section>

          {/* Financials */}
          <Section icon={<CreditCard size={14} />} title="Payment">
            <Row label="Subtotal"  value={formatPrice(order.subtotal)} />
            {order.discountAmount > 0 && (
              <Row label="Discount" value={`− ${formatPrice(order.discountAmount)}`} />
            )}
            {order.shippingFee > 0 && (
              <Row label="Shipping" value={formatPrice(order.shippingFee)} />
            )}
            <Row
              label="Total (NGN)"
              value={<span className="font-semibold text-primary">{formatPrice(order.total)}</span>}
            />
            {order.chargeCurrency !== "NGN" && order.chargeTotal != null && (
              <Row
                label={`Charged (${order.chargeCurrency})`}
                value={`${order.chargeCurrency} ${(order.chargeTotal / 100).toLocaleString()}`}
              />
            )}
            {order.promoCode && (
              <Row label="Promo code" value={order.promoCode} />
            )}
            <Row label="Provider"  value={order.paymentProvider} />
            <Row label="Reference" value={
              <span className="font-mono text-[11px] break-all">{order.paymentReference}</span>
            } />
          </Section>

          {/* Shipping */}
          <Section icon={<Truck size={14} />} title="Shipping">
            <Row label="Status"    value={SHIPPING_STATUS_LABELS[order.shippingStatus]} />
            <Row label="Zone"      value={order.shippingZoneName ?? "—"} />
            <Row label="Fee"       value={order.shippingFee ? formatPrice(order.shippingFee) : "—"} />
            <Row label="Source"    value={order.shippingFeeSource ?? "—"} />
            {order.shippingQuote?.validUntil && (
              <Row label="Quote expires" value={fmtDateTime(order.shippingQuote.validUntil)} />
            )}
          </Section>

          {/* Timestamps */}
          <Section icon={<Clock size={14} />} title="Timestamps">
            <Row label="Created"   value={fmtDateTime(order.createdAt)} />
            {order.paidAt      && <Row label="Paid"      value={fmtDateTime(order.paidAt)} />}
            {order.fulfilledAt && <Row label="Fulfilled" value={fmtDateTime(order.fulfilledAt)} />}
          </Section>
        </div>
      </div>
    </div>
  );
}
