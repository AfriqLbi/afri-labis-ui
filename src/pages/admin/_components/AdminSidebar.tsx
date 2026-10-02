import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  BarChart2,
  Scissors,
  Cog,
  Coins,
  ArrowLeft,
  Tag,
  BookImage,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useAdminAuth } from "@/hooks/use-auth.ts";

const NAV = [
  { label: "Overview", href: "/admin", icon: <LayoutDashboard size={15} /> },
  { label: "Products", href: "/admin/products", icon: <Package size={15} /> },
  { label: "Categories", href: "/admin/categories", icon: <Tag size={15} /> },
  { label: "Lookbook", href: "/admin/lookbook", icon: <BookImage size={15} /> },
  { label: "Orders", href: "/admin/orders", icon: <ShoppingBag size={15} /> },
  {
    label: "Custom Orders",
    href: "/admin/custom-orders",
    icon: <Scissors size={15} />,
  },
  { label: "Production", href: "/admin/production", icon: <Cog size={15} /> },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <BarChart2 size={15} />,
  },
  { label: "Currency", href: "/admin/currency", icon: <Coins size={15} /> },
];

export default function AdminSidebar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAdminAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4 border-b border-border">
        <p
          className="text-xl font-bold tracking-[0.25em] text-primary"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          LABI
        </p>
        <p
          className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground mt-0.5"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Admin Panel
        </p>
      </div>

      {/* Logged-in user */}
      {user && (
        <div className="px-5 py-3 border-b border-border">
          <p
            className="text-xs text-foreground truncate"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {user.name}
          </p>
          <p
            className="text-[9px] text-muted-foreground tracking-[0.1em] uppercase mt-0.5"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {user.role.replace("_", " ")}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 text-[11px] tracking-[0.1em] uppercase transition-all",
                active
                  ? "bg-primary/10 text-primary border-l-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 py-4 border-t border-border space-y-0.5">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2.5 text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          <ArrowLeft size={12} /> Back to Store
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2.5 text-[10px] tracking-[0.1em] uppercase text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          <LogOut size={12} /> Sign Out
        </button>
      </div>
    </aside>
  );
}
