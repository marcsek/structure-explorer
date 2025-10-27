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
  makeSelectNodes,
  onConnected,
  onEdgesChanged,
  onNodesChanged,
} from "../graphSlice.ts";
import { generateLayoutNodesChanges } from "./layout.ts";
import SelfConnectingEdge from "../graphComponents/SelfConnectingEdge.tsx";
import Controls from "../graphComponents/Controls.tsx";
import { useComparatorEffect } from "../../helpers/useComparatorEffect.ts";

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

  return generateLayoutNodesChanges(newNodes, draggedNodeIds);
};

export default function BipartiteGraph({
  id,
  locked,
}: {
  id: string;
  locked: boolean;
}) {
  const type = "bipartite";
  const nodeSelector = makeSelectNodes<typeof type>();

  const dispatch = useAppDispatch();
  const nodes = useAppSelector((state) => nodeSelector(state, id, type));
  const edges = useAppSelector(
    (state) => state.graphView[id]?.state[type]?.edges,
  );
  const representsFunction = useAppSelector(
    (state) => state.graphView[id].tupleType === "function",
  );

  const { getNode, fitView } = useReactFlow();

  useComparatorEffect(() => {
    fitView({ ...fitViewOptions, duration: 450 });
  }, [[nodes, (a, b) => a.id === b.id]]);

  useEffect(() => {
    dispatch(editorLocked({ id, type, locked }));
  }, [id, dispatch, locked]);

  const onNodesChange = useCallback(
    (changes: NodeChange<BipartiteNodeType>[]) => {
      // TODO: Why is layouting here necessary?
      const allChanges = [
        ...changes,
        ...generateNodeChangesWithLayout(changes, nodes),
      ];

      dispatch(onNodesChanged({ id, type, changes: allChanges }));
    },
    [nodes, id, dispatch],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      dispatch(onEdgesChanged({ id, type, changes })),
    [id, dispatch],
  );

  const onConnect: OnConnect = useCallback(
    (connection) =>
      dispatch(
        onConnected({
          id,
          type,
          connection,
          breakPrevious: representsFunction,
        }),
      ),
    [id, dispatch, representsFunction],
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

      return !duplicateEdge && !identicalOrigin;
    },
    [edges, getNode],
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
          edgesFocusable={false}
          edgesReconnectable={false}
          connectOnClick={false}
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
