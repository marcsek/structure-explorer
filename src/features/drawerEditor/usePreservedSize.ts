import { useLayoutEffect, useRef } from "react";

export type Size = {
  width: number;
  height: number;
};

export default function usePreservedSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const sizeRef = useRef<Size | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      sizeRef.current = { width, height };
    });

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  // The size is intentionally not state since it is only read at the moment the
  // observed element gets swapped for the placeholder, so it never needs to
  // trigger a render on its own.
  return { ref, size: sizeRef.current };
}
