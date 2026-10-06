import { Link } from "react-router-dom";
import { motion } from "motion/react";
import Header from "../_components/Header.tsx";
import Footer from "../_components/Footer.tsx";
import { useLookbook } from "@/hooks/use-api.ts";
import { Spinner } from "@/components/ui/spinner.tsx";
import PageMeta from "@/components/PageMeta.tsx";

// Fallback items shown while loading or when the lookbook is empty
const FALLBACK = [
  {
    _id: "f1",
    imageUrl:
      "https://images.unsplash.com/photo-1531123414780-f74242c2b052?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    title: "The Harmattan Edit",
    season: "SS 2025",
  },
  {
    _id: "f2",
    imageUrl:
      "https://images.unsplash.com/photo-1552710307-537199cd41c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    title: "Fabric Stories",
    season: "Artisan Series",
  },
  {
    _id: "f3",
    imageUrl:
      "https://images.unsplash.com/photo-1578509566163-068acd11b8e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    title: "Colour & Pattern",
    season: "Print Studio",
  },
  {
    _id: "f4",
    imageUrl:
      "https://images.unsplash.com/photo-1611580045568-7201033c7a3b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    title: "Eko Summer",
    season: "Resort 2025",
  },
  {
    _id: "f5",
    imageUrl:
      "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    title: "Heritage Craft",
    season: "Signature Collection",
  },
  {
    _id: "f6",
    imageUrl:
      "https://images.unsplash.com/photo-1625646741211-711bdd65c570?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800",
    title: "Bold Expression",
    season: "Editorial",
  },
];

export default function LookbookPage() {
  const { data, isLoading } = useLookbook();
  const items = data?.length ? data : FALLBACK;

  return (
    <div className="min-h-screen bg-background">
      <PageMeta
        title="Lookbook — The Labi Edit"
        description="A visual journey through LÁBí's seasonal collections — celebrating the richness of African print, pattern, and Aṣọ-Òkè craftsmanship."
        canonical="https://labiafrica.com/lookbook"
        image={items[0]?.imageUrl}
      />
      <Header />

      {/* Hero banner */}
      <section className="relative h-[55vh] flex items-end overflow-hidden mt-[65px]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url("${items[0]?.imageUrl ?? FALLBACK[0].imageUrl}")`,
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

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Spinner className="size-8 text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[240px]">
            {items.map((item, i) => {
              // Make every 5th item span 2 rows for a masonry feel
              const tall = i % 5 === 0;
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: (i % 4) * 0.07 }}
                  className={`group relative overflow-hidden cursor-pointer ${tall ? "row-span-2" : "row-span-1"}`}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-5">
                    <div>
                      <div className="w-4 h-[1px] bg-primary mb-2" />
                      <p
                        className="text-white text-lg font-light"
                        style={{ fontFamily: "'Cormorant Garamond', serif" }}
                      >
                        {item.title}
                      </p>
                      {item.season && (
                        <p
                          className="text-white/60 text-[10px] tracking-[0.2em] uppercase mt-0.5"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {item.season}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

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
