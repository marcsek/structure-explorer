import { Background, ReactFlow } from "@xyflow/react";
import Controls from "../graphComponents/Controls.tsx";

import { computeLayoutOriented } from "./layout.ts";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import useGraph from "../../helpers/useGraph.ts";
import { useGraphLayout } from "../../helpers/useGraphLayout.ts";
import { defaultFlowProps } from "../common/graphOptions.ts";
import {
  EmptyDomainMessageDialog,
  ErrorMessageDialogBuilder,
} from "../common/MessageDialogs.tsx";
import FlowContainer from "../../components/FlowContainer/FlowContainer.tsx";

const graphType = "oriented";

export default function OrientedGraph({
  id,
  tupleInfo,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
  const {
    nodes,
    edges,
    flowNodes,
    flowEdges,
    warning,
    flowWrapperRef,
    syncNodesWithStore,
    graphProps,
  } = useGraph({ tupleInfo, graphType });

  const onLayout = useGraphLayout({
    tupleInfo,
    graphType,
    nodes,
    edges,
    computeLayout: computeLayoutOriented,
  });

  const dialogShown = nodes.length === 0;

  return (
    <FlowContainer
      ref={flowWrapperRef}
      hintEnabled={!expandedView && !dialogShown}
      zoomEnabled={!expandedView}
    >
      <ReactFlow
        {...defaultFlowProps}
        {...graphProps}
        id={id}
        nodes={flowNodes}
        edges={flowEdges}
        onNodeDragStop={syncNodesWithStore}
        nodesConnectable={!locked}
        panOnDrag={!dialogShown}
        zoomOnScroll={expandedView && !dialogShown}
        zoomOnDoubleClick={!dialogShown}
        zoomOnPinch={!dialogShown}
        snapToGrid
      >
        <Background id={`bg-${id}-${expandedView ? "expanded" : ""}`} />
      </ReactFlow>

      <Controls
        id={id}
        expandedView={expandedView}
        onExpandedViewChange={onExpandedViewChange}
        onLayout={onLayout}
      />

      {warning && (
        <ErrorMessageDialogBuilder body={warning} graphType={graphType} />
      )}

      {nodes.length === 0 && <EmptyDomainMessageDialog />}
    </FlowContainer>
  );
}
