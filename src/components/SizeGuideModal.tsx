import { useState } from "react";
import { X, Ruler } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type SizeUnit = "cm" | "inches";
type SizeChart = "women" | "men" | "children" | "accessories";
type SizeSystem = "int" | "uk" | "us" | "eu" | "fr";

// ── Size data ──────────────────────────────────────────────────────────────────
// Each row: body measurements in [cm, inches], plus size labels per system.

type SizeRow = {
  labels: Record<SizeSystem, string>;
  bust: [number, number];
  waist: [number, number];
  hips: [number, number];
  length?: [number, number];
};

const WOMEN_SIZES: SizeRow[] = [
  {
    labels: { int: "XS", uk: "6", us: "2", eu: "34", fr: "36" },
    bust: [76, 30],
    waist: [61, 24],
    hips: [84, 33],
    length: [120, 47],
  },
  {
    labels: { int: "S", uk: "8", us: "4", eu: "36", fr: "38" },
    bust: [81, 32],
    waist: [66, 26],
    hips: [89, 35],
    length: [122, 48],
  },
  {
    labels: { int: "M", uk: "10", us: "6", eu: "38", fr: "40" },
    bust: [86, 34],
    waist: [71, 28],
    hips: [94, 37],
    length: [124, 49],
  },
  {
    labels: { int: "L", uk: "12", us: "8", eu: "40", fr: "42" },
    bust: [91, 36],
    waist: [76, 30],
    hips: [99, 39],
    length: [126, 50],
  },
  {
    labels: { int: "XL", uk: "14", us: "10", eu: "42", fr: "44" },
    bust: [97, 38],
    waist: [81, 32],
    hips: [104, 41],
    length: [128, 50],
  },
  {
    labels: { int: "XXL", uk: "16", us: "12", eu: "44", fr: "46" },
    bust: [102, 40],
    waist: [86, 34],
    hips: [109, 43],
    length: [130, 51],
  },
  {
    labels: { int: "3XL", uk: "18", us: "14", eu: "46", fr: "48" },
    bust: [107, 42],
    waist: [91, 36],
    hips: [114, 45],
    length: [132, 52],
  },
];

const MEN_SIZES: SizeRow[] = [
  {
    labels: { int: "XS", uk: "34", us: "XS", eu: "44", fr: "44" },
    bust: [86, 34],
    waist: [71, 28],
    hips: [86, 34],
    length: [100, 39],
  },
  {
    labels: { int: "S", uk: "36", us: "S", eu: "46", fr: "46" },
    bust: [91, 36],
    waist: [76, 30],
    hips: [91, 36],
    length: [103, 40],
  },
  {
    labels: { int: "M", uk: "38", us: "M", eu: "48", fr: "48" },
    bust: [97, 38],
    waist: [81, 32],
    hips: [97, 38],
    length: [106, 42],
  },
  {
    labels: { int: "L", uk: "40", us: "L", eu: "50", fr: "50" },
    bust: [102, 40],
    waist: [86, 34],
    hips: [102, 40],
    length: [109, 43],
  },
  {
    labels: { int: "XL", uk: "42", us: "XL", eu: "52", fr: "52" },
    bust: [107, 42],
    waist: [91, 36],
    hips: [107, 42],
    length: [112, 44],
  },
  {
    labels: { int: "XXL", uk: "44", us: "2XL", eu: "54", fr: "54" },
    bust: [112, 44],
    waist: [97, 38],
    hips: [112, 44],
    length: [115, 45],
  },
  {
    labels: { int: "3XL", uk: "46", us: "3XL", eu: "56", fr: "56" },
    bust: [117, 46],
    waist: [102, 40],
    hips: [117, 46],
    length: [118, 46],
  },
];

const CHILDREN_SIZES: SizeRow[] = [
  {
    labels: { int: "2–3Y", uk: "2–3Y", us: "2T–3T", eu: "92–98", fr: "2–3" },
    bust: [54, 21],
    waist: [51, 20],
    hips: [57, 22],
    length: [62, 24],
  },
  {
    labels: { int: "4–5Y", uk: "4–5Y", us: "4T–5T", eu: "104–110", fr: "4–5" },
    bust: [58, 23],
    waist: [54, 21],
    hips: [61, 24],
    length: [70, 28],
  },
  {
    labels: { int: "6–7Y", uk: "6–7Y", us: "6–7", eu: "116–122", fr: "6–7" },
    bust: [63, 25],
    waist: [57, 22],
    hips: [66, 26],
    length: [78, 31],
  },
  {
    labels: { int: "8–9Y", uk: "8–9Y", us: "8–9", eu: "128–134", fr: "8–9" },
    bust: [68, 27],
    waist: [61, 24],
    hips: [71, 28],
    length: [86, 34],
  },
  {
    labels: {
      int: "10–11Y",
      uk: "10–11Y",
      us: "10–12",
      eu: "140–146",
      fr: "10–12",
    },
    bust: [74, 29],
    waist: [65, 26],
    hips: [77, 30],
    length: [94, 37],
  },
  {
    labels: { int: "12–13Y", uk: "12–13Y", us: "14", eu: "152–158", fr: "14" },
    bust: [80, 31],
    waist: [68, 27],
    hips: [83, 33],
    length: [102, 40],
  },
];

