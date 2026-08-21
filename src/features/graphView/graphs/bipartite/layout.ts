import {
  applyNodeChanges,
  type Node,
  type NodeChange,
  type NodePositionChange,
} from "@xyflow/react";
import type { BipartiteNodeType, OriginSet } from "./model";
import { type SetGroupNodeType } from "../../canvas/nodes/SetGroupNode";
import { partition } from "../../../../shared/core/utils";
import {
  FALLBACK_NODE_HEIGHT,
  FALLBACK_NODE_WIDTH,
} from "../../canvas/graphOptions";

const PADDING_X = 40;
const PADDING_Y = 20;
const GAP_Y = 35;

const GROUP_CONTAINER_WIDTH = 200;
const GROUP_CONTAINER_GAP = 50;

export const computeGroupContainerBounds = (nodes: BipartiteNodeType[]) => {
  const stackedHeight = nodes.reduce(
    (sum, n) => sum + (n.measured?.height ?? FALLBACK_NODE_HEIGHT),
    0,
  );

  return {
    bounds: {
      width: GROUP_CONTAINER_WIDTH,
      height:
        stackedHeight / 2 + 2 * PADDING_Y + (nodes.length / 2 - 1) * GAP_Y,
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

  const visible = nodes.filter((node) => !node.hidden);
  const ordered = visible.sort((a, b) => a.position.y - b.position.y);
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

    if (draggedNodesIds?.includes(node.id))
      changes.push({
        id: node.id,
        type: "position",
        position: { x, y: node.position.y },
        dragging: true,
      });
    else if (node.position.x !== x || node.position.y !== y)
      changes.push({ id: node.id, type: "position", position: { x, y } });

    domainY += origin === "domain" ? GAP_Y + nodeHeight : 0;
    rangeY += origin === "range" ? GAP_Y + nodeHeight : 0;
  });

  return changes;
};

const groupNodeOptions = {
  selectable: false,
  focusable: false,
  draggable: false,
  deletable: false,
  connectable: false,
  type: "setGroup",
} satisfies Partial<Node>;

export const createGroupNode = (
  originSet: OriginSet,
  size: { width: number; height: number },
  offset: { x: number; y: number },
): SetGroupNodeType => {
  return {
    id: `${originSet}-group`,
    position: offset,
    ...size,
    measured: size,
    data: { label: originSet, origin: originSet },
    className: `set-group-node origin-${originSet}`,
    ...groupNodeOptions,
  };
};

export const generateNodeChangesWithLayout = (
  changes: NodeChange<BipartiteNodeType>[],
  nodes: BipartiteNodeType[],
) => {
  const newNodes = applyNodeChanges(changes, nodes);

  const draggedNodeIds = changes
    .filter(
      (change): change is NodePositionChange =>
        change.type === "position" && !!change.dragging,
    )
    .map((change) => change.id);

  return generateLayoutNodesChangesBipartite(newNodes, draggedNodeIds);
};

export const addGroupNodes = (
  nodes: BipartiteNodeType[],
  keepPositions = false,
) => {
  const draggedIds = nodes.filter((n) => n.dragging).map((n) => n.id);
  const positioned = keepPositions
    ? nodes
    : computeLayoutBipartite(nodes, draggedIds);

  const { bounds, offset } = computeGroupContainerBounds(positioned);

  if (positioned.length === 0) return [];

  const domainGroup = createGroupNode("domain", bounds, {
    ...offset,
    x: -offset.x,
  });
  const rangeGroup = createGroupNode("range", bounds, offset);

  const childNodes: BipartiteNodeType[] = positioned.map((node) => ({
    ...node,
    parentId: node.data.origin === "domain" ? domainGroup.id : rangeGroup.id,
    extent: "parent",
  }));

  const [childrenDomain, childrenRange] = partition(
    childNodes,
    (n) => n.data.origin === "domain",
  );

  return [domainGroup, ...childrenDomain, rangeGroup, ...childrenRange];
};
