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
  selectEdges,
  selectPosetValidity,
  warningChanged,
} from "../graphSlice.ts";
import { staysValidHasseWithEdge, type BinaryRelation } from "./posetHelpers";
import { useAppDispatch, useAppSelector } from "../../../../app/hooks.ts";
import Controls from "../graphComponents/Controls.tsx";
import { useComparatorEffect } from "../../helpers/useComparatorEffect.ts";
import { computeLayoutHasse } from "./layout.ts";
import { useAreAllNodesInView } from "../../helpers/useAreAllNodesInView.ts";
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

const nodeSelector = makeSelectNodes<"hasse">();

export default function HasseDiagram({
  id,
  name,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
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
    if (!areAllInView()) fitView({ ...defaultFitViewOptions, duration: 300 });
  }, [[storeNodes, (a, b) => a.id === b.id]]);

  useEffect(() => {
    requestAnimationFrame(() => fitView({ ...defaultFitViewOptions }));
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
          fitView({ ...defaultFitViewOptions, duration: instant ? 0 : 300 }),
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
        fitViewOptions={defaultFitViewOptions}
        isValidConnection={isValidConnection}
        nodesConnectable={!locked}
        panOnDrag={isPoset && storeNodes.length !== 0}
        zoomOnScroll={isPoset && storeNodes.length !== 0}
        {...defaultFlowProps}
      >
        <Background id={`bg-hasse-${id}-${expandedView ? "expanded" : ""}`} />
        <Controls
          expandedView={expandedView}
          onExpandedViewChange={onExpandedViewChange}
          onLayout={onLayout}
        />
      </ReactFlow>

      {(warning || !isPoset) && (
        <ErrorMessageDialogBuilder
          body={warning}
          graphType="hasse"
          invalidPoset={!isPoset}
        />
      )}

      {isPoset && storeNodes.length === 0 && <EmptyDomainMessageDialog />}
    </div>
  );
}
