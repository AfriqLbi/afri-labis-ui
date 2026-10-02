/**
 * ProductFormModal
 * Used for both CREATE and EDIT.
 * Pass `product` to open in edit mode; omit it for create mode.
 */
import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  useAdminCreateProduct,
  useAdminUpdateProduct,
  useAdminCatalogCategories,
} from "@/hooks/use-api.ts";
import type { ApiProduct } from "@/lib/api.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

const TAGS = [
  { id: "new_arrival", label: "New Arrival" },
  { id: "best_seller", label: "Best Seller" },
  { id: "featured",    label: "Featured"    },
  { id: "deal",        label: "Deal"        },
] as const;

const STATUSES = ["draft", "active", "archived"] as const;

type Spec = { label: string; value: string };

interface Props {
  open: boolean;
  onClose: () => void;
  product?: ApiProduct; // undefined → create mode
}

function emptyForm() {
  return {
    sku: "",
    title: "",
    brandId: "",
    categoryId: "",
    price: "",
    compareAtPrice: "",
    stock: "0",
    images: [""],
    description: "",
    specs: [] as Spec[],
    status: "draft" as (typeof STATUSES)[number],
    tags: [] as string[],
  };
}

function productToForm(p: ApiProduct) {
  return {
    sku: p.sku,
    title: p.title,
    brandId: "",          // not returned in response; blank is fine for edit
    categoryId: "",       // same
    price: String(p.price),
    compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
    stock: String(p.stock),
    images: p.images.length ? p.images : [""],
    description: p.description ?? "",
    specs: p.specs as Spec[],
    status: p.status as (typeof STATUSES)[number],
    tags: p.tags ?? [],
  };
}

