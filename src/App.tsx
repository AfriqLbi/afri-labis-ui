import { BrowserRouter, Route, Routes } from "react-router-dom";
import { DefaultProviders } from "./components/providers/default.tsx";
import Index from "./pages/Index.tsx";
import ShopPage from "./pages/shop/page.tsx";
import ProductDetailPage from "./pages/shop/[id]/page.tsx";
import CheckoutPage from "./pages/checkout/page.tsx";
import CustomOrderPage from "./pages/custom-order/page.tsx";
import MeasurementsPage from "./pages/measurements/page.tsx";
import OrderTrackingPage from "./pages/orders/[id]/page.tsx";
import AccountPage from "./pages/account/page.tsx";
import SignInPage from "./pages/auth/signin/page.tsx";
import RegisterPage from "./pages/auth/register/page.tsx";
import AdminLayout from "./pages/admin/layout.tsx";
import AdminOverviewPage from "./pages/admin/page.tsx";
import AdminOrdersPage from "./pages/admin/orders/page.tsx";
import AdminCustomOrdersPage from "./pages/admin/custom-orders/page.tsx";
import AdminProductsPage from "./pages/admin/products/page.tsx";
import AdminAnalyticsPage from "./pages/admin/analytics/page.tsx";
import AdminProductionPage from "./pages/admin/production/page.tsx";
import AdminCurrencyPage from "./pages/admin/currency/page.tsx";
import NotFound from "./pages/NotFound.tsx";
import { RequireAuth } from "./components/providers/require-auth.tsx";

export default function App() {
  return (
    <BrowserRouter>
      <DefaultProviders>
        <Routes>
          {/* Public storefront */}
          <Route path="/" element={<Index />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/shop/:id" element={<ProductDetailPage />} />
          <Route path="/custom-order" element={<CustomOrderPage />} />

          {/* Auth */}
          <Route path="/auth/signin" element={<SignInPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />

          {/* Protected customer routes */}
          <Route element={<RequireAuth />}>
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/measurements" element={<MeasurementsPage />} />
            <Route path="/orders/:id" element={<OrderTrackingPage />} />
            <Route path="/account" element={<AccountPage />} />
          </Route>

          {/* Protected admin routes */}
          <Route
            element={
              <RequireAuth
                roles={[
                  "super_admin",
                  "merchandiser",
                  "support_agent",
                  "staff",
                ]}
              />
            }
          >
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverviewPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="custom-orders" element={<AdminCustomOrdersPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="analytics" element={<AdminAnalyticsPage />} />
              <Route path="production" element={<AdminProductionPage />} />
              <Route path="currency" element={<AdminCurrencyPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </DefaultProviders>
    </BrowserRouter>
  );
}
