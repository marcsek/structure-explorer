import { useReactFlow, type FitViewOptions } from "@xyflow/react";
import { useAreAllNodesInView } from "./useAreAllNodesInView";
import { useEffect, useRef } from "react";
import type { PredicateNodeType } from "../graphs/graphComponents/PredicateNode";

export interface UseFitViewOnNodeAddedProps {
  nodes: PredicateNodeType[];
  fitViewOptions: FitViewOptions;
  fitViewDuration: number | undefined;
}

export default function useFitViewOnNodeAdded({
  nodes,
  fitViewOptions,
  fitViewDuration,
}: UseFitViewOnNodeAddedProps) {
  const flowWrapperRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const areAllInView = useAreAllNodesInView(flowWrapperRef);

  const prevNodeIds = useRef<string[]>();

  useEffect(() => {
    const nodeIds = nodes.map((node) => node.id);
    const prevIds = prevNodeIds.current;
    prevNodeIds.current = nodeIds;

    const nodeAdded =
      prevIds !== undefined &&
      prevIds.length <= nodeIds.length &&
      nodeIds.some((id, i) => id !== prevIds[i]);

    if (nodeAdded && !areAllInView())
      fitView({ ...fitViewOptions, duration: fitViewDuration });
  }, [nodes, areAllInView, fitView, fitViewOptions, fitViewDuration]);

  return flowWrapperRef;
}
