// Mock order data for the order tracking page.
// In a real app, this would come from the backend database.

export type ProductionStage =
  | "received"
  | "cutting"
  | "sewing"
  | "quality_check"
  | "ready"
  | "delivered";

export type OrderStatus = "confirmed" | "in_production" | "ready" | "delivered";

export type OrderItem = {
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
};

export type StageEntry = {
  stage: ProductionStage;
  label: string;
  description: string;
  completedAt: string | null; // ISO string or null if not yet reached
  estimatedAt?: string;
};

export type MockOrder = {
  id: string;
  status: OrderStatus;
  placedAt: string;
  estimatedReady: string;
  currentStage: ProductionStage;
  stages: StageEntry[];
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  total: number;
  shippingAddress: string;
  shippingMethod: "standard" | "express";
  trackingNote: string;
};

// Demo order — "cutting" stage so there's visible progress
export const MOCK_ORDER: MockOrder = {
  id: "LBI-2026-00847",
  status: "in_production",
  placedAt: "2026-09-08T14:22:00Z",
  estimatedReady: "2026-09-18T00:00:00Z",
  currentStage: "sewing",
  trackingNote:
    "Your Adunola Wrap Dress fabric has been cut and is now with our master tailor. We will notify you when quality checks begin.",
  stages: [
    {
      stage: "received",
      label: "Order Received",
      description: "Your order has been confirmed and payment verified.",
      completedAt: "2026-09-08T14:25:00Z",
    },
    {
      stage: "cutting",
      label: "Fabric Cutting",
      description: "Your fabric has been selected and precision-cut by our artisans.",
      completedAt: "2026-09-10T09:00:00Z",
    },
    {
      stage: "sewing",
      label: "Sewing & Assembly",
      description: "Your garment is being hand-sewn and assembled to your measurements.",
      completedAt: null,
      estimatedAt: "2026-09-14T00:00:00Z",
    },
    {
      stage: "quality_check",
      label: "Quality Check",
      description: "Final inspection for stitching, finish, and fit against your measurements.",
      completedAt: null,
      estimatedAt: "2026-09-16T00:00:00Z",
    },
    {
      stage: "ready",
      label: "Ready for Delivery",
      description: "Your order has passed quality check and is packed for shipment.",
      completedAt: null,
      estimatedAt: "2026-09-17T00:00:00Z",
    },
    {
      stage: "delivered",
      label: "Delivered",
      description: "Your order is on its way or has arrived.",
      completedAt: null,
      estimatedAt: "2026-09-18T00:00:00Z",
    },
  ],
  items: [
    {
      name: "Adunola Wrap Dress",
      image:
        "https://images.unsplash.com/photo-1590735213920-68192a487bc2?w=400&q=80",
      size: "M",
      color: "Blue/Gold",
      quantity: 1,
      price: 42000,
    },
    {
      name: "Beaded Ankara Clutch",
      image:
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&q=80",
      size: "One Size",
      color: "Multi",
      quantity: 1,
      price: 18500,
    },
  ],
  subtotal: 60500,
  shippingCost: 0,
  total: 60500,
  shippingAddress: "12 Bourdillon Road, Ikoyi, Lagos, Nigeria",
  shippingMethod: "standard",
};

export function getOrderById(id: string): MockOrder | null {
  // Only one demo order — any ID that starts with "LBI-" resolves to it
  if (id === MOCK_ORDER.id || id.startsWith("LBI-")) return MOCK_ORDER;
  return null;
}
