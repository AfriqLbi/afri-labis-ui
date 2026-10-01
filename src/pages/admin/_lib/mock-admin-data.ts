// Static mock data for the admin dashboard.
// In a production app, this would come from the Convex backend.

import type { MockOrder } from "@/lib/mock-orders.ts";
import { MOCK_ORDER } from "@/lib/mock-orders.ts";

// ── Admin Orders ──────────────────────────────────────────────────────────────

export type AdminOrder = MockOrder & {
  customer: string;
  email: string;
};

export const ADMIN_ORDERS: AdminOrder[] = [
  {
    ...MOCK_ORDER,
    customer: "Amara Okafor",
    email: "amara@example.com",
  },
  {
    ...MOCK_ORDER,
    id: "LBI-2026-00791",
    status: "delivered",
    currentStage: "delivered",
    placedAt: "2026-08-15T10:00:00Z",
    total: 31500,
    subtotal: 28000,
    shippingCost: 3500,
    items: [
      {
        name: "Dashiki Polo",
        image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
        size: "L",
        color: "Burgundy/Gold",
        quantity: 1,
        price: 28000,
      },
    ],
    customer: "Chidi Eze",
    email: "chidi@example.com",
  },
  {
    ...MOCK_ORDER,
    id: "LBI-2026-00652",
    status: "delivered",
    currentStage: "delivered",
    placedAt: "2026-07-20T14:00:00Z",
    total: 55000,
    subtotal: 55000,
    shippingCost: 0,
    items: [
      {
        name: "Kente Blazer",
        image: "https://images.unsplash.com/photo-1594938298603-c8148c4b4648?w=400&q=80",
        size: "M",
        color: "Green/Gold",
        quantity: 1,
        price: 55000,
      },
    ],
    customer: "Ngozi Adeyemi",
    email: "ngozi@example.com",
  },
  {
    ...MOCK_ORDER,
    id: "LBI-2026-00590",
    status: "confirmed",
    currentStage: "received",
    placedAt: "2026-09-09T08:30:00Z",
    total: 95000,
    subtotal: 95000,
    shippingCost: 0,
    items: [
      {
        name: "Ankara Agbada Set",
        image: "https://images.unsplash.com/photo-1653242832879-d730d48617f9?w=400&q=80",
        size: "XL",
        color: "Blue/Gold",
        quantity: 1,
        price: 95000,
      },
    ],
    customer: "Emeka Nwosu",
    email: "emeka@example.com",
  },
  {
    ...MOCK_ORDER,
    id: "LBI-2026-00534",
    status: "in_production",
    currentStage: "quality_check",
    placedAt: "2026-09-01T11:00:00Z",
    total: 78000,
    subtotal: 78000,
    shippingCost: 0,
    items: [
      {
        name: "Adire Trench Coat",
        image: "https://images.unsplash.com/photo-1784904935282-7a2719276b05?w=400&q=80",
        size: "M",
        color: "Indigo",
        quantity: 1,
        price: 78000,
      },
    ],
    customer: "Funmilayo Bello",
    email: "funmi@example.com",
  },
];

// ── Sales chart data ──────────────────────────────────────────────────────────

export type MonthlySales = {
  month: string;
  revenue: number;
  orders: number;
};

export const MONTHLY_SALES: MonthlySales[] = [
  { month: "Apr", revenue: 210000, orders: 4 },
  { month: "May", revenue: 345000, orders: 7 },
  { month: "Jun", revenue: 290000, orders: 5 },
  { month: "Jul", revenue: 480000, orders: 9 },
  { month: "Aug", revenue: 395000, orders: 8 },
  { month: "Sep", revenue: 314500, orders: 5 },
];

export type CategoryRevenue = {
  name: string;
  value: number;
  fill: string;
};

export const CATEGORY_REVENUE: CategoryRevenue[] = [
  { name: "Women", value: 48, fill: "#FED700" },
  { name: "Men", value: 35, fill: "#52480D" },
  { name: "Accessories", value: 12, fill: "#8a7a18" },
  { name: "Custom", value: 5, fill: "#3d3209" },
];

// ── Derived stats ─────────────────────────────────────────────────────────────

export const ADMIN_STATS = {
  totalRevenue: ADMIN_ORDERS.reduce((s, o) => s + o.total, 0),
  totalOrders: ADMIN_ORDERS.length,
  avgOrderValue: Math.round(
    ADMIN_ORDERS.reduce((s, o) => s + o.total, 0) / ADMIN_ORDERS.length,
  ),
  inProduction: ADMIN_ORDERS.filter((o) => o.status === "in_production").length,
};
