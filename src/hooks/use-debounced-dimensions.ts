import { useState, useEffect, useRef, type RefObject } from "react";
import { useDebounce } from "./use-debounce";

interface Dimensions {
  width: number;
  height: number;
}

/**
 * Observes the size of a DOM element and returns debounced width/height.
 */
export function useDimensions(
  ref: RefObject<HTMLElement | null>,
  debounceMs = 100,
): Dimensions {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });

  const [rawDimensions, setRawDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });

  const debouncedDimensions = useDebounce(rawDimensions, debounceMs);

  useEffect(() => {
    setDimensions(debouncedDimensions);
  }, [debouncedDimensions]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setRawDimensions({ width, height });
    });

    observer.observe(el);

    // Set initial size
    const { width, height } = el.getBoundingClientRect();
    setRawDimensions({ width, height });

    return () => observer.disconnect();
  }, [ref]);

  return dimensions;
}
