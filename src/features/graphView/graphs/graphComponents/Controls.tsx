import {
  faDownLeftAndUpRightToCenter,
  faExpand,
  faHexagonNodes,
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
import { memo } from "react";
import type { OnExpandedViewChange } from "../../components/GraphView/GraphView";

const defaultFitViewOptions: FitViewOptions = {
  padding: "50px",
  maxZoom: 1,
  duration: 300,
};

const defaultZoomOptions: ViewportHelperFunctionOptions = {
  duration: 150,
};

function ControlsComponent({
  expandedView = false,
  fitViewOptions = defaultFitViewOptions,
  onExpandedViewChange,
  onInteractiveChange,
  onLayout,
}: {
  showInteractive?: boolean;
  expandedView?: boolean;
  fitViewOptions?: FitViewOptions;
  onExpandedViewChange?: OnExpandedViewChange;
  onInteractiveChange?: (change: boolean) => void;
  onLayout?: () => void;
}) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();

  const handleExpandedViewChange = () => {
    onExpandedViewChange?.(!expandedView);
  };

  return (
    <XYControls
      orientation="horizontal"
      position="bottom-right"
      fitViewOptions={fitViewOptions}
      showInteractive={false}
      showFitView={false}
      showZoom={false}
      onInteractiveChange={onInteractiveChange}
    >
      <ControlButton title="Zoom In" onClick={() => zoomIn(defaultZoomOptions)}>
        <FontAwesomeIcon icon={faPlus} fixedWidth />
      </ControlButton>

      <ControlButton
        title="Zoom Out"
        onClick={() => zoomOut(defaultZoomOptions)}
      >
        <FontAwesomeIcon icon={faMinus} fixedWidth />
      </ControlButton>

      <ControlButton title="Fit View" onClick={() => fitView(fitViewOptions)}>
        <FontAwesomeIcon icon={faExpand} fixedWidth />
      </ControlButton>

      {onLayout !== undefined && (
        <ControlButton title="Layout" onClick={onLayout}>
          <FontAwesomeIcon icon={faHexagonNodes} fixedWidth />
        </ControlButton>
      )}

      <div className="react-flow__controls-divider" />

      <ControlButton title="Expanded View" onClick={handleExpandedViewChange}>
        <FontAwesomeIcon
          icon={
            expandedView
              ? faDownLeftAndUpRightToCenter
              : faUpRightAndDownLeftFromCenter
          }
          fixedWidth
        />
      </ControlButton>
    </XYControls>
  );
}

export default memo(ControlsComponent);
