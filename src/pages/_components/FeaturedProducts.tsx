import { motion } from "motion/react";
import { PRODUCTS } from "@/lib/products.ts";
import ProductCard from "./ProductCard.tsx";

const FEATURED = PRODUCTS.slice(0, 4);

export default function FeaturedProducts() {
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
          <a
            href="/shop"
            className="hidden md:inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary border-b border-primary pb-0.5 hover:gap-4 transition-all duration-300"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            View All
          </a>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURED.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
