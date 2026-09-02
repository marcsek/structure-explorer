import type { PaletteState } from "./predicatePaletteSlice";
import type { SerializedPredicatePaletteState } from "./validationSchema";

export const getPredicatePaletteStateToExport = (
  paletteState: PaletteState,
): SerializedPredicatePaletteState => ({
  activePaletteKind: paletteState.activePaletteKind,
  customPaletteColors: paletteState.customPaletteColors.map(
    ({ color }) => color,
  ),
});
