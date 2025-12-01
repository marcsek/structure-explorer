import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { type PayloadActionSource } from "../language/languageSlice";
import { selectParsedDomain } from "../structure/structureSlice";
import { createValidationError } from "../../common/errors";
import { prepareWithSourceMeta } from "../../common/redux";

export type VariableRepresentation = { from: string; to: string };

export interface VariablesState {
  value: VariableRepresentation[];
  locked: boolean;
}

const initialState: VariablesState = { value: [], locked: false };

export const variablesSlice = createSlice({
  name: "variables",
  initialState,
  reducers: {
    importVariablesState(_state, action: PayloadAction<string>) {
      return JSON.parse(action.payload);
    },

    updateVariables: {
      reducer(state, action: PayloadActionSource<[string, string][]>) {
        state.value = action.payload.map(([from, to]) => ({ from, to }));
      },
      prepare: prepareWithSourceMeta<[string, string][]>,
    },

    lockVariables(state) {
      state.locked = !state.locked;
    },
  },
});

export const selectVariablesLock = (state: RootState) => state.variables.locked;

export const selectVariablesValidation = createSelector(
  [selectParsedDomain, (state: RootState) => state.variables],
  (domain, { value: variables }) => {
    for (const { to } of variables) {
      if (
        (domain.parsed && domain.parsed.includes(to) == false) ||
        !domain.parsed
      ) {
        return createValidationError(`${to} is not an element of domain`);
      }
    }

    return { error: undefined };
  },
);

export const selectParsedVariables = createSelector(
  [selectVariablesValidation, (state: RootState) => state.variables],
  ({ error }, { value }) => {
    if (error) return { error };

    return { parsed: value };
  },
);

export const selectValuation = createSelector(
  [selectParsedVariables],
  (variables) => {
    if (variables.parsed === undefined) return new Map<string, string>();

    return new Map(variables.parsed.map(({ from, to }) => [from, to]));
  },
);

export const { updateVariables, importVariablesState, lockVariables } =
  variablesSlice.actions;

export default variablesSlice.reducer;
