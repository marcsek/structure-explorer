import type { Edge, XYPosition } from "@xyflow/react";

export type BinaryRelation<T> = [T, T][];

export const edgesToRelation = (edges: Edge[]): BinaryRelation<string> =>
  edges.map(({ source, target }) => [source, target]);

export const edgeId = (from: string, to: string, duplicate = false) =>
  `eg-${from}->${to}${duplicate ? "-duplicate" : ""}`;

export const numberTupleToXYPosition = ([x, y]: [
  number,
  number,
]): XYPosition => ({ x, y });

export type PositionSeed = {
  positions?: Record<string, [number, number]>;
  didLayout?: boolean;
};

export const scatteredSeedPosition = (
  id: string,
  seed?: PositionSeed,
): XYPosition => {
  const imported = seed?.positions?.[id];
  if (imported) return numberTupleToXYPosition(imported);

  if (!seed?.didLayout) return { x: 0, y: 0 };

  const min = -150;
  const max = 150;
  const random = () => Math.floor(Math.random() * (max - min + 1)) + min;

  return { x: random(), y: random() };
};
