export const paletteKinds = [
  "default",
  "tritanopia",
  "deuteranopia",
  "custom",
] as const;

export type PaletteKind = (typeof paletteKinds)[number];

export interface Palette {
  kind: PaletteKind;
  colors: string[];
}

const defaultColors = [
  "#42a7c6",
  "#64c183",
  "#f7b503",
  "#FF70A4",
  "#987EF0",
  "#684957",
  "#00a892",
  "#88ccee",
];

const deuteranopiaColors = [
  "#88ccee",
  "#117733",
  "#ddcc77",
  "#cc6677",
  "#332288",
  "#882255",
  "#44aa99",
  "#999933",
];

const tritanopiaColors = [
  "#88ccee",
  "#999933",
  "#ffaabb",
  "#882255",
  "#004488",
  "#cc3311",
  "#ccbb44",
  "#cc6677",
];

export const palettes: Record<PaletteKind, string[]> = {
  default: defaultColors,
  tritanopia: tritanopiaColors,
  deuteranopia: deuteranopiaColors,
  custom: defaultColors,
};

export const defaultPalette = palettes.default;
