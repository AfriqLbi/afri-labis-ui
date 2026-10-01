/**
 * Measurements page — wired to the real backend.
 *
 * A user may have multiple named measurement profiles, one per garment type.
 * The page shows all existing profiles as tabs and lets them create new ones.
 * Each profile is saved to /v1/measurements (create) or PATCH /v1/measurements/:id (update).
 *
 * Validation mirrors the backend: value > 0 and <= 400 cm (or <= 157 inches ≈ 400 cm).
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Ruler,
  Check,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth.ts";
import {
  measurements as measurementsApi,
  type MeasurementField,
  ApiError,
} from "@/lib/api.ts";
import { useMeasurementProfiles } from "@/hooks/use-api.ts";
import { useQueryClient } from "@tanstack/react-query";
import Header from "../_components/Header.tsx";
import Footer from "../_components/Footer.tsx";
import SizeGuideModal from "@/components/SizeGuideModal.tsx";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Link } from "react-router-dom";

// ── Constants ──────────────────────────────────────────────────────────────────

type Unit = "cm" | "inches";

const CM_TO_IN = 0.393701;
const IN_TO_CM = 2.54;

/** Standard field set — user can edit keys/labels freely via the advanced editor */
const STANDARD_FIELDS: {
  key: string;
  label: string;
  hint: string;
  category: "upper" | "lower" | "extra";
}[] = [
  {
    key: "bust",
    label: "Bust / Chest",
    hint: "Fullest part of chest",
    category: "upper",
  },
  {
    key: "waist",
    label: "Waist",
    hint: "Narrowest part of torso",
    category: "upper",
  },
  {
    key: "hips",
    label: "Hips",
    hint: "Widest part of hips",
    category: "upper",
  },
  {
    key: "shoulder",
    label: "Shoulder Width",
    hint: "Tip to tip across shoulders",
    category: "upper",
  },
  {
    key: "sleeve",
    label: "Sleeve Length",
    hint: "Shoulder tip to wrist",
    category: "upper",
  },
  {
    key: "length",
    label: "Garment Length",
    hint: "Shoulder to desired hem",
    category: "lower",
  },
  {
    key: "inseam",
    label: "Inseam",
    hint: "Crotch to ankle (trousers)",
    category: "lower",
  },
  {
    key: "neck",
    label: "Neck",
    hint: "Around the base of the neck",
    category: "extra",
  },
];

const GARMENT_TYPES = [
  { value: "dress", label: "Dress / Gown" },
  { value: "suit", label: "Suit / Jacket" },
  { value: "trousers", label: "Trousers / Pants" },
  { value: "shirt", label: "Shirt / Blouse" },
  { value: "aso-oke-jacket", label: "Aso Oke Jacket" },
  { value: "aso-oke-gown", label: "Aso Oke Gown" },
  { value: "cargo-pants", label: "Cargo Pants" },
  { value: "danshiki", label: "Danshiki" },
  { value: "agbada-set", label: "Agbada Set" },
  { value: "bridal", label: "Bridal / Wedding" },
  { value: "other", label: "Other" },
];

// ── Helper ─────────────────────────────────────────────────────────────────────

function displayValue(cmValue: number, unit: Unit): string {
  if (cmValue === 0) return "";
  return unit === "inches"
    ? String(Math.round(cmValue * CM_TO_IN * 10) / 10)
    : String(cmValue);
}

function toStoredCm(displayVal: string, unit: Unit): number {
  const n = parseFloat(displayVal);
  if (isNaN(n) || n <= 0) return 0;
  return unit === "inches" ? Math.round(n * IN_TO_CM * 10) / 10 : n;
}

