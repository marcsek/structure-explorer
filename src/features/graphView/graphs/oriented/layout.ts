import type { Edge, Node, NodeChange } from "@xyflow/react";
import ELK, {
  type ElkExtendedEdge,
  type ElkNode,
} from "elkjs/lib/elk.bundled.js";
import {
  FALLBACK_NODE_HEIGHT,
  FALLBACK_NODE_WIDTH,
  SNAP_GRID_SIZE,
} from "../../canvas/graphOptions";

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

  const children: ElkNode[] = inputNodes.map((node) => ({
    id: node.id,
    width: node.measured?.width ?? FALLBACK_NODE_WIDTH,
    height: node.measured?.height ?? FALLBACK_NODE_HEIGHT,
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

  let layoutedGraph: ElkNode;

  try {
    layoutedGraph = await elk.layout(graph);
  } catch (error) {
    console.error("ELK layout error:", error);
    return [];
  }

  if (!layoutedGraph.children) return [];

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const n of layoutedGraph.children) {
    if (n.x != null && n.y != null) {
      minX = Math.min(minX, n.x);
      minY = Math.min(minY, n.y);
      maxX = Math.max(maxX, n.x + (n.width ?? 0));
      maxY = Math.max(maxY, n.y + (n.height ?? 0));
    }
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  const nodeChanges: NodeChange<TNode>[] = [];
  for (const lNode of layoutedGraph.children) {
    const node = inputNodes.find((n) => n.id === lNode.id);
    if (!node) continue;

    const shiftedX = (lNode.x ?? 0) - centerX;
    const shiftedY = (lNode.y ?? 0) - centerY;

    const clampedX = Math.floor(shiftedX / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
    const clampedY = Math.floor(shiftedY / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;

    if (node.position.x === clampedX && node.position.y === clampedY) continue;

    nodeChanges.push({
      id: node.id,
      type: "position",
      position: { x: clampedX, y: clampedY },
    });
  }

  return nodeChanges;
};
