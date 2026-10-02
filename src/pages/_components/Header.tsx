import { useState, useRef, useEffect } from "react";
import { ShoppingBag, Search, Menu, X, User } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
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
  { label: "Lookbook", href: "/lookbook" },
  { label: "About", href: "/about" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { itemCount, openCart } = useCart();
  const { signinRedirect } = useAuth();
  const navigate = useNavigate();

  // Focus the input whenever the overlay opens
  useEffect(() => {
    if (searchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [searchOpen]);

  // Close overlay on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchOpen(false);
    setSearchQuery("");
    navigate(`/shop?q=${encodeURIComponent(q)}`);
  };

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
              <Link
                key={link.label}
                to={link.href}
                className="text-xs tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(true)}
              className="text-foreground hover:text-primary transition-colors cursor-pointer"
              aria-label="Search"
            >
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

      {/* ── Search overlay ── */}
      <AnimatePresence>
        {searchOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 z-[60]"
              onClick={() => setSearchOpen(false)}
            />
            {/* Search bar */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25 }}
              className="fixed top-0 left-0 right-0 z-[70] bg-background border-b border-border px-6 py-5"
            >
              <form
                onSubmit={handleSearchSubmit}
                className="max-w-2xl mx-auto flex items-center gap-4"
              >
                <Search size={18} className="text-primary shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pieces, fabrics, styles…"
                  className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-lg font-light focus:outline-none"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSearchOpen(false)}
                  className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label="Close search"
                >
                  <X size={20} />
                </button>
              </form>
              <p
                className="max-w-2xl mx-auto mt-3 pl-[34px] text-[10px] tracking-[0.2em] uppercase text-muted-foreground"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Press Enter to search · Esc to close
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
              <motion.div
                key={link.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: i * 0.07,
                  duration: 0.3,
                  ease: "easeOut" as const,
                }}
              >
                <Link
                  to={link.href}
                  className="text-sm tracking-[0.2em] uppercase text-foreground hover:text-primary transition-colors"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </Link>
              </motion.div>
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
