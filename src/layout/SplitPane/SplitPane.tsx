import "./SplitPane.css";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type React from "react";

const KEYBOARD_STEP = 0.02;
const DEFAULT_SNAP_RATIOS = [0.5];

interface PaneContextValue {
  side: "left" | "right";
  paneRef?: React.Ref<HTMLDivElement>;
  contentRef?: React.Ref<HTMLDivElement>;
  isScrolling?: boolean;
}

const PaneContext = createContext<PaneContextValue | null>(null);

export type PaneProps = React.HTMLAttributes<HTMLDivElement>;

export function Pane({ children, className = "", ...props }: PaneProps) {
  const context = useContext(PaneContext);

  if (!context) {
    console.error("Pane must be a direct child of SplitPane.");
    return null;
  }

  const { side, paneRef, contentRef, isScrolling } = context;

  return (
    <div
      {...props}
      ref={paneRef}
      className={`split-pane-panel split-pane-${side} ${
        side === "left" && isScrolling ? "split-pane-left-scrolling" : ""
      } ${className}`}
    >
      {side === "left" ? <div ref={contentRef}>{children}</div> : children}
    </div>
  );
}

type PaneElement = React.ReactElement<PaneProps, typeof Pane>;

interface SplitPaneProps {
  children: [PaneElement, PaneElement];
  defaultRatio?: number;
  snapRatios?: number[];
  snapThreshold?: number;
}

export default function SplitPane({
  children,
  defaultRatio = 0.5,
  snapRatios = DEFAULT_SNAP_RATIOS,
  snapThreshold = 30,
}: SplitPaneProps) {
  const [left, right] = children;

  const containerRef = useRef<HTMLDivElement>(null);
  const leftPaneRef = useRef<HTMLDivElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);
  const dividerRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const [ratio, setRatio] = useState(defaultRatio);
  const [isDragging, setIsDragging] = useState(false);
  const [isLeftScrolling, setIsLeftScrolling] = useState(false);

  useLayoutEffect(() => {
    const leftPane = leftPaneRef.current;
    const leftContent = leftContentRef.current;
    if (!leftPane || !leftContent) return;

    const observer = new ResizeObserver(() =>
      setIsLeftScrolling(leftPane.scrollHeight > leftPane.clientHeight),
    );

    observer.observe(leftPane);
    observer.observe(leftContent);

    return () => observer.disconnect();
  }, []);

  const getTrack = useCallback(() => {
    const container = containerRef.current;
    const divider = dividerRef.current;
    if (!container || !divider) return null;

    const { left, width } = container.getBoundingClientRect();
    const dividerWidth = divider.getBoundingClientRect().width;

    if (width - dividerWidth <= 0) return null;

    return { left, dividerWidth, trackWidth: width - dividerWidth };
  }, []);

  const getRenderedRatio = useCallback(() => {
    const track = getTrack();
    const leftPane = leftPaneRef.current;
    if (!track || !leftPane) return null;

    return leftPane.getBoundingClientRect().width / track.trackWidth;
  }, [getTrack]);

  const snapRatio = useCallback(
    (ratio: number, width: number) => {
      let closest = ratio;
      let closestDistance = snapThreshold;

      for (const snap of snapRatios) {
        const distance = Math.abs(ratio - snap) * width;

        if (distance < closestDistance) {
          closest = snap;
          closestDistance = distance;
        }
      }

      return closest;
    },
    [snapRatios, snapThreshold],
  );

  const setRatioFromClientX = useCallback(
    (clientX: number) => {
      const track = getTrack();
      if (!track) return;

      const pointerRatio =
        (clientX - track.left - track.dividerWidth / 2) / track.trackWidth;

      setRatio(snapRatio(pointerRatio, track.trackWidth));
    },
    [getTrack, snapRatio],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let previousWidth = container.getBoundingClientRect().width;

    const observer = new ResizeObserver(([entry]) => {
      const { width } = entry.contentRect;

      if (width === previousWidth) return;

      previousWidth = width;
      setRatio(defaultRatio);
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [defaultRatio]);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const isDragPointer = (event: PointerEvent) =>
      pointerIdRef.current === null || event.pointerId === pointerIdRef.current;

    const stopDragging = () => {
      const pointerId = pointerIdRef.current;
      const divider = dividerRef.current;

      if (pointerId !== null && divider?.hasPointerCapture(pointerId))
        divider.releasePointerCapture(pointerId);

      pointerIdRef.current = null;
      setIsDragging(false);

      const renderedRatio = getRenderedRatio();
      if (renderedRatio !== null) setRatio(renderedRatio);
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragPointer(event)) return;

      if (event.buttons === 0) {
        stopDragging();
        return;
      }

      setRatioFromClientX(event.clientX);
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (isDragPointer(event)) stopDragging();
    };

    window.addEventListener("pointermove", handlePointerMove, true);
    window.addEventListener("pointerup", handlePointerUp, true);
    window.addEventListener("pointercancel", handlePointerUp, true);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove, true);
      window.removeEventListener("pointerup", handlePointerUp, true);
      window.removeEventListener("pointercancel", handlePointerUp, true);
    };
  }, [isDragging, setRatioFromClientX, getRenderedRatio]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowLeft"
        ? -KEYBOARD_STEP
        : event.key === "ArrowRight"
          ? KEYBOARD_STEP
          : 0;

    if (step === 0) return;

    event.preventDefault();

    setRatio((current) => (getRenderedRatio() ?? current) + step);
  };

  const resetRatio = () => setRatio(defaultRatio);

  return (
    <div
      ref={containerRef}
      className={`split-pane ${isDragging ? "split-pane-dragging" : ""}`}
      style={{ "--split-pane-ratio": ratio } as React.CSSProperties}
    >
      <PaneContext.Provider
        value={{
          side: "left",
          paneRef: leftPaneRef,
          contentRef: leftContentRef,
          isScrolling: isLeftScrolling,
        }}
      >
        {left}
      </PaneContext.Provider>

      <div
        ref={dividerRef}
        className="split-pane-divider"
        role="separator"
        aria-orientation="vertical"
        aria-valuenow={Math.round(ratio * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Resize panes"
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        onDoubleClick={resetRatio}
      />

      <PaneContext.Provider value={{ side: "right" }}>
        {right}
      </PaneContext.Provider>
    </div>
  );
}
