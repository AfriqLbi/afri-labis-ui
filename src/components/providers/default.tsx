import { AuthProvider } from "./auth.tsx";
import { QueryClientProvider } from "./query-client.tsx";
import { CurrencyProvider } from "./currency.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";
import { CartProvider } from "@/hooks/use-cart.tsx";
import CartDrawer from "@/components/CartDrawer.tsx";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryClientProvider>
        {/* CurrencyProvider wraps CartProvider so formatAmount() is available
            inside CartDrawer which renders at the provider level */}
        <CurrencyProvider>
          <TooltipProvider>
            <CartProvider>
              <Toaster />
              <CartDrawer />
              {children}
            </CartProvider>
          </TooltipProvider>
        </CurrencyProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