const ACCESSORIES_SIZES: SizeRow[] = [
  {
    labels: { int: "XS/S", uk: "6–8", us: "2–4", eu: "34–36", fr: "36–38" },
    bust: [76, 30],
    waist: [61, 24],
    hips: [84, 33],
  },
  {
    labels: { int: "M/L", uk: "10–12", us: "6–8", eu: "38–40", fr: "40–42" },
    bust: [89, 35],
    waist: [74, 29],
    hips: [97, 38],
  },
  {
    labels: {
      int: "XL/XXL",
      uk: "14–16",
      us: "10–12",
      eu: "42–44",
      fr: "44–46",
    },
    bust: [102, 40],
    waist: [86, 34],
    hips: [109, 43],
  },
];

const CHART_DATA: Record<SizeChart, SizeRow[]> = {
  women: WOMEN_SIZES,
  men: MEN_SIZES,
  children: CHILDREN_SIZES,
  accessories: ACCESSORIES_SIZES,
};

const CHART_LABEL: Record<SizeChart, string> = {
  women: "Women",
  men: "Men",
  children: "Children",
  accessories: "Accessories",
};

const SIZE_SYSTEMS: { id: SizeSystem; label: string }[] = [
  { id: "int", label: "INT" },
  { id: "uk", label: "UK" },
  { id: "us", label: "US" },
  { id: "eu", label: "EU" },
  { id: "fr", label: "FR" },
];

// ── Slug → chart mapping ───────────────────────────────────────────────────────

const MEN_SLUGS = new Set([
  "men",
  "cargo-pants",
  "office-pants",
  "straight-pants",
  "danshiki",
  "ayinde-aso-oke-padded-jacket",
  "aso-oke-jacket",
  "aso-oke-trench-coat",
  "aso-oke-hoodie-both-side",
  "aso-oke-padded-jacket-double-side",
]);
const WOMEN_SLUGS = new Set([
  "women",
  "crop-top-jacket-ladies",
  "aso-oke-gown",
]);
const CHILDREN_SLUGS = new Set(["children"]);
const ACCESSORIES_SLUGS = new Set([
  "accessories",
  "aso-oke-material",
  "bridal",
  "aso-ebi",
  "new-arrivals",
]);

function slugToChart(slug: string): SizeChart {
  if (MEN_SLUGS.has(slug)) return "men";
  if (WOMEN_SLUGS.has(slug)) return "women";
  if (CHILDREN_SLUGS.has(slug)) return "children";
  if (ACCESSORIES_SLUGS.has(slug)) return "accessories";
  return "women";
}

// ── How to measure ─────────────────────────────────────────────────────────────

