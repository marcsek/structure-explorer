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
      startY = 0,
      scrollLeft = 0,
      scrollTop = 0;

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;

      isDown = true;
      dragged = false;

      startX = e.pageX - container.offsetLeft;
      startY = e.pageY - container.offsetTop;
      scrollLeft = container.scrollLeft;
      scrollTop = container.scrollTop;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDown) return;
      e.preventDefault();

      const x = e.pageX - container.offsetLeft;
      const y = e.pageY - container.offsetTop;

      const walkX = x - startX;
      const walkY = y - startY;

      if (Math.abs(walkX) > dragStartMargin) {
        dragged = true;
      }

      container.scrollLeft = scrollLeft - walkX;
      container.scrollTop = scrollTop - walkY;
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
    container.addEventListener("click", onClickCapture, true);

    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("click", onClickCapture, true);
    };
  }, [scrollContainerRef]);
}
