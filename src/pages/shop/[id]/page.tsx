import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  Heart,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatPrice } from "@/lib/products.ts";
import Header from "../../_components/Header.tsx";
import Footer from "../../_components/Footer.tsx";
import ProductCard from "../../_components/ProductCard.tsx";
import { useCart } from "@/hooks/use-cart.tsx";
import { useCurrency } from "@/components/providers/currency.tsx";
import { useProduct, useProducts } from "@/hooks/use-api.ts";
import type { ApiProduct } from "@/lib/api.ts";
import { toast } from "sonner";
import { ProductDetailSkeleton } from "@/components/ui/skeleton.tsx";
import SizeGuideModal from "@/components/SizeGuideModal.tsx";
import PageMeta from "@/components/PageMeta.tsx";

// Adapter: ApiProduct → local Product shape expected by ProductCard / useCart
function toLocalProduct(p: ApiProduct) {
  return {
    id: p._id,
    name: p.title,
    price: p.price,
    originalPrice: p.compareAtPrice ?? undefined,
    category: p.categorySlug as "women" | "men" | "accessories" | "prints",
    tags: p.tags,
    sizes: ["XS", "S", "M", "L", "XL", "XXL"], // TODO: expand from variants when available
    colors: ["Default"],
    images:
      p.images.length > 0
        ? p.images
        : [
            "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&q=80",
          ],
    description: p.description,
    details: p.specs.map((s) => `${s.label}: ${s.value}`),
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

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  // id may be either the _id or the slug; the backend accepts both at /catalog/products/:slug
  const { data: product, isLoading, isError } = useProduct(id ?? "");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-[65px]">
          <ProductDetailSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p
            className="text-4xl font-light text-muted-foreground mb-6"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Product not found
          </p>
          <Link
            to="/shop"
            className="text-xs tracking-[0.2em] uppercase text-primary underline underline-offset-4"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title={product.title}
        description={
          product.description ||
          `${product.title} by LÁBí — Contemporary African fashion made in Nigeria.`
        }
        image={product.images[0]}
        type="product"
        canonical={`https://labiafrica.com/shop/${product.slug || product._id}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.title,
          description: product.description,
          image: product.images,
          brand: { "@type": "Brand", name: product.brandName || "LÁBí" },
          offers: {
            "@type": "Offer",
            priceCurrency: "NGN",
            price: product.price,
            availability:
              product.stock - product.reserved > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            seller: { "@type": "Organization", name: "LÁBí" },
          },
        }}
      />
      <Header />
      <div className="pt-[65px]">
        <ProductDetail product={product} />
      </div>
      <Footer />
    </div>
  );
}

function ProductDetail({ product }: { product: ApiProduct }) {
  const local = toLocalProduct(product);

  const [selectedImg, setSelectedImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(local.colors[0]);
  const [wished, setWished] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("description");
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const { addItem } = useCart();
  const { formatAmount, activeCurrency } = useCurrency();

  // Fetch related products from the same category
  const { data: relatedData } = useProducts({
    categorySlug: product.categorySlug,
    limit: 5,
  });
  const related = (relatedData?.items ?? [])
    .filter((p) => p._id !== product._id)
    .slice(0, 4);

  const inStock = product.stock - product.reserved > 0;

  const handleAddToCart = () => {
    if (!inStock) {
      toast.error("This item is currently out of stock");
      return;
    }
    if (local.sizes.length > 1 && !selectedSize) {
      toast.error("Please select a size");
      return;
    }
    addItem(local, selectedSize ?? local.sizes[0], selectedColor);
    toast.success(`${local.name} added to cart`);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-5 flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground border-b border-border">
        <Link
          to="/"
          className="hover:text-primary transition-colors"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Home
        </Link>
        <ChevronRight size={10} />
        <Link
          to="/shop"
          className="hover:text-primary transition-colors"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Shop
        </Link>
        <ChevronRight size={10} />
        <span
          className="text-foreground"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {product.title}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-20">
          {/* Image gallery */}
          <div className="flex gap-4">
            {/* Thumbnails */}
            <div className="hidden md:flex flex-col gap-3 w-20 shrink-0">
              {local.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  className={`w-20 h-24 overflow-hidden border-2 transition-all cursor-pointer ${
                    selectedImg === i
                      ? "border-primary"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
            {/* Main image */}
            <div
              className="flex-1 relative overflow-hidden"
              style={{ aspectRatio: "3/4" }}
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImg}
                  src={local.images[selectedImg]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </AnimatePresence>
              {/* Out-of-stock overlay */}
              {!inStock && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <span
                    className="bg-background/90 text-foreground text-xs tracking-[0.2em] uppercase px-4 py-2"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Out of Stock
                  </span>
                </div>
              )}
              {local.tag && inStock && (
                <div className="absolute top-5 left-5">
                  <span
                    className={`text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 font-semibold ${
                      local.tag === "Sale"
                        ? "bg-destructive text-white"
                        : "bg-primary text-primary-foreground"
                    }`}
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {local.tag}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Product info */}
          <div className="flex flex-col">
            <Link
              to="/shop"
              className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-primary transition-colors mb-8 w-fit"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              <ArrowLeft size={12} /> All Collections
            </Link>

            {/* Brand */}
            <p
              className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground mb-2"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {product.brandName}
            </p>

            <h1
              className="text-4xl md:text-5xl font-light text-foreground mb-3 leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {product.title}
            </h1>

            <div className="flex items-baseline gap-3 mb-8 flex-wrap">
              <p
                className="text-2xl text-primary font-semibold tracking-wide"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {formatAmount(product.price * 100)}
              </p>
              {product.compareAtPrice && (
                <p
                  className="text-muted-foreground line-through text-lg"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {formatAmount(product.compareAtPrice * 100)}
                </p>
              )}
              {/* Secondary NGN price when showing a non-NGN currency */}
              {activeCurrency !== "NGN" && (
                <p
                  className="text-muted-foreground text-sm"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                  aria-label={`Original price: ${formatPrice(product.price)}`}
                >
                  · {formatPrice(product.price)}
                </p>
              )}
            </div>

            {/* Sizes */}
            {inStock && local.sizes.length > 1 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="text-[10px] tracking-[0.25em] uppercase text-muted-foreground"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Size:{" "}
                    <span className="text-foreground">
                      {selectedSize ?? "Select"}
                    </span>
                  </p>
                  <button
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-[10px] tracking-[0.15em] uppercase text-primary underline underline-offset-4 cursor-pointer"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Size Guide
                  </button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {local.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 text-xs border transition-all cursor-pointer ${
                        selectedSize === size
                          ? "border-primary text-primary bg-primary/10"
                          : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                      }`}
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CTAs */}
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleAddToCart}
                disabled={!inStock}
                className={`flex-1 flex items-center justify-center gap-3 py-4 text-xs tracking-[0.2em] uppercase font-semibold transition-colors ${
                  inStock
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                <ShoppingBag size={14} />
                {inStock ? "Add to Cart" : "Out of Stock"}
              </button>
              <button
                onClick={() => setWished(!wished)}
                className={`w-14 h-14 border flex items-center justify-center transition-all cursor-pointer ${
                  wished
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <Heart size={16} className={wished ? "fill-primary" : ""} />
              </button>
            </div>

            {/* Custom order link */}
            <Link
              to={`/custom-order?garment=${encodeURIComponent(product.categoryName)}`}
              className="flex items-center justify-center gap-2 w-full border border-border text-muted-foreground py-3.5 text-xs tracking-[0.15em] uppercase hover:border-primary hover:text-primary transition-colors mb-8 cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Request a Custom Version of This Piece
            </Link>

            {/* Stock indicator */}
            {inStock && product.stock - product.reserved <= 5 && (
              <p
                className="text-xs text-destructive mb-4"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Only {product.stock - product.reserved} left in stock
              </p>
            )}

            {/* Accordion */}
            <div className="border-t border-border">
              {[
                {
                  id: "description",
                  label: "Description",
                  content: (
                    <p
                      className="text-muted-foreground text-base font-light leading-relaxed"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      {product.description}
                    </p>
                  ),
                },
                ...(product.specs.length > 0
                  ? [
                      {
                        id: "details",
                        label: "Details & Care",
                        content: (
                          <ul className="space-y-2">
                            {product.specs.map((s, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-muted-foreground text-base font-light"
                                style={{
                                  fontFamily: "'Cormorant Garamond', serif",
                                }}
                              >
                                <span className="text-primary mt-1 text-xs">
                                  —
                                </span>
                                {s.label}: {s.value}
                              </li>
                            ))}
                          </ul>
                        ),
                      },
                    ]
                  : []),
                {
                  id: "shipping",
                  label: "Shipping & Returns",
                  content: (
                    <div
                      className="text-muted-foreground text-base font-light space-y-2"
                      style={{ fontFamily: "'Cormorant Garamond', serif" }}
                    >
                      <p>Free delivery within Lagos (2–3 days).</p>
                      <p>Nationwide delivery: 3–5 business days.</p>
                      <p>International shipping available.</p>
                      <p>Returns accepted within 14 days, unworn condition.</p>
                    </div>
                  ),
                },
              ].map((section) => (
                <div key={section.id} className="border-b border-border">
                  <button
                    onClick={() =>
                      setOpenSection(
                        openSection === section.id ? null : section.id,
                      )
                    }
                    className="w-full flex items-center justify-between py-4 cursor-pointer"
                  >
                    <span
                      className="text-[10px] tracking-[0.25em] uppercase text-foreground font-semibold"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {section.label}
                    </span>
                    <motion.div
                      animate={{ rotate: openSection === section.id ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown
                        size={14}
                        className="text-muted-foreground"
                      />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openSection === section.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-5">{section.content}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile thumbnails */}
        <div className="flex gap-3 mt-4 md:hidden overflow-x-auto pb-2">
          {local.images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedImg(i)}
              className={`w-16 h-20 shrink-0 overflow-hidden border-2 transition-all cursor-pointer ${
                selectedImg === i
                  ? "border-primary"
                  : "border-transparent opacity-60"
              }`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      </div>

      {/* Related products */}
      {related.length > 0 && (
        <section className="border-t border-border py-20">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-8 h-[2px] bg-primary" />
              <span
                className="text-xs tracking-[0.3em] uppercase text-primary"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                You May Also Like
              </span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((p, i) => (
                <ProductCard
                  key={p._id}
                  product={toLocalProduct(p)}
                  index={i}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <SizeGuideModal
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
        category={
          product.categorySlug === "men"
            ? "men"
            : product.categorySlug === "accessories"
              ? "accessories"
              : "women"
        }
      />
    </>
  );
}
