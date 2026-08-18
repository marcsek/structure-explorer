import { Background, ReactFlow } from "@xyflow/react";
import { useEffect } from "react";
import Controls from "../graphComponents/Controls.tsx";

import { computeLayoutOriented } from "./layout.ts";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import useGraph, { useGraphLayout } from "../../helpers/useGraph.ts";
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
    storeNodes,
    nodes,
    edges,
    warning,
    didLayout,
    flowWrapperRef,
    ...graphProps
  } = useGraph({ tupleInfo, graphType });

  const onLayout = useGraphLayout({
    tupleInfo,
    graphType,
    storeNodes,
    edges,
    computeLayout: computeLayoutOriented,
  });

  useEffect(() => {
    onLayout(true, true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dialogShown = storeNodes.length === 0;

  return (
    <FlowContainer
      ref={flowWrapperRef}
      hintEnabled={!expandedView && !dialogShown}
      zoomEnabled={!expandedView}
    >
      <ReactFlow
        id={id}
        nodes={didLayout ? nodes : []}
        edges={edges}
        nodesConnectable={!locked}
        panOnDrag={!dialogShown}
        zoomOnScroll={expandedView && !dialogShown}
        zoomOnDoubleClick={!dialogShown}
        zoomOnPinch={!dialogShown}
        snapToGrid
        {...graphProps}
        {...defaultFlowProps}
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
