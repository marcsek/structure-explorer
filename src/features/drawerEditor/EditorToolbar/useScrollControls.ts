import { useEffect, useRef, useState } from "react";

const defaultScrollIntoViewOptions: ScrollIntoViewOptions = {
  behavior: "smooth",
  inline: "center",
  block: "nearest",
};

interface UseScrollViewOptions {
  scrollIntoViewOptions?: ScrollIntoViewOptions;
  edgeMargin?: number;
}

export default function useScrollControls(options?: UseScrollViewOptions) {
  const {
    scrollIntoViewOptions = defaultScrollIntoViewOptions,
    edgeMargin = 0,
  } = options ?? {};

  const scrollContainerRef = useRef<HTMLFieldSetElement>(null);
  const [showLeftControl, setShowLeftButton] = useState(false);
  const [showRightControl, setShowRightButton] = useState(false);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

    setShowLeftButton(scrollLeft > 0);
    setShowRightButton(scrollLeft + clientWidth < scrollWidth - 1);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    handleScroll();

    container.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      resizeObserver.disconnect();
    };
  }, []);

  const scrollIntoView = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    const childrenByOffset = [...children].sort(
      (a, b) => a.offsetLeft - b.offsetLeft,
    );

    const { clientWidth, scrollLeft } = container;
    const viewRight = scrollLeft + clientWidth;

    const isOverflowingRight = (child: HTMLElement) => {
      const childRight = child.offsetLeft + child.offsetWidth;
      return childRight > viewRight - edgeMargin;
    };

    const isOverflowingLeft = (child: HTMLElement) => {
      const childLeft = child.offsetLeft;
      return childLeft < scrollLeft + edgeMargin;
    };

    if (direction === "right") {
      childrenByOffset
        .find((child) => isOverflowingRight(child) && !isOverflowingLeft(child))
        ?.scrollIntoView(scrollIntoViewOptions);
    } else {
      childrenByOffset
        .reverse()
        .find((child) => isOverflowingLeft(child) && !isOverflowingRight(child))
        ?.scrollIntoView(scrollIntoViewOptions);
    }
  };

  return {
    scrollContainerRef,
    scrollIntoView,
    showLeftControl,
    showRightControl,
  };
}
