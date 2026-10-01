import { motion } from "motion/react";
import { Link } from "react-router-dom";

const CATEGORIES = [
  {
    label: "Women's Collection",
    sub: "Dresses, sets & accessories",
    img: "https://images.unsplash.com/photo-1531123414780-f74242c2b052?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    href: "/shop?category=women",
  },
  {
    label: "African Prints",
    sub: "Ankara, kente & adire",
    img: "https://images.unsplash.com/photo-1552710307-537199cd41c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    href: "/shop?category=prints",
  },
  {
    label: "Editorial",
    sub: "Campaign & lookbook",
    img: "https://images.unsplash.com/photo-1625646741211-711bdd65c570?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    href: "/lookbook",
  },
];

export default function FeaturedCategories() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: "easeOut" as const }}
        className="flex items-center gap-4 mb-14"
      >
        <div className="w-8 h-[2px] bg-primary" />
        <span
          className="text-xs tracking-[0.3em] uppercase text-primary"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Shop by Category
        </span>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CATEGORIES.map((cat, i) => (
          <motion.div
            key={cat.label}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.7,
              delay: i * 0.15,
              ease: "easeOut" as const,
            }}
          >
            <Link
              to={cat.href}
              className="group relative overflow-hidden cursor-pointer block"
              style={{ aspectRatio: "3/4" }}
            >
              <img
                src={cat.img}
                alt={cat.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              {/* Gold hover overlay */}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Bottom label */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="w-6 h-[1px] bg-primary mb-3 transition-all duration-300 group-hover:w-12" />
                <h3
                  className="text-white text-2xl font-light mb-1"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {cat.label}
                </h3>
                <p
                  className="text-white/60 text-xs tracking-[0.15em] uppercase"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {cat.sub}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
