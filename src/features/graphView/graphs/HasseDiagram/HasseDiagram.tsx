import {
  Background,
  ReactFlow,
  type Edge,
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
import PredicateNodeComponent from "../graphComponents/PredicateNode";
import DirectEdge from "../graphComponents/DirectEdge";
import CustomConnectionLine from "../graphComponents/DirectConnectionLine";
import {
  graphDidInitialLayout,
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
import useSyncNodesWithStore from "../../helpers/useSyncNodesWithStore.ts";

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

const nodeSelector = makeSelectNodes<"hasse">();

export default function HasseDiagram({
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
  const type = "hasse";
  const flowWrapper = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const storeNodes = useAppSelector((state) => nodeSelector(state, name, type));
  const edges = useAppSelector((state) => selectEdges(state, name, type, true));
  const warning = useAppSelector(
    (state) => state.present.graphView[name]?.state[type]?.warning,
  );

  const { nodes, onNodesChange, syncNodesWithStore } = useSyncNodesWithStore({
    id: name,
    type,
    storeNodes,
  });

  const { fitView } = useReactFlow();
  const areAllInView = useAreAllNodesInView(flowWrapper.current);

  const isPoset = useAppSelector((state) => selectPosetValidity(state, name));

  useComparatorEffect(() => {
    if (!areAllInView()) fitView({ ...fitViewOptions, duration: 300 });
  }, [[storeNodes, (a, b) => a.id === b.id]]);

  useEffect(() => {
    requestAnimationFrame(() => fitView({ ...fitViewOptions }));
  }, [expandedView, fitView]);

  useEffect(() => {
    onLayout(true, true, true);
    dispatch(graphDidInitialLayout({ id: name, type, didLayout: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      dispatch(onEdgesChanged({ id: name, type, changes })),
    [name, dispatch],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => dispatch(onConnected({ id: name, type, connection })),
    [name, dispatch],
  );

  const onLayout = useCallback(
    (
      fitAfter: boolean = true,
      instant: boolean = false,
      onlyIfNotMoved: boolean = false,
    ) => {
      const nodesMoved = !storeNodes.every(
        ({ position }) => position.x === 0 && position.y === 0,
      );

      if (!onlyIfNotMoved || !nodesMoved) {
        const { nodeChanges } = computeLayoutHasse(storeNodes, edges);
        dispatch(onNodesChanged({ id: name, type, changes: nodeChanges }));
      }

      if (fitAfter)
        //TODO: Is requestAnimationFrame really necessary?
        requestAnimationFrame(() =>
          fitView({ ...fitViewOptions, duration: instant ? 0 : 300 }),
        );
    },
    [storeNodes, edges, dispatch, name, fitView],
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

      if (!ok) dispatch(warningChanged({ id: name, type, warning: error }));

      return ok;
    },
    [dispatch, edges, name],
  );

  const onConnectEnd = useCallback(() => {
    dispatch(warningChanged({ id: name, type, warning: undefined }));
  }, [dispatch, name]);

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
        id={id}
        nodes={isPoset ? nodes : []}
        edges={isPoset ? edges : []}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onNodeDragStop={syncNodesWithStore}
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
        panOnDrag={isPoset && storeNodes.length !== 0}
        zoomOnScroll={isPoset && storeNodes.length !== 0}
        minZoom={0.25}
      >
        <Background id={`bg-hasse-${id}-${expandedView ? "expanded" : ""}`} />
        <Controls
          expandedView={expandedView}
          onExpandedViewChange={onExpandedViewChange}
          onLayout={onLayout}
        />
      </ReactFlow>
      {messageDialog}
      {isPoset && storeNodes.length === 0 && (
        <MessageDialog
          type="info"
          position="center"
          title="No nodes to display"
          body={"The domain you have selected is empty."}
        />
      )}
    </div>
  );
}
