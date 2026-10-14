/**
 * Admin Production Queue — catalog orders + custom orders at each stage.
 */
import { useState } from "react";
import { Scissors, Package, CheckCircle, Truck, Tag } from "lucide-react";
import {
  useAdminUpdateProductionStage,
  useAdminUpdateCustomOrderProductionStage,
} from "@/hooks/use-api.ts";
import { useQuery } from "@tanstack/react-query";
import {
  adminOrders as adminOrdersApi,
  adminCustomOrders as adminCustomOrdersApi,
  type ApiOrder,
  type ApiCustomOrder,
} from "@/lib/api.ts";
import { formatPrice } from "@/lib/products.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";

type Stage = "cutting" | "sewing" | "quality_check" | "ready" | "delivered";

const STAGES: { id: Stage; label: string; icon: React.ReactNode }[] = [
  { id: "cutting", label: "Fabric Cutting", icon: <Scissors size={14} /> },
  { id: "sewing", label: "Sewing", icon: <Package size={14} /> },
  {
    id: "quality_check",
    label: "Quality Check",
    icon: <CheckCircle size={14} />,
  },
  { id: "ready", label: "Ready", icon: <Package size={14} /> },
  { id: "delivered", label: "Delivered", icon: <Truck size={14} /> },
];

const NEXT_STAGE: Record<Stage, Stage | null> = {
  cutting: "sewing",
  sewing: "quality_check",
  quality_check: "ready",
  ready: "delivered",
  delivered: null,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminProductionPage() {
  const [activeStage, setActiveStage] = useState<Stage>("cutting");

  // ── Catalog orders (paid / in-production) ──────────────────────────────────
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-orders-production"],
    queryFn: () => adminOrdersApi.list({ status: "paid", limit: 100 }),
    staleTime: 20_000,
    meta: { persist: false },
  });

  // ── Custom orders (in_production) ─────────────────────────────────────────
  const { data: customOrdersData, isLoading: customLoading } = useQuery({
    queryKey: ["admin-custom-orders-production"],
    queryFn: () =>
      adminCustomOrdersApi.list({ status: "in_production", limit: 100 }),
    staleTime: 20_000,
    meta: { persist: false },
  });

  const isLoading = ordersLoading || customLoading;

  const updateStage = useAdminUpdateProductionStage();
  const updateCustomStage = useAdminUpdateCustomOrderProductionStage();

  // Filter catalog orders by selected stage
  const catalogOrders = (ordersData?.items ?? []).filter(
    (o: ApiOrder) =>
      o.productionStage === activeStage ||
      (!o.productionStage && activeStage === "cutting"),
  );

  // Filter custom orders: use latest production log stage if available,
  // otherwise treat in_production orders as "cutting" (first stage)
  const customOrders = (customOrdersData?.items ?? []) as ApiCustomOrder[];

  const handleAdvanceCatalog = (orderId: string, currentStage: Stage) => {
    const next = NEXT_STAGE[currentStage];
    if (!next) return;
    updateStage.mutate(
      { id: orderId, stage: next },
      {
        onSuccess: () =>
          toast.success(`Order moved to ${next.replace(/_/g, " ")}`),
        onError: (e: unknown) =>
          toast.error((e as Error).message ?? "Could not update stage"),
      },
    );
  };

  const handleAdvanceCustom = (orderId: string, currentStage: Stage | null) => {
    const next = currentStage ? NEXT_STAGE[currentStage] : "cutting";
    if (!next) return;
    updateCustomStage.mutate(
      { id: orderId, stage: next },
      {
        onSuccess: () =>
          toast.success(`Custom order moved to ${next.replace(/_/g, " ")}`),
        onError: (e: unknown) =>
          toast.error((e as Error).message ?? "Could not update stage"),
      },
    );
  };

  const stageConfig = STAGES.find((s) => s.id === activeStage)!;
  const hasAny = catalogOrders.length > 0 || customOrders.length > 0;

  return (
    <div className="p-8 space-y-6">
      <div>
        <p
          className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Admin
        </p>
        <h1
          className="text-3xl font-light text-foreground"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Production Queue
        </h1>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-0 border-b border-border overflow-x-auto">
        {STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveStage(s.id)}
            className={`flex items-center gap-2 px-5 py-3 text-[10px] tracking-[0.15em] uppercase whitespace-nowrap transition-all cursor-pointer ${
              activeStage === s.id
                ? "border-b-2 border-primary text-foreground -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-12 text-muted-foreground">
          <Spinner className="size-5" />
          <span
            className="text-sm"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Loading…
          </span>
        </div>
      ) : !hasAny ? (
        <div className="py-16 text-center">
          <div className="w-12 h-12 bg-muted border border-border flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            {stageConfig.icon}
          </div>
          <p
            className="text-xl font-light text-muted-foreground"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            No orders at the {stageConfig.label} stage
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* ── Catalog orders ── */}
          {catalogOrders.length > 0 && (
            <div>
              <p
                className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Catalog Orders ({catalogOrders.length})
              </p>
              <div className="bg-card border border-border divide-y divide-border">
                {catalogOrders.map((o: ApiOrder) => {
                  const next = NEXT_STAGE[activeStage];
                  return (
                    <div
                      key={o._id}
                      className="px-5 py-5 flex items-center justify-between gap-4 flex-wrap"
                    >
                      <div>
                        <p
                          className="text-sm font-semibold text-foreground"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {o.orderNumber}
                        </p>
                        <p
                          className="text-xs text-muted-foreground mt-0.5"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {o.customerName ?? o.customerEmail} ·{" "}
                          {fmtDate(o.createdAt)}
                          {" · "}
                          {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                        </p>
                        <p
                          className="text-sm font-semibold text-primary mt-1"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {formatPrice(o.total)}
                        </p>
                      </div>
                      {next && (
                        <button
                          onClick={() =>
                            handleAdvanceCatalog(o._id, activeStage)
                          }
                          disabled={updateStage.isPending}
                          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 text-[10px] tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {updateStage.isPending ? (
                            <Spinner className="size-4" />
                          ) : (
                            `→ ${next.replace(/_/g, " ")}`
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Custom orders ── */}
          {customOrders.length > 0 && (
            <div>
              <p
                className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Custom Orders ({customOrders.length})
              </p>
              <div className="bg-card border border-border divide-y divide-border">
                {customOrders.map((o: ApiCustomOrder) => {
                  // Custom orders don't have productionStage on the doc —
                  // show all of them in this view since we can't filter by stage
                  // without loading the production log per order here.
                  // Stage advance starts from cutting if not yet started.
                  const next: Stage = "cutting"; // first step shown for all
                  return (
                    <div
                      key={o._id}
                      className="px-5 py-5 flex items-center justify-between gap-4 flex-wrap"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <p
                            className="text-sm font-semibold text-foreground"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {o.referenceNumber}
                          </p>
                          <span
                            className="flex items-center gap-1 text-[9px] tracking-[0.1em] uppercase text-primary bg-primary/10 px-2 py-0.5"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            <Tag size={9} /> Custom
                          </span>
                        </div>
                        <p
                          className="text-xs text-muted-foreground mt-0.5"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {o.customerName} · {o.garmentCategory} ·{" "}
                          {fmtDate(o.createdAt)}
                        </p>
                        {o.quotedPrice && (
                          <p
                            className="text-sm font-semibold text-primary mt-1"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {formatPrice(o.quotedPrice)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleAdvanceCustom(o._id, null)}
                        disabled={updateCustomStage.isPending}
                        className="flex items-center gap-2 border border-primary text-primary px-4 py-2.5 text-[10px] tracking-[0.2em] uppercase font-semibold hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-60"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {updateCustomStage.isPending ? (
                          <Spinner className="size-4" />
                        ) : (
                          "Update Stage →"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
              <p
                className="text-[10px] text-muted-foreground mt-2"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                For full stage tracking on custom orders, use the{" "}
                <a
                  href="/admin/custom-orders"
                  className="text-primary underline underline-offset-2"
                >
                  Custom Orders
                </a>{" "}
                page.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
