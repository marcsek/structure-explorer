import { useEffect, type RefObject } from "react";

const dragStartMargin = 5;

export default function useDraggingScroll(
  scrollContainerRef: RefObject<HTMLElement>,
) {
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let isDown = false,
      dragged = false;

    let startX = 0,
      scrollLeft = 0;

    const clampScrollLeft = (left: number) =>
      Math.max(
        0,
        Math.min(left, container.scrollWidth - container.clientWidth),
      );

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || container.scrollWidth <= container.clientWidth)
        return;

      e.preventDefault();

      isDown = true;
      dragged = false;

      startX = e.clientX;
      scrollLeft = clampScrollLeft(container.scrollLeft);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();

      const walkX = e.clientX - startX;

      if (!dragged && Math.abs(walkX) <= dragStartMargin) return;
      dragged = true;

      container.scrollTo({
        left: clampScrollLeft(scrollLeft - walkX),
        behavior: "instant",
      });
    };

    const endDrag = () => {
      isDown = false;
    };

    const onMouseUp = () => {
      endDrag();
    };

    const onClickCapture = (e: MouseEvent) => {
      if (dragged) {
        e.stopPropagation();
        e.preventDefault();
      }

      dragged = false;
    };

    container.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("blur", endDrag);
    container.addEventListener("click", onClickCapture, true);

    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("blur", endDrag);
      container.removeEventListener("click", onClickCapture, true);
    };
  }, [scrollContainerRef]);
}
