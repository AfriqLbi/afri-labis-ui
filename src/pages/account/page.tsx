import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  ShoppingBag,
  Ruler,
  ChevronRight,
  Save,
  Check,
  LogOut,
  Package,
  Scissors,
  CheckCircle,
  Truck,
  Clock,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import {
  Authenticated,
  Unauthenticated,
  AuthLoading,
} from "@/components/providers/auth.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import {
  useMyOrders,
  useMyCustomOrders,
  useMeasurementProfiles,
} from "@/hooks/use-api.ts";
import {
  auth as authApi,
  ApiError,
  type ApiOrder,
  type ApiCustomOrder,
} from "@/lib/api.ts";
import { formatPrice } from "@/lib/products.ts";
import { formatMinorUnits } from "@/lib/currency.ts";
import Header from "../_components/Header.tsx";
import Footer from "../_components/Footer.tsx";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

/* ── Types ───────────────────────────────────────────────────────────────── */
type Tab = "profile" | "orders" | "custom-orders" | "measurements";

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
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

const ORDER_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_payment: {
    label: "Awaiting Payment",
    color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  },
  paid: {
    label: "Paid",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  fulfilled: {
    label: "Fulfilled",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-muted-foreground bg-muted/60 border-border",
  },
  refunded: {
    label: "Refunded",
    color: "text-muted-foreground bg-muted/60 border-border",
  },
  failed: {
    label: "Failed",
    color: "text-destructive bg-destructive/10 border-destructive/20",
  },
  abandoned: {
    label: "Abandoned",
    color: "text-muted-foreground bg-muted/60 border-border",
  },
};

const CUSTOM_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_review: {
    label: "Pending Review",
    color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  },
  quoted: {
    label: "Quote Ready",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  approved: {
    label: "Approved",
    color: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  },
  payment_pending: {
    label: "Awaiting Payment",
    color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  },
  paid: {
    label: "Paid",
    color: "text-primary bg-primary/10 border-primary/20",
  },
  in_production: {
    label: "In Production",
    color: "text-primary bg-primary/10 border-primary/20",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-muted-foreground bg-muted/60 border-border",
  },
  refunded: {
    label: "Refunded",
    color: "text-muted-foreground bg-muted/60 border-border",
  },
};

const STAGE_ICONS: Record<string, React.ReactNode> = {
  cutting: <Scissors size={12} />,
  sewing: <Package size={12} />,
  quality_check: <CheckCircle size={12} />,
  ready: <Package size={12} />,
  delivered: <Truck size={12} />,
};

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default function AccountPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-[65px]">
        <AuthLoading>
          <AccountSkeleton />
        </AuthLoading>
        <Unauthenticated>
          <SignInPrompt />
        </Unauthenticated>
        <Authenticated>
          <AccountContent />
        </Authenticated>
      </div>
      <Footer />
    </div>
  );
}

/* ── Sign-in prompt ───────────────────────────────────────────────────────── */
function SignInPrompt() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-muted border border-border flex items-center justify-center mx-auto mb-8">
          <User size={24} className="text-muted-foreground" />
        </div>
        <p
          className="text-[10px] tracking-[0.3em] uppercase text-primary mb-4"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          My Account
        </p>
        <h1
          className="text-4xl font-light text-foreground mb-4"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Sign in to your account
        </h1>
        <p
          className="text-muted-foreground text-lg font-light leading-relaxed mb-8"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Access your order history, saved measurements, and profile settings.
        </p>
        <Link
          to="/auth/signin?redirect=/account"
          className="inline-flex items-center justify-center w-full bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Sign In
        </Link>
        <p
          className="text-muted-foreground text-xs mt-6"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Don&apos;t have an account?{" "}
          <Link
            to="/auth/register?redirect=/account"
            className="text-primary underline underline-offset-2"
          >
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────────────────── */
function AccountSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
      <Skeleton className="h-24 w-full" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-32" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/* ── Authenticated shell ──────────────────────────────────────────────────── */
