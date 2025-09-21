import {
  Background,
  ReactFlow,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type OnConnect,
  MarkerType,
  type IsValidConnection,
  type DefaultEdgeOptions,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback } from "react";
//import DevTools from "../../helpers/Devtools";
import PredicateNodeComponent, {
  type PredicateNodeType,
} from "../graphComponents/PredicateNode";
import DirectEdge from "../graphComponents/DirectEdge";
import CustomConnectionLine from "../graphComponents/DirectConnectionLine";
import { onConnected, onEdgesChanged, onNodesChanged } from "../graphSlice.ts";
import { staysValidHasseWithEdge, type BinaryRelation } from "./posetHelpers";
import SelfConnectingEdge from "../graphComponents/SelfConnectingEdge.tsx";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks.ts";

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

export default function HasseDiagram({ id }: { id: string }) {
  const type = "hasse";

  const dispatch = useAppDispatch();
  const nodes = useAppSelector((state) => state.graphView[id]?.[type]?.nodes);
  const edges = useAppSelector((state) => state.graphView[id]?.[type]?.edges);
  const isPoset = useAppSelector(
    (state) => state.graphView[id]?.[type].isPoset,
  );

  const onNodesChange = useCallback(
    (changes: NodeChange<PredicateNodeType>[]) =>
      dispatch(onNodesChanged({ id, type, changes })),
    [id, dispatch],
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
      const relation: BinaryRelation<string> = edges.map((e) => [
        e.source,
        e.target,
      ]);

      return staysValidHasseWithEdge(relation, [
        newEdge.source,
        newEdge.target,
      ]);
    },
    [edges],
  );

  return (
    <>
      <p>{`Is Poset: ${isPoset}`}</p>
      <div style={{ width: "100%", flexGrow: 1 }}>
        <ReactFlow
          id={`hasse-${id}`}
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
          isValidConnection={isValidConnection}
        >
          <Background id={`bg-hasse-${id}`} />
          {/* <DevTools /> */}
        </ReactFlow>
      </div>
    </>
  );
}
