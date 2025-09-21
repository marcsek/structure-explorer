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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback } from "react";
//import DevTools from "../../helpers/Devtools";
import PredicateNodeComponent, {
  type PredicateNodeType,
} from "../graphComponents/PredicateNode";
import DirectEdge from "../graphComponents/DirectEdge";
import CustomConnectionLine from "../graphComponents/DirectConnectionLine";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks";
import { onConnected, onEdgesChanged, setNodes } from "../graphSlice.ts";
import { layoutNodes } from "./layout.ts";
import SelfConnectingEdge from "../graphComponents/SelfConnectingEdge.tsx";

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

const applyNodeChangesWithLayout = (
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

  return layoutNodes(newNodes, draggedNodeIds);
};

export default function BipartiteGraph({ id }: { id: string }) {
  const type = "bipartite";

  const dispatch = useAppDispatch();
  const nodes = useAppSelector((state) => state.graphView[id]?.[type]?.nodes);
  const edges = useAppSelector((state) => state.graphView[id]?.[type]?.edges);

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
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          connectionLineComponent={CustomConnectionLine}
          connectionLineStyle={connectionLineStyle}
        >
          <Background id={`bg-bipartite-${id}`} />
          {/* <DevTools /> */}
        </ReactFlow>
      </div>
    </>
  );
}
