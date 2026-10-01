import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  type TooltipContentProps,
} from "recharts";
import {
  useAdminMetrics,
  useAdminRevenueSeries,
  useAdminCategoryMix,
  useAdminTopProducts,
  useAdminLowStock,
} from "@/hooks/use-api.ts";
import { MONTHLY_SALES, CATEGORY_REVENUE } from "../_lib/mock-admin-data.ts";
import { formatPrice } from "@/lib/products.ts";
import { Spinner } from "@/components/ui/spinner.tsx";

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
// Typed correctly for Recharts v3 to avoid runtime errors from ValueType casts.

function RevenueTooltip({
  active,
  payload,
  label,
}: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value;
  const ngn =
    typeof value === "number" ? formatPrice(value) : String(value ?? "");
  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid #333",
        padding: "8px 12px",
        fontFamily: "Montserrat, sans-serif",
        fontSize: 11,
        color: "#f5f5f5",
      }}
    >
      <p style={{ marginBottom: 4, color: "#888" }}>{label}</p>
      <p style={{ color: "#FED700", fontWeight: 600 }}>{ngn}</p>
    </div>
  );
}

function PieTooltip({
  active,
  payload,
}: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  const entry = payload[0];
  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid #333",
        padding: "8px 12px",
        fontFamily: "Montserrat, sans-serif",
        fontSize: 11,
        color: "#f5f5f5",
      }}
    >
      <p style={{ color: "#888", marginBottom: 2 }}>{entry?.name}</p>
      <p style={{ color: "#FED700", fontWeight: 600 }}>{entry?.value}%</p>
    </div>
  );
}

const PIE_COLORS = ["#FED700", "#52480D", "#8a7a18", "#3d3209"];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const { data: metrics, isLoading: mL } = useAdminMetrics();
  const { data: series, isLoading: sL } = useAdminRevenueSeries(6);
  const { data: catMix, isLoading: cL } = useAdminCategoryMix();
  const { data: topProds, isLoading: tL } = useAdminTopProducts();
  const { data: lowStock, isLoading: lL } = useAdminLowStock();

  const loading = mL || sL || cL || tL || lL;

  // Chart data — fall back to mock when API is unreachable
  const chartData = series ?? MONTHLY_SALES;
  const pieData =
    catMix?.map((c) => ({ name: c.category, value: c.percentage })) ??
    CATEGORY_REVENUE.map((c) => ({ name: c.name, value: c.value }));

  return (
    <div className="p-8 space-y-10">
      {/* Page header */}
      <div>
        <p
          className="text-[10px] tracking-[0.3em] uppercase text-primary mb-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Admin
        </p>
        <h1
          className="text-3xl font-light text-foreground"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          Analytics
        </h1>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-muted-foreground">
          <Spinner className="size-5" />
          <span
            className="text-sm"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Loading analytics…
          </span>
        </div>
      )}

      {/* KPI cards — always in NGN (admin canonical view) */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Revenue",
              value: formatPrice(metrics.totalRevenue),
            },
            { label: "Total Orders", value: String(metrics.totalOrders) },
            {
              label: "Avg. Order Value",
              value: formatPrice(metrics.avgOrderValue),
            },
            { label: "Pending Orders", value: String(metrics.pendingOrders) },
          ].map((k) => (
            <div key={k.label} className="bg-card border border-border p-5">
              <p
                className="text-2xl font-semibold text-primary"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {k.value}
              </p>
              <p
                className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mt-1"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {k.label}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Revenue bar chart */}
        <div className="bg-card border border-border p-6">
          <p
            className="text-[10px] tracking-[0.3em] uppercase text-primary mb-5 font-semibold"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Monthly Revenue
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={26}>
              <XAxis
                dataKey="month"
                tick={{
                  fill: "#888",
                  fontSize: 10,
                  fontFamily: "Montserrat, sans-serif",
                }}
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
                content={(props) => <RevenueTooltip {...props} />}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="revenue" radius={0} isAnimationActive={false}>
                {chartData.map((_entry, i) => (
                  <Cell
                    key={`bar-cell-${i}`}
                    fill={i === chartData.length - 1 ? "#FED700" : "#52480D"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Category pie */}
        <div className="bg-card border border-border p-6">
          <p
            className="text-[10px] tracking-[0.3em] uppercase text-primary mb-5 font-semibold"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Revenue by Category
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                isAnimationActive={false}
              >
                {pieData.map((_entry, i) => (
                  <Cell
                    key={`pie-cell-${i}`}
                    fill={PIE_COLORS[i % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip content={PieTooltip} />
              <Legend
                formatter={(value: string) => (
                  <span
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontSize: 10,
                      color: "#888",
                    }}
                  >
                    {value}
                  </span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products */}
      {topProds && topProds.length > 0 && (
        <div className="bg-card border border-border">
          <div className="px-6 py-4 border-b border-border">
            <p
              className="text-[10px] tracking-[0.3em] uppercase text-primary font-semibold"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Top Products by Revenue
            </p>
          </div>
          <div className="divide-y divide-border">
            {topProds.slice(0, 5).map((p, i) => (
              <div
                key={p.productId}
                className="px-6 py-3 flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="text-[10px] text-muted-foreground w-4"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {i + 1}
                  </span>
                  <p
                    className="text-sm font-light text-foreground"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    {p.title}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className="text-[10px] text-muted-foreground"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {p.units} units
                  </span>
                  <span
                    className="text-sm font-semibold text-primary"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {formatPrice(p.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Low stock */}
      {lowStock && lowStock.length > 0 && (
        <div className="bg-card border border-border">
          <div className="px-6 py-4 border-b border-border">
            <p
              className="text-[10px] tracking-[0.3em] uppercase text-destructive font-semibold"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Low Stock Alerts
            </p>
          </div>
          <div className="divide-y divide-border">
            {lowStock.map((p) => (
              <div
                key={p._id}
                className="px-6 py-3 flex items-center justify-between gap-4"
              >
                <p
                  className="text-sm font-light text-foreground"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {p.title}
                </p>
                <span
                  className="text-xs text-destructive font-semibold"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {p.stock - p.reserved} available
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
