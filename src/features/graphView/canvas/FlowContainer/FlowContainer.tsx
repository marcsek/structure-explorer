import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./FlowContainer.css";

import { useState, useRef, forwardRef, useEffect } from "react";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const HIDE_TIMEOUT_DURATION = 750;

export interface FlowContainerProps {
  children: React.ReactNode;
  hintEnabled?: boolean;
  zoomOnModifier?: boolean;
  zoomEnabled?: boolean;
  elementsHidden?: boolean;
}

const FlowContainer = forwardRef<HTMLDivElement, FlowContainerProps>(
  (
    {
      children,
      hintEnabled = true,
      zoomOnModifier = true,
      zoomEnabled = true,
      elementsHidden = false,
    },
    ref,
  ) => {
    const [showHint, setShowHint] = useState(false);
    const hideTimerRef = useRef<number | null>(null);

    useEffect(() => {
      return () => void window.clearTimeout(hideTimerRef.current ?? undefined);
    }, []);

    const showZoomHint = () => {
      if (!hintEnabled) return;

      setShowHint(true);

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }

      hideTimerRef.current = window.setTimeout(() => {
        hideZoomHint();
      }, HIDE_TIMEOUT_DURATION);
    };

    const hideZoomHint = () => {
      setShowHint(false);

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    return (
      <div
        ref={ref}
        className={`react-flow__container ${elementsHidden ? "elements-hidden" : ""}`}
        onPointerDownCapture={hideZoomHint}
        onWheelCapture={(e) => {
          if (!zoomEnabled) {
            return e.stopPropagation();
          }

          if (e.ctrlKey || e.metaKey) {
            return void hideZoomHint();
          }

          showZoomHint();
          if (zoomOnModifier) e.stopPropagation();
        }}
      >
        <ZoomHint show={showHint} />
        {children}
      </div>
    );
  },
);

function ZoomHint({ show }: { show: boolean }) {
  return (
    <div
      className={`flow-container-zoom-hint-container ${show ? "visible" : "hidden"}`}
    >
      <div className="flow-container-zoom-hint">
        <FontAwesomeIcon icon={faInfoCircle} />
        Hold <span className="flow-container-kbd">{getModifierKey()}</span> and
        scroll to zoom
      </div>
    </div>
  );
}

const getModifierKey = () =>
  /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "⌘" : "Ctrl";

export default FlowContainer;
