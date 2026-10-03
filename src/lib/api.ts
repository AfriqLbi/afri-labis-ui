/**
 * Labi API Client
 *
 * Typed fetch wrapper for the NestJS backend at /v1/.
 * - Auth is handled via httpOnly cookies (set by the backend on login).
 *   No tokens are ever stored in localStorage or JS-accessible storage.
 * - Every request includes credentials: "include" so the browser sends cookies.
 * - On 401 the client calls the appropriate /auth/refresh endpoint (also cookie-based)
 *   and retries once. If refresh fails the onSessionExpired callback is invoked.
 */

// ── Config ─────────────────────────────────────────────────────────────────────

export const API_BASE =
  (import.meta.env.VITE_API_URL ?? "http://localhost:4000") + "/v1";

// ── Session-expired callback ───────────────────────────────────────────────────
// Auth providers register their own handler here so they can clear user state
// and redirect without creating a circular import.
//
// IMPORTANT: these callbacks only fire when a session that WAS active has
// expired mid-use. They must NOT fire on the initial page load for a guest
// who never had a session. We track whether each context has ever had a
// successful authenticated call with the _hasSession flags.

let _onCustomerSessionExpired: (() => void) | null = null;
let _onAdminSessionExpired: (() => void) | null = null;
let _customerHasSession = false;
let _adminHasSession = false;

export function onCustomerSessionExpired(cb: () => void) {
  _onCustomerSessionExpired = cb;
}
export function onAdminSessionExpired(cb: () => void) {
  _onAdminSessionExpired = cb;
}
/** Called by AuthProvider after a successful login/register/me to arm the expiry callback. */
export function markCustomerSessionActive() {
  _customerHasSession = true;
}
export function markAdminSessionActive() {
  _adminHasSession = true;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export type UserRole =
  "super_admin" | "merchandiser" | "support_agent" | "customer" | "staff";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
};

// Kept for legacy compatibility — no longer used for token storage
export type AuthTokens = {
  user: AuthUser;
};

export type ApiProduct = {
  _id: string;
  sku: string;
  slug: string;
  title: string;
  brandName: string;
  categoryName: string;
  categorySlug: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  reserved: number;
  images: string[];
  description: string;
  descriptionHtml: string;
  specs: { label: string; value: string }[];
  status: "active" | "draft" | "archived";
  tags: string[];
  ratingAvg: number;
  ratingCount: number;
};

export type ApiCategory = {
  _id: string;
  name: string;
  slug: string;
  blurb: string;
  imageUrl: string;
  type: "category" | "section";
  sortOrder: number;
  subcategories: { id: string; name: string; slug: string }[];
};

export type OrderLineItem = {
  productId: string;
  sku: string;
  title: string;
  image: string;
  qty: number;
  unitPrice: number;
};

export type ShippingAddress = {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country?: string;
};

