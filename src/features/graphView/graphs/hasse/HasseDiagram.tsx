import { selectPosetValidity } from "../../graphViewSlice.ts";
import { useAppSelector } from "../../../../app/hooks.ts";
import { computeLayoutHasse } from "./layout.ts";
import type { GraphComponentProps } from "../../GraphView.tsx";
import useGraph from "../../hooks/useGraph.ts";
import { useGraphLayout } from "../../hooks/useGraphLayout.ts";
import GraphCanvas from "../../canvas/GraphCanvas.tsx";
import {
  EmptyDomainMessageDialog,
  InvalidPosetMessageDialog,
} from "../../canvas/dialogs/GraphDialogs.tsx";

const graphType = "hasse";

export default function HasseDiagram({
  id,
  tupleInfo,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
  const {
    nodes,
    edges,
    didLayout,
    warning,
    flowWrapperRef,
    syncNodesWithStore,
    graphProps,
  } = useGraph({ tupleInfo, graphType, includeHovered: true });

  const isPoset = useAppSelector((state) =>
    selectPosetValidity(state, tupleInfo),
  );

  const onLayout = useGraphLayout({
    tupleInfo,
    graphType,
    nodes,
    edges,
    computeLayout: computeLayoutHasse,
  });

  const blockingDialog = !isPoset ? (
    <InvalidPosetMessageDialog />
  ) : nodes.length === 0 ? (
    <EmptyDomainMessageDialog />
  ) : null;

  return (
    <GraphCanvas
      id={id}
      nodes={nodes}
      edges={edges}
      locked={locked}
      expandedView={expandedView}
      warning={warning}
      blockingDialog={blockingDialog}
      containerRef={flowWrapperRef}
      flowProps={{ ...graphProps, snapToGrid: true }}
      elementsHidden={!didLayout || !isPoset}
      onNodeDragStop={syncNodesWithStore}
      onExpandedViewChange={onExpandedViewChange}
      onLayout={onLayout}
    />
  );
}
