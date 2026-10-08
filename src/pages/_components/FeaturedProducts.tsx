import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { PRODUCTS, type Product } from "@/lib/products.ts";
import { useProducts } from "@/hooks/use-api.ts";
import type { ApiProduct } from "@/lib/api.ts";
import ProductCard from "./ProductCard.tsx";

/** Map an ApiProduct to the local Product shape that ProductCard expects. */
function apiToProduct(p: ApiProduct): Product {
  return {
    id: p.slug || p._id,
    _id: p._id, // ObjectId needed for checkout inline-items
    name: p.title,
    // normaliseProduct already gives full NGN naira — no division needed
    price: p.price,
    originalPrice: p.compareAtPrice ?? undefined,
    category: (p.categorySlug as Product["category"]) ?? "women",
    tags: p.tags ?? [],
    sizes: [],
    colors: [],
    images: p.images?.length
      ? p.images
      : [
          "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
        ],
    description: p.description ?? "",
    details: p.specs?.map((s) => `${s.label}: ${s.value}`) ?? [],
    inStock: p.stock > 0,
    tag: p.tags?.includes("new_arrival")
      ? "New"
      : p.tags?.includes("best_seller")
        ? "Bestseller"
        : p.compareAtPrice
          ? "Sale"
          : undefined,
  };
}

export default function FeaturedProducts() {
  const { data, isLoading } = useProducts({ limit: 4 });

  // Use live API data if available, fall back to static mock
  const products: Product[] = data?.items?.length
    ? data.items.slice(0, 4).map(apiToProduct)
    : PRODUCTS.slice(0, 4);

  return (
    <section className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="flex items-end justify-between mb-14"
        >
          <div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-[2px] bg-primary" />
              <span
                className="text-xs tracking-[0.3em] uppercase text-primary"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Featured
              </span>
            </div>
            <h2
              className="text-5xl md:text-6xl font-light text-foreground"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              New Arrivals
            </h2>
          </div>
          <Link
            to="/shop"
            className="hidden md:inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary border-b border-primary pb-0.5 hover:gap-4 transition-all duration-300"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            View All
          </Link>
        </motion.div>

        {isLoading ? (
          /* Skeleton grid while loading */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <div
                  className="bg-muted animate-pulse w-full"
                  style={{ aspectRatio: "3/4" }}
                />
                <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                <div className="h-3 bg-muted animate-pulse rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <ProductCard key={product.id} product={product} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
