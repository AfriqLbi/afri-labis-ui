/**
 * CurrencySwitcher — compact flag + code dropdown in the storefront header.
 *
 * Design constraints (must match existing design system):
 *  - bg-background, text-foreground, border-border tokens only
 *  - text-primary (gold) for the active item and hover states
 *  - font-family: 'Montserrat', sans-serif
 *  - text-[10px] tracking-[0.2em] uppercase — matches all other header labels
 *  - Zero border-radius everywhere (--radius: 0rem)
 *  - Animated via motion/react (same pattern as sort dropdown in ShopPage)
 *
 * Accessibility:
 *  - Trigger: role="button", aria-haspopup="listbox", aria-expanded
 *  - Listbox: role="listbox", aria-label="Select currency"
 *  - Options: role="option", aria-selected, data-focused via keyboard nav
 *  - Keyboard: Enter/Space opens, ArrowUp/Down navigates, Enter selects, Escape closes
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useCurrency } from "@/components/providers/currency.tsx";

export default function CurrencySwitcher() {
  const { activeCurrency, enabledCurrencies, rates, isLoading, staleRates, setCurrency } =
    useCurrency();

  const [open, setOpen] = useState(false);
  const [focusIdx, setFocusIdx] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const activeRate = rates.find((r) => r.currency === activeCurrency);
  const activeFlag = activeRate?.flag ?? "🌍";
  const activeCode = activeCurrency;

  // ── Keyboard navigation ──────────────────────────────────────────────────

  const handleTriggerKey = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setOpen((o) => !o);
        setFocusIdx(enabledCurrencies.indexOf(activeCurrency) ?? 0);
      }
      if (e.key === "Escape") setOpen(false);
    },
    [activeCurrency, enabledCurrencies],
  );

  const handleListKey = useCallback(
    (e: React.KeyboardEvent<HTMLUListElement>) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setFocusIdx((i) => Math.min(i + 1, enabledCurrencies.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setFocusIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setCurrency(enabledCurrencies[focusIdx]);
        setOpen(false);
        triggerRef.current?.focus();
      } else if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    },
    [enabledCurrencies, focusIdx, setCurrency],
  );

  // Move DOM focus to the highlighted option
  useEffect(() => {
    if (!open) return;
    const items = listRef.current?.querySelectorAll<HTMLLIElement>("[role=option]");
    items?.[focusIdx]?.focus();
  }, [open, focusIdx]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        disabled={isLoading}
        onClick={() => { setOpen((o) => !o); setFocusIdx(enabledCurrencies.indexOf(activeCurrency)); }}
        onKeyDown={handleTriggerKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Currency: ${activeCode}. Click to change.`}
        className={[
          "flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase transition-colors",
          "text-muted-foreground hover:text-primary disabled:opacity-40 disabled:cursor-not-allowed",
        ].join(" ")}
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        <span aria-hidden="true">{activeFlag}</span>
        <span>{activeCode}</span>
        {/* Stale rate dot */}
        {staleRates && !isLoading && (
          <span
            className="w-1.5 h-1.5 bg-yellow-400/70 animate-pulse"
            title="Exchange rates may be slightly outdated"
            aria-label="Exchange rates may be slightly outdated"
          />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.ul
            ref={listRef}
            role="listbox"
            aria-label="Select currency"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" as const }}
            onKeyDown={handleListKey}
            className={[
              "absolute right-0 top-full mt-2 z-50",
              "bg-card border border-border",
              "min-w-[9rem] py-1",
            ].join(" ")}
            tabIndex={-1}
          >
            {enabledCurrencies.map((code, idx) => {
              const rateEntry = rates.find((r) => r.currency === code);
              const isActive = code === activeCurrency;
              const isFocused = idx === focusIdx;
              return (
                <li
                  key={code}
                  role="option"
                  aria-selected={isActive}
                  tabIndex={-1}
                  onClick={() => { setCurrency(code); setOpen(false); }}
                  onMouseEnter={() => setFocusIdx(idx)}
                  className={[
                    "flex items-center gap-2.5 px-4 py-2.5 cursor-pointer",
                    "text-[10px] tracking-[0.2em] uppercase transition-colors outline-none",
                    isActive
                      ? "text-primary"
                      : isFocused
                      ? "text-foreground bg-muted/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/40",
                  ].join(" ")}
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  <span aria-hidden="true">{rateEntry?.flag ?? "🏳"}</span>
                  <span className="flex-1">{code}</span>
                  <span className="text-muted-foreground/70">{rateEntry?.symbol ?? code}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 bg-primary shrink-0" aria-hidden="true" />
                  )}
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
