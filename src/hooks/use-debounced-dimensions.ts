import { useState, useEffect, type RefObject } from "react";
import { useDebounce } from "./use-debounce";

interface Dimensions {
  width: number;
  height: number;
}

const INITIAL: Dimensions = { width: 0, height: 0 };

/**
 * Observes the size of a DOM element and returns debounced width/height.
 */
export function useDimensions(
  ref: RefObject<HTMLElement | null>,
  debounceMs = 100,
): Dimensions {
  const [raw, setRaw] = useState<Dimensions>(INITIAL);
  const [debounced] = useDebounce(raw, debounceMs);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setRaw({ width, height });
    });

    observer.observe(el);

    // Capture initial size
    const { width, height } = el.getBoundingClientRect();
    setRaw({ width, height });

    return () => observer.disconnect();
  }, [ref]);

  return debounced;
}
