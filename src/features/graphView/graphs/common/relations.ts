import type { Edge } from "@xyflow/react";

export type BinaryRelation<T> = [T, T][];

export const edgesToRelation = (edges: Edge[]): BinaryRelation<string> =>
  edges.map(({ source, target }) => [source, target]);
