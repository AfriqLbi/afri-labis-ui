/**
 * ProductFormModal
 * Used for both CREATE and EDIT.
 * Pass `product` to open in edit mode; omit it for create mode.
 */
import { useEffect, useRef, useState } from "react";
import { X, Plus, Trash2, Upload, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  useAdminCreateProduct,
  useAdminUpdateProduct,
  useAdminCatalogCategories,
  useAdminCatalogBrands,
} from "@/hooks/use-api.ts";
import { adminMedia, adminCatalog } from "@/lib/api.ts";
import type { ApiProduct } from "@/lib/api.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

const TAGS = [
  { id: "new_arrival", label: "New Arrival" },
  { id: "best_seller", label: "Best Seller" },
  { id: "featured", label: "Featured" },
  { id: "deal", label: "Deal" },
] as const;

const STATUSES = ["draft", "active", "archived"] as const;

type Spec = { label: string; value: string };

interface Props {
  open: boolean;
  onClose: () => void;
  product?: ApiProduct;
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
    images: [] as string[],
    description: "",
    specs: [] as Spec[],
    status: "draft" as (typeof STATUSES)[number],
    tags: [] as string[],
    packageWeightGrams: "",
    packageDimsL: "",
    packageDimsW: "",
    packageDimsH: "",
  };
}

function productToForm(p: ApiProduct) {
  const dims = (
    p as unknown as { packageDims?: { l: number; w: number; h: number } | null }
  ).packageDims;
  return {
    sku: p.sku,
    title: p.title,
    brandId: "",
    categoryId: "",
    price: String(p.price),
    compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
    stock: String(p.stock),
    images: p.images.length ? [...p.images] : [],
    description: p.description ?? "",
    specs: p.specs as Spec[],
    status: p.status as (typeof STATUSES)[number],
    tags: p.tags ?? [],
    packageWeightGrams: String(
      (p as unknown as { packageWeightGrams?: number | null })
        .packageWeightGrams ?? "",
    ),
    packageDimsL: dims ? String(dims.l) : "",
    packageDimsW: dims ? String(dims.w) : "",
    packageDimsH: dims ? String(dims.h) : "",
  };
}

