import { selectPosetValidity } from "../graphSlice.ts";
import { useAppSelector } from "../../../../app/hooks.ts";
import { computeLayoutHasse } from "./layout.ts";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import useGraph from "../../helpers/useGraph.ts";
import { useGraphLayout } from "../../helpers/useGraphLayout.ts";
import GraphCanvas from "../common/GraphCanvas.tsx";

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
    flowNodes,
    flowEdges,
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

  return (
    <GraphCanvas
      id={id}
      nodes={isPoset ? flowNodes : []}
      edges={isPoset ? flowEdges : []}
      locked={locked}
      expandedView={expandedView}
      dialogShown={!isPoset || nodes.length === 0}
      emptyDomain={isPoset && nodes.length === 0}
      errorDialog={{ graphType, body: warning, invalidPoset: !isPoset }}
      containerRef={flowWrapperRef}
      flowProps={{ ...graphProps, snapToGrid: true }}
      onNodeDragStop={syncNodesWithStore}
      onExpandedViewChange={onExpandedViewChange}
      onLayout={onLayout}
    />
  );
}
