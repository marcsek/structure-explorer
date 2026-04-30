import type { Edge, Node, NodeChange } from "@xyflow/react";
import ELK, {
  type ElkExtendedEdge,
  type ElkNode,
} from "elkjs/lib/elk.bundled.js";
import { SNAP_GRID_SIZE } from "../common/graphOptions";

const elkOptions = {
  "elk.algorithm": "force",
  "elk.force.model": "EADES",
  "elk.direction": "RIGHT",
  "elk.spacing.nodeNode": "70",
  "elk.edgeRouting": "STRAIGHT",
};

export const computeLayoutOriented = async <
  TNode extends Node,
  TEdge extends Edge,
>(
  inputNodes: TNode[],
  inputEdges: TEdge[],
): Promise<NodeChange<TNode>[]> => {
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

  const nodeChanges: NodeChange<TNode>[] = [];
  for (const lNode of layoutedGraph.children) {
    const node = inputNodes.find((n) => n.id === lNode.id);
    if (!node) continue;

    const clampedX =
      Math.floor((lNode.x ?? 0) / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
    const clampedY =
      Math.floor((lNode.y ?? 0) / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;

    if (node.position.x === clampedX && node.position.y === clampedY) continue;

    nodeChanges.push({
      id: node.id,
      type: "position",
      position: { x: clampedX, y: clampedY },
    });
  }

  return nodeChanges;
};
