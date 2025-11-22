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
  selectEdges,
  selectPosetValidity,
  warningChanged,
} from "../graphSlice.ts";
import { staysValidHasseWithEdge, type BinaryRelation } from "./posetHelpers";
import SelfConnectingEdge from "../graphComponents/SelfConnectingEdge.tsx";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks.ts";
import Controls from "../graphComponents/Controls.tsx";
import MessageDialog from "../graphComponents/MessageDialog/MessageDialog.tsx";
import { useComparatorEffect } from "../../helpers/useComparatorEffect.ts";
import { computeLayoutHasse } from "./layout.ts";
import { useAreAllNodesInView } from "../../helpers/useAreAllNodesInView.ts";
import type { OnExpandedViewChange } from "../../components/GraphView/GraphView.tsx";

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
  maxZoom: 1,
};

export default function HasseDiagram({
  id,
  locked,
  expandedView = false,
  onExpandedViewChange,
}: {
  id: string;
  locked: boolean;
  expandedView?: boolean;
  onExpandedViewChange?: OnExpandedViewChange;
}) {
  const type = "hasse";
  const nodeSelector = makeSelectNodes<typeof type>();
  const flowWrapper = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const nodes = useAppSelector((state) => nodeSelector(state, id, type));
  const edges = useAppSelector((state) => selectEdges(state, id, type, true));
  const warning = useAppSelector(
    (state) => state.graphView[id]?.state[type]?.warning,
  );

  const { fitView } = useReactFlow();
  const areAllInView = useAreAllNodesInView(flowWrapper.current);

  const isPoset = useAppSelector((state) => selectPosetValidity(state, id));

  useComparatorEffect(() => {
    if (!areAllInView()) fitView({ ...fitViewOptions, duration: 300 });
  }, [[nodes, (a, b) => a.id === b.id]]);

  // TODO: Can't GraphView manage this?
  useEffect(() => {
    dispatch(editorLocked({ id, type, locked }));
  }, [id, dispatch, locked]);

  useEffect(() => {
    requestAnimationFrame(() => fitView({ ...fitViewOptions }));
  }, [expandedView, fitView]);

  useEffect(() => {
    onLayout(true, true, true);
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
    (
      fitAfter: boolean = true,
      instant: boolean = false,
      onlyIfNotMoved: boolean = false,
    ) => {
      const nodesMoved = !nodes.every(
        ({ position }) => position.x === 0 && position.y === 0,
      );

      if (!onlyIfNotMoved || !nodesMoved) {
        const { nodeChanges } = computeLayoutHasse(nodes, edges);
        dispatch(onNodesChanged({ id, type, changes: nodeChanges }));
      }

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

      const [ok, error] = staysValidHasseWithEdge(relation, [
        newEdge.source,
        newEdge.target,
      ]);

      if (!ok) dispatch(warningChanged({ id, type, warning: error }));

      return ok;
    },
    [dispatch, edges, id],
  );

  const onConnectEnd = useCallback(() => {
    dispatch(warningChanged({ id, type, warning: undefined }));
  }, [dispatch, id]);

  let messageDialog;

  if (!isPoset)
    messageDialog = (
      <MessageDialog
        type="error"
        position="center"
        title="Invalid poset"
        body="This predicate’s interpretation does not form a valid poset. Adjust
            it to enable this editor."
      />
    );
  else if (warning)
    messageDialog = (
      <MessageDialog type="error" position="corner" body={warning} />
    );

  return (
    <div
      style={{ width: "100%", flexGrow: 1, position: "relative" }}
      ref={flowWrapper}
    >
      <ReactFlow
        id={`hasse-${id}`}
        nodes={isPoset ? nodes : []}
        edges={isPoset ? edges : []}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
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
        <Background id={`bg-hasse-${id}-${expandedView ? "expanded" : ""}`} />
        <Controls
          expandedView={expandedView}
          onExpandedViewChange={onExpandedViewChange}
          onInteractiveChange={(ch) => {
            dispatch(editorLocked({ id, type, locked: locked || !ch }));
          }}
          onLayout={onLayout}
        />
      </ReactFlow>
      {messageDialog}
    </div>
  );
}
