import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { type Product } from "@/lib/products.ts";
import { useCurrency } from "@/components/providers/currency.tsx";

type Props = {
  product: Product;
  index: number;
};

export default function ProductCard({ product, index }: Props) {
  const [wished, setWished] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const { formatAmount, isLoading } = useCurrency();

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        delay: (index % 4) * 0.1,
        ease: "easeOut" as const,
      }}
      className="group"
    >
      <Link to={`/shop/${product.id}`} className="block">
        <div
          className="relative overflow-hidden mb-4"
          style={{ aspectRatio: "3/4" }}
          onMouseEnter={() => product.images[1] && setImgIdx(1)}
          onMouseLeave={() => setImgIdx(0)}
        >
          <img
            src={product.images[imgIdx]}
            alt={product.name}
            className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
          />
          {product.tag && (
            <div className="absolute top-4 left-4">
              <span
                className={`text-[10px] tracking-[0.15em] uppercase px-2.5 py-1 font-semibold ${
                  product.tag === "Sale"
                    ? "bg-destructive text-white"
                    : "bg-primary text-primary-foreground"
                }`}
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {product.tag}
              </span>
            </div>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              setWished(!wished);
            }}
            className="absolute top-4 right-4 w-9 h-9 bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer hover:bg-primary"
          >
            <Heart
              size={15}
              className={
                wished ? "text-primary fill-primary" : "text-foreground"
              }
            />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-primary text-primary-foreground py-3.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2">
            <ShoppingBag size={14} />
            <span
              className="text-xs tracking-[0.15em] uppercase font-semibold"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Quick Add
            </span>
          </div>
        </div>
      </Link>
      <div>
        <Link to={`/shop/${product.id}`}>
          <h3
            className="text-foreground text-xl font-light mb-1 hover:text-primary transition-colors"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2">
          <p
            className="text-primary text-sm font-semibold tracking-wide"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {/* Skeleton while currency loads to avoid layout shift */}
            {isLoading ? (
              <span
                className="inline-block w-16 h-4 bg-muted animate-pulse"
                aria-hidden="true"
              />
            ) : (
              formatAmount(product.price * 100)
            )}
          </p>
          {product.originalPrice && (
            <p
              className="text-muted-foreground text-sm line-through"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {formatAmount(product.originalPrice * 100)}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
