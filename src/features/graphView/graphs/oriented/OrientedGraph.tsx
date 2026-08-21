import { computeLayoutOriented } from "./layout.ts";
import type { GraphComponentProps } from "../../GraphView.tsx";
import useGraph from "../../hooks/useGraph.ts";
import { useGraphLayout } from "../../hooks/useGraphLayout.ts";
import GraphCanvas from "../../canvas/GraphCanvas.tsx";
import { EmptyDomainMessageDialog } from "../../canvas/dialogs/GraphDialogs.tsx";

const graphType = "oriented";

export default function OrientedGraph({
  id,
  tupleInfo,
  locked,
  expandedView,
  onExpandedViewChange,
}: GraphComponentProps) {
  const {
    nodes,
    edges,
    flowNodes,
    flowEdges,
    warning,
    flowWrapperRef,
    syncNodesWithStore,
    graphProps,
  } = useGraph({ tupleInfo, graphType });

  const onLayout = useGraphLayout({
    tupleInfo,
    graphType,
    nodes,
    edges,
    computeLayout: computeLayoutOriented,
  });

  const blockingDialog =
    nodes.length === 0 ? <EmptyDomainMessageDialog /> : null;

  return (
    <GraphCanvas
      id={id}
      nodes={flowNodes}
      edges={flowEdges}
      locked={locked}
      expandedView={expandedView}
      warning={warning}
      blockingDialog={blockingDialog}
      containerRef={flowWrapperRef}
      flowProps={{ ...graphProps, snapToGrid: true }}
      onNodeDragStop={syncNodesWithStore}
      onExpandedViewChange={onExpandedViewChange}
      onLayout={onLayout}
    />
  );
}
