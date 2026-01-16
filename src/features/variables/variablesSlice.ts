import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { type PayloadActionSource } from "../language/languageSlice";
import { selectValidatedDomain } from "../structure/structureSlice";
import { createValidationError } from "../../common/errors";
import {
  prepareWithSourceMeta,
  type LockableValue,
  type Validated,
} from "../../common/redux";

export type VariableRepresentation = { from: string; to: string };
export type VariablesState = LockableValue<VariableRepresentation[]>;

const initialState: VariablesState = { value: [], locked: false };

export const variablesSlice = createSlice({
  name: "variables",
  initialState,
  reducers: {
    importVariablesState(_state, action: PayloadAction<VariablesState>) {
      return action.payload;
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

export const selectValidatedVariables = createSelector(
  [selectValidatedDomain, (state: RootState) => state.variables],
  (domain, { value: variables }) => {
    const result: Validated<VariableRepresentation[]> = { parsed: variables };

    for (const { to } of variables) {
      if (
        (domain.parsed && domain.parsed.includes(to) == false) ||
        !domain.parsed
      ) {
        result.error = createValidationError(
          `${to} is not an element of domain`,
        );
      }
    }

    return result;
  },
);

export const selectValuation = createSelector(
  [selectValidatedVariables],
  (variables) => {
    if (variables.parsed === undefined) return new Map<string, string>();

    return new Map(variables.parsed.map(({ from, to }) => [from, to]));
  },
);

export const { updateVariables, importVariablesState, lockVariables } =
  variablesSlice.actions;

export default variablesSlice.reducer;
