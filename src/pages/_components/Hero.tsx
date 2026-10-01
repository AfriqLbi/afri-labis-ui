import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-end overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url("https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920")`,
        }}
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />

      {/* Gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24 pt-40 w-full">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" as const }}
            className="text-primary text-xs tracking-[0.4em] uppercase mb-6"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            New Collection — SS 2025
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.35, ease: "easeOut" as const }}
            className="text-6xl md:text-8xl lg:text-[7rem] font-light text-white leading-[0.9] text-balance mb-8"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Rooted in
            <br />
            <em className="text-primary not-italic font-semibold">Heritage.</em>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" as const }}
            className="text-white/70 text-lg font-light max-w-lg mb-10 leading-relaxed"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Contemporary African fashion that celebrates the richness of print,
            pattern, and ancestral craft — worn with pride.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" as const }}
            className="flex flex-wrap gap-4"
          >
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-8 py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Shop Collection <ArrowRight size={14} />
            </Link>
            <Link
              to="/lookbook"
              className="inline-flex items-center gap-3 border border-white/40 text-white px-8 py-4 text-xs tracking-[0.2em] uppercase font-medium hover:border-primary hover:text-primary transition-colors cursor-pointer"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Explore Lookbook
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-8 right-8 flex flex-col items-center gap-2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{
            repeat: Infinity,
            duration: 1.8,
            ease: "easeInOut" as const,
          }}
          className="w-[1px] h-12 bg-primary/60"
        />
        <span
          className="text-[10px] tracking-[0.3em] text-white/40 uppercase rotate-90 translate-x-4"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
