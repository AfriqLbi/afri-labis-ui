import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  ArrowLeft,
  Upload,
  ChevronDown,
  MessageCircle,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth.ts";
import {
  customOrders as customOrdersApi,
  type MeasurementField,
  ApiError,
} from "@/lib/api.ts";
import { useMeasurementProfiles } from "@/hooks/use-api.ts";
import Header from "../_components/Header.tsx";
import Footer from "../_components/Footer.tsx";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner.tsx";

/* ── Constants ────────────────────────────────────────────────────────────── */

const GARMENT_TYPES = [
  "Ankara Dress",
  "Agbada Set",
  "Aso-Oke Outfit",
  "Danshiki",
  "Kaftan",
  "Blazer / Jacket",
  "Skirt & Blouse",
  "Jumpsuit",
  "Wedding / Bridal",
  "Cargo Pants",
  "Office Pants",
  "Aso Oke Gown",
  "Other",
];

const FABRIC_OPTIONS = [
  { id: "ankara", label: "Ankara", desc: "Bold, machine-printed cotton" },
  { id: "aso-oke", label: "Aso-Oke", desc: "Hand-woven ceremonial fabric" },
  { id: "adire", label: "Adire", desc: "Traditional Nigerian tie-dye" },
  { id: "kente", label: "Kente", desc: "Woven silk & cotton strips" },
  {
    id: "guinea-brocade",
    label: "Guinea Brocade",
    desc: "Embossed woven fabric",
  },
  { id: "lace", label: "French / George Lace", desc: "Premium occasion lace" },
  { id: "velvet", label: "Velvet", desc: "Luxe textured finish" },
  { id: "other", label: "Other / Undecided", desc: "Tell us in the notes" },
];

const COLORS = [
  "Black",
  "White",
  "Gold / Yellow",
  "Red",
  "Royal Blue",
  "Emerald Green",
  "Burgundy",
  "Purple",
  "Orange",
  "Pink",
  "Navy",
  "Brown",
  "Multi-colour",
  "Custom (describe below)",
];

const TIMELINES = [
  { id: "standard", label: "Standard", sub: "3–4 weeks" },
  { id: "express", label: "Express", sub: "1–2 weeks (+30%)" },
  { id: "rush", label: "Rush", sub: "Under 7 days (+60%)" },
];

const MEASUREMENT_FIELDS: { key: string; label: string; hint: string }[] = [
  { key: "bust", label: "Bust / Chest", hint: "Fullest part of chest" },
  { key: "waist", label: "Waist", hint: "Narrowest part of torso" },
  { key: "hips", label: "Hips", hint: "Widest part of hips" },
  { key: "length", label: "Garment Length", hint: "Shoulder to desired hem" },
  {
    key: "shoulder",
    label: "Shoulder Width",
    hint: "Tip to tip across shoulders",
  },
  { key: "sleeve", label: "Sleeve Length", hint: "Shoulder tip to wrist" },
];

/* ── Step types ───────────────────────────────────────────────────────────── */

type DesignStep = {
  garmentType: string;
  referenceUrl: string;
  colorPreference: string;
  occasion: string;
};

type FabricStep = {
  fabric: string;
  budgetMin: string;
  budgetMax: string;
  timeline: string;
};

type MeasurementsStep = {
  savedProfileId: string; // "" = use inline
  bust: string;
  waist: string;
  hips: string;
  length: string;
  shoulder: string;
  sleeve: string;
  unit: "cm" | "inches";
};

type ContactStep = {
  name: string;
  email: string;
  phone: string;
  notes: string;
};

const STEPS = [
  { id: "design", label: "Design" },
  { id: "fabric", label: "Fabric" },
  { id: "measurements", label: "Measurements" },
  { id: "contact", label: "Contact" },
] as const;

type StepId = (typeof STEPS)[number]["id"];

/* ── Main Component ───────────────────────────────────────────────────────── */

