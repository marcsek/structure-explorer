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

const type = "hasse";
const nodeSelector = makeSelectNodes<"hasse">();

export default function HasseDiagram({
  id,
  tupleName,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
  const dispatch = useAppDispatch();
  const storeNodes = useAppSelector((state) =>
    nodeSelector(state, tupleName, type),
  );
  const edges = useAppSelector((state) =>
    selectEdges(state, tupleName, type, true),
  );
  const warning = useAppSelector(
    (state) => state.present.graphView[tupleName]?.state[type]?.warning,
  );
  const isPoset = useAppSelector((state) =>
    selectPosetValidity(state, tupleName),
  );

  const { nodes, onNodesChange, syncNodesWithStore } = useSyncNodesWithStore({
    id: tupleName,
    type,
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
      dispatch(onEdgesChanged({ id: tupleName, type, changes })),
    [tupleName, dispatch],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => dispatch(onConnected({ id: tupleName, type, connection })),
    [tupleName, dispatch],
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
        dispatch(onNodesChanged({ id: tupleName, type, changes: nodeChanges }));
      }

      if (fitAfter)
        fitView({
          ...defaultFitViewOptions,
          duration: instant ? 0 : defaultFitViewDuration,
        });

      dispatch(graphDidInitialLayout({ id: tupleName, type, didLayout: true }));
    },
    [storeNodes, edges, dispatch, tupleName, fitView],
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
        dispatch(warningChanged({ id: tupleName, type, warning: error }));

      return ok;
    },
    [dispatch, edges, tupleName],
  );

  const onConnectEnd = useCallback(() => {
    dispatch(warningChanged({ id: tupleName, type, warning: undefined }));
  }, [dispatch, tupleName]);

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
        <Background id={`bg-${type}-${id}-${expandedView ? "expanded" : ""}`} />
        <Controls
          expandedView={expandedView}
          onExpandedViewChange={onExpandedViewChange}
          onLayout={onLayout}
        />
      </ReactFlow>

      {(warning || !isPoset) && (
        <ErrorMessageDialogBuilder
          body={warning}
          graphType={type}
          invalidPoset={!isPoset}
        />
      )}

      {isPoset && storeNodes.length === 0 && <EmptyDomainMessageDialog />}
    </div>
  );
}
