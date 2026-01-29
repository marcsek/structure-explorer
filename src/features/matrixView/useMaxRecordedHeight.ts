import { useLayoutEffect, useRef, useState } from "react";

export default function useMaxRecordedHeight() {
  const [maxHeight, setMaxHeight] = useState<number>(0);
  const ref = useRef<HTMLDivElement>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    if (ref.current) {
      const height = ref.current.getBoundingClientRect().height;
      setMaxHeight((prev) => Math.max(prev ?? 0, height));
    }
  });

  return { height: maxHeight, ref };
}
