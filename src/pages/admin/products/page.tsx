import { useState } from "react";
import { Plus, Pencil, Archive, ChevronDown, Tag } from "lucide-react";
import {
  useAdminProducts,
  useAdminSetStock,
  useAdminDeleteProduct,
  useAdminToggleTag,
} from "@/hooks/use-api.ts";
import { formatPrice } from "@/lib/products.ts";
import { AdminTableSkeleton } from "@/components/ui/skeleton.tsx";
import { ApiErrorBoundary } from "@/components/ApiErrorBoundary.tsx";
import { toast } from "sonner";
import type { ApiProduct } from "@/lib/api.ts";
import ProductFormModal from "../_components/ProductFormModal.tsx";

const TAGS = [
  { id: "new_arrival", label: "New" },
  { id: "best_seller", label: "Best Seller" },
  { id: "featured", label: "Featured" },
  { id: "deal", label: "Deal" },
] as const;

const STATUS_COLORS: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-400/10",
  draft: "text-yellow-400 bg-yellow-400/10",
  archived: "text-muted-foreground bg-muted/60",
};

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("active");
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<ApiProduct | undefined>(
    undefined,
  );

  const { data, isLoading } = useAdminProducts({ status, page, limit: 24 });
  const setStockMut = useAdminSetStock();
  const deleteMut = useAdminDeleteProduct();
  const toggleTagMut = useAdminToggleTag();

  const products = data?.items ?? [];

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditProduct(undefined);
    setModalOpen(true);
  };
  const openEdit = (p: ApiProduct) => {
    setEditProduct(p);
    setModalOpen(true);
  };

  const handleStockSave = (productId: string) => {
    const val = parseInt(editingStock[productId] ?? "");
    if (isNaN(val) || val < 0) {
      toast.error("Enter a valid stock number");
      return;
    }
    setStockMut.mutate(
      { productId, stock: val },
      {
        onSuccess: () => {
          toast.success("Stock updated");
          setEditingStock((prev) => {
            const n = { ...prev };
            delete n[productId];
            return n;
          });
        },
        onError: (e: unknown) =>
          toast.error((e as Error).message ?? "Could not update stock"),
      },
    );
  };

  const handleArchive = (p: ApiProduct) => {
    if (
      !window.confirm(`Archive "${p.title}"? It will be hidden from the store.`)
    )
      return;
    deleteMut.mutate(p._id, {
      onSuccess: () => toast.success("Product archived"),
      onError: (e: unknown) =>
        toast.error((e as Error).message ?? "Could not archive"),
    });
  };

  const handleToggleTag = (p: ApiProduct, tag: string) => {
    toggleTagMut.mutate(
      { id: p._id, tag },
      {
        onError: (e: unknown) =>
          toast.error((e as Error).message ?? "Tag update failed"),
      },
    );
  };

  // ── UI ─────────────────────────────────────────────────────────────────────

  return (
    <ApiErrorBoundary label="Admin Products">
      <>
        <div className="p-8 space-y-6">
          {/* Page header */}
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
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
                Products
              </h1>
            </div>

            <div className="flex items-center gap-3">
              {/* Status filter */}
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="checkout-input appearance-none pr-8 text-xs w-36"
                >
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                  <option value="">All</option>
                </select>
                <ChevronDown
                  size={12}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>

              {/* New product */}
              <button
                onClick={openCreate}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 text-xs tracking-[0.15em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                <Plus size={13} /> New Product
              </button>
            </div>
          </div>

          {/* Table */}
          {isLoading ? (
            <AdminTableSkeleton rows={8} cols={5} />
          ) : products.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <p
                className="text-3xl font-light text-muted-foreground"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                No products found
              </p>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary border-b border-primary pb-0.5 cursor-pointer"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                <Plus size={12} /> Create your first product
              </button>
            </div>
          ) : (
            <>
              <div className="bg-card border border-border divide-y divide-border">
                {/* Table header */}
                <div className="px-5 py-3 hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-center">
                  {[
                    "Product",
                    "Price / Stock",
                    "Tags",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <span
                      key={h}
                      className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {h}
                    </span>
                  ))}
                </div>

                {products.map((p: ApiProduct) => {
                  const available = p.stock - p.reserved;
                  const stockVal = editingStock[p._id] ?? String(p.stock);
                  const isEditing = p._id in editingStock;

                  return (
                    <div
                      key={p._id}
                      className="px-5 py-4 grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 items-start md:items-center"
                    >
                      {/* Product info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-14 shrink-0 overflow-hidden bg-muted border border-border">
                          {p.images[0] && (
                            <img
                              src={p.images[0]}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-sm font-light text-foreground truncate"
                            style={{
                              fontFamily: "'Cormorant Garamond', serif",
                            }}
                          >
                            {p.title}
                          </p>
                          <p
                            className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {p.sku}
                          </p>
                          {p.categoryName && (
                            <p
                              className="text-[10px] text-muted-foreground/60 mt-0.5"
                              style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              {p.categoryName}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Price + inline stock editor */}
                      <div className="space-y-2">
                        <p
                          className="text-sm text-foreground"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {formatPrice(p.price ?? 0)}
                        </p>
                        {p.compareAtPrice != null && (
                          <p
                            className="text-xs line-through text-muted-foreground"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {formatPrice(p.compareAtPrice)}
                          </p>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            value={stockVal}
                            onChange={(e) =>
                              setEditingStock((prev) => ({
                                ...prev,
                                [p._id]: e.target.value,
                              }))
                            }
                            className="checkout-input py-1 text-xs w-20 text-right"
                          />
                          <span
                            className={`text-[9px] ${
                              available <= 0
                                ? "text-destructive"
                                : available <= 5
                                  ? "text-yellow-400"
                                  : "text-emerald-400"
                            }`}
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            {available <= 0 ? "OOS" : `${available} avail`}
                          </span>
                          <button
                            onClick={() => handleStockSave(p._id)}
                            disabled={!isEditing || setStockMut.isPending}
                            className="text-[9px] tracking-[0.15em] uppercase text-primary hover:underline underline-offset-2 disabled:opacity-30 cursor-pointer"
                            style={{ fontFamily: "'Montserrat', sans-serif" }}
                          >
                            Save
                          </button>
                        </div>
                      </div>

                      {/* Tag pills */}
                      <div className="flex flex-wrap gap-1">
                        {TAGS.map((tag) => {
                          const active = p.tags?.includes(tag.id);
                          return (
                            <button
                              key={tag.id}
                              type="button"
                              title={`Toggle "${tag.label}" tag`}
                              onClick={() => handleToggleTag(p, tag.id)}
                              disabled={toggleTagMut.isPending}
                              className={`flex items-center gap-1 px-2 py-0.5 text-[9px] tracking-[0.1em] uppercase border transition-all cursor-pointer disabled:opacity-50 ${
                                active
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                              }`}
                              style={{ fontFamily: "'Montserrat', sans-serif" }}
                            >
                              <Tag size={9} />
                              {tag.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Status badge */}
                      <span
                        className={`text-[9px] tracking-[0.1em] uppercase px-2 py-1 w-fit ${
                          STATUS_COLORS[p.status] ?? ""
                        }`}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {p.status}
                      </span>

                      {/* Action buttons */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(p)}
                          title="Edit product"
                          className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        {p.status !== "archived" && (
                          <button
                            onClick={() => handleArchive(p)}
                            title="Archive product"
                            disabled={deleteMut.isPending}
                            className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-40"
                          >
                            <Archive size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {data && data.pages > 1 && (
                <div className="flex gap-2 justify-center pt-2">
                  {Array.from({ length: data.pages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`w-9 h-9 text-xs border transition-all cursor-pointer ${
                          p === page
                            ? "bg-primary text-primary-foreground border-primary"
                            : "border-border text-muted-foreground hover:border-primary"
                        }`}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Create / Edit modal */}
        <ProductFormModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          product={editProduct}
        />
      </>
    </ApiErrorBoundary>
  );
}