export type ApiOrder = {
  _id: string;
  orderNumber: string;
  customerId: string | null;
  customerEmail: string | null;
  customerName: string | null;
  items: OrderLineItem[];
  subtotal: number;
  discountAmount: number;
  total: number;
  currency: string;
  chargeCurrency: string;
  chargeTotal: number | null;
  ngnTotal: number | null;
  fxRate: number;
  fxBuffer: number;
  promoCode: string | null;
  status:
    | "pending_payment"
    | "paid"
    | "failed"
    | "abandoned"
    | "fulfilled"
    | "cancelled"
    | "refunded";
  paymentProvider: "paystack" | "flutterwave" | "stripe";
  paymentReference: string;
  checkoutUrl: string | null;
  shippingAddress: ShippingAddress;
  productionStage:
    "cutting" | "sewing" | "quality_check" | "ready" | "delivered" | null;
  reservationExpiresAt: string | null;
  paidAt: string | null;
  fulfilledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MeasurementField = {
  key: string;
  label: string;
  value: number;
};

export type ApiMeasurementProfile = {
  _id: string;
  userId: string;
  garmentType: string;
  garmentLabel: string | null;
  measurements: MeasurementField[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomOrderStatus =
  | "pending_review"
  | "quoted"
  | "approved"
  | "payment_pending"
  | "paid"
  | "in_production"
  | "completed"
  | "cancelled"
  | "refunded";

export type ApiCustomOrder = {
  _id: string;
  referenceNumber: string;
  customerId: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string | null;
  description: string;
  garmentCategory: string;
  fabricChoice: string | null;
  referenceImages: string[];
  measurement: {
    profileId: string | null;
    garmentType: string;
    garmentLabel: string | null;
    fields: MeasurementField[];
  } | null;
  status: CustomOrderStatus;
  quotedPrice: number | null;
  estimatedReadyDate: string | null;
  adminQuoteNote: string | null;
  paymentProvider: "paystack" | "flutterwave" | null;
  checkoutUrl: string | null;
  whatsappLink: string | null;
  linkedOrderId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ProductionLogEntry = {
  _id: string;
  orderId: string;
  orderType: "order" | "custom_order";
  orderReference: string;
  stage: "cutting" | "sewing" | "quality_check" | "ready" | "delivered";
  updatedBy: string;
  updatedByName: string | null;
  note: string | null;
  createdAt: string;
};

export type Paginated<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
};

// ── Error class ────────────────────────────────────────────────────────────────

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export { ApiError };

// ── Core fetch ─────────────────────────────────────────────────────────────────

/**
 * `context` tells the refresh logic which cookie set to refresh when a 401 fires.
 * "customer" → POST /auth/refresh (uses labi_token_refresh cookie)
 * "admin"    → POST /admin/auth/refresh (uses labi_admin_token_refresh cookie)
 * "none"     → no auto-refresh attempted
 */
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: { context?: "customer" | "admin" | "none" } = {},
): Promise<T> {
  const context =
    opts.context ?? (path.startsWith("/admin") ? "admin" : "customer");

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include", // send cookies on every request
    headers: { "Content-Type": "application/json" },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && context !== "none") {
    const refreshed = await tryRefresh(context);
    if (refreshed) {
      const retry = await fetch(`${API_BASE}${path}`, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(retry);
    }
    // Refresh failed — only notify if this context had an active session.
    // A guest hitting a 401 on the initial /auth/me should never see the toast.
    if (context === "admin") {
      if (_adminHasSession) _onAdminSessionExpired?.();
    } else {
      if (_customerHasSession) _onCustomerSessionExpired?.();
    }
  }

  return handleResponse<T>(res);
}

async function handleResponse<T>(res: Response): Promise<T> {
  let json: {
    success: boolean;
    data?: T;
    message?: string;
    statusCode?: number;
  } | null = null;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) throw new ApiError(res.status, res.statusText);
    throw new ApiError(res.status, "Invalid JSON response");
  }
  if (!res.ok || json?.success === false) {
    throw new ApiError(
      res.status,
      (json?.message as string) ?? res.statusText,
      json,
    );
  }
  return (json?.data ?? json) as T;
}

