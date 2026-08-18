import { useCallback } from "react";
import {
  useReactFlow,
  type Edge,
  type EdgeChange,
  type IsValidConnection,
  type NodeChange,
  type OnConnect,
} from "@xyflow/react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  graphDidInitialLayout,
  makeSelectNodes,
  onConnected,
  onEdgesChanged,
  onNodesChanged,
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
import { UndoActions } from "../../undoHistory/undoHistory";
import {
  defaultFitViewDuration,
  defaultFitViewOptions,
} from "../graphs/common/graphOptions";
import type { DirectEdgeType } from "../graphs/graphComponents/DirectEdge";
import useSyncNodesWithStore from "./useSyncNodesWithStore";
import useFitViewOnNodeAdded from "./useFitViewOnNodeAdded";

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
}

export default function useGraph<T extends GraphType>({
  tupleInfo,
  graphType,
  includeHovered = false,
}: UseGraphProps<T>) {
  const dispatch = useAppDispatch();
  const tupleId = getTupleId(tupleInfo);
  const representsFunction = tupleInfo.type === "function";

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

  const flowWrapperRef = useFitViewOnNodeAdded({ nodes: storeNodes });

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
    warning,
    didLayout,
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

type ComputeLayout<T extends GraphType> = (
  nodes: NodesOf<T>,
  edges: DirectEdgeType[],
) => NodeChange<NodeOf<T>>[] | Promise<NodeChange<NodeOf<T>>[]>;

interface UseGraphLayoutProps<T extends GraphType> {
  tupleInfo: TupleInfo;
  graphType: T;
  storeNodes: NodesOf<T>;
  edges: DirectEdgeType[];
  computeLayout: ComputeLayout<T>;
}

export function useGraphLayout<T extends GraphType>({
  tupleInfo,
  graphType,
  storeNodes,
  edges,
  computeLayout,
}: UseGraphLayoutProps<T>) {
  const dispatch = useAppDispatch();
  const { fitView } = useReactFlow();

  return useCallback(
    async (
      fitAfter: boolean = true,
      instant: boolean = false,
      onlyIfNotMoved: boolean = false,
    ) => {
      const nodesMoved = !storeNodes.every(
        ({ position }) => position.x === 0 && position.y === 0,
      );

      if (!onlyIfNotMoved || !nodesMoved) {
        const changes = await computeLayout(storeNodes, edges);
        if (changes.length === 0) return;

        dispatch(onNodesChanged({ tupleInfo, graphType, changes }));

        if (nodesMoved) dispatch(UndoActions.checkpoint());
      }

      if (fitAfter)
        fitView({
          ...defaultFitViewOptions,
          duration: instant ? 0 : defaultFitViewDuration,
        });

      dispatch(
        graphDidInitialLayout({ tupleInfo, graphType, didLayout: true }),
      );
    },
    [storeNodes, edges, computeLayout, fitView, dispatch, tupleInfo, graphType],
  );
}
