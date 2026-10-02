import { useState, useEffect, useRef } from "react";
import { Plus, Pencil, Trash2, X, ImageIcon, Upload, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  useAdminCatalogCategories,
  useAdminCreateCategory,
  useAdminUpdateCategory,
  useAdminDeleteCategory,
} from "@/hooks/use-api.ts";
import { adminMedia } from "@/lib/api.ts";
import type { ApiCategory } from "@/lib/api.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

// ── Category form modal ────────────────────────────────────────────────────────

interface FormState {
  name: string;
  blurb: string;
  imageUrl: string;
  type: "category" | "section";
  sortOrder: string;
}

function emptyForm(): FormState {
  return { name: "", blurb: "", imageUrl: "", type: "category", sortOrder: "0" };
}

function categoryToForm(c: ApiCategory): FormState {
  return {
    name: c.name,
    blurb: c.blurb ?? "",
    imageUrl: c.imageUrl ?? "",
    type: c.type,
    sortOrder: String(c.sortOrder ?? 0),
  };
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  category?: ApiCategory;
}

function CategoryFormModal({ open, onClose, category }: ModalProps) {
  const isEdit = !!category;
  const [form, setForm] = useState<FormState>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const createMut = useAdminCreateCategory();
  const updateMut = useAdminUpdateCategory();
  const isSaving  = createMut.isPending || updateMut.isPending;

  useEffect(() => {
    if (open) setForm(category ? categoryToForm(category) : emptyForm());
  }, [open, category]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await adminMedia.upload(file);
      set("imageUrl", url);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error("Name is required"); return; }

    const dto = {
      name:      form.name.trim(),
      blurb:     form.blurb.trim() || undefined,
      imageUrl:  form.imageUrl || undefined,
      type:      form.type,
      sortOrder: parseInt(form.sortOrder) || 0,
    };

    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: category!._id, dto });
        toast.success("Category updated");
      } else {
        await createMut.mutateAsync(dto);
        toast.success("Category created");
      }
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Something went wrong");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }} transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed top-0 right-0 h-full w-full max-w-lg bg-card border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 border-b border-border shrink-0">
              <div>
                <p className="text-[10px] tracking-[0.3em] uppercase text-primary"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {isEdit ? "Edit Category" : "New Category"}
                </p>
                <h2 className="text-2xl font-light text-foreground mt-0.5"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {isEdit ? category!.name : "Create a category"}
                </h2>
              </div>
              <button onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form id="cat-form" onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

              <Field label="Name *">
                <input value={form.name} onChange={(e) => set("name", e.target.value)}
                  placeholder="Aṣọ-Òkè Trousers" required className="checkout-input" />
              </Field>

              <Field label="Blurb" hint="Short description shown on the storefront">
                <textarea value={form.blurb} onChange={(e) => set("blurb", e.target.value)}
                  placeholder="Handwoven Aṣọ-Òkè trousers in contemporary cuts."
                  rows={2} className="checkout-input resize-none w-full" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Type">
                  <select value={form.type} onChange={(e) => set("type", e.target.value as "category" | "section")}
                    className="checkout-input">
                    <option value="category">Category</option>
                    <option value="section">Section</option>
                  </select>
                </Field>
                <Field label="Sort Order">
                  <input type="number" min={0} value={form.sortOrder}
                    onChange={(e) => set("sortOrder", e.target.value)}
                    placeholder="0" className="checkout-input" />
                </Field>
              </div>

              {/* Image */}
              <Field label="Cover Image">
                {form.imageUrl ? (
                  <div className="relative group w-full h-40 overflow-hidden bg-muted border border-border">
                    <img src={form.imageUrl} alt="Category cover"
                      className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <label className="cursor-pointer text-white hover:text-primary transition-colors">
                        <input ref={fileRef} type="file" accept="image/*" className="hidden"
                          onChange={handleImageUpload} />
                        <Upload size={16} />
                      </label>
                      <button type="button" onClick={() => set("imageUrl", "")}
                        className="text-white hover:text-destructive transition-colors cursor-pointer">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Spinner className="size-5 text-primary" />
                      </div>
                    )}
                  </div>
                ) : (
                  <label
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer py-8 w-full"
                    onClick={() => fileRef.current?.click()}
                  >
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={handleImageUpload} />
                    <div className="w-10 h-10 border border-border flex items-center justify-center text-muted-foreground">
                      <ImageIcon size={18} />
                    </div>
                    <p className="text-sm font-light text-muted-foreground"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {uploading ? "Uploading…" : "Click or drag to upload a cover image"}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      JPG, PNG, WebP · max 10 MB
                    </p>
                  </label>
                )}
              </Field>
            </form>

            {/* Footer */}
            <div className="shrink-0 px-7 py-5 border-t border-border flex gap-3 justify-end">
              <button type="button" onClick={onClose}
                className="px-6 py-3 text-xs tracking-[0.15em] uppercase border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
                style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Cancel
              </button>
              <button type="submit" form="cat-form" disabled={isSaving || uploading}
                className="px-8 py-3 text-xs tracking-[0.15em] uppercase bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {isSaving && <Spinner className="size-3.5" />}
                {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminCategoriesPage() {
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editCat,      setEditCat]      = useState<ApiCategory | undefined>();
  const [expandedId,   setExpandedId]   = useState<string | null>(null);

  const { data: categories, isLoading } = useAdminCatalogCategories();
  const deleteMut = useAdminDeleteCategory();

  const openCreate = () => { setEditCat(undefined); setModalOpen(true); };
  const openEdit   = (c: ApiCategory) => { setEditCat(c); setModalOpen(true); };

  const handleDelete = (c: ApiCategory) => {
    if (!window.confirm(`Delete category "${c.name}"? Products in this category will become uncategorised.`)) return;
    deleteMut.mutate(c._id, {
      onSuccess: () => toast.success("Category deleted"),
      onError: (e: unknown) => toast.error((e as Error).message ?? "Delete failed"),
    });
  };

  // Split into categories and sections
  const cats     = (categories ?? []).filter((c) => c.type === "category");
  const sections = (categories ?? []).filter((c) => c.type === "section");

  return (
    <>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>Admin</p>
            <h1 className="text-3xl font-light text-foreground"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>Categories</h1>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-xs tracking-[0.15em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <Plus size={13} /> New Category
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-3 py-16 text-muted-foreground">
            <Spinner className="size-5" />
            <span className="text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>Loading…</span>
          </div>
        ) : (
          <>
            <CategoryGroup
              title="Garment Categories"
              hint="Browseable product categories shown in the shop"
              items={cats}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onEdit={openEdit}
              onDelete={handleDelete}
              deletePending={deleteMut.isPending}
            />
            <CategoryGroup
              title="Storefront Sections"
              hint="Curated sections like New Arrivals or Bridal"
              items={sections}
              expandedId={expandedId}
              setExpandedId={setExpandedId}
              onEdit={openEdit}
              onDelete={handleDelete}
              deletePending={deleteMut.isPending}
            />
            {!cats.length && !sections.length && (
              <div className="py-20 text-center space-y-4">
                <p className="text-3xl font-light text-muted-foreground"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}>No categories yet</p>
                <button onClick={openCreate}
                  className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary border-b border-primary pb-0.5 cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  <Plus size={12} /> Create the first category
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <CategoryFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        category={editCat}
      />
    </>
  );
}

// ── Category group section ─────────────────────────────────────────────────────

function CategoryGroup({
  title, hint, items, expandedId, setExpandedId, onEdit, onDelete, deletePending,
}: {
  title: string;
  hint: string;
  items: ApiCategory[];
  expandedId: string | null;
  setExpandedId: (id: string | null) => void;
  onEdit: (c: ApiCategory) => void;
  onDelete: (c: ApiCategory) => void;
  deletePending: boolean;
}) {
  if (!items.length) return null;

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold"
          style={{ fontFamily: "'Montserrat', sans-serif" }}>{title}</p>
        <p className="text-[10px] text-muted-foreground"
          style={{ fontFamily: "'Montserrat', sans-serif" }}>{hint}</p>
      </div>

      <div className="bg-card border border-border divide-y divide-border">
        {items.map((cat) => {
          const expanded = expandedId === cat._id;
          return (
            <div key={cat._id}>
              <div className="px-5 py-4 flex items-center gap-4">
                {/* Cover thumb */}
                <div className="w-12 h-14 shrink-0 overflow-hidden bg-muted border border-border">
                  {cat.imageUrl ? (
                    <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground/40">
                      <ImageIcon size={14} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-light text-foreground"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}>{cat.name}</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 uppercase tracking-wide"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {cat.slug} · order {cat.sortOrder}
                  </p>
                  {cat.blurb && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}>{cat.blurb}</p>
                  )}
                </div>

                {/* Subcategories expand */}
                {cat.subcategories?.length > 0 && (
                  <button
                    onClick={() => setExpandedId(expanded ? null : cat._id)}
                    className="text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    {cat.subcategories.length} sub
                  </button>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <button onClick={() => onEdit(cat)} title="Edit"
                    className="text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => onDelete(cat)} title="Delete"
                    disabled={deletePending}
                    className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-40">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              <AnimatePresence>
                {expanded && cat.subcategories?.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-border divide-y divide-border/50 bg-muted/20">
                      {cat.subcategories.map((sub) => (
                        <div key={sub.id} className="px-5 py-2.5 pl-14 flex items-center gap-3">
                          <div className="w-1 h-1 bg-primary/60 shrink-0" />
                          <p className="text-xs text-muted-foreground"
                            style={{ fontFamily: "'Cormorant Garamond', serif" }}>{sub.name}</p>
                          <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wide"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}>{sub.slug}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Field helper ───────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5"
        style={{ fontFamily: "'Montserrat', sans-serif" }}>
        {label}
        {hint && <span className="ml-2 normal-case tracking-normal text-muted-foreground/60">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
