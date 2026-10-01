import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
    toast.success("You're on the list. Welcome to the LABI family.");
    setEmail("");
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <section
      className="relative py-32 overflow-hidden"
      style={{
        backgroundImage: `url("https://images.unsplash.com/photo-1578509566163-068acd11b8e7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/85" />
      <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: "easeOut" as const }}
        >
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-8 h-[1px] bg-primary" />
            <span
              className="text-xs tracking-[0.3em] uppercase text-primary"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Stay Connected
            </span>
            <div className="w-8 h-[1px] bg-primary" />
          </div>
          <h2
            className="text-5xl md:text-6xl font-light text-white mb-6"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Join the LABI Circle
          </h2>
          <p
            className="text-white/60 text-lg font-light mb-10 leading-relaxed"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            First access to new collections, exclusive offers, 
            and stories from the heart of African fashion.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder:text-white/30 px-5 py-4 text-sm focus:outline-none focus:border-primary transition-colors"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            />
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-8 py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {submitted ? "Subscribed!" : "Subscribe"}
            </button>
          </form>
          <p
            className="text-white/30 text-xs mt-4 tracking-wide"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            No spam. Unsubscribe at any time.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
