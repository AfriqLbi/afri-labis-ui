import { motion } from "motion/react";
import { Link } from "react-router-dom";
import Header from "../_components/Header.tsx";
import Footer from "../_components/Footer.tsx";

const PILLARS = [
  {
    num: "01",
    title: "Heritage First",
    body: "Aṣọ-Òkè and African textiles are among the world's most extraordinary woven traditions. We honour that craftsmanship in every cut and seam.",
  },
  {
    num: "02",
    title: "Modern & Wearable",
    body: "African clothing should not live only in museums or on special occasions. Our pieces are designed for every day — anywhere in the world.",
  },
  {
    num: "03",
    title: "Community-Built",
    body: "We work with local weavers, tailors and artisans in Ilorin and across Nigeria, creating livelihoods while keeping traditional skills alive.",
  },
  {
    num: "04",
    title: "Global Ambition",
    body: "Our long-term vision is to become a major non-oil export brand from Nigeria — taking African-made textiles and garments to customers around the world.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* ── Hero ── */}
      <section className="relative h-[65vh] flex items-end overflow-hidden mt-[65px]">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url("https://images.unsplash.com/photo-1531123414780-f74242c2b052?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920")`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/10" />
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 w-full">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-primary text-xs tracking-[0.4em] uppercase mb-4"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Èwà Omoluabi
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="text-5xl md:text-7xl lg:text-8xl font-light text-white leading-[0.95]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            About{" "}
            <em className="text-primary not-italic font-semibold">LÁBí</em>
          </motion.h1>
        </div>
      </section>

      {/* ── Mission statement ── */}
      <section className="py-24 max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9 }}
          className="space-y-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-8 h-[2px] bg-primary" />
            <span
              className="text-xs tracking-[0.3em] uppercase text-primary"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Who We Are
            </span>
          </div>
          <p
            className="text-4xl md:text-5xl font-light text-foreground leading-snug"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            LÁBí is an indigenous African textile and fashion brand founded in{" "}
            <em className="text-primary not-italic">Ilorin, Kwara State, Nigeria.</em>
          </p>
          <p
            className="text-xl font-light text-muted-foreground leading-relaxed max-w-3xl"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            We are on a mission to take Aṣọ-Òkè and African textiles to the world —
            transforming traditional woven fabrics into modern pieces that can be worn
            every day, anywhere in the world.
          </p>
          <p
            className="text-lg font-light text-muted-foreground leading-relaxed max-w-3xl"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            At LÁBí, we believe African clothing should not be preserved only in
            museums or worn only on special occasions. Our culture can be modern,
            functional, stylish and global.
          </p>
        </motion.div>
      </section>

      {/* ── What we make ── */}
      <section className="py-20 bg-card border-y border-border">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          {/* Image collage */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="relative"
          >
            <div className="grid grid-cols-2 gap-3">
              <img
                src="https://images.unsplash.com/photo-1552710307-537199cd41c0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                alt="Aṣọ-Òkè weaving"
                className="w-full object-cover mt-10"
                style={{ aspectRatio: "3/4" }}
              />
              <img
                src="https://images.unsplash.com/photo-1578509566163-068acd11b8e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=600"
                alt="LÁBí craftsmanship"
                className="w-full object-cover -mt-10"
                style={{ aspectRatio: "3/4" }}
              />
            </div>
            <div className="absolute -bottom-4 -right-4 w-32 h-32 border-2 border-primary -z-10" />
            <div className="absolute -top-4 -left-4 w-20 h-20 border border-primary/40 -z-10" />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.15 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-8 h-[2px] bg-primary" />
              <span
                className="text-xs tracking-[0.3em] uppercase text-primary"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                What We Make
              </span>
            </div>
            <h2
              className="text-4xl md:text-5xl font-light text-foreground leading-tight"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Tradition woven into{" "}
              <em className="text-primary not-italic">modern form.</em>
            </h2>
            <p
              className="text-lg font-light text-muted-foreground leading-relaxed"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              From our FÌLÁ and Aṣọ-Òkè trousers to jackets, shirts, coats and
              other contemporary pieces — we combine traditional craftsmanship with
              modern design to create clothing that allows people to wear their
              heritage with pride.
            </p>
            <Link
              to="/shop"
              className="inline-flex items-center gap-3 text-xs tracking-[0.2em] uppercase text-primary border-b border-primary pb-1 hover:gap-5 transition-all duration-300"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Shop the Collection
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Four pillars ── */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-4 mb-16"
        >
          <div className="w-8 h-[2px] bg-primary" />
          <span
            className="text-xs tracking-[0.3em] uppercase text-primary"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            What We Stand For
          </span>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {PILLARS.map((p, i) => (
            <motion.div
              key={p.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.1 }}
              className="border-t border-border pt-6 space-y-4"
            >
              <p
                className="text-primary text-xs tracking-[0.3em]"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {p.num}
              </p>
              <h3
                className="text-xl font-light text-foreground"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {p.title}
              </h3>
              <p
                className="text-sm font-light text-muted-foreground leading-relaxed"
                style={{ fontFamily: "'Cormorant Garamond', serif" }}
              >
                {p.body}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Community & vision ── */}
      <section className="py-24 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-6 space-y-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex items-center gap-4"
          >
            <div className="w-8 h-[2px] bg-primary" />
            <span
              className="text-xs tracking-[0.3em] uppercase text-primary"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Our Vision
            </span>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.1 }}
            className="text-3xl md:text-4xl font-light text-foreground leading-snug"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            LÁBí is more than a clothing line.{" "}
            <em className="text-primary not-italic">
              We are building a proudly African textile and fashion ecosystem.
            </em>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <p
              className="text-lg font-light text-muted-foreground leading-relaxed"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              We work with local weavers, tailors and artisans, creating opportunities
              within our communities while building an African textile brand with
              global ambitions.
            </p>
            <p
              className="text-lg font-light text-muted-foreground leading-relaxed"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Our long-term vision is to become a major non-oil export brand from
              Nigeria — taking African-made textiles and garments to customers around
              the world, creating jobs, supporting local production and ultimately
              building a world-class garment production house for African fashion brands.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Made in Nigeria manifesto ── */}
      <section className="py-32 max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="space-y-4"
        >
          {[
            "Woven in Nigeria.",
            "Designed in Nigeria.",
            "Made in Nigeria.",
            "Worn around the world.",
          ].map((line, i) => (
            <motion.p
              key={line}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.15 }}
              className="text-3xl md:text-5xl font-light text-foreground"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              {line}
            </motion.p>
          ))}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="text-2xl md:text-3xl text-primary font-semibold mt-8 tracking-[0.1em]"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            LÁBí. Èwà Omoluabi.
          </motion.p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-16 flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link
            to="/shop"
            className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground px-10 py-4 text-xs tracking-[0.25em] uppercase font-semibold hover:bg-primary/90 transition-colors"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Shop the Collection
          </Link>
          <Link
            to="/custom-order"
            className="inline-flex items-center justify-center gap-3 border border-border text-foreground px-10 py-4 text-xs tracking-[0.25em] uppercase font-medium hover:border-primary hover:text-primary transition-colors"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Custom Order
          </Link>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
