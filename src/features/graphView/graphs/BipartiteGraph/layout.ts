import { applyNodeChanges, type NodeChange } from "@xyflow/react";
import type { BipartiteNodeType } from "./BipartiteGraph";

const paddingX = 40,
  paddingY = 20;
const gapY = 35;

const groupContainerWidth = 200;
const groupContainerGap = 50;

export const computeGroupContainerBounds = (nodes: BipartiteNodeType[]) => {
  const stackedHeight =
    nodes.reduce((sum, n) => sum + (n.measured?.height ?? 0), 0) / 2;

  return {
    bounds: {
      width: groupContainerWidth,
      height: stackedHeight + 2 * paddingY + (nodes.length / 2 - 1) * gapY,
    },
    offset: { x: (groupContainerGap + groupContainerWidth) / 2, y: 0 },
  };
};

export const computeLayoutBipartite = (
  nodes: BipartiteNodeType[],
  draggedNodesIds?: string[],
) => {
  const changes = generateLayoutNodesChangesBipartite(nodes, draggedNodesIds);
  return applyNodeChanges(changes, nodes);
};

export const generateLayoutNodesChangesBipartite = (
  nodes: BipartiteNodeType[],
  draggedNodesIds?: string[],
) => {
  let domainY = paddingY,
    rangeY = paddingY;

  const vissible = nodes.filter((node) => !node.hidden);
  const ordered = vissible.sort((a, b) => a.position.y - b.position.y);
  const changes: NodeChange<BipartiteNodeType>[] = [];

  ordered.forEach((node) => {
    const origin = node.data.origin;

    const nodeHeight = node.measured?.height ?? 0;
    const nodeWidth = node.measured?.width ?? 0;

    const x =
      origin === "domain"
        ? groupContainerWidth - paddingX - nodeWidth
        : paddingX;
    const y = origin === "domain" ? domainY : rangeY;

    const newNode = node;
    if (draggedNodesIds?.includes(node.id))
      changes.push({
        id: node.id,
        type: "position",
        position: { x, y: node.position.y },
      });
    else if (newNode.position.x !== x || newNode.position.y !== y)
      changes.push({
        id: node.id,
        type: "position",
        position: { x, y },
      });

    domainY += origin === "domain" ? gapY + nodeHeight : 0;
    rangeY += origin === "range" ? gapY + nodeHeight : 0;

    return newNode;
  });

  return changes;
};
