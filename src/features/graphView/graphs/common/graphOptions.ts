import {
  type NodeTypes,
  type EdgeTypes,
  type DefaultEdgeOptions,
  MarkerType,
  type FitViewOptions,
  type ReactFlowProps,
} from "@xyflow/react";
import DirectEdge, { type DirectEdgeType } from "../graphComponents/DirectEdge";
import SelfConnectingEdge from "../graphComponents/SelfConnectingEdge";
import SetGroupNode from "../graphComponents/SetGroupNode";
import PredicateNode, {
  type PredicateNodeType,
} from "../graphComponents/PredicateNode";
import CustomConnectionLine from "../graphComponents/DirectConnectionLine";

export const connectionLineStyle = {
  stroke: "#b1b1b7",
};

export const nodeTypes: NodeTypes = {
  predicate: PredicateNode,
  setGroup: SetGroupNode,
};

export const edgeTypes: EdgeTypes = {
  direct: DirectEdge,
  selfConnecting: SelfConnectingEdge,
};

export const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "direct",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#b1b1b7",
  },
};

export const defaultFitViewOptions: FitViewOptions = {
  padding: "50px",
  maxZoom: 1,
};

export const defaultFitViewDuration = 300;

export const defaultFlowProps: ReactFlowProps<
  PredicateNodeType,
  DirectEdgeType
> = {
  nodeTypes,
  edgeTypes,
  defaultEdgeOptions,
  fitView: true,
  fitViewOptions: defaultFitViewOptions,
  connectionLineComponent: CustomConnectionLine,
  connectionLineStyle,
  proOptions: { hideAttribution: true },
  nodesFocusable: false,
  edgesFocusable: false,
  edgesReconnectable: false,
  connectOnClick: false,
  minZoom: 0.25,
};
