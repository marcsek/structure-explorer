import {
  faDownLeftAndUpRightToCenter,
  faExpand,
  faHexagonNodes,
  faMinus,
  faPlus,
  faUpRightAndDownLeftFromCenter,
  type IconDefinition,
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
import { OverlayTrigger, Tooltip } from "react-bootstrap";

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
      <TooltipControlButton
        title="Zoom In"
        onClick={() => zoomIn(defaultZoomOptions)}
        icon={faPlus}
      />

      <TooltipControlButton
        title="Zoom Out"
        onClick={() => zoomOut(defaultZoomOptions)}
        icon={faMinus}
      />

      <TooltipControlButton
        title="Fit View"
        onClick={() => fitView(fitViewOptions)}
        icon={faExpand}
      />
      {onLayout !== undefined && (
        <TooltipControlButton
          title="Layout"
          onClick={onLayout}
          icon={faHexagonNodes}
        />
      )}

      <div className="react-flow__controls-divider" />

      <TooltipControlButton
        title="Expanded View"
        onClick={handleExpandedViewChange}
        icon={
          expandedView
            ? faDownLeftAndUpRightToCenter
            : faUpRightAndDownLeftFromCenter
        }
      />
    </XYControls>
  );
}

interface TooltipControlButtonProps {
  title: string;
  onClick: () => void;
  icon: IconDefinition;
}

function TooltipControlButton({
  title,
  onClick,
  icon,
}: TooltipControlButtonProps) {
  return (
    <OverlayTrigger
      placement="top"
      delay={{ show: 200, hide: 0 }}
      overlay={
        <Tooltip className="custom-bs-tooltip sm mb" id={`tooltip-${title}`}>
          {title}
        </Tooltip>
      }
    >
      <span>
        <ControlButton onClick={onClick}>
          <FontAwesomeIcon icon={icon} fixedWidth />
        </ControlButton>
      </span>
    </OverlayTrigger>
  );
}

export default memo(ControlsComponent);