async function tryRefresh(context: "customer" | "admin"): Promise<boolean> {
  const endpoint =
    context === "admin" ? "/admin/auth/refresh" : "/auth/refresh";
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Geo / Currency ─────────────────────────────────────────────────────────────

export type GeoContextCurrencyRate = {
  currency: string;
  rate: number;
  symbol: string;
  flag: string;
};

export type GeoContextResponse = {
  country: string;
  currency: string;
  rates: GeoContextCurrencyRate[];
  enabledCurrencies: string[];
  fxBuffer: number;
  staleRates?: boolean;
};

export const geo = {
  getContext() {
    return request<GeoContextResponse>("GET", "/geo/context", undefined, {
      context: "none",
    });
  },
};

// ── Auth — Storefront (customer) ───────────────────────────────────────────────

export const auth = {
  register(dto: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    return request<{ user: AuthUser }>("POST", "/auth/register", dto, {
      context: "none",
    });
  },

  login(dto: { email: string; password: string }) {
    return request<{ user: AuthUser }>("POST", "/auth/login", dto, {
      context: "none",
    });
  },

  logout() {
    return request<void>("POST", "/auth/logout", undefined, {
      context: "none",
    });
  },

  me(context: "customer" | "none" = "customer") {
    return request<AuthUser>("GET", "/auth/me", undefined, { context });
  },
};

// ── Auth — Admin ───────────────────────────────────────────────────────────────

export const adminAuth = {
  login(dto: { email: string; password: string }) {
    return request<{ user: AuthUser }>("POST", "/admin/auth/login", dto, {
      context: "none",
    });
  },

  logout() {
    return request<void>("POST", "/admin/auth/logout", undefined, {
      context: "none",
    });
  },

  me(context: "admin" | "none" = "admin") {
    return request<AuthUser>("GET", "/admin/auth/me", undefined, { context });
  },
};

// ── Catalog ────────────────────────────────────────────────────────────────────

export const catalog = {
  listProducts(params?: {
    q?: string;
    categorySlug?: string;
    tag?: string;
    min?: number;
    max?: number;
    inStock?: boolean;
    sort?: string;
    page?: number;
    limit?: number;
  }) {
    const qs = new URLSearchParams();
    if (params?.q) qs.set("q", params.q);
    if (params?.categorySlug) qs.set("categorySlug", params.categorySlug);
    if (params?.tag) qs.set("tag", params.tag);
    if (params?.min !== undefined) qs.set("min", String(params.min));
    if (params?.max !== undefined) qs.set("max", String(params.max));
    if (params?.inStock) qs.set("inStock", "true");
    if (params?.sort) qs.set("sort", params.sort);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return request<Paginated<ApiProduct>>(
      "GET",
      `/catalog/products${q ? `?${q}` : ""}`,
      undefined,
      { context: "none" },
    );
  },

  getProduct(slug: string) {
    return request<ApiProduct>("GET", `/catalog/products/${slug}`, undefined, {
      context: "none",
    });
  },

  listCategories(type?: "category" | "section") {
    const q = type ? `?type=${type}` : "";
    return request<ApiCategory[]>("GET", `/catalog/categories${q}`, undefined, {
      context: "none",
    });
  },

  getCategory(slug: string) {
    return request<ApiCategory>(
      "GET",
      `/catalog/categories/${slug}`,
      undefined,
      { context: "none" },
    );
  },
};

// ── Cart ───────────────────────────────────────────────────────────────────────

export const cart = {
  get() {
    return request<{
      _id: string;
      userId: string | null;
      guestId: string | null;
      lines: {
        productId: string;
        sku: string;
        title: string;
        image: string;
        unitPrice: number;
        quantity: number;
      }[];
      promoCode: string | null;
      discountAmount: number | null;
    }>("GET", "/cart");
  },
  addLine(dto: {
    productId: string;
    sku: string;
    title: string;
    image: string;
    unitPrice: number;
    quantity: number;
  }) {
    return request<unknown>("POST", "/cart/lines", dto);
  },
  updateLine(dto: { productId: string; quantity: number }) {
    return request<unknown>("PATCH", "/cart/lines", dto);
  },
  removeLine(productId: string) {
    return request<unknown>("DELETE", `/cart/lines/${productId}`);
  },
  clear() {
    return request<unknown>("DELETE", "/cart");
  },
  merge() {
    return request<unknown>("POST", "/cart/merge");
  },
};

// ── Orders ─────────────────────────────────────────────────────────────────────

export const orders = {
  create(dto: {
    cartId?: string;
    customerEmail?: string;
    customerName?: string;
    paymentProvider: "paystack" | "flutterwave" | "stripe";
    shippingAddress: ShippingAddress;
    promoCode?: string;
    chargeCurrency?: string;
    fxRateSnapshot?: { rate: number; buffer: number };
  }) {
    return request<{ order: ApiOrder; checkoutUrl: string; reference: string }>(
      "POST",
      "/orders",
      dto,
    );
  },
  mine(page = 1, limit = 20) {
    return request<Paginated<ApiOrder>>(
      "GET",
      `/orders/mine?page=${page}&limit=${limit}`,
    );
  },
  get(id: string) {
    return request<ApiOrder>("GET", `/orders/${id}`);
  },
  getProductionHistory(orderId: string) {
    return request<{
      currentStage: string | null;
      history: ProductionLogEntry[];
    }>("GET", `/production/${orderId}/history`);
  },
};

// ── Payments ───────────────────────────────────────────────────────────────────

export const payments = {
  initialize(dto: { orderId: string; provider: "paystack" | "flutterwave" }) {
    return request<{ checkoutUrl: string; reference: string }>(
      "POST",
      "/payments/initialize",
      dto,
    );
  },
};

// ── Custom Orders ──────────────────────────────────────────────────────────────

export const customOrders = {
  submit(dto: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    description: string;
    garmentCategory: string;
    fabricChoice?: string;
    referenceImages?: string[];
    measurement?: {
      profileId?: string;
      garmentType: string;
      garmentLabel?: string;
      measurements?: MeasurementField[];
    };
  }) {
    return request<ApiCustomOrder>("POST", "/custom-orders", dto);
  },
  mine(page = 1, limit = 20) {
    return request<Paginated<ApiCustomOrder>>(
      "GET",
      `/custom-orders/mine?page=${page}&limit=${limit}`,
    );
  },
  get(id: string) {
    return request<ApiCustomOrder>("GET", `/custom-orders/${id}`);
  },
  approveQuote(id: string, paymentProvider: "paystack" | "flutterwave") {
    return request<{ checkoutUrl: string; paymentReference: string }>(
      "POST",
      `/custom-orders/${id}/approve`,
      { paymentProvider },
    );
  },
};

