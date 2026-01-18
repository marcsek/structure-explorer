import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import Language from "../../model/Language";
import { type SymbolWithArity } from "@fmfi-uk-1-ain-412/js-fol-parser";
import { createValidationError } from "../../common/errors";
import {
  prepareWithSourceMeta,
  type LockableValue,
  type Validated,
} from "../../common/redux";

export type ConstantsRepresentation = string[];
export type AritySymbolsRepresentation = [string, number][];

export interface LanguageState {
  constants: LockableValue<ConstantsRepresentation>;
  predicates: LockableValue<AritySymbolsRepresentation>;
  functions: LockableValue<AritySymbolsRepresentation>;
}

const initialState: LanguageState = {
  constants: { value: [], locked: false },
  predicates: { value: [], locked: false },
  functions: { value: [], locked: false },
};

export type PayloadActionSource<P = void> = PayloadAction<
  P,
  string,
  { source?: string }
>;

export const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    importLanguageState(_state, action: PayloadAction<LanguageState>) {
      return action.payload;
    },

    updateConstants: {
      reducer(state, action: PayloadActionSource<ConstantsRepresentation>) {
        state.constants.value = action.payload;
      },
      prepare: prepareWithSourceMeta<ConstantsRepresentation>,
    },

    lockConstants(state) {
      state.constants.locked = !state.constants.locked;
    },

    updatePredicates: {
      reducer(state, action: PayloadActionSource<SymbolWithArity[]>) {
        state.predicates.value = action.payload.map(({ name, arity }) => [
          name,
          arity,
        ]);
      },
      prepare: prepareWithSourceMeta<SymbolWithArity[]>,
    },

    lockPredicates(state) {
      state.predicates.locked = !state.predicates.locked;
    },

    updateFunctions: {
      reducer(state, action: PayloadActionSource<SymbolWithArity[]>) {
        state.functions.value = action.payload.map(({ name, arity }) => [
          name,
          arity,
        ]);
      },
      prepare: prepareWithSourceMeta<SymbolWithArity[]>,
    },

    lockFunctions(state) {
      state.functions.locked = !state.functions.locked;
    },
  },
});

export const selectConstantsLock = (state: RootState) =>
  state.present.language.constants.locked;
export const selectPredicatesLock = (state: RootState) =>
  state.present.language.predicates.locked;
export const selectFunctionsLock = (state: RootState) =>
  state.present.language.functions.locked;

export const selectValidatedConstants = createSelector(
  [(state: RootState) => state.present.language.constants],
  ({ value: constants }) => {
    const result: Validated<Set<string>> = { parsed: new Set(constants) };

    for (const element of constants) {
      if (constants.filter((element2) => element === element2).length > 1) {
        result.error = createValidationError(
          `Constant ${element} is already defined`,
        );
      }
    }

    return result;
  },
);

export const selectValidatedPredicates = createSelector(
  [(state: RootState) => state.present.language.predicates],
  ({ value: predicates }): Validated<Map<string, number>> => {
    const result: Validated<Map<string, number>> = {
      parsed: new Map(predicates),
    };

    for (const [name] of predicates) {
      if (predicates.filter(([name2]) => name === name2).length > 1) {
        result.error = createValidationError(
          `Predicate ${name} is already defined`,
        );
      }
    }

    return result;
  },
);

export const selectValidatedFunctions = createSelector(
  [(state: RootState) => state.present.language.functions],
  ({ value: functions }): Validated<Map<string, number>> => {
    const result: Validated<Map<string, number>> = {
      parsed: new Map(functions),
    };

    for (const [name] of functions) {
      if (functions.filter(([name2]) => name === name2).length > 1) {
        result.error = createValidationError(
          `Function ${name} is already defined`,
        );
      }
    }

    return result;
  },
);

export const selectSymbolsClash = createSelector(
  [
    selectValidatedConstants,
    selectValidatedPredicates,
    selectValidatedFunctions,
  ],
  (consts, preds, funcs) => {
    let err = undefined;
    if (!consts.parsed) return "";
    if (!preds.parsed) return "";
    if (!funcs.parsed) return "";

    const constants = consts.parsed;
    const predicates = new Set(preds.parsed.keys());
    const functions = new Set(funcs.parsed.keys());

    constants.forEach((element) => {
      if (predicates.has(element)) {
        err = `Constant ${element} is also defined in predicates`;
      }

      if (functions.has(element)) {
        err = `Constant ${element} is also defined in functions`;
      }
    });

    predicates.forEach((element) => {
      if (functions.has(element)) {
        err = `Predicate ${element} is also defined in functions`;
      }
    });

    return err;
  },
);

export const selectLanguage = createSelector(
  [
    selectValidatedConstants,
    selectValidatedPredicates,
    selectValidatedFunctions,
  ],
  (constants, predicates, functions) => {
    return new Language(
      constants.parsed ?? new Set(),
      predicates.parsed ?? new Map(),
      functions.parsed ?? new Map(),
    );
  },
);

export const {
  updateConstants,
  updatePredicates,
  updateFunctions,
  importLanguageState,
  lockConstants,
  lockFunctions,
  lockPredicates,
} = languageSlice.actions;

export default languageSlice.reducer;
