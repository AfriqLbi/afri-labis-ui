import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAdminProducts, useAdminSetStock } from "@/hooks/use-api.ts";
import { formatPrice } from "@/lib/products.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import { toast } from "sonner";
import type { ApiProduct } from "@/lib/api.ts";

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("active");
  const [editingStock, setEditingStock] = useState<Record<string, string>>({});

  const { data, isLoading } = useAdminProducts({ status, page, limit: 24 });
  const setStockMut = useAdminSetStock();

  const products = data?.items ?? [];

  const handleStockSave = (productId: string) => {
    const newStock = parseInt(editingStock[productId] ?? "");
    if (isNaN(newStock) || newStock < 0) {
      toast.error("Enter a valid stock number (0 or greater)");
      return;
    }
    setStockMut.mutate({ productId, stock: newStock }, {
      onSuccess: () => {
        toast.success("Stock updated");
        setEditingStock((prev) => { const n = { ...prev }; delete n[productId]; return n; });
      },
      onError: (e: any) => toast.error(e.message ?? "Could not update stock"),
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1"
            style={{ fontFamily: "'Montserrat', sans-serif" }}>Admin</p>
          <h1 className="text-3xl font-light text-foreground"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>Products</h1>
        </div>
        <div className="relative">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="checkout-input appearance-none pr-8 text-xs w-40">
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
            <option value="">All</option>
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-12 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>Loading…</span>
        </div>
      ) : products.length === 0 ? (
        <p className="text-muted-foreground text-sm py-12" style={{ fontFamily: "'Montserrat', sans-serif" }}>No products found.</p>
      ) : (
        <>
          <div className="bg-card border border-border divide-y divide-border">
            {/* Header */}
            <div className="px-5 py-3 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center">
              {["Product", "Price", "Stock", ""].map((h) => (
                <span key={h} className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>{h}</span>
              ))}
            </div>

            {products.map((p: ApiProduct) => {
              const available = p.stock - p.reserved;
              const stockVal  = editingStock[p._id] ?? String(p.stock);
              const isEditing = p._id in editingStock;
              return (
                <div key={p._id}
                  className="px-5 py-4 grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center">
                  {/* Product info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-14 shrink-0 overflow-hidden bg-muted">
                      {p.images[0] && (
                        <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-light text-foreground truncate"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}>{p.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide"
                        style={{ fontFamily: "'Montserrat', sans-serif" }}>{p.sku}</p>
                      <span className={`text-[9px] tracking-[0.1em] uppercase px-1.5 py-0.5 ${
                        p.status === "active" ? "text-emerald-400 bg-emerald-400/10" :
                        p.status === "draft"  ? "text-yellow-400 bg-yellow-400/10" :
                                                "text-muted-foreground bg-muted/60"}`}
                        style={{ fontFamily: "'Montserrat', sans-serif" }}>{p.status}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <p className="text-sm text-foreground text-right"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}>{formatPrice(p.price)}</p>

                  {/* Stock editor */}
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={stockVal}
                      onChange={(e) => setEditingStock((prev) => ({ ...prev, [p._id]: e.target.value }))}
                      className="checkout-input py-1.5 text-xs w-20 text-right"
                    />
                    <span className={`text-[9px] ${available <= 0 ? "text-destructive" : available <= 5 ? "text-yellow-400" : "text-emerald-400"}`}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}>
                      {available <= 0 ? "OOS" : `${available} avail.`}
                    </span>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={() => handleStockSave(p._id)}
                    disabled={!isEditing || setStockMut.isPending}
                    className="text-[10px] tracking-[0.15em] uppercase text-primary hover:underline underline-offset-2 disabled:opacity-30 cursor-pointer"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Save
                  </button>
                </div>
              );
            })}
          </div>

          {data && data.pages > 1 && (
            <div className="flex gap-2 justify-center">
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 text-xs border cursor-pointer ${p === page ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary"}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
