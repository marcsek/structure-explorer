import {
  applyNodeChanges,
  type Node,
  type NodeChange,
  type NodePositionChange,
} from "@xyflow/react";
import { type SetGroupNodeType } from "../graphComponents/SetGroupNode.tsx";
import { partition } from "../../../../shared/core/utils.ts";
import type { BipartiteNodeType, OriginSet } from "./model.ts";
import {
  computeGroupContainerBounds,
  computeLayoutBipartite,
  generateLayoutNodesChangesBipartite,
} from "./layout.ts";

export const groupNodeOptions = {
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
