import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./FlowContainer.css";

import { useState, useRef, forwardRef } from "react";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const HIDE_TIMEOUT_DURATION = 1500;

export interface FlowContainerProps {
  children: React.ReactNode;
  hintEnabled: boolean;
}

const FlowContainer = forwardRef<HTMLDivElement, FlowContainerProps>(
  ({ children, hintEnabled }, ref) => {
    const [showHint, setShowHint] = useState(false);
    const hideTimerRef = useRef<number | null>(null);

    const hideZoomHint = () => {
      setShowHint(false);

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;
      }
    };

    const showZoomHint = () => {
      if (!hintEnabled) return;

      setShowHint(true);

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }

      hideTimerRef.current = window.setTimeout(() => {
        setShowHint(false);
        hideTimerRef.current = null;
      }, HIDE_TIMEOUT_DURATION);
    };

    return (
      <div
        ref={ref}
        className="react-flow__container"
        onPointerDownCapture={hideZoomHint}
        onWheelCapture={(e) => {
          if (e.ctrlKey || e.metaKey) return;

          showZoomHint();
          if (hintEnabled) e.stopPropagation();
        }}
        onClick={() => setShowHint(false)}
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
      className={`flow-container-zoom-hint-container ${show ? "is-vissible" : "is-hidden"}`}
    >
      <div className="flow-container-zoom-hint">
        <FontAwesomeIcon icon={faInfoCircle} />
        Hold <span className="kbd">{getModifierKey()}</span> and scroll to zoom
      </div>
    </div>
  );
}

const getModifierKey = () =>
  /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "⌘" : "Ctrl";

export default FlowContainer;
