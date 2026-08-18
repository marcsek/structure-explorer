import {
  Background,
  ReactFlow,
  type NodeChange,
  applyNodeChanges,
  type NodePositionChange,
  type FitViewOptions,
  useReactFlow,
  type Node,
  useNodesInitialized,
} from "@xyflow/react";
import { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { useAppDispatch } from "../../../../app/hooks";
import { graphDidInitialLayout } from "../graphSlice.ts";
import {
  computeGroupContainerBounds,
  generateLayoutNodesChangesBipartite,
} from "./layout.ts";
import Controls from "../graphComponents/Controls.tsx";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import { type SetGroupNodeType } from "../graphComponents/SetGroupNode.tsx";
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
import { partition } from "../../../../shared/core/utils.ts";
import type { BipartiteNodeType, OriginSet } from "./model.ts";

const groupNodeOptions = {
  selectable: false,
  focusable: false,
  draggable: false,
  deletable: false,
  connectable: false,
  type: "setGroup",
} satisfies Partial<Node>;

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
    warning,
    flowWrapperRef,
    onNodesChange,
    ...graphProps
  } = useGraph({ tupleInfo, graphType });

  const nodesInitialized = useNodesInitialized();

  const { getNode, fitView } = useReactFlow();

  useEffect(() => {
    dispatch(
      graphDidInitialLayout({
        tupleInfo,
        graphType,
        didLayout: true,
      }),
    );
  }, [dispatch, tupleInfo]);

  useLayoutEffect(() => {
    if (nodesInitialized) fitView({ ...fitViewOptions });
  }, [fitView, nodesInitialized]);

  const groupedNodes = useMemo(() => addGroupNodes(nodes), [nodes]);

  const computeLayoutChange = useCallback(
    (changes: NodeChange<BipartiteNodeType | Node>[]) => {
      const bipartiteNodeChanges = changes.filter(
        (ch): ch is NodeChange<BipartiteNodeType> =>
          ch.type === "add" || getNode(ch.id)?.type !== "setGroup",
      );

      const onlyDimensionChanges = changes.every(
        (ch) => ch.type === "dimensions",
      );

      // No need to layout on only dimension changes
      const layoutChanges = onlyDimensionChanges
        ? []
        : generateNodeChangesWithLayout(bipartiteNodeChanges, nodes);

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
        id={id}
        nodes={groupedNodes}
        edges={edges}
        onNodesChange={computeLayoutChange}
        nodesConnectable={!locked}
        panOnDrag={!dialogShown}
        zoomOnScroll={expandedView && !dialogShown}
        zoomOnDoubleClick={!dialogShown}
        zoomOnPinch={!dialogShown}
        {...graphProps}
        {...defaultFlowProps}
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

      {storeNodes.length === 0 && <EmptyDomainMessageDialog />}
    </FlowContainer>
  );
}

const createGroupNode = (
  originSet: OriginSet,
  size: { width: number; height: number },
  offset: { x: number; y: number },
): SetGroupNodeType => {
  return {
    id: `${originSet}-group`,
    position: offset,
    ...size,
    measured: size,
    data: { label: originSet, origin: originSet },
    className: `set-group-node origin-${originSet}`,
    ...groupNodeOptions,
  };
};

const generateNodeChangesWithLayout = (
  changes: NodeChange<BipartiteNodeType>[],
  nodes: BipartiteNodeType[],
) => {
  const newNodes = applyNodeChanges(changes, nodes);

  const draggedNodeIds = changes
    .filter(
      (change): change is NodePositionChange =>
        change.type === "position" && !!change.dragging,
    )
    .map((change) => change.id);

  return generateLayoutNodesChangesBipartite(newNodes, draggedNodeIds);
};

const addGroupNodes = (nodes: BipartiteNodeType[]) => {
  const { bounds, offset } = computeGroupContainerBounds(nodes);

  if (nodes.length === 0) return [];

  const domainGroup = createGroupNode("domain", bounds, {
    ...offset,
    x: -offset.x,
  });
  const rangeGroup = createGroupNode("range", bounds, offset);

  const childNodes: BipartiteNodeType[] = nodes.map((node) => ({
    ...node,
    parentId: node.data.origin === "domain" ? domainGroup.id : rangeGroup.id,
    extent: "parent",
  }));

  const [childrenDomain, childrenRange] = partition(
    childNodes,
    (n) => n.data.origin === "domain",
  );

  return [domainGroup, ...childrenDomain, rangeGroup, ...childrenRange];
};
