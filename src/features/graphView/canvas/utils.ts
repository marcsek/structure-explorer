import type { Edge, Node } from "@xyflow/react";

export function makeNodeInvisible<T extends Node>(node: T) {
  return { ...node, style: { ...node.style, visibility: "hidden" } };
}

export function makeEdgeHidden<T extends Edge>(edge: T) {
  return { ...edge, hidden: true };
}
