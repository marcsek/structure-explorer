import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { applyNodeChanges, type NodeChange } from "@xyflow/react";
import type { PredicateNodeType } from "../graphs/graphComponents/PredicateNode";
import { useAppDispatch } from "../../../app/hooks";
import { onNodesChanged } from "../graphs/graphSlice";
import type { GraphType } from "../graphs/graphRegistry";
import type { TupleInfo } from "../../structure/tupleInfo";
import { UndoActions } from "../../undoHistory/undoHistory";

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

  const latestNodes = useRef<TNode[] | null>(null);

  const setNodes = useCallback((nodes: TNode[] | null) => {
    latestNodes.current = nodes;
    setLocalNodes(nodes);
  }, []);

  useLayoutEffect(() => {
    if (!isDragging.current) setNodes(null);
  }, [storeNodes, setNodes]);

  const onNodesChange = useCallback(
    (changes: NodeChange<TNode>[]) => {
      if (changes.length === 0) return;

      isDragging.current ||= changes.some(
        (ch) => ch.type === "position" && ch.dragging,
      );

      if (isDragging.current) {
        setNodes(applyNodeChanges(changes, latestNodes.current ?? storeNodes));
        return;
      }

      dispatch(onNodesChanged({ tupleInfo, graphType, changes }));
    },
    [dispatch, tupleInfo, storeNodes, graphType, setNodes],
  );

  const syncNodesWithStore = useCallback(() => {
    if (!isDragging.current || !latestNodes.current) return;

    const changes: NodeChange<PredicateNodeType>[] = latestNodes.current.map(
      (item) => ({
        type: "position",
        id: item.id,
        position: item.position,
        dragging: false,
      }),
    );

    dispatch(onNodesChanged({ tupleInfo, graphType, changes }));
    isDragging.current = false;
    setNodes(null);

    dispatch(UndoActions.checkpoint());
  }, [dispatch, tupleInfo, graphType, setNodes]);

  return { nodes: localNodes ?? storeNodes, onNodesChange, syncNodesWithStore };
}
