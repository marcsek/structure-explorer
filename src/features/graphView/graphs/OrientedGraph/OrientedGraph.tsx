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
  graphDidInitialLayout,
  makeSelectNodes,
  onConnected,
  onEdgesChanged,
  onNodesChanged,
  selectEdges,
  warningChanged,
} from "../graphSlice.ts";
import { graphs } from "../graphRegistry.ts";
import { getTupleId } from "../../../structure/tupleInfo";
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
import { UndoActions } from "../../../undoHistory/undoHistory.ts";
import FlowContainer from "../../components/FlowContainer/FlowContainer.tsx";

const graphType = "oriented";
const nodeSelector = makeSelectNodes<"oriented">();

export default function OrientedGraph({
  id,
  tupleInfo,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
  const representsFunction = tupleInfo.type === "function";
  const tupleId = getTupleId(tupleInfo);

  const dispatch = useAppDispatch();
  const storeNodes = useAppSelector((state) =>
    nodeSelector(state, tupleInfo, graphType),
  );
  const edges = useAppSelector((state) =>
    selectEdges(state, tupleInfo, graphType),
  );
  const warning = useAppSelector(
    (state) => state.present.graphView[tupleId]?.state[graphType]?.warning,
  );
  const didLayout = useAppSelector(
    (state) => state.present.graphView[tupleId]?.state[graphType]?.didLayout,
  );

  const { nodes, onNodesChange, syncNodesWithStore } = useSyncNodesWithStore({
    tupleInfo,
    graphType,
    storeNodes,
  });

  const { fitView } = useReactFlow();

  const flowWrapperRef = useFitViewOnNodeAdded({ nodes: storeNodes });

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      dispatch(onEdgesChanged({ tupleInfo, graphType, changes })),
    [dispatch, tupleInfo],
  );

  const onConnect: OnConnect = useCallback(
    (connection) =>
      dispatch(
        onConnected({
          tupleInfo,
          graphType,
          connection,
          breakPrevious: representsFunction,
        }),
      ),
    [dispatch, tupleInfo, representsFunction],
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
        if (nodeChanges.length === 0) return;

        dispatch(
          onNodesChanged({
            tupleInfo,
            graphType,
            changes: nodeChanges,
          }),
        );

        if (nodesMoved) dispatch(UndoActions.checkpoint());
      }

      if (fitAfter)
        fitView({
          ...defaultFitViewOptions,
          duration: instant ? 0 : defaultFitViewDuration,
        });

      dispatch(
        graphDidInitialLayout({
          tupleInfo,
          graphType,
          didLayout: true,
        }),
      );
    },
    [storeNodes, fitView, dispatch, tupleInfo, edges],
  );

  const isValidConnection: IsValidConnection = useCallback(
    (newEdge) => {
      const [valid, error] = graphs[graphType].validateConnection(
        edges,
        newEdge,
      );

      if (error)
        dispatch(warningChanged({ tupleInfo, graphType, warning: error }));

      return valid;
    },
    [dispatch, edges, tupleInfo],
  );

  const onConnectEnd = useCallback(() => {
    dispatch(
      warningChanged({
        tupleInfo,
        graphType,
        warning: undefined,
      }),
    );
  }, [dispatch, tupleInfo]);

  useEffect(() => {
    onLayout(true, true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dialogShown = storeNodes.length === 0;

  return (
    <FlowContainer
      ref={flowWrapperRef}
      hintEnabled={!expandedView && !dialogShown}
      zoomEnabled={!expandedView}
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
        isValidConnection={isValidConnection}
        nodesConnectable={!locked}
        panOnDrag={!dialogShown}
        zoomOnScroll={expandedView && !dialogShown}
        zoomOnDoubleClick={!dialogShown}
        zoomOnPinch={!dialogShown}
        snapToGrid
        {...defaultFlowProps}
      >
        <Background id={`bg-${id}-${expandedView ? "expanded" : ""}`} />
      </ReactFlow>
      <Controls
        id={id}
        expandedView={expandedView}
        onExpandedViewChange={onExpandedViewChange}
        onLayout={onLayout}
      />

      {warning && (
        <ErrorMessageDialogBuilder body={warning} graphType={graphType} />
      )}

      {nodes.length === 0 && <EmptyDomainMessageDialog />}
    </FlowContainer>
  );
}
