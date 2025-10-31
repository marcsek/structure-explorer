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
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";
import PredicateNodeComponent, {
  type PredicateNodeType,
} from "../graphComponents/PredicateNode";
import DirectEdge from "../graphComponents/DirectEdge";
import CustomConnectionLine from "../graphComponents/DirectConnectionLine";
import {
  editorLocked,
  makeSelectNodes,
  onConnected,
  onEdgesChanged,
  onNodesChanged,
} from "../graphSlice.ts";
import SelfConnectingEdge from "../graphComponents/SelfConnectingEdge.tsx";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks.ts";
import Controls from "../graphComponents/Controls.tsx";
import { useComparatorEffect } from "../../helpers/useComparatorEffect.ts";
import { useAreAllNodesInView } from "../../helpers/useAreAllNodesInView.ts";
import { computeLayoutOriented } from "./layout.ts";

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
  },
};

const fitViewOptions: FitViewOptions = {
  padding: "50px",
};

export default function OrientedGraph({
  id,
  locked,
}: {
  id: string;
  locked: boolean;
}) {
  const type = "oriented";
  const nodeSelector = makeSelectNodes<typeof type>();
  const flowWrapper = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const nodes = useAppSelector((state) => nodeSelector(state, id, type));
  const edges = useAppSelector(
    (state) => state.graphView[id]?.state[type]?.edges,
  );
  const representsFunction = useAppSelector(
    (state) => state.graphView[id].tupleType === "function",
  );

  const { fitView } = useReactFlow();
  const areAllInView = useAreAllNodesInView(flowWrapper.current);

  useEffect(() => {
    dispatch(editorLocked({ id, type, locked }));
  }, [id, dispatch, locked]);

  useComparatorEffect(() => {
    if (!areAllInView()) fitView({ ...fitViewOptions, duration: 300 });
  }, [[nodes, (a, b) => a.id === b.id]]);

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

  const onLayout = useCallback(
    (fitAfter: boolean = true) => {
      computeLayoutOriented(nodes, edges).then((nodeChanges) => {
        dispatch(onNodesChanged({ id, type, changes: nodeChanges }));

        if (fitAfter) fitView({ ...fitViewOptions, duration: 300 });
      });
    },
    [nodes, edges, dispatch, id, fitView],
  );

  const isValidConnection: IsValidConnection = useCallback(
    (newEdge) =>
      // no duplicate edges
      !edges.some(
        (edge) =>
          newEdge.source === edge.source && newEdge.target === edge.target,
      ),
    [edges],
  );

  return (
    <>
      <div style={{ width: "100%", flexGrow: 1 }} ref={flowWrapper}>
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
          <Background id={`bg-oriented-${id}`} />
          <Controls
            onInteractiveChange={(ch) => {
              dispatch(editorLocked({ id, type, locked: locked || !ch }));
            }}
            onLayout={onLayout}
          />
        </ReactFlow>
      </div>
    </>
  );
}
