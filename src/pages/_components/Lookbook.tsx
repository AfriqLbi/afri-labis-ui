import { motion } from "motion/react";
import { Link } from "react-router-dom";

const LOOKBOOK = [
  {
    img: "https://images.unsplash.com/photo-1531123414780-f74242c2b052?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    label: "The Harmattan Edit",
    size: "tall",
  },
  {
    img: "https://images.unsplash.com/photo-1552710307-537199cd41c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    label: "Fabric Stories",
    size: "short",
  },
  {
    img: "https://images.unsplash.com/photo-1578509566163-068acd11b8e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    label: "Colour & Pattern",
    size: "short",
  },
  {
    img: "https://images.unsplash.com/photo-1611580045568-7201033c7a3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    label: "Eko Summer",
    size: "tall",
  },
];

export default function Lookbook() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
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
              Lookbook
            </span>
          </div>
          <h2
            className="text-5xl md:text-6xl font-light text-foreground"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            The Labi Edit
          </h2>
        </div>
        <Link
          to="/lookbook"
          className="hidden md:inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-primary border-b border-primary pb-0.5 hover:gap-4 transition-all duration-300"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Full Lookbook
        </Link>
      </motion.div>

      {/* Masonry-style grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {LOOKBOOK.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.7,
              delay: i * 0.1,
              ease: "easeOut" as const,
            }}
            className={`group relative overflow-hidden cursor-pointer ${
              item.size === "tall" ? "row-span-2" : "row-span-1"
            }`}
            style={{ aspectRatio: item.size === "tall" ? "auto" : "4/3" }}
          >
            <Link
              to="/lookbook"
              className="block w-full h-full absolute inset-0"
            >
              <span className="sr-only">{item.label}</span>
            </Link>
            <img
              src={item.img}
              alt={item.label}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-107"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
              <div>
                <div className="w-4 h-[1px] bg-primary mb-2" />
                <p
                  className="text-white text-lg font-light"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {item.label}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
