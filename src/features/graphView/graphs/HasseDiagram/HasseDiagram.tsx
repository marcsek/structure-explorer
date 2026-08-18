import { Background, ReactFlow } from "@xyflow/react";
import { useEffect } from "react";
import { selectPosetValidity } from "../graphSlice.ts";
import { useAppSelector } from "../../../../app/hooks.ts";
import Controls from "../graphComponents/Controls.tsx";
import { computeLayoutHasse } from "./layout.ts";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import useGraph, { useGraphLayout } from "../../helpers/useGraph.ts";
import { defaultFlowProps } from "../common/graphOptions.ts";
import {
  EmptyDomainMessageDialog,
  ErrorMessageDialogBuilder,
} from "../common/MessageDialogs.tsx";
import FlowContainer from "../../components/FlowContainer/FlowContainer.tsx";

const graphType = "hasse";

export default function HasseDiagram({
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
    flowWrapperRef,
    syncNodesWithStore,
    graphProps,
  } = useGraph({ tupleInfo, graphType, includeHovered: true });

  const isPoset = useAppSelector((state) =>
    selectPosetValidity(state, tupleInfo),
  );

  const onLayout = useGraphLayout({
    tupleInfo,
    graphType,
    storeNodes,
    edges,
    computeLayout: computeLayoutHasse,
  });

  useEffect(() => {
    onLayout(true, true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dialogShown = !isPoset || storeNodes.length === 0;

  return (
    <FlowContainer
      ref={flowWrapperRef}
      hintEnabled={!expandedView && !dialogShown}
      zoomEnabled={!expandedView}
    >
      <ReactFlow
        id={id}
        nodes={isPoset ? nodes : []}
        edges={isPoset ? edges : []}
        nodesConnectable={!locked}
        onNodeDragStop={syncNodesWithStore}
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

      {(warning || !isPoset) && (
        <ErrorMessageDialogBuilder
          body={warning}
          graphType={graphType}
          invalidPoset={!isPoset}
        />
      )}

      {isPoset && storeNodes.length === 0 && <EmptyDomainMessageDialog />}
    </FlowContainer>
  );
}
