import {
  Background,
  ReactFlow,
  type DefaultEdgeOptions,
  type Edge,
  type EdgeTypes,
  type FitViewOptions,
  type Node,
  type NodeTypes,
  type ReactFlowProps,
} from "@xyflow/react";
import type { ReactNode, Ref } from "react";

import FlowContainer from "./FlowContainer/FlowContainer.tsx";
import type { OnExpandedViewChange } from "../GraphView.tsx";
import Controls from "./Controls/Controls.tsx";
import DirectConnectionLine from "./edges/DirectConnectionLine.tsx";
import DirectEdge from "./edges/DirectEdge.tsx";
import PredicateNode from "./nodes/PredicateNode.tsx";
import SetGroupNode from "./nodes/SetGroupNode.tsx";
import { SNAP_GRID_SIZE } from "./graphOptions.ts";
import { ConnectionWarningDialog } from "./dialogs/GraphDialogs.tsx";

const nodeTypes: NodeTypes = {
  predicate: PredicateNode,
  setGroup: SetGroupNode,
};

const edgeTypes: EdgeTypes = {
  direct: DirectEdge,
};

const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "direct",
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
  warning: ReactNode;
  blockingDialog?: ReactNode;
  containerRef: Ref<HTMLDivElement>;
  flowProps: ReactFlowProps<NodeType, EdgeType>;
  fitViewOptions?: FitViewOptions;
  elementsHidden?: boolean;
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
  warning,
  blockingDialog,
  containerRef,
  flowProps,
  fitViewOptions,
  elementsHidden = false,
  onNodeDragStop,
  onExpandedViewChange,
  onLayout,
}: GraphCanvasProps<NodeType, EdgeType>) {
  const dialogShown = Boolean(blockingDialog);

  return (
    <FlowContainer
      ref={containerRef}
      hintEnabled={!expandedView && !dialogShown}
      zoomOnModifier={!expandedView}
      zoomEnabled={!dialogShown}
      elementsHidden={elementsHidden}
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
        connectionLineComponent={DirectConnectionLine}
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

      <ConnectionWarningDialog warning={warning} />

      {blockingDialog}
    </FlowContainer>
  );
}
