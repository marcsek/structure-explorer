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

export interface ControlsComponentProps {
  id: string;
  showInteractive?: boolean;
  expandedView?: boolean;
  fitViewOptions?: FitViewOptions;
  onExpandedViewChange?: OnExpandedViewChange;
  onInteractiveChange?: (change: boolean) => void;
  onLayout?: () => void;
}

function ControlsComponent({
  id,
  expandedView = false,
  fitViewOptions = defaultFitViewOptions,
  onExpandedViewChange,
  onInteractiveChange,
  onLayout,
}: ControlsComponentProps) {
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
        id={id}
        title="Zoom In"
        onClick={() => zoomIn(defaultZoomOptions)}
        icon={faPlus}
      />

      <TooltipControlButton
        id={id}
        title="Zoom Out"
        onClick={() => zoomOut(defaultZoomOptions)}
        icon={faMinus}
      />

      <TooltipControlButton
        id={id}
        title="Fit View"
        onClick={() => fitView(fitViewOptions)}
        icon={faExpand}
      />
      {onLayout !== undefined && (
        <TooltipControlButton
          id={id}
          title="Layout"
          onClick={onLayout}
          icon={faHexagonNodes}
        />
      )}

      <div className="react-flow__controls-divider" />

      <TooltipControlButton
        id={id}
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
  id: string;
  title: string;
  onClick: () => void;
  icon: IconDefinition;
}

function TooltipControlButton({
  id,
  title,
  onClick,
  icon,
}: TooltipControlButtonProps) {
  return (
    <OverlayTrigger
      placement="top"
      delay={{ show: 200, hide: 0 }}
      overlay={
        <Tooltip className="custom-bs-tooltip sm mb" id={`tooltip-${id}`}>
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
