export const unaryPredicatesColors = [
  "#00b0f0",
  "#23cc61",
  "#FFAB00",
  "#FF70A4",
  "#987EF0",
  "#00a892",
  "#fd8c46",
  "#4d8db2",
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
