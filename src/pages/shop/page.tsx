import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import Header from "../_components/Header.tsx";
import Footer from "../_components/Footer.tsx";
import ProductCard from "../_components/ProductCard.tsx";
import { useProducts, useCategories } from "@/hooks/use-api.ts";
import type { ApiProduct } from "@/lib/api.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

// ── Adapts API product to the shape ProductCard expects ──────────────────────
function toLocalProduct(p: ApiProduct) {
  return {
    id: p._id,
    name: p.title,
    price: p.price,
    originalPrice: p.compareAtPrice ?? undefined,
    category: p.categorySlug as "women" | "men" | "accessories" | "prints",
    tags: p.tags,
    sizes: [], // variants not expanded in list view
    colors: [],
    images:
      p.images.length > 0
        ? p.images
        : [
            "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&q=80",
          ],
    description: p.description,
    details: [],
    inStock: p.stock - p.reserved > 0,
    tag: p.tags.includes("new_arrival")
      ? ("New" as const)
      : p.tags.includes("best_seller")
        ? ("Bestseller" as const)
        : p.tags.includes("deal")
          ? ("Sale" as const)
          : undefined,
  };
}

const SORT_OPTIONS = [
  { id: "default", label: "Featured" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "name", label: "Name A–Z" },
];

const PRICE_RANGES = [
  { id: "all", label: "All Prices", min: undefined, max: undefined },
  { id: "under30", label: "Under ₦30,000", min: undefined, max: 30000 },
  { id: "30to60", label: "₦30,000 – ₦60,000", min: 30000, max: 60000 },
  { id: "over60", label: "Over ₦60,000", min: 60000, max: undefined },
];

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [category, setCategory] = useState(
    searchParams.get("category") ?? "all",
  );
  const [priceRange, setPriceRange] = useState("all");
  const [sort, setSort] = useState("default");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const sortRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown on outside click
  useEffect(() => {
    if (!sortOpen) return;
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [sortOpen]);

  // Sync category + search query from URL
  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setCategory(cat);
    else setCategory("all");
  }, [searchParams]);

  const searchQuery = searchParams.get("q") ?? undefined;

  const priceConfig =
    PRICE_RANGES.find((p) => p.id === priceRange) ?? PRICE_RANGES[0];

  // Map sort to API param
  const sortParam =
    sort === "price-asc"
      ? "price_asc"
      : sort === "price-desc"
        ? "price_desc"
        : sort === "name"
          ? "name_asc"
          : undefined;

  const { data, isLoading, isError } = useProducts({
    q: searchQuery,
    categorySlug: category !== "all" ? category : undefined,
    min: priceConfig.min,
    max: priceConfig.max,
    sort: sortParam,
    page,
    limit: 24,
  });

  const { data: categories } = useCategories("category");

  const products = data?.items ?? [];
  const total = data?.total ?? 0;

  const activeFilterCount =
    (category !== "all" ? 1 : 0) + (priceRange !== "all" ? 1 : 0);

  const clearFilters = useCallback(() => {
    setCategory("all");
    setPriceRange("all");
    setSearchParams({});
  }, [setSearchParams]);

  const handleCategoryChange = (slug: string) => {
    setCategory(slug);
    setPage(1);
    if (slug !== "all") setSearchParams({ category: slug });
    else setSearchParams({});
  };

  const allCategories = [
    { slug: "all", name: "All" },
    ...(categories ?? []).map((c) => ({ slug: c.slug, name: c.name })),
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Page hero */}
      <div className="pt-[65px] border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p
              className="text-xs tracking-[0.3em] uppercase text-primary mb-3"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Explore
            </p>
            <h1
              className="text-5xl md:text-6xl font-light text-foreground"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {searchQuery ? `"${searchQuery}"` : "All Collections"}
            </h1>
          </div>
          <p
            className="text-muted-foreground text-sm"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {isLoading ? "Loading…" : `${total} piece${total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Category pills */}
        <div className="flex gap-2 flex-wrap mb-8 overflow-x-auto pb-1">
          {allCategories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-5 py-2 text-xs tracking-[0.15em] uppercase transition-all duration-200 cursor-pointer whitespace-nowrap border ${
                category === cat.slug
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          {/* Filter button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 border border-border px-4 py-2.5 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            <SlidersHorizontal size={13} />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Active filter chips */}
          <div className="flex gap-2 flex-wrap flex-1">
            {category !== "all" && (
              <FilterChip
                label={
                  allCategories.find((c) => c.slug === category)?.name ??
                  category
                }
                onRemove={() => handleCategoryChange("all")}
              />
            )}
            {priceRange !== "all" && (
              <FilterChip
                label={
                  PRICE_RANGES.find((p) => p.id === priceRange)?.label ??
                  priceRange
                }
                onRemove={() => setPriceRange("all")}
              />
            )}
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-[10px] tracking-widest uppercase text-muted-foreground underline underline-offset-4 cursor-pointer"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Clear all
              </button>
            )}
          </div>

          {/* Sort */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-2 border border-border px-4 py-2.5 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {SORT_OPTIONS.find((o) => o.id === sort)?.label}
              <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {sortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 top-full mt-1 bg-card border border-border w-48 z-30"
                >
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => {
                        setSort(o.id);
                        setSortOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-xs tracking-[0.1em] uppercase transition-colors cursor-pointer ${
                        sort === o.id
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {o.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Product grid */}
        {isLoading ? (
          <div className="py-32 flex justify-center">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : isError ? (
          <div className="py-32 text-center">
            <p
              className="text-2xl font-light text-muted-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Could not load products
            </p>
            <p
              className="text-xs text-muted-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Make sure the backend is running at{" "}
              {import.meta.env.VITE_API_URL ?? "http://localhost:4000"}
            </p>
          </div>
        ) : products.length === 0 ? (
          <div className="py-32 text-center">
            <p
              className="text-3xl font-light text-muted-foreground mb-4"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              No pieces found
            </p>
            <button
              onClick={clearFilters}
              className="text-xs tracking-[0.2em] uppercase text-primary underline underline-offset-4 cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, i) => (
                <ProductCard
                  key={product._id}
                  product={toLocalProduct(product)}
                  index={i}
                />
              ))}
            </div>

            {/* Pagination */}
            {data && data.pages > 1 && (
              <div className="flex justify-center gap-2 mt-16">
                {Array.from({ length: data.pages }, (_, i) => i + 1).map(
                  (p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setPage(p);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className={`w-10 h-10 text-xs border transition-all cursor-pointer ${
                        p === page
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary hover:text-primary"
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

      {/* Filter Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ duration: 0.35, ease: "easeOut" as const }}
              className="fixed top-0 left-0 h-full w-80 bg-card border-r border-border z-50 overflow-y-auto flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <span
                  className="text-xs tracking-[0.3em] uppercase text-foreground font-semibold"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Filters
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 px-6 py-6 space-y-8">
                {/* Category */}
                <div>
                  <FilterSectionLabel>Category</FilterSectionLabel>
                  <div className="space-y-2 mt-3">
                    {allCategories.map((cat) => (
                      <button
                        key={cat.slug}
                        onClick={() => {
                          handleCategoryChange(cat.slug);
                          setDrawerOpen(false);
                        }}
                        className={`w-full text-left text-sm py-1 transition-colors cursor-pointer ${
                          category === cat.slug
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price */}
                <div>
                  <FilterSectionLabel>Price</FilterSectionLabel>
                  <div className="space-y-2 mt-3">
                    {PRICE_RANGES.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPriceRange(p.id);
                          setDrawerOpen(false);
                        }}
                        className={`w-full text-left text-sm py-1 transition-colors cursor-pointer ${
                          priceRange === p.id
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 border-t border-border flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 border border-border py-3 text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground hover:border-foreground transition-colors cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Clear
                </button>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 bg-primary text-primary-foreground py-3 text-xs tracking-[0.15em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Apply ({products.length})
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="flex items-center gap-1.5 bg-muted px-3 py-1 text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-foreground cursor-pointer"
      >
        <X size={10} />
      </button>
    </span>
  );
}

function FilterSectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold"
      style={{ fontFamily: "'Montserrat', sans-serif" }}
    >
      {children}
    </p>
  );
}

// formatPrice is no longer exported from here — import from @/lib/products.ts directly.
// This export is kept temporarily for any legacy imports; will be removed in cleanup.
export { formatPrice } from "@/lib/products.ts";
