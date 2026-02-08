import { useLayoutEffect, useRef } from "react";

export type Size = {
  width: number;
  height: number;
};

export function usePreservedSize<T extends HTMLElement>() {
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

  return { ref, size: sizeRef.current };
}
