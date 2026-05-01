import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import "./FlowContainer.css";

import { useState, useRef, forwardRef, useEffect } from "react";
import { faInfoCircle } from "@fortawesome/free-solid-svg-icons";

const HIDE_TIMEOUT_DURATION = 2300;
const THROTTLE_TIMEOUT_DURATION = 5000;

export interface FlowContainerProps {
  children: React.ReactNode;
  hintEnabled: boolean;
}

const FlowContainer = forwardRef<HTMLDivElement, FlowContainerProps>(
  ({ children, hintEnabled }, ref) => {
    const [showHint, setShowHint] = useState(false);
    const hideTimerRef = useRef<number | null>(null);
    const throttleTimerRef = useRef<number | null>(null);

    useEffect(() => {
      return () => {
        window.clearTimeout(hideTimerRef.current ?? undefined);
        window.clearTimeout(throttleTimerRef.current ?? undefined);
      };
    }, []);

    const hideZoomHint = () => {
      setShowHint(false);

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
        hideTimerRef.current = null;

        throttleHint();
      }
    };

    const showZoomHint = () => {
      if (!hintEnabled || throttleTimerRef.current) return;

      setShowHint(true);

      if (hideTimerRef.current) {
        window.clearTimeout(hideTimerRef.current);
      }

      hideTimerRef.current = window.setTimeout(() => {
        setShowHint(false);
        hideTimerRef.current = null;

        throttleHint();
      }, HIDE_TIMEOUT_DURATION);
    };

    const throttleHint = () => {
      throttleTimerRef.current = window.setTimeout(() => {
        throttleTimerRef.current = null;
      }, THROTTLE_TIMEOUT_DURATION);
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