export default function CustomOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [step, setStep] = useState<StepId>("design");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRef, setSubmittedRef] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);

  // Pre-fill garment type from query param (e.g. from product detail page)
  const presetGarment = searchParams.get("garment") ?? "";

  const [design, setDesign] = useState<DesignStep>({
    garmentType: presetGarment,
    referenceUrl: "",
    colorPreference: "",
    occasion: "",
  });
  const [fabric, setFabric] = useState<FabricStep>({
    fabric: "",
    budgetMin: "",
    budgetMax: "",
    timeline: "standard",
  });
  const [measurements, setMeasurements] = useState<MeasurementsStep>({
    savedProfileId: "",
    bust: "",
    waist: "",
    hips: "",
    length: "",
    shoulder: "",
    sleeve: "",
    unit: "cm",
  });
  const [contact, setContact] = useState<ContactStep>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    notes: "",
  });

  // Keep contact in sync if user signs in mid-flow
  useEffect(() => {
    if (user) {
      setContact((c) => ({
        ...c,
        name: c.name || user.name,
        email: c.email || user.email,
        phone: c.phone || user.phone || "",
      }));
    }
  }, [user]);

  const currentIdx = STEPS.findIndex((s) => s.id === step);
  const goNext = () => {
    const n = STEPS[currentIdx + 1];
    if (n) setStep(n.id);
  };
  const goBack = () => {
    const p = STEPS[currentIdx - 1];
    if (p) setStep(p.id);
    else navigate(-1);
  };

  /* ── Submit ──────────────────────────────────────────────────────────────── */

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Build inline measurements (if not using a saved profile)
      const inlineFields: MeasurementField[] = [];
      if (!measurements.savedProfileId) {
        const entries = [
          { key: "bust", label: "Bust / Chest", value: measurements.bust },
          { key: "waist", label: "Waist", value: measurements.waist },
          { key: "hips", label: "Hips", value: measurements.hips },
          {
            key: "length",
            label: "Garment Length",
            value: measurements.length,
          },
          {
            key: "shoulder",
            label: "Shoulder Width",
            value: measurements.shoulder,
          },
          { key: "sleeve", label: "Sleeve Length", value: measurements.sleeve },
        ];
        for (const e of entries) {
          const num = parseFloat(e.value);
          if (!isNaN(num) && num > 0) {
            // Convert inches → cm if needed
            inlineFields.push({
              key: e.key,
              label: e.label,
              value:
                measurements.unit === "inches"
                  ? Math.round(num * 2.54 * 10) / 10
                  : num,
            });
          }
        }
      }

      const hasMeasurements =
        measurements.savedProfileId || inlineFields.length > 0;

      const fabricLabel =
        FABRIC_OPTIONS.find((f) => f.id === fabric.fabric)?.label ??
        fabric.fabric;

      // Build description that captures the full design brief
      const descParts = [
        `Garment: ${design.garmentType}`,
        design.occasion ? `Occasion: ${design.occasion}` : null,
        design.colorPreference ? `Colour: ${design.colorPreference}` : null,
        fabric.budgetMin || fabric.budgetMax
          ? `Budget: ₦${fabric.budgetMin || "?"}–₦${fabric.budgetMax || "?"}`
          : null,
        `Timeline: ${TIMELINES.find((t) => t.id === fabric.timeline)?.label ?? fabric.timeline}`,
        contact.notes ? `Notes: ${contact.notes}` : null,
      ].filter(Boolean);

      const result = await customOrdersApi.submit({
        customerName: user ? undefined : contact.name,
        customerEmail: user ? undefined : contact.email,
        customerPhone: contact.phone || undefined,
        description: descParts.join(" | "),
        garmentCategory: design.garmentType,
        fabricChoice: fabricLabel || undefined,
        referenceImages: design.referenceUrl ? [design.referenceUrl] : [],
        measurement: hasMeasurements
          ? {
              profileId: measurements.savedProfileId || undefined,
              garmentType: design.garmentType
                .toLowerCase()
                .replace(/\s+/g, "-"),
              garmentLabel: design.garmentType,
              measurements: measurements.savedProfileId
                ? undefined
                : inlineFields,
            }
          : undefined,
      });

      setSubmittedRef(result.referenceNumber);
      setWhatsappLink(result.whatsappLink);
      setDone(true);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Could not submit your request. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Confirmation ──────────────────────────────────────────────────────── */

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Confirmation
          contact={contact}
          referenceNumber={submittedRef}
          whatsappLink={whatsappLink}
          onContinue={() => navigate("/shop")}
        />
      </div>
    );
  }

  /* ── Layout ────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="pt-[65px]">
        {/* Hero bar */}
        <div className="border-b border-border bg-card">
          <div className="max-w-5xl mx-auto px-6 py-10">
            <p
              className="text-[10px] tracking-[0.3em] uppercase text-primary mb-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Bespoke Service
            </p>
            <h1
              className="text-4xl md:text-5xl font-light text-foreground"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Request a Custom Order
            </h1>
            <p
              className="text-muted-foreground mt-3 text-lg font-light max-w-xl"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Tell us your vision — fabric, fit, occasion — and our artisans
              will craft it precisely for you.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid lg:grid-cols-[280px_1fr] gap-12">
            {/* Sidebar */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-1">
                {STEPS.map((s, i) => {
                  const isComplete = i < currentIdx;
                  const isActive = s.id === step;
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        if (isComplete) setStep(s.id);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-4 text-left transition-all cursor-pointer ${
                        isActive
                          ? "bg-primary/10 border-l-2 border-primary"
                          : isComplete
                            ? "hover:bg-muted/60 border-l-2 border-primary/30"
                            : "border-l-2 border-border opacity-40"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 flex items-center justify-center text-[10px] font-bold shrink-0 ${isComplete || isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        {isComplete ? <Check size={10} /> : i + 1}
                      </div>
                      <span
                        className={`text-xs tracking-[0.2em] uppercase ${isActive ? "text-foreground" : "text-muted-foreground"}`}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {s.label}
                      </span>
                    </button>
                  );
                })}
                <div className="pt-8 px-4">
                  <p
                    className="text-xs text-muted-foreground leading-relaxed"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    All custom orders are reviewed within 24 hours. We will
                    contact you with a quote before any payment is taken.
                  </p>
                </div>
              </div>
            </aside>

            {/* Mobile step bar */}
            <div className="flex items-center gap-2 lg:hidden mb-2 col-span-full">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 flex items-center justify-center text-[9px] font-bold ${i < currentIdx || s.id === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                  >
                    {i < currentIdx ? <Check size={8} /> : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-[1px] w-6 ${i < currentIdx ? "bg-primary" : "bg-border"}`}
                    />
                  )}
                </div>
              ))}
              <span
                className="ml-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {STEPS[currentIdx].label}
              </span>
            </div>

            {/* Form area */}
            <div>
              <AnimatePresence mode="wait">
                {step === "design" && (
                  <StepPanel key="design">
                    <DesignForm
                      data={design}
                      onChange={setDesign}
                      onNext={goNext}
                      onBack={goBack}
                    />
                  </StepPanel>
                )}
                {step === "fabric" && (
                  <StepPanel key="fabric">
                    <FabricForm
                      data={fabric}
                      onChange={setFabric}
                      onNext={goNext}
                      onBack={goBack}
                    />
                  </StepPanel>
                )}
                {step === "measurements" && (
                  <StepPanel key="measurements">
                    <MeasurementsForm
                      data={measurements}
                      onChange={setMeasurements}
                      onNext={goNext}
                      onBack={goBack}
                      userId={user?.id}
                    />
                  </StepPanel>
                )}
                {step === "contact" && (
                  <StepPanel key="contact">
                    <ContactForm
                      data={contact}
                      onChange={setContact}
                      onSubmit={handleSubmit}
                      onBack={goBack}
                      submitting={submitting}
                      isAuthenticated={!!user}
                    />
                  </StepPanel>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

/* ── Step 1: Design ───────────────────────────────────────────────────────── */

function DesignForm({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: DesignStep;
  onChange: (d: DesignStep) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      className="space-y-8"
    >
      <StepTitle>Your Design</StepTitle>
      <Field label="Garment Type" required>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {GARMENT_TYPES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ ...data, garmentType: g })}
              className={`px-3 py-3 text-xs tracking-wide border transition-all cursor-pointer text-left ${data.garmentType === g ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"}`}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {g}
            </button>
          ))}
        </div>
        <input
          required
          tabIndex={-1}
          value={data.garmentType}
          onChange={() => {}}
          className="opacity-0 h-0 w-0 absolute"
        />
      </Field>
      <Field label="Design Reference (Image URL or Pinterest link)">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted border border-border flex items-center justify-center shrink-0">
            <Upload size={14} className="text-muted-foreground" />
          </div>
          <input
            type="url"
            value={data.referenceUrl}
            onChange={(e) =>
              onChange({ ...data, referenceUrl: e.target.value })
            }
            placeholder="https://www.pinterest.com/pin/..."
            className="checkout-input"
          />
        </div>
        <p
          className="text-[10px] text-muted-foreground mt-1.5"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Share a link to a photo that inspires the look you want.
        </p>
      </Field>
      <Field label="Colour Preference" required>
        <div className="relative">
          <select
            required
            value={data.colorPreference}
            onChange={(e) =>
              onChange({ ...data, colorPreference: e.target.value })
            }
            className="checkout-input appearance-none pr-10"
          >
            <option value="" disabled>
              Select a colour…
            </option>
            {COLORS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      </Field>
      <Field label="Occasion">
        <input
          value={data.occasion}
          onChange={(e) => onChange({ ...data, occasion: e.target.value })}
          placeholder="e.g. Wedding, Birthday, Corporate Event…"
          className="checkout-input"
        />
      </Field>
      <StepNav onBack={onBack} nextLabel="Continue to Fabric" />
    </form>
  );
}

/* ── Step 2: Fabric ───────────────────────────────────────────────────────── */

function FabricForm({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: FabricStep;
  onChange: (d: FabricStep) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      className="space-y-8"
    >
      <StepTitle>Fabric &amp; Budget</StepTitle>
      <Field label="Fabric Choice" required>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {FABRIC_OPTIONS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange({ ...data, fabric: f.id })}
              className={`px-4 py-3.5 border transition-all cursor-pointer text-left flex items-start gap-3 ${data.fabric === f.id ? "border-primary bg-primary/10" : "border-border hover:border-foreground/40"}`}
            >
              <div
                className={`w-3 h-3 border mt-0.5 shrink-0 flex items-center justify-center ${data.fabric === f.id ? "border-primary" : "border-muted-foreground"}`}
              >
                {data.fabric === f.id && (
                  <div className="w-1.5 h-1.5 bg-primary" />
                )}
              </div>
              <div>
                <p
                  className="text-xs font-medium text-foreground"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {f.label}
                </p>
                <p
                  className="text-[10px] text-muted-foreground mt-0.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {f.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
        <input
          required
          tabIndex={-1}
          value={data.fabric}
          onChange={() => {}}
          className="opacity-0 h-0 w-0 absolute"
        />
      </Field>
      <Field label="Budget Range (₦)">
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: "budgetMin" as const, label: "Minimum", ph: "50000" },
            { key: "budgetMax" as const, label: "Maximum", ph: "150000" },
          ].map(({ key, label, ph }) => (
            <div key={key}>
              <label
                className="block text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {label}
              </label>
              <input
                type="number"
                min={0}
                value={data[key]}
                onChange={(e) => onChange({ ...data, [key]: e.target.value })}
                placeholder={ph}
                className="checkout-input"
              />
            </div>
          ))}
        </div>
      </Field>
      <Field label="Production Timeline" required>
        <div className="space-y-2">
          {TIMELINES.map((t) => (
            <label
              key={t.id}
              className={`flex items-center justify-between px-4 py-4 border cursor-pointer transition-all ${data.timeline === t.id ? "border-primary bg-primary/5" : "border-border hover:border-foreground/40"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-4 h-4 border flex items-center justify-center ${data.timeline === t.id ? "border-primary" : "border-border"}`}
                >
                  {data.timeline === t.id && (
                    <div className="w-2 h-2 bg-primary" />
                  )}
                </div>
                <span
                  className="text-xs font-medium text-foreground"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {t.label}
                </span>
              </div>
              <span
                className="text-xs text-muted-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {t.sub}
              </span>
              <input
                type="radio"
                className="hidden"
                checked={data.timeline === t.id}
                onChange={() => onChange({ ...data, timeline: t.id })}
              />
            </label>
          ))}
        </div>
      </Field>
      <StepNav onBack={onBack} nextLabel="Continue to Measurements" />
    </form>
  );
}

