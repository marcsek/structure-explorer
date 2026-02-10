import {
  Background,
  ReactFlow,
  type Edge,
  type EdgeChange,
  type OnConnect,
  type IsValidConnection,
  useReactFlow,
} from "@xyflow/react";
import { useCallback, useEffect } from "react";
import {
  getTupleId,
  graphDidInitialLayout,
  makeSelectNodes,
  onConnected,
  onEdgesChanged,
  onNodesChanged,
  warningChanged,
} from "../graphSlice.ts";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks.ts";
import Controls from "../graphComponents/Controls.tsx";

import { computeLayoutOriented } from "./layout.ts";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import useSyncNodesWithStore from "../../helpers/useSyncNodesWithStore.ts";
import {
  defaultFitViewDuration,
  defaultFitViewOptions,
  defaultFlowProps,
} from "../common/graphOptions.ts";
import {
  EmptyDomainMessageDialog,
  ErrorMessageDialogBuilder,
} from "../common/MessageDialogs.tsx";
import useFitViewOnNodeAdded from "../../helpers/useFitViewOnNodeAdded.ts";

const graphType = "oriented";
const nodeSelector = makeSelectNodes<"oriented">();

export default function OrientedGraph({
  id,
  tupleName,
  tupleType,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
  const representsFunction = tupleType === "function";
  const tupleId = getTupleId(tupleType, tupleName);

  const dispatch = useAppDispatch();
  const storeNodes = useAppSelector((state) =>
    nodeSelector(state, tupleName, tupleType, graphType),
  );
  const edges = useAppSelector(
    (state) => state.present.graphView[tupleId]?.state[graphType]?.edges,
  );
  const warning = useAppSelector(
    (state) => state.present.graphView[tupleId]?.state[graphType]?.warning,
  );
  const didLayout = useAppSelector(
    (state) => state.present.graphView[tupleId]?.state[graphType]?.didLayout,
  );

  const { nodes, onNodesChange, syncNodesWithStore } = useSyncNodesWithStore({
    tupleName,
    graphType,
    tupleType,
    storeNodes,
  });

  const { fitView } = useReactFlow();

  const flowWrapperRef = useFitViewOnNodeAdded({ nodes: storeNodes });

  useEffect(() => {
    if (!didLayout) onLayout(true, true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      dispatch(onEdgesChanged({ tupleName, graphType, tupleType, changes })),
    [dispatch, tupleName, tupleType],
  );

  const onConnect: OnConnect = useCallback(
    (connection) =>
      dispatch(
        onConnected({
          tupleName,
          graphType,
          tupleType,
          connection,
          breakPrevious: representsFunction,
        }),
      ),
    [dispatch, tupleName, tupleType, representsFunction],
  );

  const onLayout = useCallback(
    async (
      fitAfter: boolean = true,
      instant: boolean = false,
      onlyIfNotMoved: boolean = false,
    ) => {
      const nodesMoved = !storeNodes.every(
        ({ position }) => position.x === 0 && position.y === 0,
      );

      if (!onlyIfNotMoved || !nodesMoved) {
        const nodeChanges = await computeLayoutOriented(storeNodes, edges);

        dispatch(
          onNodesChanged({
            tupleName,
            graphType,
            tupleType,
            changes: nodeChanges,
          }),
        );
      }

      if (fitAfter)
        fitView({
          ...defaultFitViewOptions,
          duration: instant ? 0 : defaultFitViewDuration,
        });

      dispatch(
        graphDidInitialLayout({
          tupleName,
          graphType,
          tupleType,
          didLayout: true,
        }),
      );
    },
    [storeNodes, fitView, dispatch, tupleName, tupleType, edges],
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
          warningChanged({
            tupleName,
            graphType,
            tupleType,
            warning: "Edge already exists.",
          }),
        );

      return !duplicateEdges;
    },
    [dispatch, edges, tupleName, tupleType],
  );

  const onConnectEnd = useCallback(() => {
    dispatch(
      warningChanged({
        tupleName,
        graphType,
        tupleType,
        warning: undefined,
      }),
    );
  }, [dispatch, tupleName, tupleType]);

  return (
    <div className="react-flow__container" ref={flowWrapperRef}>
      <ReactFlow
        id={id}
        nodes={didLayout ? nodes : []}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onNodeDragStop={syncNodesWithStore}
        isValidConnection={isValidConnection}
        nodesConnectable={!locked}
        panOnDrag={nodes.length !== 0}
        zoomOnScroll={nodes.length !== 0}
        {...defaultFlowProps}
      >
        <Background id={`bg-${id}-${expandedView ? "expanded" : ""}`} />
        <Controls
          expandedView={expandedView}
          onExpandedViewChange={onExpandedViewChange}
          onLayout={onLayout}
        />
      </ReactFlow>

      {warning && (
        <ErrorMessageDialogBuilder body={warning} graphType={graphType} />
      )}

      {nodes.length === 0 && <EmptyDomainMessageDialog />}
    </div>
  );
}
