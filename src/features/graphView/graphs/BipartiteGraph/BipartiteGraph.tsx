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
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { type PredicateNodeType } from "../graphComponents/PredicateNode";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import {
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
import { useComparatorEffect } from "../../helpers/useComparatorEffect.ts";
import { useAreAllNodesInView } from "../../helpers/useAreAllNodesInView.ts";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import { type SetGroupNodeType } from "../graphComponents/SetGroupNode.tsx";
import { partition } from "../../helpers/utils.ts";
import useSyncNodesWithStore from "../../helpers/useSyncNodesWithStore.ts";
import { defaultFlowProps } from "../common/graphOptions.ts";
import {
  EmptyDomainMessageDialog,
  ErrorMessageDialogBuilder,
} from "../common/MessageDialogs.tsx";

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
  duration: 300,
};

const nodeSelector = makeSelectNodes<"bipartite">();

export default function BipartiteGraph({
  id,
  name,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
  const type = "bipartite";
  const flowWrapper = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const storeNodes = useAppSelector((state) => nodeSelector(state, name, type));
  const edges = useAppSelector(
    (state) => state.present.graphView[name]?.state[type]?.edges,
  );
  const representsFunction = useAppSelector(
    (state) => state.present.graphView[name]?.tupleType === "function",
  );
  const warning = useAppSelector(
    (state) => state.present.graphView[name]?.state[type]?.warning,
  );
  const nodesInitialized = useNodesInitialized();

  const { nodes, onNodesChange, syncNodesWithStore } = useSyncNodesWithStore({
    id: name,
    type,
    storeNodes,
  });

  const { getNode, fitView } = useReactFlow();
  const areAllInView = useAreAllNodesInView(flowWrapper.current);

  useComparatorEffect(() => {
    if (!areAllInView()) fitView({ ...fitViewOptions, duration: 450 });
  }, [[storeNodes, (a, b) => a.id === b.id]]);

  useEffect(() => {
    graphDidInitialLayout({ id: name, type, didLayout: true });
  }, [name]);

  useLayoutEffect(() => {
    if (nodesInitialized) {
      fitView(fitViewOptions);
    }
  }, [fitView, nodesInitialized]);

  useEffect(() => {
    requestAnimationFrame(() => fitView({ ...fitViewOptions }));
  }, [expandedView, fitView]);

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

      // We don't need to layout on only dimension changes
      const layoutChanges = onlyDimensionChanges
        ? []
        : generateNodeChangesWithLayout(bipartiteNodeChanges, nodes);

      onNodesChange([...bipartiteNodeChanges, ...layoutChanges]);
    },
    [nodes, onNodesChange, getNode],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      dispatch(onEdgesChanged({ id: name, type, changes })),
    [name, dispatch],
  );

  const onConnect: OnConnect = useCallback(
    (connection) =>
      dispatch(
        onConnected({
          id: name,
          type,
          connection,
          breakPrevious: representsFunction,
        }),
      ),
    [name, dispatch, representsFunction],
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
          warningChanged({ id: name, type, warning: "Edge already exists." }),
        );
      else if (identicalOrigin) {
        dispatch(
          warningChanged({
            id: name,
            type,
            warning: "Only edges from domain to range nodes are valid.",
          }),
        );
      }

      return !duplicateEdge && !identicalOrigin;
    },
    [dispatch, edges, getNode, name],
  );

  const onConnectEnd = useCallback(() => {
    dispatch(warningChanged({ id: name, type, warning: undefined }));
  }, [dispatch, name]);

  return (
    <>
      <div
        style={{ width: "100%", flexGrow: 1, position: "relative" }}
        ref={flowWrapper}
      >
        <ReactFlow
          id={name}
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
          <Background
            id={`bg-bipartite-${id}-${expandedView ? "expanded" : ""}`}
          />
          <Controls
            expandedView={expandedView}
            fitViewOptions={controlsFitViewOptions}
            onExpandedViewChange={onExpandedViewChange}
          />
        </ReactFlow>

        {warning && (
          <ErrorMessageDialogBuilder body={warning} graphType="bipartite" />
        )}

        {storeNodes.length === 0 && <EmptyDomainMessageDialog />}
      </div>
    </>
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
