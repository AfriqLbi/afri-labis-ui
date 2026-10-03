import { useRef, useState } from "react";
import {
  Plus, Pencil, Trash2, X, Upload, ImageIcon,
  Eye, EyeOff, GripVertical,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  useAdminLookbook,
  useAdminCreateLookbookItem,
  useAdminUpdateLookbookItem,
  useAdminDeleteLookbookItem,
  useAdminReorderLookbook,
} from "@/hooks/use-api.ts";
import { adminMedia } from "@/lib/api.ts";
import type { ApiLookbookItem } from "@/lib/api.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

// ── Form state ─────────────────────────────────────────────────────────────────

interface FormState {
  title: string;
  caption: string;
  imageUrl: string;
  season: string;
  published: boolean;
}

const emptyForm = (): FormState => ({
  title: "", caption: "", imageUrl: "", season: "", published: true,
});

const itemToForm = (item: ApiLookbookItem): FormState => ({
  title:     item.title,
  caption:   item.caption ?? "",
  imageUrl:  item.imageUrl,
  season:    item.season ?? "",
  published: item.published,
});

// ── Form modal ─────────────────────────────────────────────────────────────────

function LookbookItemModal({
  open, onClose, item,
}: { open: boolean; onClose: () => void; item?: ApiLookbookItem }) {
  const isEdit = !!item;
  const [form, setForm]       = useState<FormState>(emptyForm);
  const [uploading, setUpl]   = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const createMut = useAdminCreateLookbookItem();
  const updateMut = useAdminUpdateLookbookItem();
  const isSaving  = createMut.isPending || updateMut.isPending;

  // Reset form on open
  useState(() => { if (open) setForm(item ? itemToForm(item) : emptyForm()); });

  // Escape to close
  useState(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUpl(true);
    try {
      const url = await adminMedia.upload(file);
      set("imageUrl", url);
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Upload failed");
    } finally {
      setUpl(false);
      e.target.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim())    { toast.error("Title is required");       return; }
    if (!form.imageUrl.trim()) { toast.error("An image is required");    return; }

    const dto = {
      title:     form.title.trim(),
      caption:   form.caption.trim() || undefined,
      imageUrl:  form.imageUrl,
      season:    form.season.trim() || undefined,
      published: form.published,
    };

    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: item!._id, dto });
        toast.success("Item updated");
      } else {
        await createMut.mutateAsync(dto);
        toast.success("Item added to lookbook");
      }
      onClose();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Something went wrong");
    }
  };

  // Initialise form on open (using useEffect pattern inside render is fine here
  // because the modal remounts when open transitions true→false→true)
  if (open && !form.title && item) setForm(itemToForm(item));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50" onClick={onClose}
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
                  {isEdit ? "Edit Item" : "New Lookbook Item"}
                </p>
                <h2 className="text-2xl font-light text-foreground mt-0.5"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {isEdit ? item!.title : "Add to the Labi Edit"}
                </h2>
              </div>
              <button onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <form id="lb-form" onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto px-7 py-6 space-y-5">

              {/* Image upload */}
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  Image *
                </label>
                {form.imageUrl ? (
                  <div className="relative group overflow-hidden bg-muted border border-border"
                    style={{ aspectRatio: "3/4" }}>
                    <img src={form.imageUrl} alt="Preview"
                      className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <label className="cursor-pointer text-white hover:text-primary transition-colors">
                        <input type="file" accept="image/*" className="hidden"
                          onChange={handleUpload} />
                        <Upload size={18} />
                      </label>
                      <button type="button" onClick={() => set("imageUrl", "")}
                        className="text-white hover:text-destructive transition-colors cursor-pointer">
                        <Trash2 size={18} />
                      </button>
                    </div>
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Spinner className="size-6 text-primary" />
                      </div>
                    )}
                  </div>
                ) : (
                  <label
                    className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer py-14 w-full"
                    onClick={() => fileRef.current?.click()}
                  >
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={handleUpload} />
                    <div className="w-12 h-12 border border-border flex items-center justify-center text-muted-foreground">
                      <ImageIcon size={20} />
                    </div>
                    <p className="text-sm font-light text-muted-foreground"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                      {uploading ? "Uploading…" : "Click or drag to upload"}
                    </p>
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground/60"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      JPG, PNG, WebP · max 10 MB
                    </p>
                  </label>
                )}
              </div>

              {/* Title */}
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>Title *</label>
                <input value={form.title} onChange={(e) => set("title", e.target.value)}
                  placeholder="The Harmattan Edit" required className="checkout-input" />
              </div>

              {/* Caption */}
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>Caption</label>
                <textarea value={form.caption} onChange={(e) => set("caption", e.target.value)}
                  placeholder="Handwoven Aṣọ-Òkè meets modern silhouette."
                  rows={2} className="checkout-input resize-none w-full" />
              </div>

              {/* Season */}
              <div>
                <label className="block text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-1.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>Season / Collection</label>
                <input value={form.season} onChange={(e) => set("season", e.target.value)}
                  placeholder="SS 2025" className="checkout-input" />
              </div>

              {/* Published toggle */}
              <div className="flex items-center justify-between py-3 border-t border-border">
                <div>
                  <p className="text-xs text-foreground"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}>Published</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}>
                    Visible to customers on the storefront
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => set("published", !form.published)}
                  className={`w-11 h-6 rounded-full transition-colors cursor-pointer relative ${
                    form.published ? "bg-primary" : "bg-muted border border-border"
                  }`}
                  aria-label={form.published ? "Published" : "Draft"}
                >
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    form.published ? "translate-x-5" : "translate-x-0.5"
                  }`} />
                </button>
              </div>
            </form>

            {/* Footer */}
            <div className="shrink-0 px-7 py-5 border-t border-border flex gap-3 justify-end">
              <button type="button" onClick={onClose}
                className="px-6 py-3 text-xs tracking-[0.15em] uppercase border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors cursor-pointer"
                style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Cancel
              </button>
              <button type="submit" form="lb-form" disabled={isSaving || uploading}
                className="px-8 py-3 text-xs tracking-[0.15em] uppercase bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                style={{ fontFamily: "'Montserrat', sans-serif" }}>
                {isSaving && <Spinner className="size-3.5" />}
                {isSaving ? "Saving…" : isEdit ? "Save Changes" : "Add to Lookbook"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AdminLookbookPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem,  setEditItem]  = useState<ApiLookbookItem | undefined>();
  // Track drag-reorder state
  const [dragIdx,   setDragIdx]   = useState<number | null>(null);
  const [overIdx,   setOverIdx]   = useState<number | null>(null);

  const { data: items = [], isLoading } = useAdminLookbook();
  const deleteMut  = useAdminDeleteLookbookItem();
  const reorderMut = useAdminReorderLookbook();
  const toggleMut  = useAdminUpdateLookbookItem();

  const openCreate = () => { setEditItem(undefined); setModalOpen(true); };
  const openEdit   = (item: ApiLookbookItem) => { setEditItem(item); setModalOpen(true); };

  const handleDelete = (item: ApiLookbookItem) => {
    if (!window.confirm(`Remove "${item.title}" from the lookbook?`)) return;
    deleteMut.mutate(item._id, {
      onSuccess: () => toast.success("Item removed"),
      onError: (e: unknown) => toast.error((e as Error).message ?? "Delete failed"),
    });
  };

  const handleTogglePublish = (item: ApiLookbookItem) => {
    toggleMut.mutate(
      { id: item._id, dto: { published: !item.published } },
      { onError: (e: unknown) => toast.error((e as Error).message ?? "Update failed") },
    );
  };

  // ── Drag-to-reorder ──────────────────────────────────────────────────────────

  const handleDragStart = (i: number) => setDragIdx(i);
  const handleDragOver  = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    setOverIdx(i);
  };

  const handleDrop = () => {
    if (dragIdx === null || overIdx === null || dragIdx === overIdx) {
      setDragIdx(null); setOverIdx(null); return;
    }
    const reordered = [...items];
    const [moved]   = reordered.splice(dragIdx, 1);
    reordered.splice(overIdx, 0, moved);

    const payload = reordered.map((item, i) => ({ id: item._id, sortOrder: i }));
    reorderMut.mutate(payload, {
      onError: (e: unknown) => toast.error((e as Error).message ?? "Reorder failed"),
    });
    setDragIdx(null); setOverIdx(null);
  };

  return (
    <>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>Admin</p>
            <h1 className="text-3xl font-light text-foreground"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>Lookbook</h1>
            <p className="text-xs text-muted-foreground mt-1"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Drag rows to reorder · toggle the eye to publish / unpublish
            </p>
          </div>
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-xs tracking-[0.15em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
            style={{ fontFamily: "'Montserrat', sans-serif" }}>
            <Plus size={13} /> Add Item
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center gap-3 py-16 text-muted-foreground">
            <Spinner className="size-5" />
            <span className="text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>Loading…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <p className="text-3xl font-light text-muted-foreground"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}>The lookbook is empty</p>
            <button onClick={openCreate}
              className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary border-b border-primary pb-0.5 cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>
              <Plus size={12} /> Add the first item
            </button>
          </div>
        ) : (
          <>
            {/* Summary pill */}
            <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}>
              {items.filter((i) => i.published).length} published · {items.filter((i) => !i.published).length} hidden
            </p>

            {/* Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map((item, i) => (
                <motion.div
                  key={item._id}
                  layout
                  draggable
                  onDragStart={() => handleDragStart(i)}
                  onDragOver={(e) => handleDragOver(e, i)}
                  onDrop={handleDrop}
                  onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                  className={`group relative bg-card border overflow-hidden transition-all ${
                    overIdx === i && dragIdx !== i
                      ? "border-primary scale-[1.02]"
                      : "border-border"
                  } ${!item.published ? "opacity-50" : ""}`}
                >
                  {/* Drag handle */}
                  <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-grab">
                    <GripVertical size={14} />
                  </div>

                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ aspectRatio: "3/4" }}>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />

                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button onClick={() => openEdit(item)} title="Edit"
                        className="w-8 h-8 bg-white/10 hover:bg-primary flex items-center justify-center text-white transition-colors cursor-pointer">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => handleTogglePublish(item)}
                        title={item.published ? "Unpublish" : "Publish"}
                        className="w-8 h-8 bg-white/10 hover:bg-primary flex items-center justify-center text-white transition-colors cursor-pointer">
                        {item.published ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                      <button onClick={() => handleDelete(item)} title="Delete"
                        disabled={deleteMut.isPending}
                        className="w-8 h-8 bg-white/10 hover:bg-destructive flex items-center justify-center text-white transition-colors cursor-pointer disabled:opacity-40">
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Draft badge */}
                    {!item.published && (
                      <div className="absolute top-2 right-2">
                        <span className="text-[9px] tracking-[0.1em] uppercase bg-muted text-muted-foreground px-2 py-0.5"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}>
                          Draft
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Caption */}
                  <div className="p-3">
                    <p className="text-sm font-light text-foreground truncate"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}>{item.title}</p>
                    {item.season && (
                      <p className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground mt-0.5"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}>{item.season}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      <LookbookItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editItem}
      />
    </>
  );
}
