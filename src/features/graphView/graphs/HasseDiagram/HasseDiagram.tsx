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
  selectEdges,
  selectPosetValidity,
  warningChanged,
} from "../graphSlice.ts";
import { staysValidHasseWithEdge, type BinaryRelation } from "./posetHelpers";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks.ts";
import Controls from "../graphComponents/Controls.tsx";
import { computeLayoutHasse } from "./layout.ts";
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

const graphType = "hasse";
const nodeSelector = makeSelectNodes<"hasse">();

export default function HasseDiagram({
  id,
  tupleInfo,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
  const { name: tupleName, type: tupleType } = tupleInfo;

  const tupleId = getTupleId(tupleType, tupleName);

  const dispatch = useAppDispatch();
  const storeNodes = useAppSelector((state) =>
    nodeSelector(state, tupleInfo, graphType),
  );
  const edges = useAppSelector((state) =>
    selectEdges(state, tupleInfo, graphType, true),
  );
  const warning = useAppSelector(
    (state) => state.present.graphView[tupleId]?.state[graphType]?.warning,
  );
  const isPoset = useAppSelector((state) =>
    selectPosetValidity(state, tupleInfo),
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
    (connection) => dispatch(onConnected({ tupleInfo, graphType, connection })),
    [dispatch, tupleInfo],
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

  useEffect(() => {
    onLayout(true, true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isValidConnection: IsValidConnection = useCallback(
    (newEdge) => {
      const relation: BinaryRelation<string> = edges
        .filter((e) => !e.data?.helper)
        .map((e) => [e.source, e.target]);

      const [ok, error] = staysValidHasseWithEdge(relation, [
        newEdge.source,
        newEdge.target,
      ]);

      if (!ok)
        dispatch(
          warningChanged({
            tupleInfo,
            graphType,
            warning: error,
          }),
        );

      return ok;
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

  const dialogShown = !isPoset || storeNodes.length === 0;

  return (
    <FlowContainer
      ref={flowWrapperRef}
      hintEnabled={!expandedView && !dialogShown}
      zoomEnabled={!expandedView}
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
        expandedView={expandedView}
        onExpandedViewChange={onExpandedViewChange}
        onLayout={onLayout}
      />

      {(warning || !isPoset) && (
        <ErrorMessageDialogBuilder
          body={warning}
          graphType={graphType}
          invalidPoset={!isPoset}
        />
      )}

      {isPoset && storeNodes.length === 0 && <EmptyDomainMessageDialog />}
    </FlowContainer>
  );
}
