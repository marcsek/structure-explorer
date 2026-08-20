import { computeLayoutOriented } from "./layout.ts";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import useGraph from "../../helpers/useGraph.ts";
import { useGraphLayout } from "../../helpers/useGraphLayout.ts";
import GraphCanvas from "../common/GraphCanvas.tsx";
import { EmptyDomainMessageDialog } from "../common/MessageDialogs.tsx";

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
