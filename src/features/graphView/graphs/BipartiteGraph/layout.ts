import { partition } from "../../helpers/utils";
import type { BipartiteNodeType } from "./BipartiteGraph";

const startX = 0,
  startY = 0;
const gapX = 300,
  gapY = 200;

export const layoutNodes = (
  nodes: BipartiteNodeType[],
  draggedNodesIds?: string[],
) => {
  let domainY = startY,
    rangeY = startY;

  const [vissible, other] = partition(nodes, (node) => !node.hidden);
  const ordered = vissible.sort((a, b) => a.position.y - b.position.y);

  const positionedNodes = ordered.map((node) => {
    const origin = node.data.origin;
    const x = startX + (gapX / 2) * (origin === "domain" ? -1 : 1);
    const y = origin === "domain" ? domainY : rangeY;

    let newNode = node;
    if (draggedNodesIds?.includes(node.id))
      newNode = { ...node, position: { x, y: node.position.y } };
    else if (newNode.position.x !== x || newNode.position.y !== y)
      newNode = { ...node, position: { x, y } };

    domainY += origin === "domain" ? gapY : 0;
    rangeY += origin === "range" ? gapY : 0;

    return newNode;
  });

  return [...positionedNodes, ...other];
};