function validate(fields: MeasurementField[]): string | null {
  for (const f of fields) {
    if (f.value <= 0) return `"${f.label}" must be greater than zero.`;
    if (f.value > 400)
      return `"${f.label}" value (${f.value} cm) exceeds the realistic maximum of 400 cm.`;
  }
  const keys = fields.map((f) => f.key.toLowerCase());
  const dup = keys.find((k, i) => keys.indexOf(k) !== i);
  if (dup)
    return `Duplicate field key: "${dup}". Each measurement must have a unique name.`;
  return null;
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MeasurementsPage() {
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const { data: profiles, isLoading } = useMeasurementProfiles();
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [activeProfileId, setActiveProfileId] = useState<string | "new">("new");
  const [unit, setUnit] = useState<Unit>("cm");

  // For the "new profile" form
  const [newGarmentType, setNewGarmentType] = useState("dress");
  const [newGarmentLabel, setNewGarmentLabel] = useState("");
  const [newFieldValues, setNewFieldValues] = useState<Record<string, string>>(
    {},
  );
  const [saving, setSaving] = useState(false);

  const activeProfile =
    profiles?.find((p) => p._id === activeProfileId) ?? null;

  // ── New profile save ──────────────────────────────────────────────────────

  const handleCreateProfile = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const fields: MeasurementField[] = STANDARD_FIELDS.map((f) => ({
        key: f.key,
        label: f.label,
        value: toStoredCm(newFieldValues[f.key] ?? "", unit),
      })).filter((f) => f.value > 0);

      if (fields.length === 0) {
        toast.error("Enter at least one measurement before saving.");
        return;
      }

      const err = validate(fields);
      if (err) {
        toast.error(err);
        return;
      }

      setSaving(true);
      try {
        const created = await measurementsApi.create({
          garmentType: newGarmentType,
          garmentLabel:
            newGarmentLabel ||
            GARMENT_TYPES.find((g) => g.value === newGarmentType)?.label,
          measurements: fields,
        });
        await qc.invalidateQueries({ queryKey: ["measurement-profiles"] });
        setActiveProfileId(created._id);
        setNewFieldValues({});
        toast.success("Profile saved!");
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Could not save profile.",
        );
      } finally {
        setSaving(false);
      }
    },
    [newFieldValues, newGarmentType, newGarmentLabel, unit, qc],
  );

  // ── Existing profile update ───────────────────────────────────────────────

  const handleUpdateProfile = useCallback(
    async (profileId: string, fields: MeasurementField[]) => {
      const err = validate(fields);
      if (err) {
        toast.error(err);
        return;
      }

      setSaving(true);
      try {
        await measurementsApi.update(profileId, { measurements: fields });
        await qc.invalidateQueries({ queryKey: ["measurement-profiles"] });
        toast.success("Measurements updated!");
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Could not update profile.",
        );
      } finally {
        setSaving(false);
      }
    },
    [qc],
  );

  // ── Delete profile ────────────────────────────────────────────────────────

  const handleDeleteProfile = useCallback(
    async (profileId: string) => {
      if (
        !window.confirm(
          "Delete this measurement profile? This cannot be undone.",
        )
      )
        return;
      try {
        await measurementsApi.remove(profileId);
        await qc.invalidateQueries({ queryKey: ["measurement-profiles"] });
        setActiveProfileId("new");
        toast.success("Profile deleted.");
      } catch (err) {
        toast.error(
          err instanceof ApiError ? err.message : "Could not delete profile.",
        );
      }
    },
    [qc],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-[65px]">
        {/* Hero */}
        <div className="border-b border-border bg-card">
          <div className="max-w-4xl mx-auto px-6 py-10">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className="text-[10px] tracking-[0.3em] uppercase text-primary mb-2"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Personalised Fit
                </p>
                <h1
                  className="text-4xl md:text-5xl font-light text-foreground"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  My Measurements
                </h1>
                <p
                  className="text-muted-foreground mt-3 text-lg font-light max-w-md"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  Save your measurements once and reuse them across all custom
                  orders for a perfectly tailored fit every time.
                </p>
              </div>
              <button
                onClick={() => setSizeGuideOpen(true)}
                className="shrink-0 flex items-center gap-2 border border-primary text-primary px-4 py-2.5 text-xs tracking-[0.15em] uppercase hover:bg-primary/10 transition-colors cursor-pointer"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                <Ruler size={12} /> Size Guide
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Sign-in prompt */}
          {!isAuthenticated && (
            <div className="bg-card border border-border px-6 py-8 text-center space-y-4 mb-8">
              <p
                className="text-2xl font-light"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                Sign in to save your measurements
              </p>
              <p
                className="text-xs text-muted-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Measurements are saved to your account and reused across all
                custom orders.
              </p>
              <Link
                to="/auth/signin?redirect=/measurements"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Sign In
              </Link>
            </div>
          )}

          {/* Profile tabs */}
          {isAuthenticated && (
            <>
              {isLoading ? (
                <div className="flex items-center gap-3 py-8 text-muted-foreground">
                  <Spinner className="size-5" />
                  <span
                    className="text-sm"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Loading your profiles…
                  </span>
                </div>
              ) : (
                <>
                  {/* Tab strip */}
                  <div className="flex gap-0 border-b border-border mb-10 overflow-x-auto">
                    {(profiles ?? []).map((p) => (
                      <button
                        key={p._id}
                        onClick={() => setActiveProfileId(p._id)}
                        className={`px-5 py-3 text-[10px] tracking-[0.2em] uppercase whitespace-nowrap transition-all cursor-pointer ${
                          activeProfileId === p._id
                            ? "border-b-2 border-primary text-foreground -mb-px"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {p.garmentLabel ?? p.garmentType}
                      </button>
                    ))}
                    <button
                      onClick={() => setActiveProfileId("new")}
                      className={`px-5 py-3 text-[10px] tracking-[0.2em] uppercase whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeProfileId === "new"
                          ? "border-b-2 border-primary text-foreground -mb-px"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      <Plus size={11} /> New Profile
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {activeProfileId === "new" ? (
                      <motion.div
                        key="new"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <NewProfileForm
                          garmentType={newGarmentType}
                          garmentLabel={newGarmentLabel}
                          fieldValues={newFieldValues}
                          unit={unit}
                          saving={saving}
                          onGarmentTypeChange={setNewGarmentType}
                          onGarmentLabelChange={setNewGarmentLabel}
                          onFieldChange={(key, val) =>
                            setNewFieldValues((prev) => ({
                              ...prev,
                              [key]: val,
                            }))
                          }
                          onUnitChange={setUnit}
                          onSubmit={handleCreateProfile}
                        />
                      </motion.div>
                    ) : activeProfile ? (
                      <motion.div
                        key={activeProfile._id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ExistingProfileForm
                          profile={activeProfile}
                          unit={unit}
                          saving={saving}
                          onUnitChange={setUnit}
                          onSave={handleUpdateProfile}
                          onDelete={handleDeleteProfile}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        category="women"
      />
      <Footer />
    </div>
  );
}

// ── New Profile Form ───────────────────────────────────────────────────────────

function NewProfileForm({
  garmentType,
  garmentLabel,
  fieldValues,
  unit,
  saving,
  onGarmentTypeChange,
  onGarmentLabelChange,
  onFieldChange,
  onUnitChange,
  onSubmit,
}: {
  garmentType: string;
  garmentLabel: string;
  fieldValues: Record<string, string>;
  unit: Unit;
  saving: boolean;
  onGarmentTypeChange: (v: string) => void;
  onGarmentLabelChange: (v: string) => void;
  onFieldChange: (key: string, val: string) => void;
  onUnitChange: (u: Unit) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-10">
      <Section title="Profile Details">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Garment Type">
            <div className="relative">
              <select
                value={garmentType}
                onChange={(e) => onGarmentTypeChange(e.target.value)}
                className="checkout-input appearance-none pr-10"
              >
                {GARMENT_TYPES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={13}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          </Field>
          <Field label="Custom Label (optional)">
            <input
              value={garmentLabel}
              onChange={(e) => onGarmentLabelChange(e.target.value)}
              placeholder='e.g. "My Wedding Gown Profile"'
              className="checkout-input"
            />
          </Field>
        </div>
      </Section>

      <UnitToggle unit={unit} onUnitChange={onUnitChange} />

      <Section title="Upper Body">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {STANDARD_FIELDS.filter((f) => f.category === "upper").map((f) => (
            <MeasurementInput
              key={f.key}
              label={f.label}
              hint={f.hint}
              unit={unit}
              value={fieldValues[f.key] ?? ""}
              onChange={(v) => onFieldChange(f.key, v)}
            />
          ))}
        </div>
      </Section>

      <Section title="Lower Body">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {STANDARD_FIELDS.filter((f) => f.category === "lower").map((f) => (
            <MeasurementInput
              key={f.key}
              label={f.label}
              hint={f.hint}
              unit={unit}
              value={fieldValues[f.key] ?? ""}
              onChange={(v) => onFieldChange(f.key, v)}
            />
          ))}
        </div>
      </Section>

      <Section title="Additional">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {STANDARD_FIELDS.filter((f) => f.category === "extra").map((f) => (
            <MeasurementInput
              key={f.key}
              label={f.label}
              hint={f.hint}
              unit={unit}
              value={fieldValues[f.key] ?? ""}
              onChange={(v) => onFieldChange(f.key, v)}
            />
          ))}
        </div>
      </Section>

      <InfoBox />

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
        ) : (
          <>
            <Save size={14} /> Save Profile
          </>
        )}
      </button>
    </form>
  );
}

// ── Existing Profile Form ──────────────────────────────────────────────────────

function ExistingProfileForm({
  profile,
  unit,
  saving,
  onUnitChange,
  onSave,
  onDelete,
}: {
  profile: import("@/lib/api.ts").ApiMeasurementProfile;
  unit: Unit;
  saving: boolean;
  onUnitChange: (u: Unit) => void;
  onSave: (id: string, fields: MeasurementField[]) => void;
  onDelete: (id: string) => void;
}) {
  // Build display state from stored cm values
  const initDisplayValues = useCallback(() => {
    const m: Record<string, string> = {};
    for (const f of profile.measurements) {
      m[f.key] = displayValue(f.value, unit);
    }
    return m;
  }, [profile, unit]);

  const [displayValues, setDisplayValues] =
    useState<Record<string, string>>(initDisplayValues);

  // Recompute display values when unit changes
  const handleUnitChange = (u: Unit) => {
    onUnitChange(u);
    const m: Record<string, string> = {};
    for (const f of profile.measurements) {
      m[f.key] = displayValue(f.value, u);
    }
    setDisplayValues(m);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // Merge: known standard fields + any custom fields on the profile
    const allKeys = [
      ...STANDARD_FIELDS.map((f) => f.key),
      ...profile.measurements
        .map((f) => f.key)
        .filter((k) => !STANDARD_FIELDS.some((sf) => sf.key === k)),
    ];

    const fields: MeasurementField[] = allKeys
      .map((key) => {
        const existing = profile.measurements.find((f) => f.key === key);
        const displayVal = displayValues[key] ?? "";
        const cmValue = toStoredCm(displayVal, unit);
        if (cmValue <= 0) return null;
        return {
          key,
          label:
            existing?.label ??
            STANDARD_FIELDS.find((f) => f.key === key)?.label ??
            key,
          value: cmValue,
        };
      })
      .filter((f): f is MeasurementField => f !== null);

    onSave(profile._id, fields);
  };

  return (
    <form onSubmit={handleSave} className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-2xl font-light"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {profile.garmentLabel ?? profile.garmentType}
          </h2>
          {profile.notes && (
            <p
              className="text-xs text-muted-foreground mt-1"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {profile.notes}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDelete(profile._id)}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer border border-border hover:border-destructive px-3 py-2"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          <Trash2 size={12} /> Delete
        </button>
      </div>

      <UnitToggle unit={unit} onUnitChange={handleUnitChange} />

      {/* Render all fields: standard ones first, then any custom ones */}
      {["upper", "lower", "extra"].map((cat) => {
        const fields = STANDARD_FIELDS.filter((f) => f.category === cat);
        if (fields.length === 0) return null;
        return (
          <Section
            key={cat}
            title={
              cat === "upper"
                ? "Upper Body"
                : cat === "lower"
                  ? "Lower Body"
                  : "Additional"
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {fields.map((f) => (
                <MeasurementInput
                  key={f.key}
                  label={f.label}
                  hint={f.hint}
                  unit={unit}
                  value={displayValues[f.key] ?? ""}
                  onChange={(v) =>
                    setDisplayValues((prev) => ({ ...prev, [f.key]: v }))
                  }
                />
              ))}
            </div>
          </Section>
        );
      })}

      {/* Custom fields not in the standard set */}
      {profile.measurements.filter(
        (f) => !STANDARD_FIELDS.some((sf) => sf.key === f.key),
      ).length > 0 && (
        <Section title="Custom Fields">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {profile.measurements
              .filter((f) => !STANDARD_FIELDS.some((sf) => sf.key === f.key))
              .map((f) => (
                <MeasurementInput
                  key={f.key}
                  label={f.label}
                  hint={f.key}
                  unit={unit}
                  value={displayValues[f.key] ?? ""}
                  onChange={(v) =>
                    setDisplayValues((prev) => ({ ...prev, [f.key]: v }))
                  }
                />
              ))}
          </div>
        </Section>
      )}

      <InfoBox />

      <div className="flex gap-3">
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
          ) : (
            <>
              <Save size={14} /> Save Changes
            </>
          )}
        </button>
      </div>
    </form>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-6 h-[1px] bg-primary" />
        <h2
          className="text-xs tracking-[0.3em] uppercase text-primary font-semibold"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {title}
        </h2>
      </div>
      {children}
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

function UnitToggle({
  unit,
  onUnitChange,
}: {
  unit: Unit;
  onUnitChange: (u: Unit) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        Unit:
      </span>
      {(["cm", "inches"] as const).map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onUnitChange(u)}
          className={`px-4 py-1.5 text-xs tracking-wide border transition-all cursor-pointer ${unit === u ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/40"}`}
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {u}
        </button>
      ))}
    </div>
  );
}

function MeasurementInput({
  label,
  hint,
  unit,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  unit: Unit;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label
        className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          type="number"
          min={0}
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={unit === "cm" ? "e.g. 90" : "e.g. 35"}
          className="checkout-input pr-14"
        />
        <span
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {unit}
        </span>
      </div>
      <p
        className="text-[9px] text-muted-foreground mt-1"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {hint}
      </p>
    </div>
  );
}

function InfoBox() {
  return (
    <div className="bg-muted/40 border border-border px-5 py-4 flex items-start gap-3">
      <div className="w-2 h-2 bg-primary mt-1 shrink-0" />
      <p
        className="text-xs text-muted-foreground leading-relaxed"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        Measurements are saved to your account and reused across custom orders.
        Our team verifies all measurements before cutting begins. Values must be
        between 1 and 400 cm.
      </p>
    </div>
  );
}