export default function ProductFormModal({ open, onClose, product }: Props) {
  const isEdit = !!product;
  const [form, setForm] = useState(emptyForm);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createMut = useAdminCreateProduct();
  const updateMut = useAdminUpdateProduct();
  const { data: categories } = useAdminCatalogCategories();
  const { data: brands, refetch: refetchBrands } = useAdminCatalogBrands();
  const [newBrandName, setNewBrandName] = useState("");
  const [creatingBrand, setCreatingBrand] = useState(false);

  const isSaving = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (open) setForm(product ? productToForm(product) : emptyForm());
  }, [open, product]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const set = (field: keyof ReturnType<typeof emptyForm>, value: unknown) =>
    setForm((f) => ({ ...f, [field]: value }));

  // ── Image upload helpers ───────────────────────────────────────────────────

  const uploadFile = async (file: File, targetIdx?: number) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }

    const insertIdx = targetIdx ?? form.images.length;
    setUploadingIdx(insertIdx);

    try {
      const url = await adminMedia.upload(file);
      setForm((f) => {
        const imgs = [...f.images];
        if (targetIdx !== undefined) {
          imgs[targetIdx] = url; // replace existing slot
        } else {
          imgs.push(url); // append new
        }
        return { ...f, images: imgs };
      });
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Upload failed");
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleFileInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    idx?: number,
  ) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (idx !== undefined) {
      uploadFile(files[0], idx);
    } else {
      files.forEach((f) => uploadFile(f));
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/"),
    );
    if (!files.length) return;
    files.forEach((f) => uploadFile(f));
  };

  const removeImage = (i: number) =>
    set(
      "images",
      form.images.filter((_, idx) => idx !== i),
    );

  const moveImage = (from: number, to: number) => {
    const imgs = [...form.images];
    const [moved] = imgs.splice(from, 1);
    imgs.splice(to, 0, moved);
    set("images", imgs);
  };

  // ── Brand inline create ───────────────────────────────────────────────────

  const handleCreateBrand = async () => {
    const name = newBrandName.trim();
    if (!name) return;
    setCreatingBrand(true);
    try {
      const brand = await adminCatalog.createBrand({ name });
      await refetchBrands();
      set("brandId", brand._id);
      setNewBrandName("");
      toast.success(`Brand "${brand.name}" created`);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Could not create brand");
    } finally {
      setCreatingBrand(false);
    }
  };

  // ── Spec helpers ───────────────────────────────────────────────────────────

  const setSpec = (i: number, key: "label" | "value", val: string) =>
    set(
      "specs",
      form.specs.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)),
    );
  const addSpec = () => set("specs", [...form.specs, { label: "", value: "" }]);
  const removeSpec = (i: number) =>
    set(
      "specs",
      form.specs.filter((_, idx) => idx !== i),
    );

  // ── Tag toggle ────────────────────────────────────────────────────────────

  const toggleTag = (tag: string) =>
    set(
      "tags",
      form.tags.includes(tag)
        ? form.tags.filter((t) => t !== tag)
        : [...form.tags, tag],
    );

  // ── Submit ────────────────────────────────────────────────────────────────

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
    if (uploadingIdx !== null) {
      toast.error("Please wait for image uploads to finish");
      return;
    }

    const dto: Record<string, unknown> = {
      title: form.title.trim(),
      price,
      description: form.description.trim() || undefined,
      images: form.images,
      specs: form.specs.filter((s) => s.label && s.value),
      status: form.status,
      tags: form.tags,
      stock: parseInt(form.stock) || 0,
    };

    if (form.compareAtPrice)
      dto.compareAtPrice = parseFloat(form.compareAtPrice);
    if (form.categoryId) dto.categoryId = form.categoryId;

    // Shipping weight / dimensions
    if (form.packageWeightGrams !== "")
      dto.packageWeightGrams = parseInt(form.packageWeightGrams, 10);
    if (form.packageDimsL && form.packageDimsW && form.packageDimsH) {
      dto.packageDims = {
        l: parseFloat(form.packageDimsL),
        w: parseFloat(form.packageDimsW),
        h: parseFloat(form.packageDimsH),
      };
    }

    if (!isEdit) {
      dto.sku = form.sku.trim();
      dto.brandId = form.brandId || undefined;
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
      toast.error((err as Error).message ?? "Something went wrong");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={onClose}
          />

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

            {/* Body */}
            <form
              onSubmit={handleSubmit}
              id="product-form"
              className="flex-1 overflow-y-auto px-7 py-6 space-y-7"
            >
              {/* ── Core details ── */}
              <Section title="Core Details">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="SKU *"
                    hint={isEdit ? "Immutable after creation" : undefined}
                  >
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
                  <Field label="Brand *">
                    <select
                      value={form.brandId}
                      onChange={(e) => set("brandId", e.target.value)}
                      className="checkout-input"
                      required
                    >
                      <option value="">— Select brand —</option>
                      {(brands ?? []).map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    {/* Inline brand creation */}
                    <div className="flex gap-2 mt-2">
                      <input
                        value={newBrandName}
                        onChange={(e) => setNewBrandName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateBrand();
                          }
                        }}
                        placeholder="Or type a new brand name…"
                        className="checkout-input flex-1 text-xs py-2"
                      />
                      <button
                        type="button"
                        onClick={handleCreateBrand}
                        disabled={!newBrandName.trim() || creatingBrand}
                        className="px-3 py-2 text-[10px] tracking-[0.15em] uppercase bg-muted hover:bg-primary hover:text-primary-foreground text-muted-foreground border border-border transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1 shrink-0"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {creatingBrand ? (
                          <Spinner className="size-3" />
                        ) : (
                          <Plus size={11} />
                        )}
                        Create
                      </button>
                    </div>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <Field
                    label="Compare-at Price"
                    hint="Crossed-out 'was' price"
                  >
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
              <Section
                title="Images"
                hint="Up to 10 MB per image · JPG, PNG, WebP"
              >
                {/* Existing images grid */}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {form.images.map((url, i) => (
                      <div
                        key={url + i}
                        className="relative group aspect-square bg-muted border border-border overflow-hidden"
                      >
                        <img
                          src={url}
                          alt={`Image ${i + 1}`}
                          className="w-full h-full object-cover"
                        />

                        {/* First image = cover badge */}
                        {i === 0 && (
                          <span
                            className="absolute top-1 left-1 text-[8px] tracking-[0.1em] uppercase bg-primary text-primary-foreground px-1.5 py-0.5"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            Cover
                          </span>
                        )}

                        {/* Hover actions */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {/* Replace */}
                          <label
                            title="Replace image"
                            className="cursor-pointer text-white hover:text-primary transition-colors"
                          >
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleFileInput(e, i)}
                            />
                            <Upload size={14} />
                          </label>

                          {/* Move left */}
                          {i > 0 && (
                            <button
                              type="button"
                              onClick={() => moveImage(i, i - 1)}
                              className="text-white hover:text-primary transition-colors text-xs font-bold cursor-pointer"
                              title="Move left"
                            >
                              ←
                            </button>
                          )}

                          {/* Move right */}
                          {i < form.images.length - 1 && (
                            <button
                              type="button"
                              onClick={() => moveImage(i, i + 1)}
                              className="text-white hover:text-primary transition-colors text-xs font-bold cursor-pointer"
                              title="Move right"
                            >
                              →
                            </button>
                          )}

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => removeImage(i)}
                            className="text-white hover:text-destructive transition-colors cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {/* Uploading overlay for this slot */}
                        {uploadingIdx === i && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Spinner className="size-5 text-primary" />
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Uploading a new image appended to end */}
                    {uploadingIdx === form.images.length && (
                      <div className="aspect-square bg-muted border border-border flex items-center justify-center">
                        <Spinner className="size-5 text-primary" />
                      </div>
                    )}
                  </div>
                )}

                {/* Drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`mt-3 border-2 border-dashed rounded-none transition-colors cursor-pointer flex flex-col items-center justify-center gap-3 py-8 px-4 ${
                    dragOver
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-muted/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileInput(e)}
                  />
                  <div
                    className={`w-10 h-10 border flex items-center justify-center transition-colors ${
                      dragOver
                        ? "border-primary text-primary"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    <ImageIcon size={18} />
                  </div>
                  <div className="text-center">
                    <p
                      className="text-sm font-light text-foreground"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {dragOver ? "Drop to upload" : "Drag & drop images here"}
                    </p>
                    <p
                      className="text-[10px] text-muted-foreground mt-1 tracking-[0.1em] uppercase"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      or click to browse · JPG, PNG, WebP · max 10 MB each
                    </p>
                  </div>
                  {uploadingIdx !== null && (
                    <div
                      className="flex items-center gap-2 text-xs text-primary"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      <Spinner className="size-3.5" /> Uploading…
                    </div>
                  )}
                </div>

                {form.images.length > 0 && (
                  <p
                    className="text-[10px] text-muted-foreground mt-2"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    First image is the cover. Hover an image to reorder or
                    replace it.
                  </p>
                )}
              </Section>

              {/* ── Shipping weight / dimensions ── */}
              <Section
                title="Shipping"
                hint="Required for automatic fee calculation"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Packed weight (grams)"
                    hint="Required before publishing"
                  >
                    <input
                      type="number"
                      min={0}
                      value={form.packageWeightGrams}
                      onChange={(e) =>
                        set("packageWeightGrams", e.target.value)
                      }
                      placeholder="850"
                      className="checkout-input"
                    />
                  </Field>
                </div>
                <div>
                  <p
                    className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Packed dimensions (cm) — L × W × H
                    <span className="ml-2 normal-case tracking-normal text-muted-foreground/60">
                      used for volumetric weight
                    </span>
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      ["packageDimsL", "packageDimsW", "packageDimsH"] as const
                    ).map((k, i) => (
                      <input
                        key={k}
                        type="number"
                        min={0}
                        step={0.1}
                        value={form[k]}
                        onChange={(e) => set(k, e.target.value)}
                        placeholder={["L", "W", "H"][i]}
                        className="checkout-input text-sm"
                      />
                    ))}
                  </div>
                </div>
              </Section>

              {/* ── Specifications ── */}
              <Section
                title="Specifications"
                hint="e.g. Material: Ankara Cotton"
              >
                <div className="space-y-2">
                  {form.specs.map((spec, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_1fr_auto] gap-2 items-center"
                    >
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
                disabled={isSaving || uploadingIdx !== null}
                className="px-8 py-3 text-xs tracking-[0.15em] uppercase bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {(isSaving || uploadingIdx !== null) && (
                  <Spinner className="size-3.5" />
                )}
                {uploadingIdx !== null
                  ? "Uploading…"
                  : isSaving
                    ? "Saving…"
                    : isEdit
                      ? "Save Changes"
                      : "Create Product"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Helpers ── */

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
        {hint && (
          <span className="ml-2 normal-case tracking-normal text-muted-foreground/60">
            {hint}
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
