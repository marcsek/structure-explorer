import { computeLayoutOriented } from "./layout.ts";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import useGraph from "../../helpers/useGraph.ts";
import { useGraphLayout } from "../../helpers/useGraphLayout.ts";
import GraphCanvas from "../common/GraphCanvas.tsx";

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

  const emptyDomain = nodes.length === 0;

  return (
    <GraphCanvas
      id={id}
      nodes={flowNodes}
      edges={flowEdges}
      locked={locked}
      expandedView={expandedView}
      dialogShown={emptyDomain}
      emptyDomain={emptyDomain}
      errorDialog={{ graphType, body: warning }}
      containerRef={flowWrapperRef}
      flowProps={{ ...graphProps, snapToGrid: true }}
      onNodeDragStop={syncNodesWithStore}
      onExpandedViewChange={onExpandedViewChange}
      onLayout={onLayout}
    />
  );
}
