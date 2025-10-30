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
import { useCallback, useEffect } from "react";
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
  selectEdges,
  selectPosetValidity,
} from "../graphSlice.ts";
import { staysValidHasseWithEdge, type BinaryRelation } from "./posetHelpers";
import SelfConnectingEdge from "../graphComponents/SelfConnectingEdge.tsx";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks.ts";
import Controls from "../graphComponents/Controls.tsx";
import ErrorDialog from "./ErrorDialog/ErrorDialog.tsx";
import { useComparatorEffect } from "../../helpers/useComparatorEffect.ts";
import { computeLayout } from "./layout.ts";

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
  const nodeSelector = makeSelectNodes<typeof type>();

  const dispatch = useAppDispatch();
  const nodes = useAppSelector((state) => nodeSelector(state, id, type));
  const edges = useAppSelector((state) => selectEdges(state, id, type, true));

  const { fitView } = useReactFlow();

  const isPoset = useAppSelector((state) =>
    selectPosetValidity(state, id, "hasse", true),
  );

  useComparatorEffect(() => {
    fitView({ ...fitViewOptions, duration: 300 });
  }, [[nodes, (a, b) => a.id === b.id]]);

  // TODO: Can't GraphView manage this?
  useEffect(() => {
    dispatch(editorLocked({ id, type, locked }));
  }, [id, dispatch, locked]);

  useEffect(() => {
    onLayout(true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const onLayout = useCallback(
    (fitAfter: boolean = true, instant: boolean = false) => {
      const { nodeChanges } = computeLayout(nodes, edges);
      dispatch(onNodesChanged({ id, type, changes: nodeChanges }));

      if (fitAfter)
        //TODO: Is requestAnimationFrame really necessary?
        requestAnimationFrame(() =>
          fitView({ ...fitViewOptions, duration: instant ? 0 : 300 }),
        );
    },
    [nodes, edges, dispatch, id, fitView],
  );

  const isValidConnection: IsValidConnection = useCallback(
    (newEdge) => {
      const relation: BinaryRelation<string> = edges
        .filter((e) => !e.data?.helper)
        .map((e) => [e.source, e.target]);

      return staysValidHasseWithEdge(relation, [
        newEdge.source,
        newEdge.target,
      ]);
    },
    [edges],
  );

  return (
    <div style={{ width: "100%", flexGrow: 1, position: "relative" }}>
      <ReactFlow
        id={`hasse-${id}`}
        nodes={isPoset ? nodes : []}
        edges={isPoset ? edges : []}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
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
        panOnDrag={isPoset}
        zoomOnScroll={isPoset}
      >
        <Background id={`bg-hasse-${id}`} />
        <Controls
          onInteractiveChange={(ch) => {
            dispatch(editorLocked({ id, type, locked: locked || !ch }));
          }}
          onLayout={onLayout}
        />
      </ReactFlow>
      {!isPoset && <ErrorDialog />}
    </div>
  );
}
