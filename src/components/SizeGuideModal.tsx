import { useState } from "react";
import { X, Ruler } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

type SizeUnit = "cm" | "inches";

type SizeRow = {
  size: string;
  bust: [number, number]; // cm, inches
  waist: [number, number];
  hips: [number, number];
  length?: [number, number]; // garment length
};

const WOMEN_SIZES: SizeRow[] = [
  { size: "XS", bust: [76, 30], waist: [61, 24], hips: [84, 33], length: [120, 47] },
  { size: "S",  bust: [81, 32], waist: [66, 26], hips: [89, 35], length: [122, 48] },
  { size: "M",  bust: [86, 34], waist: [71, 28], hips: [94, 37], length: [124, 49] },
  { size: "L",  bust: [91, 36], waist: [76, 30], hips: [99, 39], length: [126, 50] },
  { size: "XL", bust: [97, 38], waist: [81, 32], hips: [104, 41], length: [128, 50] },
  { size: "XXL", bust: [102, 40], waist: [86, 34], hips: [109, 43], length: [130, 51] },
];

const MEN_SIZES: SizeRow[] = [
  { size: "XS", bust: [86, 34],  waist: [71, 28],  hips: [86, 34],  length: [100, 39] },
  { size: "S",  bust: [91, 36],  waist: [76, 30],  hips: [91, 36],  length: [103, 40] },
  { size: "M",  bust: [97, 38],  waist: [81, 32],  hips: [97, 38],  length: [106, 42] },
  { size: "L",  bust: [102, 40], waist: [86, 34],  hips: [102, 40], length: [109, 43] },
  { size: "XL", bust: [107, 42], waist: [91, 36],  hips: [107, 42], length: [112, 44] },
  { size: "XXL", bust: [112, 44], waist: [97, 38], hips: [112, 44], length: [115, 45] },
];

const ACCESSORIES_SIZES: SizeRow[] = [
  { size: "XS/S",  bust: [76, 30], waist: [61, 24], hips: [84, 33] },
  { size: "M/L",   bust: [89, 35], waist: [74, 29], hips: [97, 38] },
  { size: "XL/XXL", bust: [102, 40], waist: [86, 34], hips: [109, 43] },
];

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
    desc: "Measure around the fullest part of your hips, about 20cm below your waist.",
  },
  {
    label: "Garment Length",
    desc: "Measured from the highest point of your shoulder to the desired hem.",
  },
];

type Props = {
  open: boolean;
  onClose: () => void;
  category?: "women" | "men" | "accessories";
};

export default function SizeGuideModal({ open, onClose, category = "women" }: Props) {
  const [unit, setUnit] = useState<SizeUnit>("cm");
  const [tab, setTab] = useState<"chart" | "how-to">("chart");

  const rows =
    category === "men"
      ? MEN_SIZES
      : category === "accessories"
      ? ACCESSORIES_SIZES
      : WOMEN_SIZES;

  const col = (val: [number, number]) => (unit === "cm" ? val[0] : val[1]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 z-[60]"
            onClick={onClose}
          />

          {/* Panel */}
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
                      — {category}
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
                    {/* Unit toggle */}
                    <div className="flex items-center gap-2 mb-5">
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
                          className={`px-4 py-1.5 text-xs tracking-wide border transition-all cursor-pointer ${
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

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        <thead>
                          <tr className="border-b border-border">
                            {["Size", "Bust", "Waist", "Hips", ...(rows[0].length ? ["Length"] : [])].map((h) => (
                              <th
                                key={h}
                                className="py-3 px-4 text-left text-[10px] tracking-[0.2em] uppercase text-muted-foreground font-normal"
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
                              key={row.size}
                              className={`border-b border-border/50 ${
                                i % 2 === 0 ? "bg-muted/20" : ""
                              }`}
                            >
                              <td className="py-3 px-4 font-semibold text-primary">{row.size}</td>
                              <td className="py-3 px-4 text-foreground">{col(row.bust)}</td>
                              <td className="py-3 px-4 text-foreground">{col(row.waist)}</td>
                              <td className="py-3 px-4 text-foreground">{col(row.hips)}</td>
                              {row.length && (
                                <td className="py-3 px-4 text-foreground">{col(row.length)}</td>
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
                      All measurements are body measurements, not garment measurements. If
                      you are between sizes, we recommend sizing up. For a custom fit,{" "}
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
                      For the most accurate fit, use a flexible tape measure and take
                      measurements over close-fitting clothing or underwear. Have a
                      friend help if possible.
                    </p>
                    <div className="space-y-4">
                      {HOW_TO_MEASURE.map((item, i) => (
                        <div key={item.label} className="flex gap-4">
                          <div className="w-7 h-7 bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary" style={{ fontFamily: "'Montserrat', sans-serif" }}>
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
                              style={{ fontFamily: "'Cormorant Garamond', serif" }}
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
                        Not sure about your measurements? Save your profile on our{" "}
                        <a href="/measurements" className="text-primary underline underline-offset-2">
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
