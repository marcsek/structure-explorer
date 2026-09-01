import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  defaultPalette,
  palettes as bakedPalettes,
  paletteKinds,
  newColor,
  type PaletteKind,
  type Palette,
} from "./palettes";
import type { RootState } from "../../app/store";

export interface PaletteState {
  activePaletteKind: PaletteKind;
  customPaletteColors: string[];
}

const initialState: PaletteState = {
  activePaletteKind: "default",
  customPaletteColors: defaultPalette,
};

export const predicatePaletteSlice = createSlice({
  name: "predicatePalette",
  initialState,
  reducers: {
    setActivePalette(state, action: PayloadAction<PaletteKind>) {
      state.activePaletteKind = action.payload;
    },

    addCustomPaletteColor(state) {
      state.customPaletteColors.push(newColor);
    },

    removeCustomPaletteColor(state, action: PayloadAction<number>) {
      if (state.customPaletteColors.length <= 1) return;

      state.customPaletteColors.splice(action.payload, 1);
    },

    setCustomPaletteColor(
      state,
      action: PayloadAction<{ index: number; color: string }>,
    ) {
      const { index, color } = action.payload;

      state.customPaletteColors[index] = color;
    },

    reorderCustomPaletteColors(
      state,
      action: PayloadAction<{ from: number; to: number }>,
    ) {
      const { from, to } = action.payload;
      const colors = state.customPaletteColors;

      const [moved] = colors.splice(from, 1);
      colors.splice(to, 0, moved);
    },
  },
});

export const selectActivePalette = createSelector(
  [
    (state: RootState) => state.present.predicatePalette.activePaletteKind,
    (state: RootState) => state.present.predicatePalette.customPaletteColors,
  ],
  (kind, customPalette): Palette => {
    if (kind === "custom") return { kind, colors: customPalette };
    return { kind, colors: bakedPalettes[kind] };
  },
);

export const selectAvailablePalettes = createSelector(
  [(state: RootState) => state.present.predicatePalette.customPaletteColors],
  (customPalette): Palette[] =>
    paletteKinds.map((kind) =>
      kind === "custom"
        ? { kind, colors: customPalette }
        : { kind, colors: bakedPalettes[kind] },
    ),
);

export default predicatePaletteSlice.reducer;

export const {
  setActivePalette,
  addCustomPaletteColor,
  removeCustomPaletteColor,
  setCustomPaletteColor,
  reorderCustomPaletteColors,
} = predicatePaletteSlice.actions;
