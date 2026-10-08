/**
 * useCart — server-side cart as the single source of truth.
 *
 * All add / update / remove operations go directly to the backend
 * POST/PATCH/DELETE /v1/cart/lines.  Guest customers are identified by a
 * stable UUID stored in localStorage and sent as the X-Guest-Id header via
 * the cartFetch helper in api.ts.
 *
 * On login, CartProvider automatically merges the guest cart into the user
 * cart and clears the guest ID from localStorage.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
  type ReactNode,
} from "react";
import {
  cart as cartApi,
  getOrCreateGuestId,
  type ServerCart,
  type ServerCartLine,
  ApiError,
} from "@/lib/api.ts";
import { useAuth } from "@/hooks/use-auth.ts";
import { toast } from "sonner";

// ── Public type ───────────────────────────────────────────────────────────────
// CartItem is kept for compatibility with CartDrawer / checkout rendering.
// It wraps the flat server line into the shape components expect.

export type CartItem = {
  product: {
    id: string; // productId (ObjectId)
    _id: string; // same as id — both always the ObjectId from the server
    name: string;
    price: number; // unit price in NGN naira
    images: string[];
    availableStock?: number; // not returned by cart; undefined until detail page
  };
  size: string; // not tracked server-side; shown as "—"
  color: string; // not tracked server-side; shown as "—"
  quantity: number;
};

// ── Context ───────────────────────────────────────────────────────────────────

type CartContextValue = {
  /** Full server cart, or null while loading */
  serverCart: ServerCart | null;
  /** Cart lines adapted to the CartItem shape for existing components */
  items: CartItem[];
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Subtotal in NGN naira (not kobo) */
  subtotal: number;
  itemCount: number;
  /** Add qty of a product (by ObjectId) */
  addItem: (productId: string, qty?: number) => Promise<void>;
  /** Remove a line entirely */
  removeItem: (productId: string) => Promise<void>;
  /** Set absolute quantity; 0 removes the line */
  updateQuantity: (productId: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [serverCart, setServerCart] = useState<ServerCart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const prevUserId = useRef<string | null>(null);

  // ── Fetch / refetch ───────────────────────────────────────────────────────

  const fetchCart = useCallback(async () => {
    try {
      const c = await cartApi.get();
      setServerCart(c);
    } catch (err) {
      // 401 for guests is expected when not signed in — treat as empty cart
      if (!(err instanceof ApiError && err.status === 401)) {
        console.error("Cart fetch error:", err);
      }
      setServerCart(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // ── Login: merge guest cart then re-fetch ─────────────────────────────────

  useEffect(() => {
    const wasGuest = prevUserId.current === null;
    const nowLoggedIn = user?.id != null;

    if (wasGuest && nowLoggedIn) {
      // User just logged in — merge any guest cart
      const guestId = localStorage.getItem("labi_guest_id");
      if (guestId) {
        cartApi
          .mergeGuest(guestId)
          .then((merged) => {
            setServerCart(merged);
            // Clear guest ID now that it's merged into the user account
            localStorage.removeItem("labi_guest_id");
          })
          .catch(() => {
            // Non-fatal — just refetch the user cart
            fetchCart();
          });
      } else {
        fetchCart();
      }
    }

    prevUserId.current = user?.id ?? null;
  }, [user?.id, fetchCart]);

  // ── Mutations ─────────────────────────────────────────────────────────────

  const addItem = useCallback(async (productId: string, qty = 1) => {
    try {
      const updated = await cartApi.addLine({ productId, quantity: qty });
      setServerCart(updated);
      setIsOpen(true);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Could not add item to cart";
      toast.error(msg);
    }
  }, []);

  const removeItem = useCallback(async (productId: string) => {
    try {
      const updated = await cartApi.removeLine(productId);
      setServerCart(updated);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not remove item",
      );
    }
  }, []);

  const updateQuantity = useCallback(async (productId: string, qty: number) => {
    try {
      const updated =
        qty === 0
          ? await cartApi.removeLine(productId)
          : await cartApi.updateLine({ productId, quantity: qty });
      setServerCart(updated);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Could not update quantity",
      );
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      const updated = await cartApi.clear();
      setServerCart(updated);
    } catch {
      // Silently fail — cart state will be corrected on next fetch
    }
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────

  // Adapt server lines → CartItem shape for backward-compatible rendering
  const items: CartItem[] = (serverCart?.lines ?? []).map(
    (line: ServerCartLine) => ({
      product: {
        id: line.productId,
        _id: line.productId,
        name: line.title,
        price: line.unitPrice,
        images: [line.image].filter(Boolean),
      },
      size: "—",
      color: "—",
      quantity: line.quantity,
    }),
  );

  const subtotal = serverCart?.subtotal ?? 0;
  const itemCount = serverCart?.count ?? 0;

  return (
    <CartContext.Provider
      value={{
        serverCart,
        items,
        isLoading,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        subtotal,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        refetch: fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
