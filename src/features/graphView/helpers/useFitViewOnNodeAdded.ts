import { useReactFlow } from "@xyflow/react";
import { useAreAllNodesInView } from "./useAreAllNodesInView";
import { useRef } from "react";
import {
  defaultFitViewOptions,
  defaultFitViewDuration,
} from "../graphs/common/graphOptions";
import { useComparatorEffect } from "./useComparatorEffect";
import type { PredicateNodeType } from "../graphs/graphComponents/PredicateNode";

export interface UseFitViewOnNodeAddedProps {
  nodes: PredicateNodeType[];
}

export default function useFitViewOnNodeAdded({
  nodes,
}: UseFitViewOnNodeAddedProps) {
  const flowWrapperRef = useRef<HTMLDivElement>(null);
  const { fitView } = useReactFlow();
  const areAllInView = useAreAllNodesInView(flowWrapperRef.current);

  useComparatorEffect(() => {
    if (!areAllInView())
      fitView({ ...defaultFitViewOptions, duration: defaultFitViewDuration });
  }, [[nodes, (a, b) => a.id === b.id]]);

  return flowWrapperRef;
}
