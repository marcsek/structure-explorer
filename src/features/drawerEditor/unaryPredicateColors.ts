import { defaultPalette } from "../predicatePalette/palettes";

export function getUnaryPredicateColor(colors: string[], idx: number) {
  if (colors.length === 0) return defaultPalette[idx % defaultPalette.length];

  return colors[idx % colors.length];
}

export function getUnaryPredicateToColorMap(
  relevantPredicates: string[],
  allPredicates: [string, number][],
  colors: string[],
) {
  return new Map(
    allPredicates
      .map(
        ([predicate], idx) =>
          [predicate, getUnaryPredicateColor(colors, idx)] as const,
      )
      .filter(([predicate]) => relevantPredicates.includes(predicate)),
  );
}
