import {
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
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import useGraph from "../../helpers/useGraph.ts";
import {
  defaultFitViewDuration,
  defaultFitViewOptions,
} from "../common/graphOptions.ts";
import GraphCanvas from "../common/GraphCanvas.tsx";
import type { BipartiteNodeType } from "./model.ts";

const fitViewOptions: FitViewOptions = {
  ...defaultFitViewOptions,
  padding: "35px",
};

const controlsFitViewOptions: FitViewOptions = {
  ...fitViewOptions,
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

  return (
    <GraphCanvas
      id={id}
      nodes={groupedNodes}
      edges={edges}
      locked={locked}
      expandedView={expandedView}
      dialogShown={storeNodes.length === 0}
      emptyDomain={nodes.length === 0}
      errorDialog={{ graphType, body: warning }}
      containerRef={flowWrapperRef}
      flowProps={{ ...graphProps, onNodesChange: computeLayoutChange }}
      fitViewOptions={controlsFitViewOptions}
      onNodeDragStop={syncNodesWithStore}
      onExpandedViewChange={onExpandedViewChange}
    />
  );
}
