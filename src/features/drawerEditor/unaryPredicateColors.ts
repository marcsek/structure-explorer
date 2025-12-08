export const unaryPredicatesColors = [
  "#00B8D9",
  "#22C55E",
  "#FFAB00",
  "#FF70A4",
];

export function getUnaryPredicateColor(idx: number) {
  return unaryPredicatesColors[idx % unaryPredicatesColors.length];
}

export function getUnaryPredicateToColorMap(
  relevantPredicates: string[],
  allPredicates: [string, number][],
) {
  return new Map(
    allPredicates
      .map(
        ([predicate], idx) => [predicate, getUnaryPredicateColor(idx)] as const,
      )
      .filter(([predicate]) => relevantPredicates.includes(predicate)),
  );
}
