import { applyNodeChanges, type NodeChange } from "@xyflow/react";
import type { BipartiteNodeType } from "./BipartiteGraph";

const startX = 0,
  startY = 0;
const gapX = 250,
  gapY = 110;

export const layoutNodes = (
  nodes: BipartiteNodeType[],
  draggedNodesIds?: string[],
) => {
  const changes = generateLayoutNodesChanges(nodes, draggedNodesIds);
  return applyNodeChanges(changes, nodes);
};

export const generateLayoutNodesChanges = (
  nodes: BipartiteNodeType[],
  draggedNodesIds?: string[],
) => {
  let domainY = startY,
    rangeY = startY;

  const vissible = nodes.filter((node) => !node.hidden);
  const ordered = vissible.sort((a, b) => a.position.y - b.position.y);
  const changes: NodeChange<BipartiteNodeType>[] = [];

  ordered.forEach((node) => {
    const origin = node.data.origin;
    const x = startX + (gapX / 2) * (origin === "domain" ? -1 : 1);
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

    domainY += origin === "domain" ? gapY : 0;
    rangeY += origin === "range" ? gapY : 0;

    return newNode;
  });

  return changes;
};
