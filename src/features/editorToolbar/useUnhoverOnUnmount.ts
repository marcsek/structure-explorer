import { useEffect, useRef } from "react";

export function useUnhoverOnUnmount(unhover: () => void) {
  const pendingUnhoverRef = useRef<(() => void) | null>(null);

  useEffect(() => () => pendingUnhoverRef.current?.(), []);

  return (hovered: boolean) => {
    pendingUnhoverRef.current = hovered ? unhover : null;
  };
}
