import { useCallback, useEffect, useMemo } from "react";
import {
  useReactFlow,
  type Edge,
  type EdgeChange,
  type FitViewOptions,
  type OnConnect,
} from "@xyflow/react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  onConnected,
  onEdgesChanged,
  selectEdges,
  selectNodes,
} from "../graphViewSlice";
import { type GraphStates, type GraphType } from "../graphs/registry";
import { getTupleId, type TupleInfo } from "../../structure/tupleInfo";
import useSyncNodesWithStore from "./useSyncNodesWithStore";
import useFitViewOnNodeAdded from "./useFitViewOnNodeAdded";
import useConnectionWarning from "./useConnectionWarning";
import { makeEdgeHidden, makeNodeInvisible } from "../canvas/utils";
import {
  defaultFitViewDuration,
  defaultFitViewOptions,
} from "../canvas/graphOptions";

type NodeOf<T extends GraphType> = GraphStates[T]["nodes"][number];

interface UseGraphProps<T extends GraphType> {
  tupleInfo: TupleInfo;
  graphType: T;
  includeHovered?: boolean;
  fitViewOptions?: FitViewOptions;
}

export default function useGraph<T extends GraphType>({
  tupleInfo,
  graphType,
  fitViewOptions = defaultFitViewOptions,
  includeHovered = false,
}: UseGraphProps<T>) {
  const dispatch = useAppDispatch();
  const tupleId = getTupleId(tupleInfo);
  const { fitView } = useReactFlow();

  const storeNodes = useAppSelector((state) =>
    selectNodes(state, tupleInfo, graphType),
  );
  const edges = useAppSelector((state) =>
    selectEdges(state, tupleInfo, graphType, includeHovered),
  );
  const didLayout = useAppSelector(
    (state) => state.present.graphView[tupleId]?.state[graphType]?.didLayout,
  );

  const { nodes, onNodesChange, syncNodesWithStore } = useSyncNodesWithStore<
    NodeOf<T>
  >({ tupleInfo, graphType, storeNodes });

  // This is a hack, since the fitView options on the ReactFlow component
  // don't work correctly for our use case, resulting in flickering
  // when switching between graph types. Always calling fitView on the initial
  // mount resolves this. Waiting for another frame is needed to allow ReactFlow to
  // handle the initial nodes.
  useEffect(() => {
    requestAnimationFrame(() => fitView({ ...fitViewOptions }));
  }, [fitView, fitViewOptions]);

  const flowWrapperRef = useFitViewOnNodeAdded({
    nodes: storeNodes,
    fitViewOptions,
    fitViewDuration: defaultFitViewDuration,
  });

  const flowNodes = useMemo(
    () => (didLayout ? nodes : nodes.map(makeNodeInvisible)),
    [nodes, didLayout],
  );

  const flowEdges = useMemo(
    () => (didLayout ? edges : edges.map(makeEdgeHidden)),
    [edges, didLayout],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<Edge>[]) =>
      dispatch(onEdgesChanged({ tupleInfo, graphType, changes })),
    [dispatch, tupleInfo, graphType],
  );

  const onConnect: OnConnect = useCallback(
    (connection) => dispatch(onConnected({ tupleInfo, graphType, connection })),
    [dispatch, tupleInfo, graphType],
  );

  const { warning, isValidConnection } = useConnectionWarning(graphType, edges);

  return {
    storeNodes,
    nodes,
    edges,
    flowNodes,
    flowEdges,
    didLayout,
    warning,
    flowWrapperRef,
    syncNodesWithStore,
    graphProps: {
      onNodesChange,
      onEdgesChange,
      onConnect,
      isValidConnection,
    },
  };
}
