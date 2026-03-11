export const unaryPredicatesColors = [
  "#42a7c6",
  "#64c183",
  "#f7b503",
  "#FF70A4",
  "#987EF0",
  "#684957",
  "#00a892",
  "#88ccee",
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
