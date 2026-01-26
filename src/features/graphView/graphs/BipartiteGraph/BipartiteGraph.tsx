import {
  Background,
  ReactFlow,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type OnConnect,
  MarkerType,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
  applyNodeChanges,
  type NodePositionChange,
  type FitViewOptions,
  useReactFlow,
  type IsValidConnection,
  type Node,
  useNodesInitialized,
} from "@xyflow/react";
import { useCallback, useEffect, useMemo, useRef } from "react";
import PredicateNodeComponent, {
  type PredicateNodeType,
} from "../graphComponents/PredicateNode";
import DirectEdge from "../graphComponents/DirectEdge";
import CustomConnectionLine from "../graphComponents/DirectConnectionLine";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import {
  graphDidInitialLayout,
  makeSelectNodes,
  onConnected,
  onEdgesChanged,
  onNodesChanged,
  warningChanged,
} from "../graphSlice.ts";
import {
  computeGroupContainerBounds,
  generateLayoutNodesChangesBipartite,
} from "./layout.ts";
import SelfConnectingEdge from "../graphComponents/SelfConnectingEdge.tsx";
import Controls from "../graphComponents/Controls.tsx";
import { useComparatorEffect } from "../../helpers/useComparatorEffect.ts";
import { useAreAllNodesInView } from "../../helpers/useAreAllNodesInView.ts";
import MessageDialog from "../graphComponents/MessageDialog/MessageDialog.tsx";
import type { OnExpandedViewChange } from "../../components/GraphView/GraphView.tsx";
import SetGroupNode, {
  type SetGroupNodeType,
} from "../graphComponents/SetGroupNode.tsx";
import { partition } from "../../helpers/utils.ts";

export type OriginSet = "domain" | "range";

export type BipartiteNodeType = PredicateNodeType<{
  origin: OriginSet;
}>;

const connectionLineStyle = {
  stroke: "#b1b1b7",
};

const nodeTypes: NodeTypes = {
  predicate: PredicateNodeComponent,
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

const nodeSelector = makeSelectNodes<"bipartite">();

export default function BipartiteGraph({
  id,
  name,
  locked,
  expandedView = false,
  onExpandedViewChange,
}: {
  id: string;
  name: string;
  locked: boolean;
  expandedView?: boolean;
  onExpandedViewChange?: OnExpandedViewChange;
}) {
  const type = "bipartite";
  const flowWrapper = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const nodes = useAppSelector((state) => nodeSelector(state, name, type));
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

  const { getNode, fitView } = useReactFlow();
  const areAllInView = useAreAllNodesInView(flowWrapper.current);

  useComparatorEffect(() => {
    if (!areAllInView()) fitView({ ...fitViewOptions, duration: 450 });
  }, [[nodes, (a, b) => a.id === b.id]]);

  useEffect(() => {
    graphDidInitialLayout({ id: name, type, didLayout: true });
  }, [name]);

  useEffect(() => {
    if (nodesInitialized) {
      fitView(fitViewOptions);
    }
  }, [fitView, nodesInitialized]);

  useEffect(() => {
    requestAnimationFrame(() => fitView({ ...fitViewOptions }));
  }, [expandedView, fitView]);

  const groupedNodes = useMemo(() => addGroupNodes(nodes), [nodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange<BipartiteNodeType | Node>[]) => {
      const bipartiteNodeChanges = changes.filter(
        (ch): ch is NodeChange<BipartiteNodeType> =>
          ch.type === "add" || getNode(ch.id)?.type !== "setGroup",
      );

      const allChanges = [
        ...bipartiteNodeChanges,
        ...generateNodeChangesWithLayout(bipartiteNodeChanges, nodes),
      ];

      dispatch(onNodesChanged({ id: name, type, changes: allChanges }));
    },
    [nodes, name, dispatch, getNode],
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
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineComponent={CustomConnectionLine}
          connectionLineStyle={connectionLineStyle}
          isValidConnection={isValidConnection}
          proOptions={{ hideAttribution: true }}
          nodesFocusable={false}
          nodesConnectable={!locked}
          edgesFocusable={false}
          edgesReconnectable={false}
          connectOnClick={false}
          panOnDrag={nodes.length !== 0}
          zoomOnScroll={nodes.length !== 0}
        >
          <Background
            id={`bg-bipartite-${id}-${expandedView ? "expanded" : ""}`}
          />
          <Controls
            expandedView={expandedView}
            fitViewOptions={{ ...fitViewOptions, maxZoom: 1, duration: 300 }}
            onExpandedViewChange={onExpandedViewChange}
          />
        </ReactFlow>
        {warning && (
          <MessageDialog type="error" position="corner" body={warning} />
        )}
        {nodes.length === 0 && (
          <MessageDialog
            type="info"
            position="center"
            title="No nodes to display"
            body={"The domain you have selected is empty."}
          />
        )}
      </div>
    </>
  );
}
