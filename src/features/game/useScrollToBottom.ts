import { useEffect, type RefObject } from "react";

export default function useScrollToBottom(contentRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const content = contentRef.current;
    const container = content?.parentElement;
    if (!content || !container) return;

    let initial = true;

    const observer = new ResizeObserver(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: initial ? "auto" : "smooth",
      });
      initial = false;
    });

    observer.observe(content);

    return () => observer.disconnect();
  }, [contentRef]);
}
