import { useEffect, useRef } from "react";

export interface UseClickAwayListenerProps {
  onClickOutside: () => void;
  shouldListen: boolean;
}

export default function useClickAwayListener<T extends HTMLElement>({
  onClickOutside,
  shouldListen,
}: UseClickAwayListenerProps) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node))
        onClickOutside();
    }

    if (shouldListen)
      document.addEventListener("pointerdown", handleClickOutside);
    else document.removeEventListener("pointerdown", handleClickOutside);

    return () =>
      document.removeEventListener("pointerdown", handleClickOutside);
  }, [onClickOutside, shouldListen]);

  return ref;
}
