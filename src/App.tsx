import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import {
  RequireAuth,
  RequireAdmin,
} from "./components/providers/require-auth.tsx";

// ── Storefront pages ───────────────────────────────────────────────────────────
import Index from "./pages/Index.tsx";
import ShopPage from "./pages/shop/page.tsx";
import ProductDetailPage from "./pages/shop/[id]/page.tsx";
import CheckoutPage from "./pages/checkout/page.tsx";
import CustomOrderPage from "./pages/custom-order/page.tsx";
import MeasurementsPage from "./pages/measurements/page.tsx";
import OrderTrackingPage from "./pages/orders/[id]/page.tsx";
import AccountPage from "./pages/account/page.tsx";
import LookbookPage from "./pages/lookbook/page.tsx";
import AboutPage from "./pages/about/page.tsx";

// ── Customer auth pages ────────────────────────────────────────────────────────
import SignInPage from "./pages/auth/signin/page.tsx";
import RegisterPage from "./pages/auth/register/page.tsx";
import AuthCallback from "./pages/auth/Callback.tsx";

// ── Admin auth page ────────────────────────────────────────────────────────────
import AdminLoginPage from "./pages/admin/login/page.tsx";

// ── Admin pages ────────────────────────────────────────────────────────────────
import AdminLayout from "./pages/admin/layout.tsx";
import AdminOverviewPage from "./pages/admin/page.tsx";
import AdminOrdersPage from "./pages/admin/orders/page.tsx";
import AdminCustomOrdersPage from "./pages/admin/custom-orders/page.tsx";
import AdminProductsPage from "./pages/admin/products/page.tsx";
import AdminAnalyticsPage from "./pages/admin/analytics/page.tsx";
import AdminProductionPage from "./pages/admin/production/page.tsx";
import AdminCurrencyPage from "./pages/admin/currency/page.tsx";
import AdminCategoriesPage from "./pages/admin/categories/page.tsx";
import AdminLookbookPage from "./pages/admin/lookbook/page.tsx";
import AdminShippingPage from "./pages/admin/shipping/page.tsx";

import NotFound from "./pages/NotFound.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <DefaultProviders>
        <Routes>
          {/* ── Public storefront ── */}
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:id" element={<ProductDetailPage />} />
          <Route path="/custom-order" element={<CustomOrderPage />} />
          <Route path="/lookbook" element={<LookbookPage />} />
          <Route path="/about" element={<AboutPage />} />

          {/* ── Customer auth ── */}
          <Route path="/auth/signin" element={<SignInPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* ── Protected customer routes ── */}
          <Route element={<RequireAuth />}>
            <Route path="/measurements" element={<MeasurementsPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>

          {/* ── Order tracking — accessible to logged-in owners AND guests
                with a signed token (quote-order pay links) ── */}
          <Route path="/orders/:id" element={<OrderTrackingPage />} />

          {/* ── Checkout — guests and signed-in users both allowed ── */}
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* ── Admin auth (public — no guard) ── */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* ── Protected admin routes (uses separate AdminAuthContext) ── */}
          <Route element={<RequireAdmin />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="custom-orders" element={<AdminCustomOrdersPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="categories" element={<AdminCategoriesPage />} />
              <Route path="lookbook" element={<AdminLookbookPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="production" element={<AdminProductionPage />} />
              <Route path="currency" element={<AdminCurrencyPage />} />
              <Route path="shipping" element={<AdminShippingPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </DefaultProviders>
    </BrowserRouter>
  );
}
