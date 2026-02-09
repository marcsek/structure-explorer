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

const graphType = "hasse";
const nodeSelector = makeSelectNodes<"hasse">();

export default function HasseDiagram({
  id,
  tupleName,
  tupleType,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
  const tupleId = getTupleId(tupleType, tupleName);

  const dispatch = useAppDispatch();
  const storeNodes = useAppSelector((state) =>
    nodeSelector(state, tupleName, graphType, tupleType),
  );
  const edges = useAppSelector((state) =>
    selectEdges(state, tupleName, graphType, tupleType, true),
  );
  const warning = useAppSelector(
    (state) => state.present.graphView[tupleId]?.state[graphType]?.warning,
  );
  const isPoset = useAppSelector((state) =>
    selectPosetValidity(state, tupleName, tupleType),
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
    onLayout(true, true, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      dispatch(onEdgesChanged({ tupleName, graphType, tupleType, changes })),
    [dispatch, tupleName, tupleType],
  );

  const onConnect: OnConnect = useCallback(
    (connection) =>
      dispatch(onConnected({ tupleName, graphType, tupleType, connection })),
    [dispatch, tupleName, tupleType],
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
            tupleName,
            graphType,
            tupleType,
            warning: error,
          }),
        );

      return ok;
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
        nodes={isPoset ? nodes : []}
        edges={isPoset ? edges : []}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onNodeDragStop={syncNodesWithStore}
        isValidConnection={isValidConnection}
        nodesConnectable={!locked}
        panOnDrag={isPoset && storeNodes.length !== 0}
        zoomOnScroll={isPoset && storeNodes.length !== 0}
        {...defaultFlowProps}
      >
        <Background id={`bg-${id}-${expandedView ? "expanded" : ""}`} />
        <Controls
          expandedView={expandedView}
          onExpandedViewChange={onExpandedViewChange}
          onLayout={onLayout}
        />
      </ReactFlow>

      {(warning || !isPoset) && (
        <ErrorMessageDialogBuilder
          body={warning}
          graphType={graphType}
          invalidPoset={!isPoset}
        />
      )}

      {isPoset && storeNodes.length === 0 && <EmptyDomainMessageDialog />}
    </div>
  );
}
