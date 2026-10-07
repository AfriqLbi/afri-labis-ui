import { AnimatePresence, motion } from "motion/react";
import { X, Minus, Plus, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { useCart } from "@/hooks/use-cart.tsx";
import { Link } from "react-router-dom";
import { useCurrency } from "@/components/providers/currency.tsx";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    subtotal,
    itemCount,
  } = useCart();
  const { formatAmount } = useCurrency();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: "easeOut" as const }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <ShoppingBag size={16} className="text-primary" />
                <span
                  className="text-xs tracking-[0.3em] uppercase text-foreground font-semibold"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Your Cart
                </span>
                {itemCount > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </div>
              <button
                onClick={closeCart}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                aria-label="Close cart"
              >
                <X size={18} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-6 px-6">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                  <ShoppingBag size={40} className="text-muted-foreground/40" />
                  <p
                    className="text-2xl font-light text-muted-foreground"
                    style={{ fontFamily: "'Cormorant Garamond', serif" }}
                  >
                    Your cart is empty
                  </p>
                  <button
                    onClick={closeCart}
                    className="text-xs tracking-[0.2em] uppercase text-primary underline underline-offset-4 cursor-pointer"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item) => (
                    <CartItem
                      key={`${item.product.id}-${item.size}-${item.color}`}
                      item={item}
                      onRemove={() =>
                        removeItem(item.product.id, item.size, item.color)
                      }
                      onUpdateQty={(qty) =>
                        updateQuantity(
                          item.product.id,
                          item.size,
                          item.color,
                          qty,
                        )
                      }
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-border px-6 py-6 shrink-0 space-y-4">
                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span
                      className="text-xs tracking-wide text-muted-foreground uppercase"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Subtotal
                    </span>
                    <span
                      className="text-sm text-foreground"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formatAmount(subtotal * 100)}
                    </span>
                  </div>

                  {/* Shipping — calculated at checkout based on address + zone */}
                  <div className="flex justify-between items-center">
                    <span
                      className="text-xs tracking-wide text-muted-foreground uppercase"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Shipping
                    </span>
                    <span
                      className="flex items-center gap-1.5 text-xs text-muted-foreground italic"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      <Truck size={11} />
                      Calculated at checkout
                    </span>
                  </div>

                  <div className="flex justify-between border-t border-border pt-3 mt-1">
                    <span
                      className="text-xs tracking-[0.15em] uppercase text-foreground font-semibold"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Subtotal
                    </span>
                    <span
                      className="text-lg text-primary font-semibold"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      {formatAmount(subtotal * 100)}
                    </span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  onClick={closeCart}
                  className="flex items-center justify-center gap-3 w-full bg-primary text-primary-foreground py-4 text-xs tracking-[0.2em] uppercase font-semibold hover:bg-primary/90 transition-colors cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Proceed to Checkout <ArrowRight size={13} />
                </Link>
                <button
                  onClick={closeCart}
                  className="w-full border border-border text-muted-foreground py-3.5 text-xs tracking-[0.15em] uppercase hover:border-foreground hover:text-foreground transition-colors cursor-pointer"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

type CartItemProps = {
  item: import("@/hooks/use-cart.tsx").CartItem;
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
};

function CartItem({ item, onRemove, onUpdateQty }: CartItemProps) {
  const { formatAmount } = useCurrency();

  // Cap quantity at the product's available stock (falls back to a high cap
  // for static/mock products that don't carry stock info).
  const maxQty = item.product.availableStock ?? 99;
  const canIncrease = item.quantity < maxQty;

  return (
    <div className="flex gap-4">
      <div className="w-20 h-24 shrink-0 overflow-hidden">
        <img
          src={item.product.images[0]}
          alt={item.product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h4
            className="text-base font-light text-foreground leading-snug"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            {item.product.name}
          </h4>
          <button
            onClick={onRemove}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0 mt-0.5"
            aria-label="Remove item"
          >
            <X size={13} />
          </button>
        </div>
        <p
          className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground mt-1"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {item.color} · {item.size}
        </p>

        {/* Stock warning when at the limit */}
        {item.quantity >= maxQty && maxQty < 99 && (
          <p
            className="text-[10px] text-amber-500 mt-1"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Only {maxQty} in stock
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          {/* Qty control */}
          <div className="flex items-center border border-border">
            <button
              onClick={() => onUpdateQty(item.quantity - 1)}
              className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              aria-label="Decrease quantity"
            >
              <Minus size={11} />
            </button>
            <span
              className="w-8 text-center text-xs text-foreground"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {item.quantity}
            </span>
            <button
              onClick={() =>
                canIncrease ? onUpdateQty(item.quantity + 1) : undefined
              }
              disabled={!canIncrease}
              className={`w-7 h-7 flex items-center justify-center transition-colors ${
                canIncrease
                  ? "text-muted-foreground hover:text-foreground cursor-pointer"
                  : "text-muted-foreground/30 cursor-not-allowed"
              }`}
              aria-label="Increase quantity"
              title={!canIncrease ? `Maximum stock: ${maxQty}` : undefined}
            >
              <Plus size={11} />
            </button>
          </div>
          <p
            className="text-sm font-semibold text-primary"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {formatAmount(item.product.price * item.quantity * 100)}
          </p>
        </div>
      </div>
    </div>
  );
}
