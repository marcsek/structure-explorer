import {
  faExpand,
  faHexagonNodes,
  faLock,
  faLockOpen,
  faMinus,
  faPlus,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ControlButton,
  useReactFlow,
  Controls as XYControls,
  type FitViewOptions,
  type ViewportHelperFunctionOptions,
} from "@xyflow/react";
import { useState } from "react";

const defaultFitViewOptions: FitViewOptions = {
  padding: "50px",
  duration: 300,
};

const defaultZoomOptions: ViewportHelperFunctionOptions = {
  duration: 150,
};

export default function Controls({
  showInteractive = false,
  onInteractiveChange,
  onLayout,
}: {
  showInteractive?: boolean;
  onInteractiveChange?: (change: boolean) => void;
  onLayout?: () => void;
}) {
  const [isInteractive, setIsInteractive] = useState(true);

  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const handleInteractiveChange = () => {
    onInteractiveChange?.(!isInteractive);
    setIsInteractive((prev) => !prev);
  };

  return (
    <XYControls
      orientation="horizontal"
      fitViewOptions={defaultFitViewOptions}
      showInteractive={false}
      showFitView={false}
      showZoom={false}
      onInteractiveChange={onInteractiveChange}
    >
      <ControlButton title="Full Screen" onClick={() => {}}>
        <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} fixedWidth />
      </ControlButton>

      <div className="react-flow__controls-divider" />

      <ControlButton title="Zoom In" onClick={() => zoomIn(defaultZoomOptions)}>
        <FontAwesomeIcon icon={faPlus} fixedWidth />
      </ControlButton>

      <ControlButton
        title="Zoom Out"
        onClick={() => zoomOut(defaultZoomOptions)}
      >
        <FontAwesomeIcon icon={faMinus} fixedWidth />
      </ControlButton>

      <ControlButton
        title="Fit View"
        onClick={() => fitView({ padding: "50px", duration: 300 })}
      >
        <FontAwesomeIcon icon={faExpand} fixedWidth />
      </ControlButton>

      {onLayout !== undefined && (
        <ControlButton title="Layout" onClick={onLayout}>
          <FontAwesomeIcon icon={faHexagonNodes} fixedWidth />
        </ControlButton>
      )}

      {showInteractive && (
        <ControlButton
          title="Toggle Interactivity"
          onClick={handleInteractiveChange}
        >
          <FontAwesomeIcon
            icon={isInteractive ? faLockOpen : faLock}
            fixedWidth
          />
        </ControlButton>
      )}
    </XYControls>
  );
}
