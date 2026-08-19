import { useReactFlow, type FitViewOptions } from "@xyflow/react";
import { useAreAllNodesInView } from "./useAreAllNodesInView";
import { useRef } from "react";
import { useComparatorEffect } from "./useComparatorEffect";
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

  useComparatorEffect(() => {
    if (!areAllInView())
      fitView({ ...fitViewOptions, duration: fitViewDuration });
  }, [[nodes, (a, b) => a.id === b.id]]);

  return flowWrapperRef;
}
