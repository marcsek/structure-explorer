import { selectPosetValidity } from "../graphSlice.ts";
import { useAppSelector } from "../../../../app/hooks.ts";
import { computeLayoutHasse } from "./layout.ts";
import type { GraphComponentProps } from "../../components/GraphView/GraphView.tsx";
import useGraph from "../../helpers/useGraph.ts";
import { useGraphLayout } from "../../helpers/useGraphLayout.ts";
import GraphCanvas from "../common/GraphCanvas.tsx";
import {
  EmptyDomainMessageDialog,
  InvalidPosetMessageDialog,
} from "../common/MessageDialogs.tsx";

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

  const blockingDialog = !isPoset ? (
    <InvalidPosetMessageDialog />
  ) : nodes.length === 0 ? (
    <EmptyDomainMessageDialog />
  ) : null;

  return (
    <GraphCanvas
      id={id}
      nodes={isPoset ? flowNodes : []}
      edges={isPoset ? flowEdges : []}
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
