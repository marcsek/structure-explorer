import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { partition } from "./utils";
import { applyNodeChanges, type NodeChange } from "@xyflow/react";
import type { PredicateNodeType } from "../graphs/graphComponents/PredicateNode";
import { useAppDispatch } from "../../../app/hooks";
import { onNodesChanged } from "../graphs/graphSlice";
import type { GraphType } from "../graphs/plugins";
import type { TupleType } from "../../structure/structureSlice";

interface UseSyncNodesWithStoreProps<TNode extends PredicateNodeType> {
  tupleName: string;
  graphType: GraphType;
  tupleType: TupleType;
  storeNodes: TNode[];
}

export default function useSyncNodesWithStore<TNode extends PredicateNodeType>({
  tupleName,
  graphType,
  tupleType,
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
            { tupleName, graphType, tupleType, changes },
            { ignore: nonUserChanges },
          ),
        );
    },
    [dispatch, tupleName, storeNodes, tupleType, graphType],
  );

  const syncNodesWithStore = useCallback(() => {
    if (!isDragging.current || !localNodes) return;

    const nodeChanges: NodeChange<PredicateNodeType>[] = localNodes.map(
      ({ id, position }) => ({ type: "position", id, position }),
    );

    dispatch(
      onNodesChanged({ tupleName, graphType, tupleType, changes: nodeChanges }),
    );
    isDragging.current = false;
    setLocalNodes(null);
  }, [dispatch, tupleName, localNodes, tupleType, graphType]);

  return { nodes: localNodes ?? storeNodes, onNodesChange, syncNodesWithStore };
}
