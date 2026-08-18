import { applyNodeChanges, type NodeChange } from "@xyflow/react";
import type { BipartiteNodeType } from "./model";
import {
  FALLBACK_NODE_HEIGHT,
  FALLBACK_NODE_WIDTH,
} from "../common/graphOptions";

const PADDING_X = 40;
const PADDING_Y = 20;
const GAP_Y = 35;

const GROUP_CONTAINER_WIDTH = 200;
const GROUP_CONTAINER_GAP = 50;

export const computeGroupContainerBounds = (nodes: BipartiteNodeType[]) => {
  const stackedHeight =
    nodes.reduce(
      (sum, n) => sum + (n.measured?.height ?? FALLBACK_NODE_HEIGHT),
      0,
    ) / 2;

  return {
    bounds: {
      width: GROUP_CONTAINER_WIDTH,
      height: stackedHeight + 2 * PADDING_Y + (nodes.length / 2 - 1) * GAP_Y,
    },
    offset: { x: (GROUP_CONTAINER_GAP + GROUP_CONTAINER_WIDTH) / 2, y: 0 },
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
  let domainY = PADDING_Y,
    rangeY = PADDING_Y;

  const vissible = nodes.filter((node) => !node.hidden);
  const ordered = vissible.sort((a, b) => a.position.y - b.position.y);
  const changes: NodeChange<BipartiteNodeType>[] = [];

  ordered.forEach((node) => {
    const origin = node.data.origin;

    const nodeHeight = node.measured?.height ?? FALLBACK_NODE_HEIGHT;
    const nodeWidth = node.measured?.width ?? FALLBACK_NODE_WIDTH;

    const x =
      origin === "domain"
        ? GROUP_CONTAINER_WIDTH - PADDING_X - nodeWidth
        : PADDING_X;
    const y = origin === "domain" ? domainY : rangeY;

    const newNode = node;
    if (draggedNodesIds?.includes(node.id))
      changes.push({
        id: node.id,
        type: "position",
        position: { x, y: node.position.y },
        dragging: true,
      });
    else if (newNode.position.x !== x || newNode.position.y !== y)
      changes.push({
        id: node.id,
        type: "position",
        position: { x, y },
      });

    domainY += origin === "domain" ? GAP_Y + nodeHeight : 0;
    rangeY += origin === "range" ? GAP_Y + nodeHeight : 0;

    return newNode;
  });

  return changes;
};
