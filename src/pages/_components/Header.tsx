import { useState } from "react";
import { ShoppingBag, Search, Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/use-cart.tsx";
import { useAuth } from "@/hooks/use-auth.ts";
import {
  Authenticated,
  Unauthenticated,
} from "@/components/providers/auth.tsx";
import CurrencySwitcher from "@/components/CurrencySwitcher.tsx";

const NAV_LINKS = [
  { label: "New Arrivals", href: "/shop" },
  { label: "Women", href: "/shop?category=women" },
  { label: "Men", href: "/shop?category=men" },
  { label: "Custom Order", href: "/custom-order" },
  { label: "About", href: "#" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, openCart } = useCart();
  const { signinRedirect } = useAuth();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1">
            <span
              className="text-3xl font-bold tracking-[0.25em] text-primary"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                letterSpacing: "0.3em",
              }}
            >
              LABI
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button className="text-foreground hover:text-primary transition-colors cursor-pointer">
              <Search size={18} />
            </button>

            {/* Currency switcher */}
            <CurrencySwitcher />

            {/* Account icon */}
            <Authenticated>
              <Link
                to="/account"
                className="text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <User size={18} />
              </Link>
            </Authenticated>
            <Unauthenticated>
              <button
                onClick={() => signinRedirect()}
                className="text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <User size={18} />
              </button>
            </Unauthenticated>

            <button
              onClick={openCart}
              className="text-foreground hover:text-primary transition-colors relative cursor-pointer"
            >
              <ShoppingBag size={18} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>
            <button
              className="md:hidden text-foreground hover:text-primary transition-colors cursor-pointer"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" as const }}
            className="fixed top-[65px] left-0 right-0 z-40 bg-background border-b border-border px-6 py-8 flex flex-col gap-6"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.a
                key={link.label}
                href={link.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.07,
                  duration: 0.3,
                  ease: "easeOut" as const,
                }}
                className="text-sm tracking-[0.2em] uppercase text-foreground hover:text-primary transition-colors"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: NAV_LINKS.length * 0.07,
                duration: 0.3,
                ease: "easeOut" as const,
              }}
            >
              <Authenticated>
                <Link
                  to="/account"
                  className="text-sm tracking-[0.2em] uppercase text-primary"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                  onClick={() => setMenuOpen(false)}
                >
                  My Account
                </Link>
              </Authenticated>
              <Unauthenticated>
                <button
                  onClick={() => {
                    signinRedirect();
                    setMenuOpen(false);
                  }}
                  className="text-sm tracking-[0.2em] uppercase text-primary cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Sign In
                </button>
              </Unauthenticated>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
