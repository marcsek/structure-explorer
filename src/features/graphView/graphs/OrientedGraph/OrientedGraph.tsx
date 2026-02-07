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

const type = "oriented";
const nodeSelector = makeSelectNodes<"oriented">();

export default function OrientedGraph({
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
  const edges = useAppSelector(
    (state) => state.present.graphView[tupleName]?.state[type]?.edges,
  );
  const representsFunction = useAppSelector(
    (state) => state.present.graphView[tupleName]?.tupleType === "function",
  );
  const warning = useAppSelector(
    (state) => state.present.graphView[tupleName]?.state[type]?.warning,
  );
  const didLayout = useAppSelector(
    (state) => state.present.graphView[tupleName]?.state[type]?.didLayout,
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
    (connection) =>
      dispatch(
        onConnected({
          id: tupleName,
          type,
          connection,
          breakPrevious: representsFunction,
        }),
      ),
    [tupleName, dispatch, representsFunction],
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
      if (!newEdge.targetHandle) return false;

      const duplicateEdges = edges.some(
        (edge) =>
          newEdge.source === edge.source && newEdge.target === edge.target,
      );

      if (duplicateEdges)
        dispatch(
          warningChanged({
            id: tupleName,
            type,
            warning: "Edge already exists.",
          }),
        );

      return !duplicateEdges;
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
        <Background id={`bg-${type}-${id}-${expandedView ? "expanded" : ""}`} />
        <Controls
          expandedView={expandedView}
          onExpandedViewChange={onExpandedViewChange}
          onLayout={onLayout}
        />
      </ReactFlow>

      {warning && <ErrorMessageDialogBuilder body={warning} graphType={type} />}

      {nodes.length === 0 && <EmptyDomainMessageDialog />}
    </div>
  );
}
