/**
 * Admin Production Queue — shows all orders currently at each production stage.
 * Staff and admins can advance stages from here or from the individual order pages.
 */
import { useState } from "react";
import { Scissors, Package, CheckCircle, Truck, ChevronDown } from "lucide-react";
import { useAdminUpdateProductionStage } from "@/hooks/use-api.ts";
import { useQuery } from "@tanstack/react-query";
import { adminOrders as adminOrdersApi, type ApiOrder } from "@/lib/api.ts";
import { formatPrice } from "@/lib/products.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";

type Stage = "cutting" | "sewing" | "quality_check" | "ready" | "delivered";

const STAGES: { id: Stage; label: string; icon: React.ReactNode }[] = [
  { id: "cutting",       label: "Fabric Cutting",  icon: <Scissors size={14} /> },
  { id: "sewing",        label: "Sewing",           icon: <Package size={14} /> },
  { id: "quality_check", label: "Quality Check",   icon: <CheckCircle size={14} /> },
  { id: "ready",         label: "Ready",            icon: <Package size={14} /> },
  { id: "delivered",     label: "Delivered",        icon: <Truck size={14} /> },
];

const NEXT_STAGE: Record<Stage, Stage | null> = {
  cutting:       "sewing",
  sewing:        "quality_check",
  quality_check: "ready",
  ready:         "delivered",
  delivered:     null,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function AdminProductionPage() {
  const [activeStage, setActiveStage] = useState<Stage>("cutting");

  // Fetch paid/in-production orders and filter by production stage client-side
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["admin-orders-production"],
    queryFn: () => adminOrdersApi.list({ status: "paid", limit: 100 }),
    staleTime: 20_000,
  });

  const updateStage = useAdminUpdateProductionStage();

  const orders = (ordersData?.items ?? []).filter(
    (o: ApiOrder) => o.productionStage === activeStage || (!o.productionStage && activeStage === "cutting"),
  );

  const handleAdvance = (orderId: string, currentStage: Stage) => {
    const next = NEXT_STAGE[currentStage];
    if (!next) return;
    updateStage.mutate({ id: orderId, stage: next }, {
      onSuccess: () => toast.success(`Moved to ${next.replace(/_/g, " ")}`),
      onError:   (e: any) => toast.error(e.message ?? "Could not update stage"),
    });
  };

  const stageConfig = STAGES.find((s) => s.id === activeStage)!;

  return (
    <div className="p-8 space-y-6">
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}>Admin</p>
        <h1 className="text-3xl font-light text-foreground"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>Production Queue</h1>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-0 border-b border-border overflow-x-auto">
        {STAGES.map((s) => (
          <button key={s.id} onClick={() => setActiveStage(s.id)}
            className={`flex items-center gap-2 px-5 py-3 text-[10px] tracking-[0.15em] uppercase whitespace-nowrap transition-all cursor-pointer ${
              activeStage === s.id
                ? "border-b-2 border-primary text-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"}`}
            style={{ fontFamily: "'Montserrat', sans-serif" }}>
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* Orders at this stage */}
      {isLoading ? (
        <div className="flex items-center gap-3 py-12 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>Loading…</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 bg-muted border border-border flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            {stageConfig.icon}
          </div>
          <p className="text-xl font-light text-muted-foreground"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            No orders at the {stageConfig.label} stage
          </p>
        </div>
      ) : (
        <div className="bg-card border border-border divide-y divide-border">
          {orders.map((o: ApiOrder) => {
            const next = NEXT_STAGE[activeStage];
            return (
              <div key={o._id} className="px-5 py-5 flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-sm font-semibold text-foreground"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}>{o.orderNumber}</p>
                  <p className="text-xs text-muted-foreground mt-0.5"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {o.customerName ?? o.customerEmail} · {fmtDate(o.createdAt)}
                    {" · "}{o.items.length} item{o.items.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}>{formatPrice(o.total)}</p>
                </div>
                {next && (
                  <button
                    onClick={() => handleAdvance(o._id, activeStage)}
                    disabled={updateStage.isPending}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 text-[10px] tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {updateStage.isPending
                      ? <Spinner className="size-4" />
                      : `→ ${next.replace(/_/g, " ")}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Note about custom orders */}
      <div className="bg-muted/40 border border-border px-5 py-4 flex items-start gap-3">
        <div className="w-2 h-2 bg-primary mt-1 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed"
          style={{ fontFamily: "'Montserrat', sans-serif" }}>
          This view shows standard catalog orders. Custom orders have their own production
          tracking under <a href="/admin/custom-orders" className="text-primary underline underline-offset-2">Custom Orders</a>.
        </p>
      </div>
    </div>
  );
}
