import {
  createAction,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  defaultPalette,
  palettes as bakedPalettes,
  paletteKinds,
  type BakedPaletteKind,
  type PaletteKind,
  type Palette,
  type PaletteColor,
} from "./palettes";
import type { AppThunk, RootState } from "../../app/store";
import type { SerializedPredicatePaletteState } from "./validationSchema";

export interface PaletteState {
  activePaletteKind: PaletteKind;
  customPaletteColors: PaletteColor[];
}

// What a freshly added swatch starts out as, before the user picks a color.
const addedColorSeed = "#a3a3a3";

const withColorIds = (colors: string[]): PaletteColor[] =>
  colors.map((color, id) => ({ id, color }));

const nextColorId = (colors: PaletteColor[]) =>
  colors.reduce((highest, { id }) => Math.max(highest, id), -1) + 1;

const initialState: PaletteState = {
  activePaletteKind: "default",
  customPaletteColors: withColorIds(defaultPalette),
};

// Marks the end of palette editing, so workbook can report the edits at once.
export const predicatePaletteClosed = createAction("predicatePalette/closed");

export const predicatePaletteSlice = createSlice({
  name: "predicatePalette",
  initialState,
  reducers: {
    importPredicatePaletteState(
      _state,
      action: PayloadAction<SerializedPredicatePaletteState>,
    ) {
      const { activePaletteKind, customPaletteColors } = action.payload;

      return {
        activePaletteKind,
        customPaletteColors: withColorIds(customPaletteColors),
      };
    },

    setActivePalette(state, action: PayloadAction<PaletteKind>) {
      state.activePaletteKind = action.payload;
    },

    copyPaletteToCustom(state, action: PayloadAction<BakedPaletteKind>) {
      state.customPaletteColors = withColorIds(bakedPalettes[action.payload]);
    },

    addCustomPaletteColor(state) {
      state.customPaletteColors.push({
        id: nextColorId(state.customPaletteColors),
        color: addedColorSeed,
      });
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

      state.customPaletteColors[index].color = color;
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

export const selectPredicatePaletteState = (state: RootState) =>
  state.present.predicatePalette;

export const selectCustomPaletteColors = (state: RootState) =>
  state.present.predicatePalette.customPaletteColors;

const selectCustomPaletteColorValues = createSelector(
  [selectCustomPaletteColors],
  (customPalette) => customPalette.map(({ color }) => color),
);

export const selectActivePalette = createSelector(
  [
    (state: RootState) => state.present.predicatePalette.activePaletteKind,
    selectCustomPaletteColorValues,
  ],
  (kind, customPalette): Palette => {
    if (kind === "custom") return { kind, colors: customPalette };
    return { kind, colors: bakedPalettes[kind] };
  },
);

export const selectAvailablePalettes = createSelector(
  [selectCustomPaletteColorValues],
  (customPalette): Palette[] =>
    paletteKinds.map((kind) =>
      kind === "custom"
        ? { kind, colors: customPalette }
        : { kind, colors: bakedPalettes[kind] },
    ),
);

export const closePredicatePalette =
  (paletteOnOpen: PaletteState): AppThunk =>
  (dispatch, getState) => {
    const palette = selectPredicatePaletteState(getState());

    if (hasPaletteChanged(paletteOnOpen, palette))
      dispatch(predicatePaletteClosed());
  };

const hasPaletteChanged = (before: PaletteState, after: PaletteState) =>
  before.activePaletteKind !== after.activePaletteKind ||
  before.customPaletteColors.length !== after.customPaletteColors.length ||
  before.customPaletteColors.some(
    ({ color }, index) => color !== after.customPaletteColors[index].color,
  );

export default predicatePaletteSlice.reducer;

export const {
  importPredicatePaletteState,
  setActivePalette,
  copyPaletteToCustom,
  addCustomPaletteColor,
  removeCustomPaletteColor,
  setCustomPaletteColor,
  reorderCustomPaletteColors,
} = predicatePaletteSlice.actions;
