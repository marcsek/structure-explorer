import {
  Background,
  MarkerType,
  ReactFlow,
  type DefaultEdgeOptions,
  type Edge,
  type EdgeTypes,
  type FitViewOptions,
  type Node,
  type NodeTypes,
  type ReactFlowProps,
} from "@xyflow/react";
import type { Ref } from "react";

import FlowContainer from "../../components/FlowContainer/FlowContainer.tsx";
import type { OnExpandedViewChange } from "../../components/GraphView/GraphView.tsx";
import Controls from "../graphComponents/Controls.tsx";
import CustomConnectionLine from "../graphComponents/DirectConnectionLine.tsx";
import DirectEdge from "../graphComponents/DirectEdge.tsx";
import PredicateNode from "../graphComponents/PredicateNode.tsx";
import SelfConnectingEdge from "../graphComponents/SelfConnectingEdge.tsx";
import SetGroupNode from "../graphComponents/SetGroupNode.tsx";
import { SNAP_GRID_SIZE } from "./graphOptions.ts";
import {
  EmptyDomainMessageDialog,
  ErrorMessageDialogBuilder,
  type ErrorMessageDialogBuilderProps,
} from "./MessageDialogs.tsx";

const nodeTypes: NodeTypes = {
  predicate: PredicateNode,
  setGroup: SetGroupNode,
};

const edgeTypes: EdgeTypes = {
  direct: DirectEdge,
  selfConnecting: SelfConnectingEdge,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "direct",
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#b1b1b7",
  },
};

const proOptions = { hideAttribution: true };

const snapGrid: [number, number] = [SNAP_GRID_SIZE, SNAP_GRID_SIZE];

export interface GraphCanvasProps<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
> {
  id: string;
  nodes: NodeType[];
  edges: EdgeType[];
  locked: boolean;
  expandedView: boolean;
  dialogShown: boolean;
  emptyDomain: boolean;
  errorDialog: ErrorMessageDialogBuilderProps;
  containerRef: Ref<HTMLDivElement>;
  flowProps: ReactFlowProps<NodeType, EdgeType>;
  fitViewOptions?: FitViewOptions;
  onNodeDragStop: () => void;
  onExpandedViewChange?: OnExpandedViewChange;
  onLayout?: () => void;
}

export default function GraphCanvas<
  NodeType extends Node = Node,
  EdgeType extends Edge = Edge,
>({
  id,
  nodes,
  edges,
  locked,
  expandedView,
  dialogShown,
  emptyDomain,
  errorDialog,
  containerRef,
  flowProps,
  fitViewOptions,
  onNodeDragStop,
  onExpandedViewChange,
  onLayout,
}: GraphCanvasProps<NodeType, EdgeType>) {
  return (
    <FlowContainer
      ref={containerRef}
      hintEnabled={!expandedView && !dialogShown}
      zoomEnabled={!expandedView}
    >
      <ReactFlow
        id={id}
        nodes={nodes}
        edges={edges}
        onNodeDragStop={onNodeDragStop}
        nodesConnectable={!locked}
        panOnDrag={!dialogShown}
        zoomOnScroll={expandedView && !dialogShown}
        zoomOnDoubleClick={!dialogShown}
        zoomOnPinch={!dialogShown}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={CustomConnectionLine}
        proOptions={proOptions}
        snapGrid={snapGrid}
        nodesFocusable={false}
        edgesFocusable={false}
        edgesReconnectable={false}
        connectOnClick={false}
        minZoom={0.25}
        {...flowProps}
      >
        <Background id={`bg-${id}-${expandedView ? "expanded" : ""}`} />
      </ReactFlow>

      <Controls
        id={id}
        expandedView={expandedView}
        fitViewOptions={fitViewOptions}
        onExpandedViewChange={onExpandedViewChange}
        onLayout={onLayout}
      />

      <ErrorMessageDialogBuilder {...errorDialog} />

      {emptyDomain && <EmptyDomainMessageDialog />}
    </FlowContainer>
  );
}
