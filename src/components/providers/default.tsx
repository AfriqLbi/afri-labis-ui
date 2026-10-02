import { AuthProvider, AdminAuthProvider } from "./auth.tsx";
import { QueryClientProvider } from "./query-client.tsx";
import { CurrencyProvider } from "./currency.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";
import { CartProvider } from "@/hooks/use-cart.tsx";
import CartDrawer from "@/components/CartDrawer.tsx";
import { CookieConsent } from "@/components/CookieConsent.tsx";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AdminAuthProvider>
        <QueryClientProvider>
          <CurrencyProvider>
            <TooltipProvider>
              <CartProvider>
                <Toaster />
                <CartDrawer />
                <CookieConsent />
                {children}
              </CartProvider>
            </TooltipProvider>
          </CurrencyProvider>
        </QueryClientProvider>
      </AdminAuthProvider>
    </AuthProvider>
  );
}
