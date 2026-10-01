/**
 * Labi API Client
 *
 * Typed fetch wrapper for the NestJS backend at /v1/.
 * - Injects JWT access token from localStorage on every request
 * - Handles the { success, data } response envelope
 * - Exposes typed functions for every backend endpoint used by the frontend
 *
 * Token storage keys:
 *   labi_access_token   — short-lived JWT (15 min)
 *   labi_refresh_token  — long-lived refresh JWT (7 days)
 *   labi_user           — serialised user object (id, name, email, role)
 */

// ── Config ────────────────────────────────────────────────────────────────────

export const API_BASE =
  (import.meta.env.VITE_API_URL ?? "http://localhost:4000") + "/v1";

const TOKEN_KEY = "labi_access_token";
const REFRESH_KEY = "labi_refresh_token";
const USER_KEY = "labi_user";

// ── Token helpers ──────────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setTokens(access: string, refresh: string): void {
  localStorage.setItem(TOKEN_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}
export function clearTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}
export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
export function setStoredUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
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

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
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
  /** ISO 4217 currency the customer was charged in */
  chargeCurrency: string;
  /** Charge amount in the minor unit of chargeCurrency */
  chargeTotal: number | null;
  /** NGN total in kobo at order creation */
  ngnTotal: number | null;
  /** FX rate locked at order creation (1 NGN = fxRate chargeCurrency) */
  fxRate: number;
  /** FX buffer % applied at lock time */
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

// ── Core fetch ─────────────────────────────────────────────────────────────────

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

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  opts: { raw?: boolean; noAuth?: boolean } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!opts.noAuth) {
    const token = getAccessToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Attempt token refresh on 401
  if (res.status === 401 && !opts.noAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      // Retry original request with new token
      headers["Authorization"] = `Bearer ${getAccessToken()}`;
      const retry = await fetch(`${API_BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      return handleResponse<T>(retry);
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

  if (!res.ok || (json && json.success === false)) {
    throw new ApiError(
      res.status,
      (json?.message as string) ?? res.statusText,
      json,
    );
  }

  return (json?.data ?? json) as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearTokens();
      return false;
    }
    const data = (await res.json()) as { data: AuthTokens };
    setTokens(data.data.accessToken, data.data.refreshToken);
    setStoredUser(data.data.user);
    return true;
  } catch {
    clearTokens();
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
  /** Single call: country detection + FX rates + CurrencyConfig in one round-trip. */
  getContext() {
    return request<GeoContextResponse>("GET", "/geo/context", undefined, {
      noAuth: true,
    });
  },
};

// ── Auth ───────────────────────────────────────────────────────────────────────

export const auth = {
  register(dto: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    return request<AuthTokens>("POST", "/auth/register", dto, { noAuth: true });
  },

  login(dto: { email: string; password: string }) {
    return request<AuthTokens>("POST", "/auth/login", dto, { noAuth: true });
  },

  refresh(refreshToken: string) {
    return request<AuthTokens>(
      "POST",
      "/auth/refresh",
      { refreshToken },
      { noAuth: true },
    );
  },

  logout() {
    return request<void>("POST", "/auth/logout");
  },

  me() {
    return request<AuthUser>("GET", "/auth/me");
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
    );
  },

  getProduct(slug: string) {
    return request<ApiProduct>("GET", `/catalog/products/${slug}`);
  },

  listCategories(type?: "category" | "section") {
    const q = type ? `?type=${type}` : "";
    return request<ApiCategory[]>("GET", `/catalog/categories${q}`);
  },

  getCategory(slug: string) {
    return request<ApiCategory>("GET", `/catalog/categories/${slug}`);
  },
};

// ── Cart ───────────────────────────────────────────────────────────────────────

export const cart = {
  get(guestId?: string | null) {
    const headers: Record<string, string> = {};
    if (guestId) headers["X-Guest-Id"] = guestId;
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
    /** ISO 4217 charge currency. Omit for NGN. */
    chargeCurrency?: string;
    /** FX snapshot from CurrencyProvider. Required for non-NGN orders. */
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

  setStock(dto: { productId: string; stock: number }) {
    return request<unknown>("PATCH", "/admin/inventory/stock", dto);
  },

  lowStock() {
    return request<ApiProduct[]>("GET", "/admin/inventory/low-stock");
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
  metrics() {
    return request<{
      totalRevenue: number;
      totalOrders: number;
      avgOrderValue: number;
      pendingOrders: number;
      lowStockCount: number;
    }>("GET", "/admin/analytics/metrics");
  },

  revenueSeries(months = 6) {
    return request<{ month: string; revenue: number; orders: number }[]>(
      "GET",
      `/admin/analytics/revenue-series?months=${months}`,
    );
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
