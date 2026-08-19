import { useCallback, useEffect, useMemo } from "react";
import {
  useReactFlow,
  type Edge,
  type EdgeChange,
  type FitViewOptions,
  type IsValidConnection,
  type OnConnect,
} from "@xyflow/react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  makeSelectNodes,
  onConnected,
  onEdgesChanged,
  selectEdges,
  warningChanged,
} from "../graphs/graphSlice";
import {
  graphs,
  type GraphStates,
  type GraphType,
} from "../graphs/graphRegistry";
import { getTupleId, type TupleInfo } from "../../structure/tupleInfo";
import type { RootState } from "../../../app/store";
import useSyncNodesWithStore from "./useSyncNodesWithStore";
import useFitViewOnNodeAdded from "./useFitViewOnNodeAdded";
import { makeEdgeHidden, makeNodeInvisible } from "./utils";
import {
  defaultFitViewDuration,
  defaultFitViewOptions,
} from "../graphs/common/graphOptions";

type NodesOf<T extends GraphType> = GraphStates[T]["nodes"];
type NodeOf<T extends GraphType> = NodesOf<T>[number];

type NodeSelector<T extends GraphType> = (
  state: RootState,
  tupleInfo: TupleInfo,
  type: T,
) => NodesOf<T>;

const nodeSelectors = {
  oriented: makeSelectNodes<"oriented">(),
  hasse: makeSelectNodes<"hasse">(),
  bipartite: makeSelectNodes<"bipartite">(),
};

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
  const representsFunction = tupleInfo.type === "function";
  const { fitView } = useReactFlow();

  const nodeSelector = nodeSelectors[graphType] as NodeSelector<T>;

  const storeNodes = useAppSelector((state) =>
    nodeSelector(state, tupleInfo, graphType),
  );
  const edges = useAppSelector((state) =>
    selectEdges(state, tupleInfo, graphType, includeHovered),
  );
  const warning = useAppSelector(
    (state) => state.present.graphView[tupleId]?.state[graphType]?.warning,
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
    (connection) =>
      dispatch(
        onConnected({
          tupleInfo,
          graphType,
          connection,
          breakPrevious: representsFunction,
        }),
      ),
    [dispatch, tupleInfo, graphType, representsFunction],
  );

  const isValidConnection: IsValidConnection = useCallback(
    (connection) => {
      const [valid, error] = graphs[graphType].validateConnection(
        edges,
        connection,
      );

      if (error)
        dispatch(warningChanged({ tupleInfo, graphType, warning: error }));

      return valid;
    },
    [dispatch, edges, tupleInfo, graphType],
  );

  const onConnectEnd = useCallback(
    () =>
      dispatch(warningChanged({ tupleInfo, graphType, warning: undefined })),
    [dispatch, tupleInfo, graphType],
  );

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
      onConnectEnd,
      isValidConnection,
    },
  };
}
