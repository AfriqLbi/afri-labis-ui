import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import AdminSidebar from "./_components/AdminSidebar.tsx";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Desktop sidebar — always visible ≥ lg ── */}
      <div className="hidden lg:block shrink-0">
        <AdminSidebar onNavigate={() => {}} />
      </div>

      {/* ── Mobile sidebar — slide-in overlay ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/70 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: -256 }}
              animate={{ x: 0 }}
              exit={{ x: -256 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="fixed top-0 left-0 h-full z-50 lg:hidden"
            >
              <AdminSidebar onNavigate={() => setSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-4 px-4 py-3 border-b border-border bg-sidebar shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <p
            className="text-lg font-bold tracking-[0.25em] text-primary"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            LABI
          </p>
          <span
            className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Admin
          </span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
