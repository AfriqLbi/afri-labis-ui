import { motion } from "motion/react";

export default function BrandStory() {
  return (
    <section className="py-32 bg-card border-y border-border overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" as const }}
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-8 h-[2px] bg-primary" />
            <span
              className="text-xs tracking-[0.3em] uppercase text-primary"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Our Story
            </span>
          </div>
          <h2
            className="text-5xl md:text-6xl font-light text-foreground mb-8 leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Dressed in the{" "}
            <em className="text-primary not-italic">language</em>
            {" "}of Africa.
          </h2>
          <p
            className="text-muted-foreground text-lg font-light leading-relaxed mb-6"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            LABI was born from a love of African textiles and a desire to bring 
            the extraordinary craftsmanship of the continent to the modern wardrobe. 
            Every piece tells a story — woven in tradition, cut for the present.
          </p>
          <p
            className="text-muted-foreground text-lg font-light leading-relaxed mb-10"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            We work directly with artisan weavers and print-makers across West Africa, 
            ensuring fair trade and celebrating techniques passed down across generations.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-3 text-xs tracking-[0.2em] uppercase text-primary border-b border-primary pb-1 hover:gap-5 transition-all duration-300"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Read Our Story
          </a>
        </motion.div>

        {/* Image collage */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" as const }}
          className="relative"
        >
          <div className="grid grid-cols-2 gap-3">
            <img
              src="https://images.unsplash.com/photo-1531123414780-f74242c2b052?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500"
              alt="Brand story 1"
              className="w-full object-cover mt-10"
              style={{ aspectRatio: "3/4" }}
            />
            <img
              src="https://images.unsplash.com/photo-1709809081557-78f803ce93a0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=500"
              alt="Brand story 2"
              className="w-full object-cover -mt-10"
              style={{ aspectRatio: "3/4" }}
            />
          </div>
          {/* Gold border accent */}
          <div className="absolute -bottom-4 -right-4 w-32 h-32 border-2 border-primary -z-10" />
          <div className="absolute -top-4 -left-4 w-20 h-20 border border-primary/40 -z-10" />
        </motion.div>
      </div>

      {/* Stats row */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" as const }}
        className="max-w-7xl mx-auto px-6 mt-24 grid grid-cols-2 md:grid-cols-4 gap-8 border-t border-border pt-16"
      >
        {[
          { num: "12+", label: "Artisan Families" },
          { num: "6", label: "African Countries" },
          { num: "200+", label: "Unique Prints" },
          { num: "2018", label: "Est. Lagos" },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <p
              className="text-5xl font-light text-primary mb-2"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {stat.num}
            </p>
            <p
              className="text-xs tracking-[0.2em] uppercase text-muted-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </motion.div>
    </section>
  );
}
