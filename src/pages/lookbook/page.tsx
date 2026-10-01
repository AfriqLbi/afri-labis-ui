import { Link } from "react-router-dom";
import { motion } from "motion/react";
import Header from "../_components/Header.tsx";
import Footer from "../_components/Footer.tsx";

const LOOKBOOK_ITEMS = [
  {
    img: "https://images.unsplash.com/photo-1531123414780-f74242c2b052?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    label: "The Harmattan Edit",
    sub: "SS 2025",
    size: "tall",
  },
  {
    img: "https://images.unsplash.com/photo-1552710307-537199cd41c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    label: "Fabric Stories",
    sub: "Artisan Series",
    size: "short",
  },
  {
    img: "https://images.unsplash.com/photo-1578509566163-068acd11b8e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    label: "Colour & Pattern",
    sub: "Print Studio",
    size: "short",
  },
  {
    img: "https://images.unsplash.com/photo-1611580045568-7201033c7a3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    label: "Eko Summer",
    sub: "Resort 2025",
    size: "tall",
  },
  {
    img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    label: "Heritage Craft",
    sub: "Signature Collection",
    size: "short",
  },
  {
    img: "https://images.unsplash.com/photo-1625646741211-711bdd65c570?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    label: "Bold Expression",
    sub: "Editorial",
    size: "short",
  },
  {
    img: "https://images.unsplash.com/photo-1574442624044-945f29ccb2a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    label: "Evening Ritual",
    sub: "Evening Wear",
    size: "tall",
  },
  {
    img: "https://images.unsplash.com/photo-1520011207eed-66e55d7d47b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    label: "Lagos Streets",
    sub: "Street Style",
    size: "short",
  },
];

export default function LookbookPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero banner */}
      <section className="relative h-[55vh] flex items-end overflow-hidden mt-[65px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1531123414780-f74242c2b052?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-primary text-xs tracking-[0.4em] uppercase mb-4"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            SS 2025
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="text-5xl md:text-7xl font-light text-white"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            The Labi Edit
          </motion.h1>
        </div>
      </section>

      {/* Grid */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-muted-foreground text-sm font-light max-w-xl mb-16 leading-relaxed"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          A visual journey through LABI's seasonal collections — celebrating the
          richness of African print, pattern, and ancestral craft.
        </motion.p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 auto-rows-[220px]">
          {LOOKBOOK_ITEMS.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.97 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.07 }}
              className={`group relative overflow-hidden cursor-pointer ${
                item.size === "tall" ? "row-span-2" : "row-span-1"
              }`}
            >
              <img
                src={item.img}
                alt={item.label}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
                <div>
                  <div className="w-4 h-[1px] bg-primary mb-2" />
                  <p
                    className="text-white text-lg font-light"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {item.label}
                  </p>
                  <p
                    className="text-white/60 text-[10px] tracking-[0.2em] uppercase mt-0.5"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {item.sub}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mt-20 flex flex-col items-center gap-6 text-center"
        >
          <p
            className="text-2xl md:text-3xl font-light text-foreground"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Ready to wear the collection?
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-3 bg-primary text-primary-foreground px-10 py-4 text-xs tracking-[0.25em] uppercase font-semibold hover:bg-primary/90 transition-colors"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Shop Now
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
