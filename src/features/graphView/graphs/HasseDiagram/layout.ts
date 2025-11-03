import dagre from "@dagrejs/dagre";
import type { Edge, Node, NodeChange } from "@xyflow/react";

export const computeLayoutHasse = <TNode extends Node, TEdge extends Edge>(
  nodes: TNode[],
  edges: TEdge[],
) => {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "BT" });

  const nodeIds = nodes.map((n) => n.id);
  const filteredEdges = edges.filter(
    ({ source, target }) =>
      nodeIds.includes(source) && nodeIds.includes(target),
  );

  nodes.forEach((n) => dagreGraph.setNode(n.id, { width: 120, height: 75 }));
  filteredEdges.forEach((e) => dagreGraph.setEdge(e.source, e.target));

  dagre.layout(dagreGraph);

  const offsetX = (dagreGraph.graph().width ?? 0) / 2;
  const offsetY = (dagreGraph.graph().height ?? 0) / 2;

  const nodeChanges: NodeChange<TNode>[] = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      id: node.id,
      type: "position",
      position: {
        x: nodeWithPosition.x - 120 / 2 - offsetX,
        y: nodeWithPosition.y - 75 / 2 - offsetY,
      },
    };
  });

  return { nodeChanges };
};
