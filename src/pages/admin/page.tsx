/**
 * Admin Overview — dashboard KPI cards + revenue chart + recent orders.
 * Uses real API data via useAdminMetrics / useAdminRevenueSeries / useAdminOrders.
 * Falls back to mock data when the backend is unreachable.
 */
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import {
  TrendingUp, ShoppingBag, Package, AlertTriangle,
} from "lucide-react";
import {
  useAdminMetrics,
  useAdminRevenueSeries,
  useAdminOrders,
  useAdminLowStock,
} from "@/hooks/use-api.ts";
import { ADMIN_STATS, MONTHLY_SALES, ADMIN_ORDERS } from "./_lib/mock-admin-data.ts";
import { formatPrice } from "@/lib/products.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  });
}

export default function AdminOverviewPage() {
  const { data: metrics, isLoading: metricsLoading } = useAdminMetrics();
  const { data: series,  isLoading: seriesLoading  } = useAdminRevenueSeries(6);
  const { data: ordersData } = useAdminOrders({ limit: 5 });
  const { data: lowStock  } = useAdminLowStock();

  // Use real data if available, fall back to mock
  const stats = metrics ?? {
    totalRevenue:  ADMIN_STATS.totalRevenue,
    totalOrders:   ADMIN_STATS.totalOrders,
    avgOrderValue: ADMIN_STATS.avgOrderValue,
    pendingOrders: 0,
    lowStockCount: 0,
  };

  const chartData = series ?? MONTHLY_SALES;
  const recentOrders = ordersData?.items ?? ADMIN_ORDERS.slice(0, 5);

  const KPI = [
    {
      label:  "Total Revenue",
      value:  formatPrice(stats.totalRevenue),
      icon:   <TrendingUp size={18} />,
      color:  "text-primary",
    },
    {
      label:  "Total Orders",
      value:  String(stats.totalOrders),
      icon:   <ShoppingBag size={18} />,
      color:  "text-blue-400",
    },
    {
      label:  "Avg. Order Value",
      value:  formatPrice(stats.avgOrderValue),
      icon:   <Package size={18} />,
      color:  "text-emerald-400",
    },
    {
      label:  "Low Stock Items",
      value:  String((metrics?.lowStockCount ?? lowStock?.length) ?? "—"),
      icon:   <AlertTriangle size={18} />,
      color:  "text-destructive",
    },
  ];

  const STATUS_COLORS: Record<string, string> = {
    paid:            "text-blue-400 bg-blue-400/10",
    pending_payment: "text-yellow-400 bg-yellow-400/10",
    fulfilled:       "text-emerald-400 bg-emerald-400/10",
    cancelled:       "text-muted-foreground bg-muted/60",
    failed:          "text-destructive bg-destructive/10",
    in_production:   "text-primary bg-primary/10",
    // mock fallbacks
    confirmed:       "text-blue-400 bg-blue-400/10",
    delivered:       "text-muted-foreground bg-muted/60",
  };

  return (
    <div className="p-8 space-y-10">
      {/* Page header */}
      <div>
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}>Admin</p>
        <h1 className="text-3xl font-light text-foreground"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}>Overview</h1>
      </div>

      {/* KPI cards */}
      {metricsLoading ? (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span className="text-sm" style={{ fontFamily: "'Montserrat', sans-serif" }}>Loading metrics…</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {KPI.map((k) => (
            <div key={k.label} className="bg-card border border-border p-5 space-y-3">
              <div className={`w-9 h-9 bg-muted flex items-center justify-center ${k.color}`}>
                {k.icon}
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>{k.value}</p>
                <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mt-0.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>{k.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Revenue chart */}
      <div className="bg-card border border-border p-6">
        <p className="text-[10px] tracking-[0.3em] uppercase text-primary mb-6 font-semibold"
          style={{ fontFamily: "'Montserrat', sans-serif" }}>Revenue — Last 6 Months</p>
        {seriesLoading ? (
          <div className="h-40 flex items-center justify-center">
            <Spinner className="size-6 text-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={28}>
              <XAxis
                dataKey="month"
                tick={{ fill: "#888", fontSize: 10, fontFamily: "Montserrat, sans-serif" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#888", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `₦${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{
                  background: "#1a1a1a", border: "1px solid #333",
                  fontFamily: "Montserrat, sans-serif", fontSize: 11,
                }}
                formatter={(v: number) => [formatPrice(v), "Revenue"]}
              />
              <Bar dataKey="revenue" radius={0}>
                {chartData.map((_: unknown, i: number) => (
                  <Cell key={i} fill={i === chartData.length - 1 ? "#FED700" : "#52480D"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Recent orders */}
      <div className="bg-card border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <p className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold"
            style={{ fontFamily: "'Montserrat', sans-serif" }}>Recent Orders</p>
          <a href="/admin/orders" className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors"
            style={{ fontFamily: "'Montserrat', sans-serif" }}>View All →</a>
        </div>
        <div className="divide-y divide-border">
          {recentOrders.map((o: any) => (
            <div key={o._id ?? o.id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {o.orderNumber ?? o.id}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {o.customerName ?? o.customer} · {fmtDate(o.createdAt ?? o.placedAt)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-[9px] tracking-[0.15em] uppercase px-2 py-0.5 font-semibold ${STATUS_COLORS[o.status] ?? ""}`}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {o.status.replace(/_/g, " ")}
                </span>
                <p className="text-sm font-semibold text-primary"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}>
                  {formatPrice(o.total)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
