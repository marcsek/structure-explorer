export const unaryPredicatesColors = [
  "#00B8D9",
  "#22C55E",
  "#FFAB00",
  "#FF70A4",
];

export function getUnaryPredicateColor(idx: number) {
  return unaryPredicatesColors[idx % unaryPredicatesColors.length];
}
