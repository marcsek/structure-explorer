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
} from "@xyflow/react";
import { useCallback, useEffect } from "react";
import PredicateNodeComponent, {
  type PredicateNodeType,
} from "../graphComponents/PredicateNode";
import DirectEdge from "../graphComponents/DirectEdge";
import CustomConnectionLine from "../graphComponents/DirectConnectionLine";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import {
  editorLocked,
  onConnected,
  onEdgesChanged,
  setNodes,
} from "../graphSlice.ts";
import { layoutNodes } from "./layout.ts";
import SelfConnectingEdge from "../graphComponents/SelfConnectingEdge.tsx";
import Controls from "../graphComponents/Controls.tsx";

export type BipartiteNodeType = PredicateNodeType<{
  origin: "domain" | "range";
}>;

const connectionLineStyle = {
  stroke: "#b1b1b7",
};

const nodeTypes: NodeTypes = {
  predicate: PredicateNodeComponent,
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

const fitViewOptions: FitViewOptions = {
  padding: "50px",
};

const applyNodeChangesWithLayout = (
  changes: NodeChange<BipartiteNodeType>[],
  nodes: BipartiteNodeType[],
) => {
  const nonSelectionChanges = changes.filter((ch) => ch.type !== "select");
  const newNodes = applyNodeChanges(nonSelectionChanges, nodes);

  const draggedNodeIds = nonSelectionChanges
    .filter(
      (change): change is NodePositionChange =>
        change.type === "position" && !!change.dragging,
    )
    .map((change) => change.id);

  return layoutNodes(newNodes, draggedNodeIds);
};

export default function BipartiteGraph({
  id,
  locked,
}: {
  id: string;
  locked: boolean;
}) {
  const type = "bipartite";

  const dispatch = useAppDispatch();
  const nodes = useAppSelector(
    (state) => state.graphView[id]?.state[type]?.nodes,
  );
  const edges = useAppSelector(
    (state) => state.graphView[id]?.state[type]?.edges,
  );
  const representsFunction = useAppSelector(
    (state) => state.graphView[id].tupleType === "function",
  );

  const { getNode, getNodeConnections } = useReactFlow();

  useEffect(() => {
    dispatch(editorLocked({ id, type, locked }));
  }, [id, dispatch, locked]);

  const onNodesChange = useCallback(
    (changes: NodeChange<BipartiteNodeType>[]) =>
      dispatch(
        setNodes({
          id,
          type,
          nodes: applyNodeChangesWithLayout(changes, nodes),
        }),
      ),
    [nodes, id, dispatch],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      dispatch(onEdgesChanged({ id, type, changes })),
    [id, dispatch],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => dispatch(onConnected({ id, type, connection })),
    [id, dispatch],
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

      if (!representsFunction) return !duplicateEdge && !identicalOrigin;

      const isValidFunction =
        getNodeConnections({ nodeId: newEdge.source }).length === 0;

      return !duplicateEdge && !identicalOrigin && isValidFunction;
    },
    [edges, getNode, getNodeConnections, representsFunction],
  );

  return (
    <>
      <div style={{ width: "100%", flexGrow: 1 }}>
        <ReactFlow
          id={id}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          fitViewOptions={fitViewOptions}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineComponent={CustomConnectionLine}
          connectionLineStyle={connectionLineStyle}
          isValidConnection={isValidConnection}
          proOptions={{ hideAttribution: true }}
          nodesFocusable={false}
          nodesConnectable={!locked}
          edgesFocusable={!locked}
          edgesReconnectable={!locked}
        >
          <Background id={`bg-bipartite-${id}`} />
          <Controls
            onInteractiveChange={(ch) => {
              dispatch(editorLocked({ id, type, locked: locked || !ch }));
            }}
          />
        </ReactFlow>
      </div>
    </>
  );
}