// ── Measurement Profiles ───────────────────────────────────────────────────────

export const measurements = {
  list() {
    return request<ApiMeasurementProfile[]>("GET", "/measurements");
  },
  get(id: string) {
    return request<ApiMeasurementProfile>("GET", `/measurements/${id}`);
  },
  create(dto: {
    garmentType: string;
    garmentLabel?: string;
    measurements: MeasurementField[];
    notes?: string;
  }) {
    return request<ApiMeasurementProfile>("POST", "/measurements", dto);
  },
  update(
    id: string,
    dto: Partial<{
      garmentType: string;
      garmentLabel: string;
      measurements: MeasurementField[];
      notes: string;
    }>,
  ) {
    return request<ApiMeasurementProfile>("PATCH", `/measurements/${id}`, dto);
  },
  remove(id: string) {
    return request<void>("DELETE", `/measurements/${id}`);
  },
};

// ── Admin: Media ───────────────────────────────────────────────────────────────

export const adminMedia = {
  async upload(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/admin/media/upload`, {
      method: "POST",
      credentials: "include", // sends labi_admin_token cookie
      body: formData,
      // No Content-Type header — browser sets multipart/form-data with boundary
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(
        (err as { message?: string }).message ??
          `Upload failed (${res.status})`,
      );
    }
    const json = (await res.json()) as {
      success: boolean;
      data: { secureUrl: string };
    };
    return json.data.secureUrl;
  },
};

// ── Admin: Catalog ─────────────────────────────────────────────────────────────

export const adminCatalog = {
  listProducts(params?: { status?: string; page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return request<Paginated<ApiProduct>>(
      "GET",
      `/admin/catalog/products${q ? `?${q}` : ""}`,
    );
  },
  createProduct(dto: unknown) {
    return request<ApiProduct>("POST", "/admin/catalog/products", dto);
  },
  updateProduct(id: string, dto: unknown) {
    return request<ApiProduct>("PATCH", `/admin/catalog/products/${id}`, dto);
  },
  deleteProduct(id: string) {
    return request<void>("DELETE", `/admin/catalog/products/${id}`);
  },
  toggleTag(id: string, tag: string) {
    return request<ApiProduct>(
      "PATCH",
      `/admin/catalog/products/${id}/tags/${tag}`,
    );
  },
  setStock(dto: { productId: string; stock: number }) {
    return request<unknown>("PATCH", "/admin/inventory/stock", dto);
  },
  lowStock() {
    return request<ApiProduct[]>("GET", "/admin/inventory/low-stock");
  },
  listCategories() {
    return request<ApiCategory[]>("GET", "/admin/catalog/categories");
  },
  createCategory(dto: unknown) {
    return request<ApiCategory>("POST", "/admin/catalog/categories", dto);
  },
  updateCategory(id: string, dto: unknown) {
    return request<ApiCategory>(
      "PATCH",
      `/admin/catalog/categories/${id}`,
      dto,
    );
  },
  deleteCategory(id: string) {
    return request<void>("DELETE", `/admin/catalog/categories/${id}`);
  },
  listBrands() {
    return request<{ _id: string; name: string; slug: string }[]>(
      "GET",
      "/admin/catalog/brands",
    );
  },
  createBrand(dto: { name: string; logoUrl?: string }) {
    return request<{ _id: string; name: string; slug: string }>(
      "POST",
      "/admin/catalog/brands",
      dto,
    );
  },
};

// ── Admin: Orders ──────────────────────────────────────────────────────────────

export const adminOrders = {
  list(params?: { status?: string; page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return request<Paginated<ApiOrder>>(
      "GET",
      `/admin/orders${q ? `?${q}` : ""}`,
    );
  },
  get(id: string) {
    return request<ApiOrder>("GET", `/admin/orders/${id}`);
  },
  fulfil(id: string) {
    return request<ApiOrder>("PATCH", `/admin/orders/${id}/fulfil`);
  },
  cancel(id: string) {
    return request<ApiOrder>("PATCH", `/admin/orders/${id}/cancel`);
  },
  updateProductionStage(id: string, stage: string, note?: string) {
    return request<ApiOrder>("PATCH", `/admin/orders/${id}/production-stage`, {
      stage,
      note,
    });
  },
};

// ── Admin: Custom Orders ───────────────────────────────────────────────────────

export const adminCustomOrders = {
  list(params?: {
    status?: string;
    email?: string;
    page?: number;
    limit?: number;
  }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.email) qs.set("email", params.email);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const q = qs.toString();
    return request<Paginated<ApiCustomOrder>>(
      "GET",
      `/admin/custom-orders${q ? `?${q}` : ""}`,
    );
  },
  get(id: string) {
    return request<ApiCustomOrder>("GET", `/admin/custom-orders/${id}`);
  },
  setQuote(
    id: string,
    dto: {
      quotedPrice: number;
      estimatedReadyDate: string;
      adminQuoteNote?: string;
    },
  ) {
    return request<ApiCustomOrder>(
      "PATCH",
      `/admin/custom-orders/${id}/quote`,
      dto,
    );
  },
  moveToProduction(id: string) {
    return request<ApiCustomOrder>(
      "PATCH",
      `/admin/custom-orders/${id}/production`,
    );
  },
  markCompleted(id: string) {
    return request<ApiCustomOrder>(
      "PATCH",
      `/admin/custom-orders/${id}/complete`,
    );
  },
  updateStatus(id: string, status: "cancelled" | "refunded", note?: string) {
    return request<ApiCustomOrder>(
      "PATCH",
      `/admin/custom-orders/${id}/status`,
      { status, note },
    );
  },
};

// ── Admin: Analytics ──────────────────────────────────────────────────────────

export const adminAnalytics = {
  async metrics() {
    const raw = await request<{
      revenueBase: number;
      orderCount: number;
      averageOrderBase: number;
      pendingCount: number;
      lowStockCount: number;
    }>("GET", "/admin/analytics/metrics");
    return {
      totalRevenue: (raw.revenueBase ?? 0) / 100,
      totalOrders: raw.orderCount ?? 0,
      avgOrderValue: (raw.averageOrderBase ?? 0) / 100,
      pendingOrders: raw.pendingCount ?? 0,
      lowStockCount: raw.lowStockCount ?? 0,
    };
  },
  async revenueSeries(months = 6) {
    const rows = await request<
      { month: string; revenue: number; orders: number }[]
    >("GET", `/admin/analytics/revenue-series?months=${months}`);
    return rows.map((r) => ({ ...r, revenue: (r.revenue ?? 0) / 100 }));
  },
  categoryMix() {
    return request<{ category: string; revenue: number; percentage: number }[]>(
      "GET",
      "/admin/analytics/category-mix",
    );
  },
  topProducts() {
    return request<
      { productId: string; title: string; revenue: number; units: number }[]
    >("GET", "/admin/analytics/top-products");
  },
};

// ── Admin: Currency Config ─────────────────────────────────────────────────────

export type CurrencyConfigRoundingRule = {
  decimals: number;
  mode: "round" | "ceil" | "floor";
};

export type ApiCurrencyConfig = {
  configKey: string;
  enabledCurrencies: string[];
  countryOverrides: Record<string, string>;
  fxBuffer: number;
  roundingRules: Record<string, CurrencyConfigRoundingRule>;
  staleRateThresholdMinutes: number;
  updatedAt?: string;
};

export const adminCurrencyConfig = {
  get() {
    return request<ApiCurrencyConfig>("GET", "/admin/currency-config");
  },
  update(dto: Partial<Omit<ApiCurrencyConfig, "configKey" | "updatedAt">>) {
    return request<ApiCurrencyConfig>("PATCH", "/admin/currency-config", dto);
  },
};

// ── Lookbook ───────────────────────────────────────────────────────────────────

export type ApiLookbookItem = {
  _id: string;
  title: string;
  caption: string;
  imageUrl: string;
  season: string;
  sortOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
};

export const lookbook = {
  list() {
    return request<ApiLookbookItem[]>("GET", "/lookbook", undefined, {
      context: "none",
    });
  },
};

export const adminLookbook = {
  list() {
    return request<ApiLookbookItem[]>("GET", "/admin/lookbook");
  },
  create(dto: {
    title: string;
    caption?: string;
    imageUrl: string;
    season?: string;
    sortOrder?: number;
    published?: boolean;
  }) {
    return request<ApiLookbookItem>("POST", "/admin/lookbook", dto);
  },
  update(
    id: string,
    dto: Partial<{
      title: string;
      caption: string;
      imageUrl: string;
      season: string;
      sortOrder: number;
      published: boolean;
    }>,
  ) {
    return request<ApiLookbookItem>("PATCH", `/admin/lookbook/${id}`, dto);
  },
  remove(id: string) {
    return request<void>("DELETE", `/admin/lookbook/${id}`);
  },
  reorder(items: { id: string; sortOrder: number }[]) {
    return request<void>("PATCH", "/admin/lookbook/reorder", { items });
  },
};
