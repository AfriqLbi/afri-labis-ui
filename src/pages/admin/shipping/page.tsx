/**
 * Admin — Shipping
 *
 * Three tabs:
 *   1. Zones       — CRUD for shipping zones and rate bands
 *   2. Quotes      — Queue of orders awaiting a shipping quote
 *   3. Settings    — SLA hours, default validity, alert recipients
 */
import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminShippingZones,
  useAdminShippingQuotes,
  useAdminShippingSettings,
  useAdminCreateShippingZone,
  useAdminUpdateShippingZone,
  useAdminDeleteShippingZone,
  useAdminSubmitShippingQuote,
  useAdminOverrideShippingFee,
  useAdminCreateShippingAdjustment,
  useAdminUpdateShippingSettings,
} from "@/hooks/use-api.ts";
import { AdminTableSkeleton } from "@/components/ui/skeleton.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { formatPrice } from "@/lib/products.ts";
import type { ApiShippingZone, ApiOrder, ApiShippingSettings } from "@/lib/api.ts";

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = "zones" | "quotes" | "settings";

export default function AdminShippingPage() {
  const [tab, setTab] = useState<Tab>("zones");

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Admin
        </p>
        <h1 className="text-3xl font-light text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Shipping
        </h1>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border mb-8">
        {(["zones", "quotes", "settings"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-[10px] tracking-[0.2em] uppercase transition-all cursor-pointer border-b-2 ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {t === "zones" ? "Zones & Rates" : t === "quotes" ? "Quotes Queue" : "Settings"}
          </button>
        ))}
      </div>

      {tab === "zones" && <ZonesTab />}
      {tab === "quotes" && <QuotesTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — Zones
// ─────────────────────────────────────────────────────────────────────────────

function emptyZone(): Omit<ApiShippingZone, "_id"> {
  return {
    name: "",
    mode: "quote",
    countries: [],
    states: [],
    priority: 0,
    isFallback: false,
    isActive: true,
    rates: [],
    pickupAvailable: false,
  };
}

function ZonesTab() {
  const { data: zones, isLoading } = useAdminShippingZones();
  const createMut = useAdminCreateShippingZone();
  const updateMut = useAdminUpdateShippingZone();
  const deleteMut = useAdminDeleteShippingZone();

  const [editing, setEditing] = useState<(ApiShippingZone & { _new?: boolean }) | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editing) return;
    const { _id, _new, ...dto } = editing as ApiShippingZone & { _new?: boolean };
    try {
      if (_new) {
        await createMut.mutateAsync(dto);
        toast.success("Zone created");
      } else {
        await updateMut.mutateAsync({ id: _id, dto });
        toast.success("Zone updated");
      }
      setEditing(null);
    } catch (err) {
      toast.error((err as Error).message ?? "Save failed");
    }
  };

  const handleDelete = async (z: ApiShippingZone) => {
    if (!window.confirm(`Delete zone "${z.name}"?`)) return;
    try {
      await deleteMut.mutateAsync(z._id);
      toast.success("Zone deleted");
    } catch (err) {
      toast.error((err as Error).message ?? "Delete failed");
    }
  };

  if (isLoading) return <AdminTableSkeleton />;
  const list = zones ?? [];

  return (
    <div className="space-y-4">
      {/* Create button */}
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({ _id: "", _new: true, ...emptyZone() })}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors cursor-pointer"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          <Plus size={13} /> Add Zone
        </button>
      </div>

      {list.length === 0 && !editing && (
        <p className="text-muted-foreground text-sm py-8 text-center" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          No shipping zones yet. Create one to enable shipping fee calculation.
        </p>
      )}

      {/* Zone rows */}
      {list.map((z) => (
        <div key={z._id} className="border border-border bg-card">
          {/* Zone header row */}
          <div className="flex items-center gap-3 px-5 py-4">
            <button
              onClick={() => setExpanded(expanded === z._id ? null : z._id)}
              className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              {expanded === z._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {z.name}
                {z.isFallback && (
                  <span className="ml-2 text-[9px] tracking-[0.15em] uppercase text-primary bg-primary/10 px-2 py-0.5">Fallback</span>
                )}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {z.countries.length ? z.countries.join(", ") : "All countries"} · {z.mode === "fixed" ? "Fixed rate" : "Quote per order"} · Priority {z.priority}
              </p>
            </div>
            <span className={`text-[10px] tracking-[0.1em] uppercase px-2 py-1 ${z.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`} style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {z.isActive ? "Active" : "Inactive"}
            </span>
            <button onClick={() => setEditing({ ...z })} className="text-muted-foreground hover:text-primary transition-colors cursor-pointer" title="Edit">
              <Pencil size={14} />
            </button>
            <button onClick={() => handleDelete(z)} className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer" title="Delete">
              <Trash2 size={14} />
            </button>
          </div>

          {/* Expanded rate bands */}
          {expanded === z._id && z.rates.length > 0 && (
            <div className="border-t border-border px-5 py-4">
              <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Weight Bands
              </p>
              <div className="space-y-1.5">
                {z.rates.map((r, i) => (
                  <div key={i} className="flex gap-4 text-xs text-muted-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    <span>{r.minGrams}g – {r.maxGrams}g</span>
                    <span className="text-primary font-medium">{formatPrice(r.feeNgn / 100)}</span>
                  </div>
                ))}
                {z.flatFeeNgn != null && (
                  <div className="flex gap-4 text-xs text-muted-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    <span>Flat fee (unmatched weight)</span>
                    <span className="text-primary font-medium">{formatPrice(z.flatFeeNgn / 100)}</span>
                  </div>
                )}
                {z.freeOverNgn != null && (
                  <div className="flex gap-4 text-xs text-muted-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    <span>Free over</span>
                    <span className="text-emerald-400 font-medium">{formatPrice(z.freeOverNgn / 100)} subtotal</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Zone editor drawer */}
      {editing && (
        <ZoneEditor
          zone={editing as ApiShippingZone & { _new?: boolean }}
          onChange={(z) => setEditing(z as ApiShippingZone & { _new?: boolean })}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
          saving={createMut.isPending || updateMut.isPending}
        />
      )}
    </div>
  );
}

// ── Zone editor ───────────────────────────────────────────────────────────────

function ZoneEditor({
  zone,
  onChange,
  onSave,
  onCancel,
  saving,
}: {
  zone: ApiShippingZone & { _new?: boolean };
  onChange: (z: ApiShippingZone & { _new?: boolean }) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const set = <K extends keyof ApiShippingZone>(k: K, v: ApiShippingZone[K]) =>
    onChange({ ...zone, [k]: v });

  const addBand = () =>
    set("rates", [...zone.rates, { minGrams: 0, maxGrams: 1000, feeNgn: 0 }]);

  const updateBand = (i: number, k: "minGrams" | "maxGrams" | "feeNgn", v: number) =>
    set(
      "rates",
      zone.rates.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)),
    );

  const removeBand = (i: number) =>
    set("rates", zone.rates.filter((_, idx) => idx !== i));

  return (
    <div className="border-2 border-primary/40 bg-card p-6 space-y-5 mt-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          {zone._new ? "New Zone" : `Edit: ${zone.name}`}
        </p>
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground cursor-pointer"><X size={16} /></button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <EF label="Name *">
          <input value={zone.name} onChange={(e) => set("name", e.target.value)} className="checkout-input" placeholder="Lagos" />
        </EF>
        <EF label="Mode">
          <select value={zone.mode} onChange={(e) => set("mode", e.target.value as "fixed" | "quote")} className="checkout-input">
            <option value="quote">Quote per order</option>
            <option value="fixed">Fixed rate card</option>
          </select>
        </EF>
        <EF label="Countries (ISO codes, comma-separated)" hint="e.g. NG,CA or leave blank for fallback">
          <input value={zone.countries.join(",")} onChange={(e) => set("countries", e.target.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))} className="checkout-input" placeholder="NG" />
        </EF>
        <EF label="States (comma-separated, optional)">
          <input value={zone.states.join(",")} onChange={(e) => set("states", e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} className="checkout-input" placeholder="Lagos" />
        </EF>
        <EF label="Priority (higher wins)">
          <input type="number" value={zone.priority} onChange={(e) => set("priority", parseInt(e.target.value) || 0)} className="checkout-input" />
        </EF>
        <div className="flex gap-6 items-center pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={zone.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>Active</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={zone.isFallback} onChange={(e) => set("isFallback", e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>Fallback zone</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={zone.pickupAvailable} onChange={(e) => set("pickupAvailable", e.target.checked)} className="w-4 h-4 accent-primary" />
            <span className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>Pickup available</span>
          </label>
        </div>
      </div>

      {zone.mode === "fixed" && (
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            Weight Bands (NGN kobo)
          </p>
          {zone.rates.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
              <EF label="Min g">
                <input type="number" min={0} value={r.minGrams} onChange={(e) => updateBand(i, "minGrams", parseInt(e.target.value) || 0)} className="checkout-input text-xs" />
              </EF>
              <EF label="Max g (excl.)">
                <input type="number" min={1} value={r.maxGrams} onChange={(e) => updateBand(i, "maxGrams", parseInt(e.target.value) || 1)} className="checkout-input text-xs" />
              </EF>
              <EF label="Fee (kobo)">
                <input type="number" min={0} value={r.feeNgn} onChange={(e) => updateBand(i, "feeNgn", parseInt(e.target.value) || 0)} className="checkout-input text-xs" />
              </EF>
              <button onClick={() => removeBand(i)} className="text-muted-foreground hover:text-destructive cursor-pointer mt-5"><Trash2 size={14} /></button>
            </div>
          ))}
          <button onClick={addBand} className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-primary hover:underline cursor-pointer" style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <Plus size={11} /> Add band
          </button>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <EF label="Flat fee (kobo) — unmatched weight">
              <input type="number" min={0} value={zone.flatFeeNgn ?? ""} onChange={(e) => set("flatFeeNgn", e.target.value === "" ? undefined : parseInt(e.target.value))} className="checkout-input" placeholder="e.g. 600000" />
            </EF>
            <EF label="Free-shipping threshold (kobo subtotal)">
              <input type="number" min={0} value={zone.freeOverNgn ?? ""} onChange={(e) => set("freeOverNgn", e.target.value === "" ? undefined : parseInt(e.target.value))} className="checkout-input" placeholder="e.g. 10000000" />
            </EF>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <EF label="ETA min days">
          <input type="number" min={0} value={zone.etaMinDays ?? ""} onChange={(e) => set("etaMinDays", e.target.value === "" ? undefined : parseInt(e.target.value))} className="checkout-input" />
        </EF>
        <EF label="ETA max days">
          <input type="number" min={0} value={zone.etaMaxDays ?? ""} onChange={(e) => set("etaMaxDays", e.target.value === "" ? undefined : parseInt(e.target.value))} className="checkout-input" />
        </EF>
      </div>

      <EF label="Customer note (shown at checkout)">
        <input value={zone.customerNote ?? ""} onChange={(e) => set("customerNote", e.target.value || undefined)} className="checkout-input" placeholder="Import duties payable on delivery." />
      </EF>

      <div className="flex justify-end gap-3 pt-2">
        <button onClick={onCancel} className="px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          Cancel
        </button>
        <button onClick={onSave} disabled={saving || !zone.name.trim()} className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          {saving ? <><Spinner className="size-3" /> Saving…</> : <><Save size={12} /> Save Zone</>}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — Quotes queue
// ─────────────────────────────────────────────────────────────────────────────

function QuotesTab() {
  const { data, isLoading, refetch } = useAdminShippingQuotes();
  const submitMut = useAdminSubmitShippingQuote();
  const overrideMut = useAdminOverrideShippingFee();
  const adjustMut = useAdminCreateShippingAdjustment();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState<Record<string, {
    amount: string; currency: string; carrier: string; etaDays: string; note: string; validDays: string;
  }>>({});
  const [overrideForm, setOverrideForm] = useState<Record<string, { amount: string; reason: string }>>({});
  const [adjustForm, setAdjustForm] = useState<Record<string, { type: "refund" | "extra_charge"; amount: string; reason: string }>>({});

  if (isLoading) return <AdminTableSkeleton />;
  const orders = (data?.items ?? []) as ApiOrder[];

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <CheckCircle size={32} className="text-emerald-400 mx-auto" />
        <p className="text-lg font-light text-muted-foreground" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          No quotes pending
        </p>
        <p className="text-[10px] tracking-wide text-muted-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          All shipping quotes are up to date.
        </p>
      </div>
    );
  }

  const handleSubmitQuote = async (orderId: string) => {
    const f = quoteForm[orderId];
    if (!f?.amount || !f?.currency) { toast.error("Amount and currency are required"); return; }
    try {
      await submitMut.mutateAsync({
        orderId,
        dto: {
          amount: parseFloat(f.amount),
          currency: f.currency.toUpperCase(),
          carrier: f.carrier || undefined,
          etaDays: f.etaDays ? parseInt(f.etaDays) : undefined,
          note: f.note || undefined,
          validDays: f.validDays ? parseInt(f.validDays) : undefined,
        },
      });
      toast.success("Quote submitted");
      setExpanded(null);
      refetch();
    } catch (err) {
      toast.error((err as Error).message ?? "Submit failed");
    }
  };

  const handleOverride = async (orderId: string) => {
    const f = overrideForm[orderId];
    if (!f?.amount || !f?.reason) { toast.error("Amount and reason are required"); return; }
    try {
      await overrideMut.mutateAsync({ orderId, dto: { amount: parseFloat(f.amount), reason: f.reason } });
      toast.success("Fee overridden");
      refetch();
    } catch (err) {
      toast.error((err as Error).message ?? "Override failed");
    }
  };

  const handleAdjust = async (orderId: string) => {
    const f = adjustForm[orderId];
    if (!f?.amount || !f?.reason) { toast.error("Amount and reason are required"); return; }
    try {
      await adjustMut.mutateAsync({ orderId, dto: { type: f.type, amount: parseFloat(f.amount), reason: f.reason } });
      toast.success("Adjustment created");
      refetch();
    } catch (err) {
      toast.error((err as Error).message ?? "Adjustment failed");
    }
  };

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const qf = quoteForm[order._id] ?? { amount: "", currency: order.chargeCurrency ?? "NGN", carrier: "", etaDays: "", note: "", validDays: "7" };
        const of = overrideForm[order._id] ?? { amount: "", reason: "" };
        const af = adjustForm[order._id] ?? { type: "refund" as const, amount: "", reason: "" };
        const isOpen = expanded === order._id;
        const slaAge = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 3600000);
        const isOverdue = slaAge >= 24;

        return (
          <div key={order._id} className={`border bg-card ${isOverdue ? "border-destructive/50" : "border-border"}`}>
            {/* Header */}
            <button
              onClick={() => setExpanded(isOpen ? null : order._id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer hover:bg-muted/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {order.orderNumber}
                  </span>
                  {isOverdue && (
                    <span className="flex items-center gap-1 text-[9px] tracking-[0.15em] uppercase text-destructive bg-destructive/10 px-2 py-0.5" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      <AlertCircle size={10} /> SLA overdue ({slaAge}h)
                    </span>
                  )}
                  <span className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {order.shippingStatus}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {order.customerName ?? "Guest"} · {order.shippingAddress?.country}{order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ""} · {order.chargeCurrency}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-primary" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {formatPrice(order.total)}
                </span>
                <Clock size={14} className="text-muted-foreground" />
              </div>
            </button>

            {/* Expanded detail + quote form */}
            {isOpen && (
              <div className="border-t border-border px-5 py-5 space-y-5">
                {/* Items */}
                <div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>Items</p>
                  <div className="space-y-1.5">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-xs" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        <span className="text-muted-foreground">{item.title} × {item.qty}</span>
                        <span className="text-foreground">{formatPrice(item.unitPrice * item.qty)}</span>
                      </div>
                    ))}
                  </div>
                  {(order.chargeableWeightGrams ?? 0) > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      Chargeable weight: {order.chargeableWeightGrams}g
                    </p>
                  )}
                </div>

                {/* Quote form — only for AWAITING_QUOTE */}
                {order.shippingStatus === "AWAITING_QUOTE" && (
                  <div className="space-y-3 pt-2">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-semibold" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      Submit Shipping Quote
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <EF label={`Amount (${qf.currency} minor units)`}>
                        <input type="number" min={0} value={qf.amount} onChange={(e) => setQuoteForm({ ...quoteForm, [order._id]: { ...qf, amount: e.target.value } })} className="checkout-input" placeholder="e.g. 450000" />
                      </EF>
                      <EF label="Currency">
                        <input value={qf.currency} onChange={(e) => setQuoteForm({ ...quoteForm, [order._id]: { ...qf, currency: e.target.value } })} className="checkout-input" placeholder="NGN" />
                      </EF>
                      <EF label="Carrier (optional)">
                        <input value={qf.carrier} onChange={(e) => setQuoteForm({ ...quoteForm, [order._id]: { ...qf, carrier: e.target.value } })} className="checkout-input" placeholder="DHL Express" />
                      </EF>
                      <EF label="Est. delivery days">
                        <input type="number" min={1} value={qf.etaDays} onChange={(e) => setQuoteForm({ ...quoteForm, [order._id]: { ...qf, etaDays: e.target.value } })} className="checkout-input" placeholder="7" />
                      </EF>
                      <EF label="Validity (days)">
                        <input type="number" min={1} value={qf.validDays} onChange={(e) => setQuoteForm({ ...quoteForm, [order._id]: { ...qf, validDays: e.target.value } })} className="checkout-input" />
                      </EF>
                    </div>
                    <EF label="Note to customer (optional)">
                      <input value={qf.note} onChange={(e) => setQuoteForm({ ...quoteForm, [order._id]: { ...qf, note: e.target.value } })} className="checkout-input" placeholder="Includes customs clearance." />
                    </EF>
                    <button
                      onClick={() => handleSubmitQuote(order._id)}
                      disabled={submitMut.isPending}
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {submitMut.isPending ? <Spinner className="size-3" /> : <CheckCircle size={12} />}
                      Submit Quote
                    </button>
                  </div>
                )}

                {/* Override fee */}
                <details className="group">
                  <summary className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground cursor-pointer hover:text-foreground list-none flex items-center gap-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    <span className="group-open:hidden">▶</span><span className="hidden group-open:inline">▼</span> Override Shipping Fee
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <EF label="New amount (minor units)">
                        <input type="number" min={0} value={of.amount} onChange={(e) => setOverrideForm({ ...overrideForm, [order._id]: { ...of, amount: e.target.value } })} className="checkout-input" />
                      </EF>
                      <EF label="Reason">
                        <input value={of.reason} onChange={(e) => setOverrideForm({ ...overrideForm, [order._id]: { ...of, reason: e.target.value } })} className="checkout-input" />
                      </EF>
                    </div>
                    <button onClick={() => handleOverride(order._id)} disabled={overrideMut.isPending} className="flex items-center gap-2 px-5 py-2 border border-primary text-primary text-[10px] tracking-[0.15em] uppercase hover:bg-primary/5 transition-colors disabled:opacity-60 cursor-pointer" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      Override
                    </button>
                  </div>
                </details>

                {/* Post-payment adjustment */}
                {(order.status === "paid" || order.status === "fulfilled") && (
                  <details className="group">
                    <summary className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground cursor-pointer hover:text-foreground list-none flex items-center gap-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      <span className="group-open:hidden">▶</span><span className="hidden group-open:inline">▼</span> Shipping Adjustment
                    </summary>
                    <div className="mt-3 space-y-3">
                      <EF label="Type">
                        <select value={af.type} onChange={(e) => setAdjustForm({ ...adjustForm, [order._id]: { ...af, type: e.target.value as "refund" | "extra_charge" } })} className="checkout-input">
                          <option value="refund">Refund</option>
                          <option value="extra_charge">Extra charge</option>
                        </select>
                      </EF>
                      <div className="grid grid-cols-2 gap-3">
                        <EF label="Amount (minor units)">
                          <input type="number" min={0} value={af.amount} onChange={(e) => setAdjustForm({ ...adjustForm, [order._id]: { ...af, amount: e.target.value } })} className="checkout-input" />
                        </EF>
                        <EF label="Reason">
                          <input value={af.reason} onChange={(e) => setAdjustForm({ ...adjustForm, [order._id]: { ...af, reason: e.target.value } })} className="checkout-input" />
                        </EF>
                      </div>
                      <button onClick={() => handleAdjust(order._id)} disabled={adjustMut.isPending} className="flex items-center gap-2 px-5 py-2 border border-border text-muted-foreground text-[10px] tracking-[0.15em] uppercase hover:text-foreground transition-colors disabled:opacity-60 cursor-pointer" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        Apply Adjustment
                      </button>
                    </div>
                  </details>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 3 — Settings
// ─────────────────────────────────────────────────────────────────────────────

function SettingsTab() {
  const { data: settings, isLoading } = useAdminShippingSettings();
  const updateMut = useAdminUpdateShippingSettings();
  const [form, setForm] = useState<Partial<ApiShippingSettings>>({});
  const [dirty, setDirty] = useState(false);

  const current = { ...settings, ...form } as ApiShippingSettings;

  const set = (k: keyof ApiShippingSettings, v: string | number) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateMut.mutateAsync(form);
      toast.success("Settings saved");
      setForm({});
      setDirty(false);
    } catch (err) {
      toast.error((err as Error).message ?? "Save failed");
    }
  };

  if (isLoading) return <AdminTableSkeleton />;

  return (
    <div className="max-w-lg space-y-6">
      <EF label="Quote SLA — hours before admin alert fires">
        <input type="number" min={1} value={current.quoteSlaHours ?? 24} onChange={(e) => set("quoteSlaHours", parseInt(e.target.value) || 24)} className="checkout-input" />
      </EF>
      <EF label="Default quote validity (days)">
        <input type="number" min={1} value={current.quoteValidDays ?? 7} onChange={(e) => set("quoteValidDays", parseInt(e.target.value) || 7)} className="checkout-input" />
      </EF>
      <EF label="Admin alert emails (comma-separated)">
        <input value={current.adminAlertEmails ?? ""} onChange={(e) => set("adminAlertEmails", e.target.value)} className="checkout-input" placeholder="admin@labi.ng, ops@labi.ng" />
      </EF>
      <EF label="Quote amount cap (NGN kobo) — catches typos">
        <input type="number" min={0} value={current.quoteAmountCapNgn ?? 50000000} onChange={(e) => set("quoteAmountCapNgn", parseInt(e.target.value) || 50000000)} className="checkout-input" />
        <p className="text-[10px] text-muted-foreground mt-1" style={{ fontFamily: "'Montserrat', sans-serif" }}>
          = {formatPrice((current.quoteAmountCapNgn ?? 50000000) / 100)} — quotes above this need super_admin approval
        </p>
      </EF>
      <button
        onClick={handleSave}
        disabled={!dirty || updateMut.isPending}
        className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground text-[10px] tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {updateMut.isPending ? <><Spinner className="size-3.5" /> Saving…</> : <><Save size={12} /> Save Settings</>}
      </button>
    </div>
  );
}

// ── Shared form field ─────────────────────────────────────────────────────────

function EF({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        {label}
        {hint && <span className="ml-2 normal-case tracking-normal text-muted-foreground/60 text-[10px]">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
