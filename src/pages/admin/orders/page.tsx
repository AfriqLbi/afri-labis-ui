import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, ChevronDown } from "lucide-react";
import {
  useAdminOrders,
  useAdminFulfilOrder,
  useAdminCancelOrder,
  useAdminUpdateProductionStage,
} from "@/hooks/use-api.ts";
import { formatPrice } from "@/lib/products.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";
import type { ApiOrder } from "@/lib/api.ts";

const STATUS_OPTIONS = [
  { value: "",               label: "All Statuses" },
  { value: "pending_payment",label: "Awaiting Payment" },
  { value: "paid",           label: "Paid" },
  { value: "fulfilled",      label: "Fulfilled" },
  { value: "cancelled",      label: "Cancelled" },
  { value: "failed",         label: "Failed" },
];

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  paid:            "text-blue-400 bg-blue-400/10 border-blue-400/20",
  fulfilled:       "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  cancelled:       "text-muted-foreground bg-muted/60 border-border",
  failed:          "text-destructive bg-destructive/10 border-destructive/20",
  abandoned:       "text-muted-foreground bg-muted/60 border-border",
  refunded:        "text-muted-foreground bg-muted/60 border-border",
};

const STAGE_OPTIONS = ["cutting", "sewing", "quality_check", "ready", "delivered"];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function AdminOrdersPage() {
  const [status, setStatus] = useState("");
  const [page,   setPage]   = useState(1);

  const { data, isLoading, isError } = useAdminOrders({
    status: status || undefined,
    page,
    limit: 20,
  });

  const fulfil       = useAdminFulfilOrder();
  const cancel       = useAdminCancelOrder();
  const updateStage  = useAdminUpdateProductionStage();

  const orders = data?.items ?? [];

  const handleFulfil = (id: string) => {
    fulfil.mutate(id, {
      onSuccess: () => toast.success("Order marked as fulfilled"),
      onError:   (e: any) => toast.error(e.message ?? "Could not fulfil order"),
    });
  };

  const handleCancel = (id: string) => {
    if (!window.confirm("Cancel this order? This will release reserved stock.")) return;
    cancel.mutate(id, {
      onSuccess: () => toast.success("Order cancelled"),
      onError:   (e: any) => toast.error(e.message ?? "Could not cancel order"),
    });
  };

  const handleStageUpdate = (id: string, stage: string) => {
    updateStage.mutate({ id, stage }, {
      onSuccess: () => toast.success(`Stage updated to ${stage.replace(/_/g, " ")}`),
      onError:   (e: any) => toast.error(e.message ?? "Could not update stage"),
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1"
            style={{ fontFamily: "'Montserrat', sans-serif" }}>Admin</p>
          <h1 className="text-3xl font-light text-foreground"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>Orders</h1>
        </div>
        {/* Status filter */}
        <div className="relative">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="checkout-input appearance-none pr-8 text-xs w-44"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-12 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>Loading orders…</span>
        </div>
      ) : isError ? (
        <p className="text-muted-foreground text-sm py-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Could not load orders — is the backend running?
        </p>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground text-sm py-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          No orders found.
        </p>
      ) : (
        <>
          <div className="bg-card border border-border divide-y divide-border">
            {orders.map((order: ApiOrder) => {
              const sc = STATUS_COLORS[order.status] ?? "";
              return (
                <div key={order._id} className="px-5 py-5 space-y-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-sm font-semibold text-foreground"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}>{order.orderNumber}</p>
                        <span className={`text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 border font-semibold ${sc}`}
                          style={{ fontFamily: "'Montserrat', sans-serif" }}>
                          {order.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        {order.customerName ?? order.customerEmail} · {fmtDate(order.createdAt)}
                        {" · "}{order.items.length} item{order.items.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-primary"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}>{formatPrice(order.total)}</p>
                  </div>

                  {/* Production stage selector (for paid orders) */}
                  {order.status === "paid" && (
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}>Stage:</span>
                      <div className="relative">
                        <select
                          defaultValue={order.productionStage ?? ""}
                          onChange={(e) => handleStageUpdate(order._id, e.target.value)}
                          className="checkout-input text-xs py-1.5 appearance-none pr-7 w-44"
                        >
                          <option value="" disabled>Set stage…</option>
                          {STAGE_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                          ))}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {order.status === "paid" && (
                      <button
                        onClick={() => handleFulfil(order._id)}
                        disabled={fulfil.isPending}
                        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        <Check size={11} /> Fulfil
                      </button>
                    )}
                    {["paid", "pending_payment"].includes(order.status) && (
                      <button
                        onClick={() => handleCancel(order._id)}
                        disabled={cancel.isPending}
                        className="flex items-center gap-1.5 border border-destructive/40 text-destructive px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase hover:bg-destructive/10 transition-colors cursor-pointer disabled:opacity-60"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        <X size={11} /> Cancel
                      </button>
                    )}
                    <Link
                      to={`/orders/${order._id}`}
                      className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors underline underline-offset-2"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      View →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex gap-2 justify-center">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 text-xs border transition-all cursor-pointer ${p === page ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