const HOW_TO_MEASURE = [
  {
    label: "Bust / Chest",
    desc: "Measure around the fullest part of your chest, keeping the tape parallel to the floor.",
  },
  {
    label: "Waist",
    desc: "Measure around your natural waistline — the narrowest part of your torso.",
  },
  {
    label: "Hips",
    desc: "Measure around the fullest part of your hips, about 20 cm below your waist.",
  },
  {
    label: "Garment Length",
    desc: "Measured from the highest point of your shoulder to the desired hem.",
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────

type Props = {
  open: boolean;
  onClose: () => void;
  /** Labi category slug OR legacy chart name */
  category?: string;
};

export default function SizeGuideModal({
  open,
  onClose,
  category = "women",
}: Props) {
  const [unit, setUnit] = useState<SizeUnit>("cm");
  const [sizeSystem, setSys] = useState<SizeSystem>("int");
  const [tab, setTab] = useState<"chart" | "how-to">("chart");

  const chart = slugToChart(category);
  const rows = CHART_DATA[chart];
  const hasLen = rows.some((r) => r.length != null);

  const col = (val: [number, number]) => (unit === "cm" ? val[0] : val[1]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 z-[60]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: "easeOut" as const }}
            className="fixed bottom-0 left-0 right-0 md:inset-0 md:flex md:items-center md:justify-center z-[61] pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full md:max-w-2xl md:mx-4 bg-card border border-border max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-card z-10">
                <div className="flex items-center gap-3">
                  <Ruler size={16} className="text-primary" />
                  <p
                    className="text-xs tracking-[0.25em] uppercase text-foreground font-semibold"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Size Guide
                    <span className="ml-2 text-muted-foreground font-normal capitalize">
                      — {CHART_LABEL[chart]}
                    </span>
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-6 py-6">
                {/* Tabs */}
                <div className="flex gap-0 mb-6 border-b border-border">
                  {(["chart", "how-to"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`px-5 py-2.5 text-[10px] tracking-[0.2em] uppercase transition-all cursor-pointer ${
                        tab === t
                          ? "border-b-2 border-primary text-foreground -mb-px"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {t === "chart" ? "Size Chart" : "How to Measure"}
                    </button>
                  ))}
                </div>

                {tab === "chart" && (
                  <>
                    {/* Controls row: unit + size system */}
                    <div className="flex flex-wrap items-center gap-4 mb-5">
                      {/* Unit toggle */}
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          Unit:
                        </span>
                        {(["cm", "inches"] as const).map((u) => (
                          <button
                            key={u}
                            onClick={() => setUnit(u)}
                            className={`px-3 py-1.5 text-xs tracking-wide border transition-all cursor-pointer ${
                              unit === u
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:border-foreground/40"
                            }`}
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {u}
                          </button>
                        ))}
                      </div>

                      {/* Size system toggle */}
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          Region:
                        </span>
                        {SIZE_SYSTEMS.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setSys(s.id)}
                            className={`px-3 py-1.5 text-xs tracking-wide border transition-all cursor-pointer ${
                              sizeSystem === s.id
                                ? "bg-primary text-primary-foreground border-primary"
                                : "border-border text-muted-foreground hover:border-foreground/40"
                            }`}
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table
                        className="w-full text-xs"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        <thead>
                          <tr className="border-b border-border">
                            {[
                              "Size",
                              `Bust${chart === "men" ? " / Chest" : ""}`,
                              "Waist",
                              "Hips",
                              ...(hasLen ? ["Length"] : []),
                            ].map((h) => (
                              <th
                                key={h}
                                className="py-3 px-3 text-left text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-normal whitespace-nowrap"
                              >
                                {h}
                                {h !== "Size" && (
                                  <span className="ml-1 text-[9px] text-muted-foreground/60">
                                    ({unit})
                                  </span>
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((row, i) => (
                            <tr
                              key={i}
                              className={`border-b border-border/50 ${i % 2 === 0 ? "bg-muted/20" : ""}`}
                            >
                              <td className="py-3 px-3 font-semibold text-primary whitespace-nowrap">
                                {row.labels[sizeSystem]}
                                {sizeSystem !== "int" && (
                                  <span className="ml-1.5 text-muted-foreground font-normal">
                                    ({row.labels.int})
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-foreground">
                                {col(row.bust)}
                              </td>
                              <td className="py-3 px-3 text-foreground">
                                {col(row.waist)}
                              </td>
                              <td className="py-3 px-3 text-foreground">
                                {col(row.hips)}
                              </td>
                              {hasLen && (
                                <td className="py-3 px-3 text-foreground">
                                  {row.length ? col(row.length) : "—"}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p
                      className="text-[10px] text-muted-foreground mt-4 leading-relaxed"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      All measurements are body measurements, not garment
                      measurements. If you are between sizes, we recommend
                      sizing up. For a custom fit,{" "}
                      <a
                        href="/custom-order"
                        className="text-primary underline underline-offset-2"
                      >
                        request a custom order
                      </a>
                      .
                    </p>
                  </>
                )}

                {tab === "how-to" && (
                  <div className="space-y-6">
                    <p
                      className="text-base font-light text-muted-foreground leading-relaxed"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      For the most accurate fit, use a flexible tape measure and
                      take measurements over close-fitting clothing or
                      underwear. Have a friend help if possible.
                    </p>
                    <div className="space-y-4">
                      {HOW_TO_MEASURE.map((item, i) => (
                        <div key={item.label} className="flex gap-4">
                          <div
                            className="w-7 h-7 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {i + 1}
                          </div>
                          <div>
                            <p
                              className="text-xs font-semibold text-foreground tracking-wide mb-1"
                              style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              {item.label}
                            </p>
                            <p
                              className="text-sm text-muted-foreground font-light leading-relaxed"
                              style={{
                                fontFamily: "'Cormorant Garamond', serif",
                              }}
                            >
                              {item.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="bg-muted/40 border border-border px-4 py-3 flex gap-3 items-start">
                      <div className="w-2 h-2 bg-primary mt-1 shrink-0" />
                      <p
                        className="text-xs text-muted-foreground leading-relaxed"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        Not sure about your measurements? Save your profile on
                        our{" "}
                        <a
                          href="/measurements"
                          className="text-primary underline underline-offset-2"
                        >
                          Measurements page
                        </a>{" "}
                        and our team will help you find the perfect size.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