/* ── Step 3: Measurements ─────────────────────────────────────────────────── */

function MeasurementsForm({
  data,
  onChange,
  onNext,
  onBack,
  userId,
}: {
  data: MeasurementsStep;
  onChange: (d: MeasurementsStep) => void;
  onNext: () => void;
  onBack: () => void;
  userId?: string;
}) {
  // Load saved profiles for authenticated users
  const { data: profiles, isLoading: profilesLoading } =
    useMeasurementProfiles();
  const hasSavedProfiles = !!userId && (profiles?.length ?? 0) > 0;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
      className="space-y-8"
    >
      <StepTitle>Your Measurements</StepTitle>
      <div className="bg-muted/40 border border-border px-4 py-3 flex items-start gap-3">
        <div className="w-2 h-2 bg-primary mt-1 shrink-0" />
        <p
          className="text-xs text-muted-foreground leading-relaxed"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Not sure how to measure? Our team will guide you via WhatsApp after
          your request is received. You can skip fields you don't know — all
          measurements are verified before production begins.
        </p>
      </div>

      {/* Saved profiles selector */}
      {userId && (
        <div>
          <p
            className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Use a Saved Profile
          </p>
          {profilesLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Spinner className="size-4" /> Loading saved profiles…
            </div>
          ) : hasSavedProfiles ? (
            <div className="space-y-2">
              {[
                {
                  _id: "",
                  garmentLabel: "Enter measurements below",
                  garmentType: "",
                },
                ...(profiles ?? []),
              ].map((p) => (
                <label
                  key={p._id}
                  className={`flex items-center gap-4 px-4 py-3 border cursor-pointer transition-all ${data.savedProfileId === p._id ? "border-primary bg-primary/5" : "border-border hover:border-foreground/40"}`}
                >
                  <div
                    className={`w-4 h-4 border flex items-center justify-center shrink-0 ${data.savedProfileId === p._id ? "border-primary" : "border-border"}`}
                  >
                    {data.savedProfileId === p._id && (
                      <div className="w-2 h-2 bg-primary" />
                    )}
                  </div>
                  <div>
                    <p
                      className="text-xs text-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {p._id === ""
                        ? "Enter measurements below"
                        : (p.garmentLabel ?? p.garmentType)}
                    </p>
                    {p._id !== "" && (
                      <p
                        className="text-[10px] text-muted-foreground"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {(p as any).measurements?.length ?? 0} fields saved
                      </p>
                    )}
                  </div>
                  <input
                    type="radio"
                    className="hidden"
                    checked={data.savedProfileId === p._id}
                    onChange={() =>
                      onChange({ ...data, savedProfileId: p._id })
                    }
                  />
                </label>
              ))}
            </div>
          ) : (
            <p
              className="text-xs text-muted-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              No saved profiles yet.{" "}
              <Link
                to="/measurements"
                className="text-primary underline underline-offset-2"
              >
                Save measurements →
              </Link>
            </p>
          )}
        </div>
      )}

      {/* Inline measurement fields (shown when no saved profile selected) */}
      {!data.savedProfileId && (
        <>
          <div className="flex items-center gap-2">
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
                onClick={() => onChange({ ...data, unit: u })}
                className={`px-4 py-1.5 text-xs tracking-wide border transition-all cursor-pointer ${data.unit === u ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-foreground/40"}`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {u}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {MEASUREMENT_FIELDS.map(({ key, label, hint }) => (
              <div key={key}>
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
                    value={data[key as keyof MeasurementsStep] as string}
                    onChange={(e) =>
                      onChange({ ...data, [key]: e.target.value })
                    }
                    placeholder={data.unit === "cm" ? "e.g. 90" : "e.g. 35"}
                    className="checkout-input pr-14"
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {data.unit}
                  </span>
                </div>
                <p
                  className="text-[9px] text-muted-foreground mt-1"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {hint}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
      <StepNav onBack={onBack} nextLabel="Continue to Contact" />
    </form>
  );
}

/* ── Step 4: Contact ──────────────────────────────────────────────────────── */

function ContactForm({
  data,
  onChange,
  onSubmit,
  onBack,
  submitting,
  isAuthenticated,
}: {
  data: ContactStep;
  onChange: (d: ContactStep) => void;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
  isAuthenticated: boolean;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      <StepTitle>Contact Details</StepTitle>
      {isAuthenticated && (
        <div className="bg-primary/5 border border-primary/20 px-4 py-3 flex items-start gap-3">
          <div className="w-2 h-2 bg-primary mt-1 shrink-0" />
          <p
            className="text-xs text-muted-foreground"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Signed in — your email and name are pre-filled. Add a phone number
            so we can reach you on WhatsApp.
          </p>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Full Name" required>
          <input
            required
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="Amara Okafor"
            className="checkout-input"
          />
        </Field>
        <Field label="Phone Number" required>
          <input
            required
            value={data.phone}
            onChange={(e) => onChange({ ...data, phone: e.target.value })}
            placeholder="+234 800 000 0000"
            className="checkout-input"
          />
        </Field>
      </div>
      <Field label="Email Address" required>
        <input
          type="email"
          required
          value={data.email}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          placeholder="amara@email.com"
          className="checkout-input"
        />
      </Field>
      <Field label="Additional Notes">
        <textarea
          rows={5}
          value={data.notes}
          onChange={(e) => onChange({ ...data, notes: e.target.value })}
          placeholder="Any extra details about your vision, deadline, or special requirements…"
          className="checkout-input resize-none"
        />
      </Field>
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 border border-border text-muted-foreground py-3.5 text-xs tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors cursor-pointer"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-[2] bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {submitting ? (
            <>
              <Spinner className="size-4" /> Submitting…
            </>
          ) : (
            "Submit Custom Order Request"
          )}
        </button>
      </div>
    </form>
  );
}

/* ── Confirmation ─────────────────────────────────────────────────────────── */

function Confirmation({
  contact,
  referenceNumber,
  whatsappLink,
  onContinue,
}: {
  contact: ContactStep;
  referenceNumber: string | null;
  whatsappLink: string | null;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" as const }}
      className="min-h-[80vh] flex items-center justify-center px-6 py-24"
    >
      <div className="max-w-lg text-center">
        <div className="w-16 h-16 bg-primary flex items-center justify-center mx-auto mb-8">
          <Check size={24} className="text-primary-foreground" />
        </div>
        <p
          className="text-xs tracking-[0.3em] uppercase text-primary mb-4"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Request Received
        </p>
        <h1
          className="text-5xl font-light text-foreground mb-6"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          {contact.name
            ? `Thank you, ${contact.name.split(" ")[0]}!`
            : "Request Received!"}
        </h1>
        <p
          className="text-muted-foreground text-lg font-light leading-relaxed mb-4"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Our team will review your request and get back to you within 24 hours
          with a personalised quote and timeline.
        </p>
        {referenceNumber && (
          <p
            className="text-xs tracking-wide text-muted-foreground mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Reference:{" "}
            <span className="text-primary font-semibold">
              {referenceNumber}
            </span>
          </p>
        )}
        {contact.phone && (
          <p
            className="text-xs tracking-wide text-muted-foreground mb-2"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            We will reach you on{" "}
            <span className="text-primary">{contact.phone}</span>
          </p>
        )}
        {contact.email && (
          <p
            className="text-xs tracking-wide text-muted-foreground mb-10"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Confirmation sent to{" "}
            <span className="text-primary">{contact.email}</span>
          </p>
        )}
        <div className="w-12 h-[1px] bg-primary mx-auto mb-10" />
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-[#25D366] text-[#25D366] px-8 py-4 text-xs tracking-[0.2em] uppercase hover:bg-[#25D366]/10 transition-colors cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              <MessageCircle size={13} /> Chat on WhatsApp
            </a>
          )}
          <button
            onClick={onContinue}
            className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-10 py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Browse the Collection
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Shared primitives ────────────────────────────────────────────────────── */

function StepPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: "easeOut" as const }}
    >
      {children}
    </motion.div>
  );
}

function StepTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-3xl font-light text-foreground mb-2"
      style={{ fontFamily: "'Cormorant Garamond', serif" }}
    >
      {children}
    </h2>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

function StepNav({
  onBack,
  nextLabel,
}: {
  onBack: () => void;
  nextLabel: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onBack}
        className="flex-1 border border-border text-muted-foreground py-3.5 text-xs tracking-[0.15em] uppercase hover:text-foreground hover:border-foreground transition-colors cursor-pointer flex items-center justify-center gap-2"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        <ArrowLeft size={12} /> Back
      </button>
      <button
        type="submit"
        className="flex-[2] bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {nextLabel}
      </button>
    </div>
  );
}
