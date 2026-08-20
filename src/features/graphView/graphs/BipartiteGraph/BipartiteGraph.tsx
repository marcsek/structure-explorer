import {
  Background,
  ReactFlow,
  type NodeChange,
  type FitViewOptions,
  useReactFlow,
  type Node,
  useNodesInitialized,
} from "@xyflow/react";
import { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { useAppDispatch } from "../../../../app/hooks";
import { graphDidInitialLayout } from "../graphSlice.ts";
import { addGroupNodes, generateNodeChangesWithLayout } from "./groupNodes.ts";
import Controls from "../graphComponents/Controls.tsx";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import useGraph from "../../helpers/useGraph.ts";
import {
  defaultFitViewDuration,
  defaultFlowProps,
} from "../common/graphOptions.ts";
import {
  EmptyDomainMessageDialog,
  ErrorMessageDialogBuilder,
} from "../common/MessageDialogs.tsx";
import FlowContainer from "../../components/FlowContainer/FlowContainer.tsx";
import type { BipartiteNodeType } from "./model.ts";

const fitViewOptions: FitViewOptions = {
  padding: "35px",
  maxZoom: 1,
};

const controlsFitViewOptions: FitViewOptions = {
  ...fitViewOptions,
  maxZoom: 1,
  duration: defaultFitViewDuration,
};

const graphType = "bipartite";

export default function BipartiteGraph({
  id,
  tupleInfo,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
  const dispatch = useAppDispatch();
  const {
    storeNodes,
    nodes,
    edges,
    didLayout,
    warning,
    flowWrapperRef,
    syncNodesWithStore,
    graphProps: { onNodesChange, ...graphProps },
  } = useGraph({ tupleInfo, graphType, fitViewOptions });

  const nodesInitialized = useNodesInitialized();

  const { getNode, fitView } = useReactFlow();

  useEffect(() => {
    if (nodesInitialized && !didLayout)
      dispatch(
        graphDidInitialLayout({
          tupleInfo,
          graphType,
          didLayout: true,
        }),
      );
  }, [didLayout, dispatch, nodesInitialized, tupleInfo]);

  useLayoutEffect(() => {
    if (nodesInitialized && !didLayout) fitView({ ...fitViewOptions });
  }, [didLayout, fitView, nodesInitialized]);

  const keepPositions = !nodesInitialized && !!didLayout;

  const groupedNodes = useMemo(
    () => addGroupNodes(nodes, keepPositions),
    [nodes, keepPositions],
  );

  const computeLayoutChange = useCallback(
    (changes: NodeChange<BipartiteNodeType | Node>[]) => {
      const bipartiteNodeChanges = changes.filter(
        (ch): ch is NodeChange<BipartiteNodeType> =>
          ch.type === "add" || getNode(ch.id)?.type !== "setGroup",
      );

      const layoutChanges = generateNodeChangesWithLayout(
        bipartiteNodeChanges,
        nodes,
      );

      onNodesChange([...bipartiteNodeChanges, ...layoutChanges]);
    },
    [nodes, onNodesChange, getNode],
  );

  const dialogShown = storeNodes.length === 0;

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
        nodes={groupedNodes}
        edges={edges}
        onNodesChange={computeLayoutChange}
        onNodeDragStop={syncNodesWithStore}
        nodesConnectable={!locked}
        panOnDrag={!dialogShown}
        zoomOnScroll={expandedView && !dialogShown}
        zoomOnDoubleClick={!dialogShown}
        zoomOnPinch={!dialogShown}
      >
        <Background id={`bg-${id}-${expandedView ? "expanded" : ""}`} />
      </ReactFlow>

      <Controls
        id={id}
        expandedView={expandedView}
        fitViewOptions={controlsFitViewOptions}
        onExpandedViewChange={onExpandedViewChange}
      />

      {warning && (
        <ErrorMessageDialogBuilder body={warning} graphType={graphType} />
      )}

      {nodes.length === 0 && <EmptyDomainMessageDialog />}
    </FlowContainer>
  );
}