export default function ProductFormModal({ open, onClose, product }: Props) {
  const isEdit = !!product;
  const [form, setForm] = useState(emptyForm);

  const createMut  = useAdminCreateProduct();
  const updateMut  = useAdminUpdateProduct();
  const { data: categories } = useAdminCatalogCategories();

  const isSaving = createMut.isPending || updateMut.isPending;

  // Populate form whenever the modal opens or product changes
  useEffect(() => {
    if (open) {
      setForm(product ? productToForm(product) : emptyForm());
    }
  }, [open, product]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const set = (field: keyof ReturnType<typeof emptyForm>, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  // ── Image list helpers ──────────────────────────────────────────────────────
  const setImage = (i: number, val: string) =>
    set("images", form.images.map((v, idx) => (idx === i ? val : v)));
  const addImage = () => set("images", [...form.images, ""]);
  const removeImage = (i: number) =>
    set("images", form.images.filter((_, idx) => idx !== i));

  // ── Spec helpers ────────────────────────────────────────────────────────────
  const setSpec = (i: number, key: "label" | "value", val: string) =>
    set("specs", form.specs.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));
  const addSpec = () => set("specs", [...form.specs, { label: "", value: "" }]);
  const removeSpec = (i: number) =>
    set("specs", form.specs.filter((_, idx) => idx !== i));

  // ── Tag toggle ──────────────────────────────────────────────────────────────
  const toggleTag = (tag: string) =>
    set("tags", form.tags.includes(tag)
      ? form.tags.filter((t) => t !== tag)
      : [...form.tags, tag]);

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sku.trim() || !form.title.trim()) {
      toast.error("SKU and title are required");
      return;
    }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) {
      toast.error("Enter a valid price");
      return;
    }

    const dto: Record<string, unknown> = {
      title: form.title.trim(),
      price,
      description: form.description.trim() || undefined,
      images: form.images.filter(Boolean),
      specs: form.specs.filter((s) => s.label && s.value),
      status: form.status,
      tags: form.tags,
      stock: parseInt(form.stock) || 0,
    };

    if (form.compareAtPrice) dto.compareAtPrice = parseFloat(form.compareAtPrice);
    if (form.categoryId)     dto.categoryId     = form.categoryId;

    if (!isEdit) {
      // Create-only fields
      dto.sku      = form.sku.trim();
      dto.brandId  = form.brandId || undefined;
    }

    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: product!._id, dto });
        toast.success("Product updated");
      } else {
        await createMut.mutateAsync(dto);
        toast.success("Product created");
      }
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    }
  };

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
            className="fixed inset-0 bg-black/70 z-50"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 right-0 h-full w-full max-w-2xl bg-card border-l border-border z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-border shrink-0">
              <div>
                <p
                  className="text-[10px] tracking-[0.3em] uppercase text-primary"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {isEdit ? "Edit Product" : "New Product"}
                </p>
                <h2
                  className="text-2xl font-light text-foreground mt-0.5"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {isEdit ? product!.title : "Create a product"}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable body */}
            <form
              onSubmit={handleSubmit}
              id="product-form"
              className="flex-1 overflow-y-auto px-7 py-6 space-y-7"
            >
              {/* ── Core fields ── */}
              <Section title="Core Details">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="SKU *" hint={isEdit ? "Immutable after creation" : undefined}>
                    <input
                      value={form.sku}
                      onChange={(e) => set("sku", e.target.value)}
                      placeholder="LABI-001"
                      required
                      disabled={isEdit}
                      className="checkout-input disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </Field>
                  <Field label="Status">
                    <select
                      value={form.status}
                      onChange={(e) => set("status", e.target.value)}
                      className="checkout-input"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Title *">
                  <input
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Adunola Wrap Dress"
                    required
                    className="checkout-input"
                  />
                </Field>

                {!isEdit && (
                  <Field label="Brand ID" hint="ObjectId from the brands collection">
                    <input
                      value={form.brandId}
                      onChange={(e) => set("brandId", e.target.value)}
                      placeholder="64a1f2c8e3b7a900120d5678"
                      className="checkout-input font-mono text-xs"
                    />
                  </Field>
                )}

                <Field label="Category">
                  <select
                    value={form.categoryId}
                    onChange={(e) => set("categoryId", e.target.value)}
                    className="checkout-input"
                  >
                    <option value="">— Select category —</option>
                    {(categories ?? []).map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </Section>

              {/* ── Pricing & stock ── */}
              <Section title="Pricing & Stock">
                <div className="grid grid-cols-3 gap-4">
                  <Field label="Price (NGN) *">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      placeholder="42000"
                      required
                      className="checkout-input"
                    />
                  </Field>
                  <Field label="Compare-at Price" hint="Crossed-out 'was' price">
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={form.compareAtPrice}
                      onChange={(e) => set("compareAtPrice", e.target.value)}
                      placeholder="55000"
                      className="checkout-input"
                    />
                  </Field>
                  <Field label="Starting Stock">
                    <input
                      type="number"
                      min={0}
                      value={form.stock}
                      onChange={(e) => set("stock", e.target.value)}
                      placeholder="10"
                      className="checkout-input"
                    />
                  </Field>
                </div>
              </Section>

              {/* ── Description ── */}
              <Section title="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="A figure-flattering wrap silhouette cut from hand-printed ankara fabric…"
                  rows={4}
                  className="checkout-input resize-none w-full"
                />
              </Section>

              {/* ── Images ── */}
              <Section title="Images" hint="Paste Cloudinary or any public image URLs">
                <div className="space-y-2">
                  {form.images.map((url, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        value={url}
                        onChange={(e) => setImage(i, e.target.value)}
                        placeholder="https://res.cloudinary.com/..."
                        className="checkout-input flex-1 text-xs"
                      />
                      {url && (
                        <div className="w-10 h-12 shrink-0 overflow-hidden bg-muted border border-border">
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) =>
                              ((e.target as HTMLImageElement).style.display = "none")
                            }
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        disabled={form.images.length === 1}
                        className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-30"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addImage}
                  className="mt-2 flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-primary hover:underline underline-offset-2 cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  <Plus size={12} /> Add image URL
                </button>
              </Section>

              {/* ── Specs ── */}
              <Section title="Specifications" hint="e.g. Material: Ankara Cotton">
                <div className="space-y-2">
                  {form.specs.map((spec, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                      <input
                        value={spec.label}
                        onChange={(e) => setSpec(i, "label", e.target.value)}
                        placeholder="Label"
                        className="checkout-input text-xs"
                      />
                      <input
                        value={spec.value}
                        onChange={(e) => setSpec(i, "value", e.target.value)}
                        placeholder="Value"
                        className="checkout-input text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => removeSpec(i)}
                        className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addSpec}
                  className="mt-2 flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-primary hover:underline underline-offset-2 cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  <Plus size={12} /> Add spec
                </button>
              </Section>

              {/* ── Tags ── */}
              <Section title="Merchandising Tags">
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((tag) => {
                    const active = form.tags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`px-4 py-2 text-xs tracking-[0.15em] uppercase border transition-all cursor-pointer ${
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                        }`}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </Section>
            </form>

            {/* Footer */}
            <div className="shrink-0 px-7 py-5 border-t border-border flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-xs tracking-[0.15em] uppercase border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="product-form"
                disabled={isSaving}
                className="px-8 py-3 text-xs tracking-[0.15em] uppercase bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {isSaving && <Spinner className="size-3.5" />}
                {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create Product"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Small helpers ── */

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
      <div className="flex items-baseline gap-2 mb-4 pb-2 border-b border-border">
        <p
          className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold"
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

function Field({
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
        {hint && <span className="ml-2 normal-case tracking-normal text-muted-foreground/60">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
