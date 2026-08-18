import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { applyNodeChanges, type NodeChange } from "@xyflow/react";
import type { PredicateNodeType } from "../graphs/graphComponents/PredicateNode";
import { useAppDispatch } from "../../../app/hooks";
import { onNodesChanged } from "../graphs/graphSlice";
import type { GraphType } from "../graphs/graphRegistry";
import type { TupleInfo } from "../../structure/tupleInfo";
import { UndoActions } from "../../undoHistory/undoHistory";
import { partition } from "../../../shared/core/utils";

interface UseSyncNodesWithStoreProps<TNode extends PredicateNodeType> {
  tupleInfo: TupleInfo;
  graphType: GraphType;
  storeNodes: TNode[];
}

export default function useSyncNodesWithStore<TNode extends PredicateNodeType>({
  tupleInfo,
  graphType,
  storeNodes,
}: UseSyncNodesWithStoreProps<TNode>) {
  const dispatch = useAppDispatch();
  const [localNodes, setLocalNodes] = useState<TNode[] | null>(null);
  const isDragging = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (!isDragging.current) setLocalNodes(null);
  }, [storeNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange<TNode>[]) => {
      const [positionChanges, otherChanges] = partition(
        changes,
        (ch) => ch.type === "position",
      );

      if (positionChanges.length !== 0) {
        isDragging.current = true;
        setLocalNodes((nodes) =>
          applyNodeChanges(positionChanges, nodes ?? storeNodes),
        );
      }

      const nonUserChanges = otherChanges.every(
        ({ type }) => type === "dimensions" || type === "replace",
      );

      if (otherChanges.length !== 0)
        dispatch(
          onNodesChanged(
            { tupleInfo, graphType, changes },
            { ignore: nonUserChanges },
          ),
        );
    },
    [dispatch, tupleInfo, storeNodes, graphType],
  );

  const syncNodesWithStore = useCallback(() => {
    if (!isDragging.current || !localNodes) return;

    const nodeChanges: NodeChange<PredicateNodeType>[] = localNodes.map(
      ({ id, position }) => ({ type: "position", id, position }),
    );

    dispatch(onNodesChanged({ tupleInfo, graphType, changes: nodeChanges }));
    isDragging.current = false;
    setLocalNodes(null);

    dispatch(UndoActions.checkpoint());
  }, [dispatch, tupleInfo, localNodes, graphType]);

  return { nodes: localNodes ?? storeNodes, onNodesChange, syncNodesWithStore };
}
