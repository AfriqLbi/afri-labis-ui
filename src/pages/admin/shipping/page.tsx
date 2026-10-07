/**
 * Admin — Shipping
 *
 * Three tabs:
 *   1. Zones & Rates  — CRUD for shipping zones, rate bands, and estimates
 *   2. Quotes Queue   — orders awaiting a shipping quote
 *   3. Settings       — SLA hours, default validity, alert emails
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
  Truck,
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
import type {
  ApiShippingZone,
  ApiOrder,
  ApiShippingSettings,
} from "@/lib/api.ts";

// ── Tabs ──────────────────────────────────────────────────────────────────────

type Tab = "zones" | "quotes" | "settings";

export default function AdminShippingPage() {
  const [tab, setTab] = useState<Tab>("zones");

  return (
    <div className="p-6 lg:p-10 max-w-6xl">
      <div className="mb-8">
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
          Shipping
        </h1>
      </div>

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
            {t === "zones"
              ? "Zones & Rates"
              : t === "quotes"
                ? "Quotes Queue"
                : "Settings"}
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
// Zones tab
// ─────────────────────────────────────────────────────────────────────────────

function emptyZone(): ApiShippingZone {
  return {
    _id: "",
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

  const [editing, setEditing] = useState<
    (ApiShippingZone & { _isNew?: boolean }) | null
  >(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleSave = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("Zone name is required");
      return;
    }
    const { _id, _isNew, ...dto } = editing as ApiShippingZone & {
      _isNew?: boolean;
    };
    try {
      if (_isNew) {
        await createMut.mutateAsync(dto);
        toast.success(`Zone "${editing.name}" created`);
      } else {
        await updateMut.mutateAsync({ id: _id, dto });
        toast.success(`Zone "${editing.name}" updated`);
      }
      setEditing(null);
    } catch (err) {
      toast.error((err as Error).message ?? "Save failed");
    }
  };

  const handleDelete = async (z: ApiShippingZone) => {
    if (!window.confirm(`Delete zone "${z.name}"? This cannot be undone.`))
      return;
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
      <div className="flex justify-end">
        <button
          onClick={() =>
            setEditing({ ...emptyZone(), _isNew: true } as ApiShippingZone & {
              _isNew: boolean;
            })
          }
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors cursor-pointer"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          <Plus size={13} /> Add Zone
        </button>
      </div>

      {list.length === 0 && !editing && (
        <div className="text-center py-12 space-y-3">
          <Truck size={28} className="text-muted-foreground mx-auto" />
          <p
            className="text-lg font-light text-muted-foreground"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            No shipping zones yet
          </p>
          <p
            className="text-[10px] tracking-wide text-muted-foreground"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Create a zone to enable shipping fee calculation at checkout.
          </p>
        </div>
      )}

      {/* Zone rows */}
      {list.map((z) => {
        const isOpen = expanded === z._id;
        const hasRates =
          z.rates.length > 0 ||
          z.flatFeeNgn != null ||
          z.freeOverNgn != null ||
          z.estimateRange;
        return (
          <div
            key={z._id}
            className={`border bg-card ${!z.isActive ? "opacity-60" : ""}`}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4">
              <button
                onClick={() => setExpanded(isOpen ? null : z._id)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
                disabled={!hasRates}
                title={hasRates ? "Show rates" : "No rate details"}
              >
                {isOpen ? (
                  <ChevronUp size={14} />
                ) : (
                  <ChevronDown
                    size={14}
                    className={!hasRates ? "opacity-30" : ""}
                  />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p
                    className="text-sm font-medium text-foreground"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {z.name}
                  </p>
                  {z.isFallback && (
                    <span
                      className="text-[9px] tracking-[0.15em] uppercase text-primary bg-primary/10 px-2 py-0.5"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Fallback
                    </span>
                  )}
                  <span
                    className={`text-[9px] tracking-[0.1em] uppercase px-2 py-0.5 ${z.mode === "fixed" ? "bg-emerald-500/10 text-emerald-400" : "bg-yellow-500/10 text-yellow-400"}`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {z.mode === "fixed" ? "Fixed rate" : "Quote"}
                  </span>
                </div>
                <p
                  className="text-[10px] text-muted-foreground mt-0.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {z.countries.length
                    ? z.countries.join(", ")
                    : "All countries"}
                  {z.states.length > 0 ? ` (${z.states.join(", ")})` : ""}
                  {" · "}Priority {z.priority}
                  {z.etaMinDays != null && z.etaMaxDays != null
                    ? ` · ${z.etaMinDays}–${z.etaMaxDays} days`
                    : ""}
                  {z.pickupAvailable ? " · Pickup ✓" : ""}
                </p>
              </div>

              <span
                className={`shrink-0 text-[10px] tracking-[0.1em] uppercase px-2 py-1 ${z.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground"}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {z.isActive ? "Active" : "Inactive"}
              </span>
              <button
                onClick={() => setEditing({ ...z })}
                className="shrink-0 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                title="Edit zone"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(z)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                title="Delete zone"
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Expanded: rate bands + thresholds */}
            {isOpen && hasRates && (
              <div className="border-t border-border px-5 py-4 space-y-4 bg-muted/10">
                {/* Weight bands */}
                {z.rates.length > 0 && (
                  <div>
                    <p
                      className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Weight Bands
                    </p>
                    <div className="space-y-1">
                      {z.rates.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-6 text-xs"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          <span className="text-muted-foreground w-36">
                            {r.minGrams.toLocaleString()}g –{" "}
                            {r.maxGrams.toLocaleString()}g
                          </span>
                          <span className="text-primary font-semibold">
                            {formatPrice(r.feeNgn / 100)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flat fee + free threshold */}
                <div className="grid grid-cols-2 gap-4">
                  {z.flatFeeNgn != null && (
                    <div>
                      <p
                        className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        Flat fee (unmatched weight)
                      </p>
                      <p
                        className="text-sm font-semibold text-primary"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {formatPrice(z.flatFeeNgn / 100)}
                      </p>
                    </div>
                  )}
                  {z.freeOverNgn != null && (
                    <div>
                      <p
                        className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        Free shipping over
                      </p>
                      <p
                        className="text-sm font-semibold text-emerald-400"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {formatPrice(z.freeOverNgn / 100)} subtotal
                      </p>
                    </div>
                  )}
                </div>

                {/* Estimate range for quote zones */}
                {z.estimateRange && (
                  <div>
                    <p
                      className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Estimate range shown to customers
                    </p>
                    <p
                      className="text-sm text-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formatPrice(z.estimateRange.minNgn / 100)} –{" "}
                      {formatPrice(z.estimateRange.maxNgn / 100)}
                    </p>
                  </div>
                )}

                {/* Customer note */}
                {z.customerNote && (
                  <div>
                    <p
                      className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mb-1"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Customer note
                    </p>
                    <p
                      className="text-xs text-muted-foreground italic"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {z.customerNote}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Zone editor panel */}
      {editing && (
        <ZoneEditor
          zone={editing as ApiShippingZone & { _isNew?: boolean }}
          onChange={(z) =>
            setEditing(z as ApiShippingZone & { _isNew?: boolean })
          }
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
  zone: ApiShippingZone & { _isNew?: boolean };
  onChange: (z: ApiShippingZone & { _isNew?: boolean }) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const set = <K extends keyof ApiShippingZone>(k: K, v: ApiShippingZone[K]) =>
    onChange({ ...zone, [k]: v });

  const addBand = () =>
    set("rates", [
      ...(zone.rates ?? []),
      { minGrams: 0, maxGrams: 1000, feeNgn: 0 },
    ]);

  const updateBand = (
    i: number,
    k: "minGrams" | "maxGrams" | "feeNgn",
    v: number,
  ) =>
    set(
      "rates",
      (zone.rates ?? []).map((r, idx) => (idx === i ? { ...r, [k]: v } : r)),
    );

  const removeBand = (i: number) =>
    set(
      "rates",
      (zone.rates ?? []).filter((_, idx) => idx !== i),
    );

  return (
    <div className="border-2 border-primary/40 bg-card p-6 space-y-6 mt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p
          className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {zone._isNew ? "New Zone" : `Edit — ${zone.name}`}
        </p>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {/* ── Core ── */}
      <Section title="Zone Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EF label="Name *">
            <input
              value={zone.name}
              onChange={(e) => set("name", e.target.value)}
              className="checkout-input"
              placeholder="Lagos"
            />
          </EF>
          <EF label="Mode">
            <select
              value={zone.mode}
              onChange={(e) => set("mode", e.target.value as "fixed" | "quote")}
              className="checkout-input"
            >
              <option value="quote">Quote per order</option>
              <option value="fixed">Fixed rate card</option>
            </select>
          </EF>
          <EF
            label="Countries (ISO codes, comma-separated)"
            hint="e.g. NG  or  NG,CA"
          >
            <input
              value={(zone.countries ?? []).join(", ")}
              onChange={(e) =>
                set(
                  "countries",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim().toUpperCase())
                    .filter(Boolean),
                )
              }
              className="checkout-input"
              placeholder="NG"
            />
          </EF>
          <EF
            label="States (comma-separated, optional)"
            hint="leave blank = whole country"
          >
            <input
              value={(zone.states ?? []).join(", ")}
              onChange={(e) =>
                set(
                  "states",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
              className="checkout-input"
              placeholder="Lagos"
            />
          </EF>
          <EF label="Priority" hint="higher number wins when zones overlap">
            <input
              type="number"
              value={zone.priority ?? 0}
              onChange={(e) => set("priority", parseInt(e.target.value) || 0)}
              className="checkout-input"
            />
          </EF>
        </div>

        <div className="flex flex-wrap gap-6 pt-2">
          {[
            { field: "isActive" as const, label: "Active" },
            { field: "isFallback" as const, label: "Fallback zone" },
            { field: "pickupAvailable" as const, label: "Pickup available" },
          ].map(({ field, label }) => (
            <label
              key={field}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={!!zone[field]}
                onChange={(e) => set(field, e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span
                className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {label}
              </span>
            </label>
          ))}
        </div>
      </Section>

      {/* ── Rate card (fixed mode only) ── */}
      {zone.mode === "fixed" && (
        <Section
          title="Rate Card"
          hint="Weight bands in NGN kobo — maxGrams is exclusive"
        >
          {(zone.rates ?? []).length === 0 && (
            <p
              className="text-xs text-muted-foreground italic"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              No weight bands yet. Add one below, or set a flat fee.
            </p>
          )}

          {(zone.rates ?? []).map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end"
            >
              <EF label="Min (g, inclusive)">
                <input
                  type="number"
                  min={0}
                  value={r.minGrams}
                  onChange={(e) =>
                    updateBand(i, "minGrams", parseInt(e.target.value) || 0)
                  }
                  className="checkout-input text-xs"
                />
              </EF>
              <EF label="Max (g, exclusive)">
                <input
                  type="number"
                  min={1}
                  value={r.maxGrams}
                  onChange={(e) =>
                    updateBand(i, "maxGrams", parseInt(e.target.value) || 1)
                  }
                  className="checkout-input text-xs"
                />
              </EF>
              <EF label="Fee (kobo)" hint={`= ${formatPrice(r.feeNgn / 100)}`}>
                <input
                  type="number"
                  min={0}
                  value={r.feeNgn}
                  onChange={(e) =>
                    updateBand(i, "feeNgn", parseInt(e.target.value) || 0)
                  }
                  className="checkout-input text-xs"
                />
              </EF>
              <button
                onClick={() => removeBand(i)}
                className="text-muted-foreground hover:text-destructive cursor-pointer mb-1"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <button
            onClick={addBand}
            className="flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-primary hover:underline cursor-pointer"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <Plus size={11} /> Add band
          </button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
            <EF label="Flat fee (kobo)" hint="applies when no band matches">
              <input
                type="number"
                min={0}
                value={zone.flatFeeNgn ?? ""}
                onChange={(e) =>
                  set(
                    "flatFeeNgn",
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value),
                  )
                }
                className="checkout-input"
                placeholder="e.g. 600000"
              />
              {zone.flatFeeNgn != null && zone.flatFeeNgn > 0 && (
                <p
                  className="text-[10px] text-primary mt-1"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  = {formatPrice(zone.flatFeeNgn / 100)}
                </p>
              )}
            </EF>
            <EF
              label="Free-shipping threshold (kobo subtotal)"
              hint="items subtotal only"
            >
              <input
                type="number"
                min={0}
                value={zone.freeOverNgn ?? ""}
                onChange={(e) =>
                  set(
                    "freeOverNgn",
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value),
                  )
                }
                className="checkout-input"
                placeholder="e.g. 10000000"
              />
              {zone.freeOverNgn != null && zone.freeOverNgn > 0 && (
                <p
                  className="text-[10px] text-emerald-400 mt-1"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  = free over {formatPrice(zone.freeOverNgn / 100)}
                </p>
              )}
            </EF>
          </div>
        </Section>
      )}

      {/* ── Estimate range (quote mode) ── */}
      {zone.mode === "quote" && (
        <Section
          title="Estimate Range"
          hint="optional — shown to customers at checkout"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <EF label="Min estimate (NGN kobo)">
              <input
                type="number"
                min={0}
                value={zone.estimateRange?.minNgn ?? ""}
                onChange={(e) => {
                  const v =
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value);
                  set(
                    "estimateRange",
                    v != null
                      ? { minNgn: v, maxNgn: zone.estimateRange?.maxNgn ?? 0 }
                      : undefined,
                  );
                }}
                className="checkout-input"
                placeholder="e.g. 4500000"
              />
              {zone.estimateRange?.minNgn ? (
                <p
                  className="text-[10px] text-primary mt-1"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  = {formatPrice(zone.estimateRange.minNgn / 100)}
                </p>
              ) : null}
            </EF>
            <EF label="Max estimate (NGN kobo)">
              <input
                type="number"
                min={0}
                value={zone.estimateRange?.maxNgn ?? ""}
                onChange={(e) => {
                  const v =
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value);
                  set(
                    "estimateRange",
                    v != null
                      ? { minNgn: zone.estimateRange?.minNgn ?? 0, maxNgn: v }
                      : undefined,
                  );
                }}
                className="checkout-input"
                placeholder="e.g. 9000000"
              />
              {zone.estimateRange?.maxNgn ? (
                <p
                  className="text-[10px] text-primary mt-1"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  = {formatPrice(zone.estimateRange.maxNgn / 100)}
                </p>
              ) : null}
            </EF>
          </div>
        </Section>
      )}

      {/* ── Presentation ── */}
      <Section title="Presentation">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <EF label="ETA min days">
            <input
              type="number"
              min={0}
              value={zone.etaMinDays ?? ""}
              onChange={(e) =>
                set(
                  "etaMinDays",
                  e.target.value === "" ? undefined : parseInt(e.target.value),
                )
              }
              className="checkout-input"
            />
          </EF>
          <EF label="ETA max days">
            <input
              type="number"
              min={0}
              value={zone.etaMaxDays ?? ""}
              onChange={(e) =>
                set(
                  "etaMaxDays",
                  e.target.value === "" ? undefined : parseInt(e.target.value),
                )
              }
              className="checkout-input"
            />
          </EF>
        </div>
        <EF
          label="Customer note"
          hint="shown at checkout — e.g. duties disclaimer"
        >
          <input
            value={zone.customerNote ?? ""}
            onChange={(e) => set("customerNote", e.target.value || undefined)}
            className="checkout-input"
            placeholder="Import duties and taxes are payable by the recipient on delivery."
          />
        </EF>
      </Section>

      {/* Save / cancel */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          onClick={onCancel}
          className="px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase border border-border text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={saving || !zone.name.trim()}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {saving ? (
            <>
              <Spinner className="size-3" /> Saving…
            </>
          ) : (
            <>
              <Save size={12} /> Save Zone
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quotes tab
// ─────────────────────────────────────────────────────────────────────────────

function QuotesTab() {
  const { data, isLoading, refetch } = useAdminShippingQuotes();
  const submitMut = useAdminSubmitShippingQuote();
  const overrideMut = useAdminOverrideShippingFee();
  const adjustMut = useAdminCreateShippingAdjustment();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState<
    Record<
      string,
      {
        amount: string;
        currency: string;
        carrier: string;
        etaDays: string;
        note: string;
        validDays: string;
      }
    >
  >({});
  const [overrideForm, setOverrideForm] = useState<
    Record<string, { amount: string; reason: string }>
  >({});
  const [adjustForm, setAdjustForm] = useState<
    Record<
      string,
      { type: "refund" | "extra_charge"; amount: string; reason: string }
    >
  >({});

  if (isLoading) return <AdminTableSkeleton />;
  const orderList = (data ?? []) as ApiOrder[];

  if (orderList.length === 0) {
    return (
      <div className="text-center py-16 space-y-2">
        <CheckCircle size={32} className="text-emerald-400 mx-auto" />
        <p
          className="text-lg font-light text-muted-foreground"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          No quotes pending
        </p>
        <p
          className="text-[10px] tracking-wide text-muted-foreground"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          All shipping quotes are up to date.
        </p>
      </div>
    );
  }

  const handleSubmitQuote = async (orderId: string) => {
    const f = quoteForm[orderId];
    if (!f?.amount || !f?.currency) {
      toast.error("Amount and currency are required");
      return;
    }
    const amount = parseFloat(f.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Enter a valid positive amount");
      return;
    }
    try {
      await submitMut.mutateAsync({
        orderId,
        dto: {
          amount,
          currency: f.currency.toUpperCase().trim(),
          carrier: f.carrier.trim() || undefined,
          etaDays: f.etaDays ? parseInt(f.etaDays) : undefined,
          note: f.note.trim() || undefined,
          validDays: f.validDays ? parseInt(f.validDays) : undefined,
        },
      });
      toast.success("Quote submitted — customer notified");
      setExpanded(null);
      refetch();
    } catch (err) {
      toast.error((err as Error).message ?? "Submit failed");
    }
  };

  const handleOverride = async (orderId: string) => {
    const f = overrideForm[orderId];
    if (!f?.amount || !f?.reason) {
      toast.error("Amount and reason are required");
      return;
    }
    try {
      await overrideMut.mutateAsync({
        orderId,
        dto: { amount: parseFloat(f.amount), reason: f.reason },
      });
      toast.success("Shipping fee overridden");
      refetch();
    } catch (err) {
      toast.error((err as Error).message ?? "Override failed");
    }
  };

  const handleAdjust = async (orderId: string) => {
    const f = adjustForm[orderId];
    if (!f?.amount || !f?.reason) {
      toast.error("Amount and reason are required");
      return;
    }
    try {
      await adjustMut.mutateAsync({
        orderId,
        dto: { type: f.type, amount: parseFloat(f.amount), reason: f.reason },
      });
      toast.success("Adjustment created");
      refetch();
    } catch (err) {
      toast.error((err as Error).message ?? "Adjustment failed");
    }
  };

  return (
    <div className="space-y-3">
      {orderList.map((order) => {
        const isOpen = expanded === order._id;
        const qf = quoteForm[order._id] ?? {
          amount: "",
          currency: order.chargeCurrency ?? "NGN",
          carrier: "",
          etaDays: "",
          note: "",
          validDays: "7",
        };
        const of_ = overrideForm[order._id] ?? { amount: "", reason: "" };
        const af = adjustForm[order._id] ?? {
          type: "refund" as const,
          amount: "",
          reason: "",
        };

        const ageHours = Math.floor(
          (Date.now() - new Date(order.createdAt).getTime()) / 3600000,
        );
        const isOverdue = ageHours >= 24;

        return (
          <div
            key={order._id}
            className={`border bg-card ${isOverdue ? "border-destructive/40" : "border-border"}`}
          >
            {/* Row header */}
            <button
              onClick={() => setExpanded(isOpen ? null : order._id)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left cursor-pointer hover:bg-muted/20 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-sm font-medium text-foreground"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {order.orderNumber}
                  </span>
                  {isOverdue && (
                    <span
                      className="flex items-center gap-1 text-[9px] tracking-[0.1em] uppercase text-destructive bg-destructive/10 px-2 py-0.5"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      <AlertCircle size={10} /> {ageHours}h — SLA overdue
                    </span>
                  )}
                  <span
                    className="text-[9px] tracking-[0.1em] uppercase text-muted-foreground px-2 py-0.5 bg-muted/60"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {order.shippingStatus}
                  </span>
                </div>
                <p
                  className="text-[10px] text-muted-foreground mt-0.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {order.customerName ?? "Guest"} ·{" "}
                  {order.shippingAddress?.country ?? "—"}
                  {order.shippingAddress?.state
                    ? `, ${order.shippingAddress.state}`
                    : ""}{" "}
                  · {order.chargeCurrency}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className="text-sm font-semibold text-primary"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {formatPrice(order.total)}
                </span>
                <Clock size={14} className="text-muted-foreground" />
              </div>
            </button>

            {/* Expanded */}
            {isOpen && (
              <div className="border-t border-border px-5 py-5 space-y-6">
                {/* Items + weight */}
                <Section title="Order Contents">
                  <div className="space-y-1.5">
                    {order.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-xs"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        <span className="text-muted-foreground">
                          {item.title} × {item.qty}
                        </span>
                        <span className="text-foreground">
                          {formatPrice(item.unitPrice * item.qty)}
                        </span>
                      </div>
                    ))}
                  </div>
                  {(order.chargeableWeightGrams ?? 0) > 0 && (
                    <p
                      className="text-[10px] text-muted-foreground mt-1"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Chargeable weight:{" "}
                      {order.chargeableWeightGrams?.toLocaleString()}g
                    </p>
                  )}
                </Section>

                {/* Quote summary — for QUOTED orders awaiting payment */}
                {order.shippingStatus === "QUOTED" && order.shippingQuote && (
                  <Section title="Quote Submitted — Awaiting Payment">
                    <div
                      className="space-y-1.5 text-xs"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {order.shippingQuote.amount != null && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Fee</span>
                          <span className="text-primary font-semibold">
                            {formatPrice(
                              (order.shippingQuote.amount ?? 0) / 100,
                            )}
                          </span>
                        </div>
                      )}
                      {order.shippingQuote.carrier && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Carrier</span>
                          <span className="text-foreground">
                            {order.shippingQuote.carrier}
                          </span>
                        </div>
                      )}
                      {order.shippingQuote.validUntil && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expires</span>
                          <span
                            className={
                              new Date(order.shippingQuote.validUntil) <
                              new Date()
                                ? "text-destructive"
                                : "text-foreground"
                            }
                          >
                            {new Date(
                              order.shippingQuote.validUntil,
                            ).toLocaleString("en-NG")}
                          </span>
                        </div>
                      )}
                    </div>
                  </Section>
                )}

                {/* Submit quote — only for AWAITING_QUOTE */}
                {order.shippingStatus === "AWAITING_QUOTE" && (
                  <Section title="Submit Shipping Quote">
                    {" "}
                    <div className="grid grid-cols-2 gap-3">
                      <EF label={`Amount (${qf.currency} minor units)`}>
                        <input
                          type="number"
                          min={0}
                          value={qf.amount}
                          onChange={(e) =>
                            setQuoteForm({
                              ...quoteForm,
                              [order._id]: { ...qf, amount: e.target.value },
                            })
                          }
                          className="checkout-input"
                          placeholder="e.g. 450000"
                        />
                        {qf.amount && !isNaN(parseFloat(qf.amount)) && (
                          <p
                            className="text-[10px] text-primary mt-1"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            = {formatPrice(parseFloat(qf.amount) / 100)}
                          </p>
                        )}
                      </EF>
                      <EF label="Currency (must match order)">
                        <input
                          value={qf.currency}
                          onChange={(e) =>
                            setQuoteForm({
                              ...quoteForm,
                              [order._id]: { ...qf, currency: e.target.value },
                            })
                          }
                          className="checkout-input"
                        />
                      </EF>
                      <EF label="Carrier (optional)">
                        <input
                          value={qf.carrier}
                          onChange={(e) =>
                            setQuoteForm({
                              ...quoteForm,
                              [order._id]: { ...qf, carrier: e.target.value },
                            })
                          }
                          className="checkout-input"
                          placeholder="DHL Express"
                        />
                      </EF>
                      <EF label="Est. delivery (days)">
                        <input
                          type="number"
                          min={1}
                          value={qf.etaDays}
                          onChange={(e) =>
                            setQuoteForm({
                              ...quoteForm,
                              [order._id]: { ...qf, etaDays: e.target.value },
                            })
                          }
                          className="checkout-input"
                          placeholder="7"
                        />
                      </EF>
                      <EF label="Quote validity (days)">
                        <input
                          type="number"
                          min={1}
                          value={qf.validDays}
                          onChange={(e) =>
                            setQuoteForm({
                              ...quoteForm,
                              [order._id]: { ...qf, validDays: e.target.value },
                            })
                          }
                          className="checkout-input"
                        />
                      </EF>
                    </div>
                    <EF
                      label="Note to customer (optional)"
                      hint="shown in the payment email"
                    >
                      <input
                        value={qf.note}
                        onChange={(e) =>
                          setQuoteForm({
                            ...quoteForm,
                            [order._id]: { ...qf, note: e.target.value },
                          })
                        }
                        className="checkout-input"
                        placeholder="Includes customs clearance to your address."
                      />
                    </EF>
                    <button
                      onClick={() => handleSubmitQuote(order._id)}
                      disabled={
                        submitMut.isPending || !qf.amount || !qf.currency
                      }
                      className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-[10px] tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {submitMut.isPending ? (
                        <>
                          <Spinner className="size-3" /> Sending…
                        </>
                      ) : (
                        <>
                          <CheckCircle size={12} /> Submit Quote
                        </>
                      )}
                    </button>
                  </Section>
                )}

                {/* Override fee */}
                <details className="group">
                  <summary
                    className="list-none flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    <span className="group-open:hidden">▶</span>
                    <span className="hidden group-open:inline">▼</span>
                    Override Shipping Fee
                  </summary>
                  <div className="mt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <EF label="New amount (minor units)">
                        <input
                          type="number"
                          min={0}
                          value={of_.amount}
                          onChange={(e) =>
                            setOverrideForm({
                              ...overrideForm,
                              [order._id]: { ...of_, amount: e.target.value },
                            })
                          }
                          className="checkout-input"
                        />
                        {of_.amount && !isNaN(parseFloat(of_.amount)) && (
                          <p
                            className="text-[10px] text-primary mt-1"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            = {formatPrice(parseFloat(of_.amount) / 100)}
                          </p>
                        )}
                      </EF>
                      <EF label="Reason *">
                        <input
                          value={of_.reason}
                          onChange={(e) =>
                            setOverrideForm({
                              ...overrideForm,
                              [order._id]: { ...of_, reason: e.target.value },
                            })
                          }
                          className="checkout-input"
                          placeholder="Customer loyalty discount"
                        />
                      </EF>
                    </div>
                    <button
                      onClick={() => handleOverride(order._id)}
                      disabled={
                        overrideMut.isPending || !of_.amount || !of_.reason
                      }
                      className="flex items-center gap-2 px-5 py-2 border border-primary text-primary text-[10px] tracking-[0.15em] uppercase hover:bg-primary/5 transition-colors disabled:opacity-60 cursor-pointer"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {overrideMut.isPending ? (
                        <Spinner className="size-3" />
                      ) : null}{" "}
                      Apply Override
                    </button>
                  </div>
                </details>

                {/* Post-payment adjustment — only for paid orders */}
                {(order.status === "paid" || order.status === "fulfilled") && (
                  <details className="group">
                    <summary
                      className="list-none flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-muted-foreground cursor-pointer hover:text-foreground select-none"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      <span className="group-open:hidden">▶</span>
                      <span className="hidden group-open:inline">▼</span>
                      Post-Payment Adjustment
                    </summary>
                    <div className="mt-3 space-y-3">
                      <EF label="Type">
                        <select
                          value={af.type}
                          onChange={(e) =>
                            setAdjustForm({
                              ...adjustForm,
                              [order._id]: {
                                ...af,
                                type: e.target.value as
                                  "refund" | "extra_charge",
                              },
                            })
                          }
                          className="checkout-input"
                        >
                          <option value="refund">
                            Refund (courier charged less)
                          </option>
                          <option value="extra_charge">
                            Extra charge (courier charged more)
                          </option>
                        </select>
                      </EF>
                      <div className="grid grid-cols-2 gap-3">
                        <EF label="Amount (minor units)">
                          <input
                            type="number"
                            min={0}
                            value={af.amount}
                            onChange={(e) =>
                              setAdjustForm({
                                ...adjustForm,
                                [order._id]: { ...af, amount: e.target.value },
                              })
                            }
                            className="checkout-input"
                          />
                          {af.amount && !isNaN(parseFloat(af.amount)) && (
                            <p
                              className="text-[10px] text-primary mt-1"
                              style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              = {formatPrice(parseFloat(af.amount) / 100)}
                            </p>
                          )}
                        </EF>
                        <EF label="Reason *">
                          <input
                            value={af.reason}
                            onChange={(e) =>
                              setAdjustForm({
                                ...adjustForm,
                                [order._id]: { ...af, reason: e.target.value },
                              })
                            }
                            className="checkout-input"
                          />
                        </EF>
                      </div>
                      <button
                        onClick={() => handleAdjust(order._id)}
                        disabled={
                          adjustMut.isPending || !af.amount || !af.reason
                        }
                        className="flex items-center gap-2 px-5 py-2 border border-border text-muted-foreground text-[10px] tracking-[0.15em] uppercase hover:text-foreground transition-colors disabled:opacity-60 cursor-pointer"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {adjustMut.isPending ? (
                          <Spinner className="size-3" />
                        ) : null}{" "}
                        Create Adjustment
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
// Settings tab
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
        <input
          type="number"
          min={1}
          value={current.quoteSlaHours ?? 24}
          onChange={(e) => set("quoteSlaHours", parseInt(e.target.value) || 24)}
          className="checkout-input"
        />
        <p
          className="text-[10px] text-muted-foreground mt-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          If no quote is submitted within this window, admins receive an overdue
          alert.
        </p>
      </EF>

      <EF label="Default quote validity (days)">
        <input
          type="number"
          min={1}
          value={current.quoteValidDays ?? 7}
          onChange={(e) => set("quoteValidDays", parseInt(e.target.value) || 7)}
          className="checkout-input"
        />
        <p
          className="text-[10px] text-muted-foreground mt-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Can be overridden per quote. Customer loses the quote if they don't
          pay in time.
        </p>
      </EF>

      <EF label="Admin alert emails (comma-separated)">
        <input
          value={current.adminAlertEmails ?? ""}
          onChange={(e) => set("adminAlertEmails", e.target.value)}
          className="checkout-input"
          placeholder="admin@labi.ng, ops@labi.ng"
        />
        <p
          className="text-[10px] text-muted-foreground mt-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Receives quote-needed and SLA-overdue alerts.
        </p>
      </EF>

      <EF label="Quote amount cap (NGN kobo)">
        <input
          type="number"
          min={0}
          value={current.quoteAmountCapNgn ?? 50000000}
          onChange={(e) =>
            set("quoteAmountCapNgn", parseInt(e.target.value) || 50000000)
          }
          className="checkout-input"
        />
        <p
          className="text-[10px] text-muted-foreground mt-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          = {formatPrice((current.quoteAmountCapNgn ?? 50000000) / 100)} —
          quotes above this are flagged to prevent typos (e.g. an extra zero).
        </p>
      </EF>

      <button
        onClick={handleSave}
        disabled={!dirty || updateMut.isPending}
        className="flex items-center gap-2 px-7 py-3 bg-primary text-primary-foreground text-[10px] tracking-[0.2em] uppercase hover:bg-primary/90 transition-colors disabled:opacity-60 cursor-pointer"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {updateMut.isPending ? (
          <>
            <Spinner className="size-3.5" /> Saving…
          </>
        ) : (
          <>
            <Save size={12} /> Save Settings
          </>
        )}
      </button>
    </div>
  );
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3 pb-2 border-b border-border">
        <p
          className="text-[10px] tracking-[0.25em] uppercase text-primary font-semibold"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {title}
        </p>
        {hint && (
          <p
            className="text-[10px] text-muted-foreground"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {hint}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function EF({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {label}
        {hint && (
          <span className="ml-2 normal-case tracking-normal text-[10px] text-muted-foreground/60">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
