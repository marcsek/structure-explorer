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
  type FitViewOptions,
} from "@xyflow/react";
import { useCallback, useEffect } from "react";
import PredicateNodeComponent, {
  type PredicateNodeType,
} from "../graphComponents/PredicateNode";
import DirectEdge from "../graphComponents/DirectEdge";
import CustomConnectionLine from "../graphComponents/DirectConnectionLine";
import {
  editorLocked,
  onConnected,
  onEdgesChanged,
  onNodesChanged,
} from "../graphSlice.ts";
import { staysValidHasseWithEdge, type BinaryRelation } from "./posetHelpers";
import SelfConnectingEdge from "../graphComponents/SelfConnectingEdge.tsx";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks.ts";
import Controls from "../graphComponents/Controls.tsx";

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

export default function HasseDiagram({
  id,
  locked,
}: {
  id: string;
  locked: boolean;
}) {
  const type = "hasse";

  const dispatch = useAppDispatch();
  const nodes = useAppSelector(
    (state) => state.graphView[id]?.state[type]?.nodes,
  );
  const edges = useAppSelector(
    (state) => state.graphView[id]?.state[type]?.edges,
  );
  const isPoset = useAppSelector(
    (state) => state.graphView[id]?.state[type].isPoset,
  );

  useEffect(() => {
    dispatch(editorLocked({ id, type, locked }));
  }, [id, dispatch, locked]);

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
          deleteKeyCode={null}
        >
          <Background id={`bg-hasse-${id}`} />
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
