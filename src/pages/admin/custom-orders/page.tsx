import { useState } from "react";
import { ChevronDown, Check, ArrowRight } from "lucide-react";
import {
  useAdminCustomOrders,
  useAdminSetCustomOrderQuote,
  useAdminMoveCustomOrderToProduction,
} from "@/hooks/use-api.ts";
import { formatPrice } from "@/lib/products.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";
import type { ApiCustomOrder } from "@/lib/api.ts";

const STATUS_OPTIONS = [
  { value: "",               label: "All Statuses" },
  { value: "pending_review", label: "Pending Review" },
  { value: "quoted",         label: "Quoted" },
  { value: "payment_pending",label: "Awaiting Payment" },
  { value: "paid",           label: "Paid" },
  { value: "in_production",  label: "In Production" },
  { value: "completed",      label: "Completed" },
  { value: "cancelled",      label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  pending_review:  "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  quoted:          "text-blue-400 bg-blue-400/10 border-blue-400/20",
  approved:        "text-blue-400 bg-blue-400/10 border-blue-400/20",
  payment_pending: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  paid:            "text-primary bg-primary/10 border-primary/20",
  in_production:   "text-primary bg-primary/10 border-primary/20",
  completed:       "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  cancelled:       "text-muted-foreground bg-muted/60 border-border",
  refunded:        "text-muted-foreground bg-muted/60 border-border",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function AdminCustomOrdersPage() {
  const [status, setStatus] = useState("");
  const [page,   setPage]   = useState(1);

  // Quote modal state
  const [quoting, setQuoting] = useState<ApiCustomOrder | null>(null);
  const [quoteForm, setQuoteForm] = useState({ price: "", date: "", note: "" });

  const { data, isLoading } = useAdminCustomOrders({
    status: status || undefined, page, limit: 20,
  });

  const setQuoteMutation   = useAdminSetCustomOrderQuote();
  const moveToProduction   = useAdminMoveCustomOrderToProduction();

  const orders = data?.items ?? [];

  const handleSetQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoting) return;
    setQuoteMutation.mutate(
      {
        id: quoting._id,
        dto: {
          quotedPrice:       parseFloat(quoteForm.price),
          estimatedReadyDate: quoteForm.date,
          adminQuoteNote:    quoteForm.note || undefined,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Quote set for ${quoting.referenceNumber}`);
          setQuoting(null);
          setQuoteForm({ price: "", date: "", note: "" });
        },
        onError: (e: any) => toast.error(e.message ?? "Could not set quote"),
      },
    );
  };

  const handleMoveToProduction = (id: string, ref: string) => {
    moveToProduction.mutate(id, {
      onSuccess: () => toast.success(`${ref} moved to production`),
      onError:   (e: any) => toast.error(e.message ?? "Could not move to production"),
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1"
            style={{ fontFamily: "'Montserrat', sans-serif" }}>Admin</p>
          <h1 className="text-3xl font-light text-foreground"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>Custom Orders</h1>
        </div>
        <div className="relative">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="checkout-input appearance-none pr-8 text-xs w-52">
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-12 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>Loading…</span>
        </div>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground text-sm py-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>No custom orders found.</p>
      ) : (
        <>
          <div className="bg-card border border-border divide-y divide-border">
            {orders.map((o: ApiCustomOrder) => {
              const sc = STATUS_COLORS[o.status] ?? "";
              return (
                <div key={o._id} className="px-5 py-5 space-y-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-sm font-semibold text-foreground"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}>{o.referenceNumber}</p>
                        <span className={`text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 border font-semibold ${sc}`}
                          style={{ fontFamily: "'Montserrat', sans-serif" }}>
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        {o.customerName} · {o.garmentCategory} · {fmtDate(o.createdAt)}
                      </p>
                      <p className="text-sm font-light text-muted-foreground mt-1 line-clamp-1"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}>{o.description}</p>
                    </div>
                    {o.quotedPrice && (
                      <p className="text-lg font-semibold text-primary"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}>{formatPrice(o.quotedPrice)}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {o.status === "pending_review" && (
                      <button
                        onClick={() => { setQuoting(o); setQuoteForm({ price: "", date: "", note: "" }); }}
                        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        Set Quote
                      </button>
                    )}
                    {o.status === "paid" && (
                      <button
                        onClick={() => handleMoveToProduction(o._id, o.referenceNumber)}
                        disabled={moveToProduction.isPending}
                        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 text-[10px] tracking-[0.15em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        <ArrowRight size={11} /> Move to Production
                      </button>
                    )}
                    {o.estimatedReadyDate && (
                      <span className="text-[10px] text-muted-foreground"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        Ready by: {o.estimatedReadyDate}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

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

      {/* Quote modal */}
      {quoting && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-6">
          <div className="bg-card border border-border w-full max-w-md p-6 space-y-5">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1"
                style={{ fontFamily: "'Montserrat', sans-serif" }}>Set Quote</p>
              <p className="text-xl font-light text-foreground"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}>{quoting.referenceNumber}</p>
              <p className="text-xs text-muted-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}>{quoting.garmentCategory}</p>
            </div>
            <form onSubmit={handleSetQuote} className="space-y-4">
              <div>
                <label className="field-label">Price (₦) *</label>
                <input required type="number" min={100} value={quoteForm.price}
                  onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
                  placeholder="85000" className="checkout-input" />
              </div>
              <div>
                <label className="field-label">Estimated Ready Date (YYYY-MM-DD) *</label>
                <input required type="date" value={quoteForm.date}
                  onChange={(e) => setQuoteForm({ ...quoteForm, date: e.target.value })}
                  className="checkout-input" />
              </div>
              <div>
                <label className="field-label">Note for Customer</label>
                <textarea rows={3} value={quoteForm.note}
                  onChange={(e) => setQuoteForm({ ...quoteForm, note: e.target.value })}
                  placeholder="Includes fabric sourcing, 2 fittings…"
                  className="checkout-input resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setQuoting(null)}
                  className="flex-1 border border-border text-muted-foreground py-3 text-xs tracking-[0.15em] uppercase hover:text-foreground transition-colors cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>Cancel</button>
                <button type="submit" disabled={setQuoteMutation.isPending}
                  className="flex-[2] bg-primary text-primary-foreground py-3 text-xs tracking-[0.15em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {setQuoteMutation.isPending ? <><Spinner className="size-4" /> Saving…</> : <><Check size={12} /> Send Quote</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
