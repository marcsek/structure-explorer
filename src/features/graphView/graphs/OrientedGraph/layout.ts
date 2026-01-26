import type { Edge, Node, NodeChange } from "@xyflow/react";
import ELK, {
  type ElkExtendedEdge,
  type ElkNode,
} from "elkjs/lib/elk.bundled.js";
import { computeLayoutHasse } from "../HasseDiagram/layout";

const elkOptions = {
  "elk.algorithm": "force",
  "elk.force.model": "EADES",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": "30",
  "elk.edgeRouting": "STRAIGHT",
};

export const computeLayoutOriented = async <
  TNode extends Node,
  TEdge extends Edge,
>(
  inputNodes: TNode[],
  inputEdges: TEdge[],
): Promise<NodeChange<TNode>[]> => {
  return computeLayoutHasse(inputNodes, inputEdges).nodeChanges;
  const elk = new ELK();

  const nodeIds = inputNodes.map((n) => n.id);
  const filteredEdges = inputEdges.filter(
    ({ source, target }) =>
      nodeIds.includes(source) && nodeIds.includes(target),
  );

  const children: ElkNode[] = nodeIds.map((id) => ({
    id,
    width: 120,
    height: 75,
  }));

  const edges: ElkExtendedEdge[] = filteredEdges.map((e) => ({
    id: e.id,
    sources: [e.source],
    targets: [e.target],
  }));

  const graph: ElkNode = {
    id: "root",
    layoutOptions: elkOptions,
    children,
    edges,
  };

  let layoutedGraph = await elk.layout(graph);

  try {
    layoutedGraph = await elk.layout(graph);
  } catch (error) {
    console.error("ELK layout error:", error);
    return [];
  }

  if (!layoutedGraph.children) return [];

  const nodeChanges: NodeChange<TNode>[] = layoutedGraph.children.map(
    (node) => ({
      id: node.id,
      type: "position",
      position: { x: Math.trunc(node.x ?? 0), y: Math.trunc(node.y ?? 0) },
    }),
  );

  return nodeChanges;
};
