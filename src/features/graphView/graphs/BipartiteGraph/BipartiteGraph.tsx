import {
  Background,
  ReactFlow,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type OnConnect,
  applyNodeChanges,
  type NodePositionChange,
  type FitViewOptions,
  useReactFlow,
  type IsValidConnection,
  type Node,
  useNodesInitialized,
} from "@xyflow/react";
import { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { type PredicateNodeType } from "../graphComponents/PredicateNode";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import {
  getTupleId,
  graphDidInitialLayout,
  makeSelectNodes,
  onConnected,
  onEdgesChanged,
  warningChanged,
} from "../graphSlice.ts";
import {
  computeGroupContainerBounds,
  generateLayoutNodesChangesBipartite,
} from "./layout.ts";
import Controls from "../graphComponents/Controls.tsx";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import { type SetGroupNodeType } from "../graphComponents/SetGroupNode.tsx";
import { partition } from "../../helpers/utils.ts";
import useSyncNodesWithStore from "../../helpers/useSyncNodesWithStore.ts";
import {
  defaultFitViewDuration,
  defaultFlowProps,
} from "../common/graphOptions.ts";
import {
  EmptyDomainMessageDialog,
  ErrorMessageDialogBuilder,
} from "../common/MessageDialogs.tsx";
import useFitViewOnNodeAdded from "../../helpers/useFitViewOnNodeAdded.ts";

export type OriginSet = "domain" | "range";

export type BipartiteNodeType = PredicateNodeType<{
  origin: OriginSet;
}>;

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
const nodeSelector = makeSelectNodes<"bipartite">();

export default function BipartiteGraph({
  id,
  tupleName,
  tupleType,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
  const representsFunction = tupleType === "function";
  const tupleId = getTupleId(tupleType, tupleName);

  const dispatch = useAppDispatch();
  const storeNodes = useAppSelector((state) =>
    nodeSelector(state, tupleName, tupleType, graphType),
  );
  const edges = useAppSelector(
    (state) => state.present.graphView[tupleId]?.state[graphType]?.edges,
  );
  const warning = useAppSelector(
    (state) => state.present.graphView[tupleId]?.state[graphType]?.warning,
  );

  const nodesInitialized = useNodesInitialized();

  const { nodes, onNodesChange, syncNodesWithStore } = useSyncNodesWithStore({
    tupleName,
    graphType,
    tupleType,
    storeNodes,
  });

  const { getNode, fitView } = useReactFlow();

  const flowWrapperRef = useFitViewOnNodeAdded({ nodes: storeNodes });

  useEffect(() => {
    dispatch(
      graphDidInitialLayout({
        tupleName,
        graphType,
        tupleType,
        didLayout: true,
      }),
    );
  }, [dispatch, tupleName, tupleType]);

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

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      dispatch(onEdgesChanged({ tupleName, graphType, tupleType, changes })),
    [dispatch, tupleName, tupleType],
  );

  const onConnect: OnConnect = useCallback(
    (connection) =>
      dispatch(
        onConnected({
          tupleName,
          graphType,
          tupleType,
          connection,
          breakPrevious: representsFunction,
        }),
      ),
    [dispatch, tupleName, tupleType, representsFunction],
  );

  const isValidConnection: IsValidConnection = useCallback(
    (newEdge) => {
      const duplicateEdge = edges.some(
        (edge) =>
          newEdge.source === edge.source && newEdge.target === edge.target,
      );

      const identicalOrigin =
        getNode(newEdge.source)?.data.origin ===
        getNode(newEdge.target)?.data.origin;

      if (duplicateEdge)
        dispatch(
          warningChanged({
            tupleName,
            graphType,
            tupleType,
            warning: "Edge already exists.",
          }),
        );
      else if (identicalOrigin) {
        dispatch(
          warningChanged({
            tupleName,
            graphType,
            tupleType,
            warning: "Only edges from domain to range nodes are valid.",
          }),
        );
      }

      return !duplicateEdge && !identicalOrigin;
    },
    [dispatch, edges, getNode, tupleName, tupleType],
  );

  const onConnectEnd = useCallback(() => {
    dispatch(
      warningChanged({
        tupleName,
        graphType,
        tupleType,
        warning: undefined,
      }),
    );
  }, [dispatch, tupleName, tupleType]);

  return (
    <div className="react-flow__container" ref={flowWrapperRef}>
      <ReactFlow
        id={id}
        nodes={groupedNodes}
        edges={edges}
        onNodesChange={computeLayoutChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onNodeDragStop={syncNodesWithStore}
        isValidConnection={isValidConnection}
        nodesConnectable={!locked}
        panOnDrag={storeNodes.length !== 0}
        zoomOnScroll={storeNodes.length !== 0}
        {...defaultFlowProps}
      >
        <Background id={`bg-${id}-${expandedView ? "expanded" : ""}`} />
        <Controls
          expandedView={expandedView}
          fitViewOptions={controlsFitViewOptions}
          onExpandedViewChange={onExpandedViewChange}
        />
      </ReactFlow>

      {warning && (
        <ErrorMessageDialogBuilder body={warning} graphType={graphType} />
      )}

      {storeNodes.length === 0 && <EmptyDomainMessageDialog />}
    </div>
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
