import { useCallback, useEffect, useRef } from "react";
import {
  useNodesInitialized,
  useReactFlow,
  type NodeChange,
} from "@xyflow/react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { graphDidInitialLayout, onNodesChanged } from "../graphs/graphSlice";
import type { GraphStates, GraphType } from "../graphs/graphRegistry";
import { getTupleId, type TupleInfo } from "../../structure/tupleInfo";
import { UndoActions } from "../../undoHistory/undoHistory";
import {
  defaultFitViewDuration,
  defaultFitViewOptions,
} from "../graphs/common/graphOptions";
import type { DirectEdgeType } from "../graphs/graphComponents/DirectEdge";

type NodesOf<T extends GraphType> = GraphStates[T]["nodes"];
type NodeOf<T extends GraphType> = NodesOf<T>[number];

type ComputeLayout<T extends GraphType> = (
  nodes: NodesOf<T>,
  edges: DirectEdgeType[],
) => NodeChange<NodeOf<T>>[] | Promise<NodeChange<NodeOf<T>>[]>;

interface UseGraphLayoutProps<T extends GraphType> {
  tupleInfo: TupleInfo;
  graphType: T;
  nodes: NodesOf<T>;
  edges: DirectEdgeType[];
  computeLayout: ComputeLayout<T>;
}

export function useGraphLayout<T extends GraphType>({
  tupleInfo,
  graphType,
  nodes,
  edges,
  computeLayout,
}: UseGraphLayoutProps<T>) {
  const dispatch = useAppDispatch();
  const { fitView } = useReactFlow();
  const tupleId = getTupleId(tupleInfo);

  const didLayout = useAppSelector(
    (state) => state.present.graphView[tupleId]?.state[graphType]?.didLayout,
  );

  const onLayout = useCallback(
    async (fitAfter: boolean = true, instant: boolean = false) => {
      const changes = await computeLayout(nodes, edges);

      if (changes.length !== 0) {
        dispatch(onNodesChanged({ tupleInfo, graphType, changes }));

        if (didLayout) dispatch(UndoActions.checkpoint());
      }

      if (fitAfter)
        fitView({
          ...defaultFitViewOptions,
          duration: instant ? 0 : defaultFitViewDuration,
        });

      if (!didLayout)
        dispatch(
          graphDidInitialLayout({ tupleInfo, graphType, didLayout: true }),
        );
    },
    [
      computeLayout,
      nodes,
      edges,
      fitView,
      didLayout,
      dispatch,
      tupleInfo,
      graphType,
    ],
  );

  const nodesInitialized = useNodesInitialized();
  const didTryInitialLayout = useRef(false);

  useEffect(() => {
    if (!nodesInitialized || didTryInitialLayout.current) return;

    didTryInitialLayout.current = true;
    if (!didLayout) onLayout(true, true);
  }, [nodesInitialized, didLayout, onLayout]);

  return onLayout;
}
