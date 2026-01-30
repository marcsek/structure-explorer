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
  graphDidInitialLayout,
  makeSelectNodes,
  onConnected,
  onEdgesChanged,
  onNodesChanged,
  warningChanged,
} from "../graphSlice.ts";
import SelfConnectingEdge from "../graphComponents/SelfConnectingEdge.tsx";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks.ts";
import Controls from "../graphComponents/Controls.tsx";
import { useComparatorEffect } from "../../helpers/useComparatorEffect.ts";
import { useAreAllNodesInView } from "../../helpers/useAreAllNodesInView.ts";
import { computeLayoutOriented } from "./layout.ts";
import MessageDialog from "../graphComponents/MessageDialog/MessageDialog.tsx";
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
  },
};

const fitViewOptions: FitViewOptions = {
  padding: "50px",
  maxZoom: 1,
};

const nodeSelector = makeSelectNodes<"oriented">();

export default function OrientedGraph({
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
  const type = "oriented";
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

  const didLayout = useAppSelector(
    (state) => state.present.graphView[name]?.state[type]?.didLayout,
  );

  const historyIdx = useAppSelector((state) => state.index);

  const { fitView } = useReactFlow();
  //TODO: memoize
  const areAllInView = useAreAllNodesInView(flowWrapper.current);

  useEffect(() => {
    requestAnimationFrame(() => fitView({ ...fitViewOptions }));
  }, [expandedView, fitView]);

  useEffect(() => {
    onLayout(true, true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIdx]);

  useComparatorEffect(() => {
    if (!areAllInView()) fitView({ ...fitViewOptions, duration: 300 });
  }, [[nodes, (a, b) => a.id === b.id]]);

  const onNodesChange = useCallback(
    (changes: NodeChange<PredicateNodeType>[]) =>
      dispatch(onNodesChanged({ id: name, type, changes })),
    [name, dispatch],
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
        computeLayoutOriented(nodes, edges).then((nodeChanges) => {
          dispatch(onNodesChanged({ id: name, type, changes: nodeChanges }));

          if (fitAfter)
            fitView({ ...fitViewOptions, duration: instant ? 0 : 300 });

          dispatch(graphDidInitialLayout({ id: name, type, didLayout: true }));
        });
      } else
        dispatch(graphDidInitialLayout({ id: name, type, didLayout: true }));
    },
    [nodes, edges, dispatch, name, fitView],
  );

  const isValidConnection: IsValidConnection = useCallback(
    (newEdge) => {
      const duplicateEdges = edges.some(
        (edge) =>
          newEdge.source === edge.source && newEdge.target === edge.target,
      );

      if (duplicateEdges)
        dispatch(
          warningChanged({ id: name, type, warning: "Edge already exists." }),
        );

      return !duplicateEdges;
    },
    [dispatch, edges, name],
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
          id={id}
          nodes={didLayout ? nodes : []}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onConnectEnd={onConnectEnd}
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
          panOnDrag={nodes.length !== 0}
          zoomOnScroll={nodes.length !== 0}
          minZoom={0.25}
        >
          <Background
            id={`bg-oriented-${id}-${expandedView ? "expanded" : ""}`}
          />
          <Controls
            expandedView={expandedView}
            onExpandedViewChange={onExpandedViewChange}
            onLayout={onLayout}
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