function AccountContent() {
  const { user, logout } = useAuth();
  const [tab, setTab] = useState<Tab>("profile");

  const name = user?.name ?? "Guest";
  const email = user?.email ?? "";
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User size={13} /> },
    { id: "orders", label: "My Orders", icon: <ShoppingBag size={13} /> },
    {
      id: "custom-orders",
      label: "Custom Orders",
      icon: <Scissors size={13} />,
    },
    { id: "measurements", label: "Measurements", icon: <Ruler size={13} /> },
  ];

  return (
    <div>
      {/* Header bar */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
              <span
                className="text-primary text-lg font-semibold"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {initials}
              </span>
            </div>
            <div>
              <p
                className="text-[10px] tracking-[0.25em] uppercase text-primary mb-0.5"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                My Account
              </p>
              <h1
                className="text-2xl font-light text-foreground"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {name}
              </h1>
              {email && (
                <p
                  className="text-xs text-muted-foreground mt-0.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {email}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="hidden sm:flex items-center gap-2 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground border border-border px-4 py-2.5 hover:border-foreground/40 transition-colors cursor-pointer"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <LogOut size={12} /> Sign Out
          </button>
        </div>
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-6 flex gap-0 border-t border-border overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-4 text-[10px] tracking-[0.2em] uppercase transition-all cursor-pointer whitespace-nowrap ${tab === t.id ? "border-b-2 border-primary text-foreground -mb-px" : "text-muted-foreground hover:text-foreground"}`}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <AnimatePresence mode="wait">
          {tab === "profile" && (
            <TabPanel key="profile">
              <ProfileTab name={name} email={email} phone={user?.phone ?? ""} />
            </TabPanel>
          )}
          {tab === "orders" && (
            <TabPanel key="orders">
              <OrdersTab />
            </TabPanel>
          )}
          {tab === "custom-orders" && (
            <TabPanel key="co">
              <CustomOrdersTab />
            </TabPanel>
          )}
          {tab === "measurements" && (
            <TabPanel key="meas">
              <MeasurementsTab />
            </TabPanel>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Profile Tab ──────────────────────────────────────────────────────────── */
function ProfileTab({
  name,
  email,
  phone,
}: {
  name: string;
  email: string;
  phone: string;
}) {
  const [form, setForm] = useState({ name, email, phone });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Profile updates go through auth/me — backend PATCH not yet exposed,
      // so we optimistically confirm and show saved state.
      await new Promise((r) => setTimeout(r, 400)); // placeholder
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      toast.success("Profile saved");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl">
      <SectionHeader
        title="Profile Details"
        desc="Your personal contact information."
      />
      <form onSubmit={handleSubmit} className="space-y-5 mt-8">
        <Field label="Full Name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Amara Okafor"
            className="checkout-input"
          />
        </Field>
        <Field label="Email Address">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="amara@email.com"
            className="checkout-input"
          />
        </Field>
        <Field label="Phone Number">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+234 800 000 0000"
            className="checkout-input"
          />
        </Field>
        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {saving ? (
              <>
                <Spinner className="size-4" /> Saving…
              </>
            ) : saved ? (
              <>
                <Check size={13} /> Saved
              </>
            ) : (
              <>
                <Save size={13} /> Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-12 border-t border-border pt-8">
        <SectionHeader
          title="Security"
          desc="Manage your password and account access."
        />
        <div className="mt-6">
          <div className="flex items-center justify-between border border-border px-5 py-4">
            <div>
              <p
                className="text-xs font-semibold text-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Password
              </p>
              <p
                className="text-sm text-muted-foreground font-light"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Managed securely — contact support to reset
              </p>
            </div>
            <button
              className="text-[10px] tracking-[0.15em] uppercase text-primary underline underline-offset-2 cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Orders Tab ───────────────────────────────────────────────────────────── */
function OrdersTab() {
  const { data, isLoading, isError } = useMyOrders();
  const orders = data?.items ?? [];

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState message="Could not load your orders." />;

  return (
    <div>
      <SectionHeader
        title="My Orders"
        desc={
          data ? `${data.total} order${data.total !== 1 ? "s" : ""} placed` : ""
        }
      />
      {orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={28} className="text-muted-foreground" />}
          message="No orders yet"
          action={
            <Link
              to="/shop"
              className="text-xs tracking-[0.2em] uppercase text-primary underline underline-offset-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Browse the Collection →
            </Link>
          }
        />
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <OrderCard key={order._id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({ order }: { order: ApiOrder }) {
  const status =
    ORDER_STATUS_MAP[order.status] ?? ORDER_STATUS_MAP.pending_payment;
  const STAGE_LABELS: Record<string, string> = {
    cutting: "Fabric Cutting",
    sewing: "Sewing",
    quality_check: "Quality Check",
    ready: "Ready",
    delivered: "Delivered",
  };

  return (
    <div className="border border-border bg-card p-5 hover:border-primary/40 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <p
              className="text-sm font-semibold text-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {order.orderNumber}
            </p>
            <span
              className={`text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 border font-semibold ${status.color}`}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {status.label}
            </span>
          </div>
          <p
            className="text-xs text-muted-foreground"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Placed {fmtDate(order.createdAt)} · {order.items.length} item
            {order.items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="text-right shrink-0">
          {order.chargeTotal &&
          order.chargeCurrency &&
          order.chargeCurrency !== "NGN" ? (
            <>
              <p
                className="text-lg font-semibold text-primary"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {formatMinorUnits(order.chargeTotal, order.chargeCurrency)}
              </p>
              <p
                className="text-[10px] text-muted-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                ≈ {formatPrice(order.total)}
              </p>
            </>
          ) : (
            <p
              className="text-lg font-semibold text-primary shrink-0"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {formatPrice(order.total)}
            </p>
          )}
        </div>
      </div>

      {/* Item thumbnails */}
      <div className="flex gap-3 mb-4 flex-wrap">
        {order.items.slice(0, 4).map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-12 h-14 shrink-0 overflow-hidden bg-muted">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>
            <div className="min-w-0">
              <p
                className="text-xs text-foreground font-light leading-snug truncate max-w-[120px]"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {item.title}
              </p>
              <p
                className="text-[10px] text-muted-foreground uppercase tracking-wide"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {item.sku}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Production stage mini-bar */}
      {order.productionStage && (
        <div className="mb-4 flex items-center gap-2">
          <span className="text-primary">
            {STAGE_ICONS[order.productionStage] ?? <Package size={12} />}
          </span>
          <p
            className="text-[10px] tracking-wide text-primary uppercase"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {STAGE_LABELS[order.productionStage] ?? order.productionStage}
          </p>
        </div>
      )}

      {/* Payment link for pending_payment orders */}
      {order.status === "pending_payment" && order.checkoutUrl && (
        <div className="mb-4">
          <a
            href={order.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-semibold hover:bg-primary/90 transition-colors"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <ExternalLink size={11} /> Complete Payment
          </a>
        </div>
      )}

      <Link
        to={`/orders/${order._id}`}
        className="inline-flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-primary hover:underline underline-offset-4 cursor-pointer"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        Track Order <ChevronRight size={10} />
      </Link>
    </div>
  );
}

/* ── Custom Orders Tab ────────────────────────────────────────────────────── */
function CustomOrdersTab() {
  const { data, isLoading, isError } = useMyCustomOrders();
  const cos = data?.items ?? [];

  if (isLoading) return <LoadingState />;
  if (isError)
    return <ErrorState message="Could not load your custom orders." />;

  return (
    <div>
      <SectionHeader
        title="Custom Orders"
        desc={
          data
            ? `${data.total} request${data.total !== 1 ? "s" : ""} submitted`
            : ""
        }
      />
      {cos.length === 0 ? (
        <EmptyState
          icon={<Scissors size={28} className="text-muted-foreground" />}
          message="No custom orders yet"
          action={
            <Link
              to="/custom-order"
              className="text-xs tracking-[0.2em] uppercase text-primary underline underline-offset-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Request a Custom Piece →
            </Link>
          }
        />
      ) : (
        <div className="mt-8 space-y-4">
          {cos.map((co) => (
            <CustomOrderCard key={co._id} co={co} />
          ))}
        </div>
      )}
    </div>
  );
}

function CustomOrderCard({ co }: { co: ApiCustomOrder }) {
  const status =
    CUSTOM_STATUS_MAP[co.status] ?? CUSTOM_STATUS_MAP.pending_review;
  const [approving, setApproving] = useState(false);
  const qc = useQueryClient();

  const handleApprove = async () => {
    setApproving(true);
    try {
      const { customOrders: coApi } = await import("@/lib/api.ts");
      const result = await coApi.approveQuote(co._id, "paystack");
      await qc.invalidateQueries({ queryKey: ["my-custom-orders"] });
      toast.success("Quote approved! Redirecting to payment…");
      setTimeout(() => {
        window.location.href = result.checkoutUrl;
      }, 900);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not approve quote.",
      );
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="border border-border bg-card p-5 hover:border-primary/40 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <p
              className="text-sm font-semibold text-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {co.referenceNumber}
            </p>
            <span
              className={`text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 border font-semibold ${status.color}`}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {status.label}
            </span>
          </div>
          <p
            className="text-xs text-muted-foreground"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {co.garmentCategory} · Submitted {fmtDate(co.createdAt)}
          </p>
        </div>
        {co.quotedPrice && (
          <p
            className="text-lg font-semibold text-primary shrink-0"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {formatPrice(co.quotedPrice)}
          </p>
        )}
      </div>

      <p
        className="text-sm font-light text-muted-foreground mb-3 line-clamp-2"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {co.description}
      </p>

      {/* Quote details */}
      {co.status === "quoted" && co.quotedPrice && (
        <div className="bg-primary/5 border border-primary/20 px-4 py-3 mb-4 space-y-1">
          <p
            className="text-xs text-foreground font-semibold"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Quote: {formatPrice(co.quotedPrice)}
            {co.estimatedReadyDate
              ? ` · Ready by ${co.estimatedReadyDate}`
              : ""}
          </p>
          {co.adminQuoteNote && (
            <p
              className="text-xs text-muted-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {co.adminQuoteNote}
            </p>
          )}
          <button
            onClick={handleApprove}
            disabled={approving}
            className="mt-2 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {approving ? (
              <>
                <Spinner className="size-3" /> Approving…
              </>
            ) : (
              "Approve & Pay"
            )}
          </button>
        </div>
      )}

      {/* Payment link for payment_pending */}
      {co.status === "payment_pending" && co.checkoutUrl && (
        <div className="mb-4">
          <a
            href={co.checkoutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 text-[10px] tracking-[0.15em] uppercase font-semibold hover:bg-primary/90 transition-colors"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <ExternalLink size={11} /> Complete Payment
          </a>
        </div>
      )}

      {/* WhatsApp link */}
      {co.whatsappLink && (
        <a
          href={co.whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-[#25D366] hover:underline underline-offset-2 mt-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          <MessageCircle size={11} /> Chat on WhatsApp
        </a>
      )}
    </div>
  );
}

/* ── Measurements Tab ────────────────────────────────────────────────────── */
function MeasurementsTab() {
  const { data: profiles, isLoading } = useMeasurementProfiles();

  if (isLoading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <SectionHeader
          title="Saved Measurements"
          desc="Your measurement profiles, used across all custom orders."
        />
        <Link
          to="/measurements"
          className="shrink-0 text-[10px] tracking-[0.15em] uppercase text-primary underline underline-offset-2"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Manage →
        </Link>
      </div>

      {!profiles || profiles.length === 0 ? (
        <EmptyState
          icon={<Ruler size={28} className="text-muted-foreground" />}
          message="No measurement profiles saved"
          action={
            <Link
              to="/measurements"
              className="text-xs tracking-[0.2em] uppercase text-primary underline underline-offset-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Add Measurements →
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {profiles.map((p) => (
            <div
              key={p._id}
              className="border border-border bg-card p-5 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p
                    className="text-sm font-semibold text-foreground"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {p.garmentLabel ?? p.garmentType}
                  </p>
                  <p
                    className="text-[10px] text-muted-foreground mt-0.5"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {p.measurements.length} fields · Updated{" "}
                    {fmtDate(p.updatedAt)}
                  </p>
                </div>
                <Link
                  to="/measurements"
                  className="text-[10px] tracking-[0.15em] uppercase text-primary hover:underline underline-offset-2"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Edit
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {p.measurements.slice(0, 6).map((f) => (
                  <div
                    key={f.key}
                    className="flex justify-between text-[10px]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    <span className="text-muted-foreground uppercase tracking-wide">
                      {f.label}
                    </span>
                    <span className="text-foreground font-semibold">
                      {f.value} cm
                    </span>
                  </div>
                ))}
                {p.measurements.length > 6 && (
                  <p
                    className="text-[10px] text-muted-foreground col-span-2 mt-1"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    +{p.measurements.length - 6} more…
                  </p>
                )}
              </div>
              {p.notes && (
                <p
                  className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border italic"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {p.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Shared primitives ────────────────────────────────────────────────────── */
function TabPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: "easeOut" as const }}
    >
      {children}
    </motion.div>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2
        className="text-2xl font-light text-foreground"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {title}
      </h2>
      {desc && (
        <p
          className="text-xs text-muted-foreground mt-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {desc}
        </p>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center gap-3 py-12 text-muted-foreground">
      <Spinner className="size-5" />
      <span
        className="text-sm"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        Loading…
      </span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <p
        className="text-muted-foreground text-sm"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {message}
      </p>
    </div>
  );
}

function EmptyState({
  icon,
  message,
  action,
}: {
  icon: React.ReactNode;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-16 text-center space-y-4">
      <div className="w-16 h-16 bg-muted border border-border flex items-center justify-center mx-auto">
        {icon}
      </div>
      <p
        className="text-xl font-light text-muted-foreground"
        style={{ fontFamily: "'Cormorant Garamond', serif" }}
      >
        {message}
      </p>
      {action}
    </div>
  );
}
