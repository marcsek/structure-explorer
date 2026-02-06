import {
  Background,
  ReactFlow,
  type Edge,
  type EdgeChange,
  type OnConnect,
  type IsValidConnection,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect, useRef } from "react";
import {
  graphDidInitialLayout,
  makeSelectNodes,
  onConnected,
  onEdgesChanged,
  onNodesChanged,
  warningChanged,
} from "../graphSlice.ts";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks.ts";
import Controls from "../graphComponents/Controls.tsx";
import { useComparatorEffect } from "../../helpers/useComparatorEffect.ts";
import { useAreAllNodesInView } from "../../helpers/useAreAllNodesInView.ts";
import { computeLayoutOriented } from "./layout.ts";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import useSyncNodesWithStore from "../../helpers/useSyncNodesWithStore.ts";
import {
  defaultFitViewOptions,
  defaultFlowProps,
} from "../common/graphOptions.ts";
import {
  EmptyDomainMessageDialog,
  ErrorMessageDialogBuilder,
} from "../common/MessageDialogs.tsx";

const nodeSelector = makeSelectNodes<"oriented">();

export default function OrientedGraph({
  id,
  name,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
  const type = "oriented";
  const flowWrapper = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const storeNodes = useAppSelector((state) => nodeSelector(state, name, type));
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

  const { nodes, onNodesChange, syncNodesWithStore } = useSyncNodesWithStore({
    id: name,
    type,
    storeNodes,
  });

  const { fitView } = useReactFlow();
  //TODO: memoize
  const areAllInView = useAreAllNodesInView(flowWrapper.current);

  useEffect(() => {
    requestAnimationFrame(() => fitView({ ...defaultFitViewOptions }));
  }, [expandedView, fitView]);

  useEffect(() => {
    onLayout(true, true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyIdx]);

  useComparatorEffect(() => {
    if (!areAllInView()) fitView({ ...defaultFitViewOptions, duration: 300 });
  }, [[storeNodes, (a, b) => a.id === b.id]]);

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
      const nodesMoved = !storeNodes.every(
        ({ position }) => position.x === 0 && position.y === 0,
      );

      if (!onlyIfNotMoved || !nodesMoved) {
        computeLayoutOriented(storeNodes, edges).then((nodeChanges) => {
          dispatch(onNodesChanged({ id: name, type, changes: nodeChanges }));

          if (fitAfter)
            fitView({ ...defaultFitViewOptions, duration: instant ? 0 : 300 });

          dispatch(graphDidInitialLayout({ id: name, type, didLayout: true }));
        });
      } else
        dispatch(graphDidInitialLayout({ id: name, type, didLayout: true }));
    },
    [storeNodes, edges, dispatch, name, fitView],
  );

  const isValidConnection: IsValidConnection = useCallback(
    (newEdge) => {
      if (!newEdge.targetHandle) return false;

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
          onNodeDragStop={syncNodesWithStore}
          fitView
          fitViewOptions={defaultFitViewOptions}
          isValidConnection={isValidConnection}
          nodesConnectable={!locked}
          panOnDrag={nodes.length !== 0}
          zoomOnScroll={nodes.length !== 0}
          {...defaultFlowProps}
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
          <ErrorMessageDialogBuilder body={warning} graphType="oriented" />
        )}

        {nodes.length === 0 && <EmptyDomainMessageDialog />}
      </div>
    </>
  );
}
