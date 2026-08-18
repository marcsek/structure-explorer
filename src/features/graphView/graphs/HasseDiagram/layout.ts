import dagre from "@dagrejs/dagre";
import type { Edge, Node, NodeChange } from "@xyflow/react";
import {
  FALLBACK_NODE_HEIGHT,
  FALLBACK_NODE_WIDTH,
  SNAP_GRID_SIZE,
} from "../common/graphOptions";

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

  nodes.forEach((n) =>
    dagreGraph.setNode(n.id, {
      width: n.measured?.width ?? FALLBACK_NODE_WIDTH,
      height: n.measured?.height ?? FALLBACK_NODE_HEIGHT,
    }),
  );

  filteredEdges.forEach((e) => dagreGraph.setEdge(e.source, e.target));

  dagre.layout(dagreGraph);

  const offsetX = (dagreGraph.graph().width ?? 0) / 2;
  const offsetY = (dagreGraph.graph().height ?? 0) / 2;

  const nodeChanges: NodeChange<TNode>[] = [];
  for (const node of nodes) {
    const nodeWithPosition = dagreGraph.node(node.id);
    const width = node.measured?.width ?? FALLBACK_NODE_WIDTH;
    const height = node.measured?.height ?? FALLBACK_NODE_HEIGHT;
    const posX = nodeWithPosition.x - width / 2 - offsetX;
    const posY = nodeWithPosition.y - height / 2 - offsetY;
    const clampedX = Math.floor((posX ?? 0) / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;
    const clampedY = Math.floor((posY ?? 0) / SNAP_GRID_SIZE) * SNAP_GRID_SIZE;

    if (node.position.x === clampedX && node.position.y === clampedY) continue;

    nodeChanges.push({
      id: node.id,
      type: "position",
      position: { x: clampedX, y: clampedY },
    });
  }

  return nodeChanges;
};
