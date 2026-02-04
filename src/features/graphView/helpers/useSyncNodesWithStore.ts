import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { partition } from "./utils";
import { applyNodeChanges, type NodeChange } from "@xyflow/react";
import type { PredicateNodeType } from "../graphs/graphComponents/PredicateNode";
import { useAppDispatch } from "../../../app/hooks";
import { onNodesChanged } from "../graphs/graphSlice";
import type { GraphType } from "../graphs/plugins";

interface UseSyncNodesWithStoreProps<TNode extends PredicateNodeType> {
  id: string;
  type: GraphType;
  storeNodes: TNode[];
}

export default function useSyncNodesWithStore<TNode extends PredicateNodeType>({
  id,
  type,
  storeNodes,
}: UseSyncNodesWithStoreProps<TNode>) {
  const dispatch = useAppDispatch();
  const [localNodes, setLocalNodes] = useState<TNode[] | null>(null);
  const isDragging = useRef<boolean>(false);

  useLayoutEffect(() => {
    if (!isDragging.current) {
      setLocalNodes(null);
    }
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

      const onlyDimensionChanges = otherChanges.every(
        ({ type }) => type === "dimensions",
      );

      if (otherChanges.length !== 0)
        dispatch(
          onNodesChanged(
            { id, type, changes },
            { ignore: onlyDimensionChanges },
          ),
        );
    },
    [dispatch, id, storeNodes, type],
  );

  const syncNodesWithStore = useCallback(() => {
    if (!isDragging.current || !localNodes) return;

    const nodeChanges: NodeChange<PredicateNodeType>[] = localNodes.map(
      ({ id, position }) => ({ type: "position", id, position }),
    );

    dispatch(onNodesChanged({ id, type, changes: nodeChanges }));
    isDragging.current = false;
    setLocalNodes(null);
  }, [dispatch, id, localNodes, type]);

  return { nodes: localNodes ?? storeNodes, onNodesChange, syncNodesWithStore };
}
