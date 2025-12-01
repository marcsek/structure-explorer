import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import Language from "../../model/Language";
import type { ValidationError } from "../textView/textViewSlice";
import type { SymbolWithArity } from "@fmfi-uk-1-ain-412/js-fol-parser";

export interface BaseLanguageState {
  locked: boolean;
}

export interface ConstantsState extends BaseLanguageState {
  value: string[];
}

export interface AritySymbolsState extends BaseLanguageState {
  value: [string, number][];
}

export interface LanguageState {
  constants: ConstantsState;
  predicates: AritySymbolsState;
  functions: AritySymbolsState;
}

const initialState: LanguageState = {
  constants: { value: [], locked: false },
  predicates: { value: [], locked: false },
  functions: { value: [], locked: false },
};

export const prepareWithSourceMeta = <P>(
  payload: P,
  meta: { source?: string } = {},
) => ({
  payload,
  meta,
});

export type PayloadActionSource<P = void> = PayloadAction<
  P,
  string,
  { source?: string }
>;

export const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    importLanguageState(_state, action: PayloadAction<string>) {
      return JSON.parse(action.payload);
    },

    updateConstants: {
      reducer(state, action: PayloadActionSource<string[]>) {
        state.constants.value = action.payload;
      },
      prepare: prepareWithSourceMeta<string[]>,
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
  state.language.constants.locked;
export const selectPredicatesLock = (state: RootState) =>
  state.language.predicates.locked;
export const selectFunctionsLock = (state: RootState) =>
  state.language.functions.locked;

export const createValidationError = (message: string) => {
  return {
    error: {
      kind: "validation",
      message,
    } as ValidationError,
  };
};

export const selectConstantsValidation = createSelector(
  [(state: RootState) => state.language.constants],
  ({ value: constants }) => {
    for (const element of constants) {
      if (constants.filter((element2) => element === element2).length > 1) {
        return createValidationError(`Constant ${element} is already defined`);
      }
    }

    return { error: undefined };
  },
);

export const selectParsedConstants = createSelector(
  [selectConstantsValidation, (state: RootState) => state.language.constants],
  ({ error }, { value: constants }) => {
    if (error) return { error };

    return { parsed: new Set(constants) };
  },
);

export const selectPredicatesValidation = createSelector(
  [(state: RootState) => state.language.predicates],
  ({ value: predicates }) => {
    for (const [name] of predicates) {
      if (predicates.filter(([name2]) => name === name2).length > 1) {
        return createValidationError(`Predicate ${name} is already defined`);
      }
    }

    return { error: undefined };
  },
);

export const selectParsedPredicates = createSelector(
  [selectPredicatesValidation, (state: RootState) => state.language.predicates],
  ({ error }, { value }) => {
    if (error) return { error };

    return { parsed: new Map(value) };
  },
);

export const selectFunctionsValidation = createSelector(
  [(state: RootState) => state.language.functions],
  ({ value: functions }) => {
    for (const [name] of functions) {
      if (functions.filter(([name2]) => name === name2).length > 1) {
        return createValidationError(`Function ${name} is already defined`);
      }
    }

    return { error: undefined };
  },
);

export const selectParsedFunctions = createSelector(
  [selectFunctionsValidation, (state: RootState) => state.language.functions],
  ({ error }, { value }) => {
    if (error) return { error };

    return { parsed: new Map(value) };
  },
);

export const selectSymbolsClash = createSelector(
  [selectParsedConstants, selectParsedPredicates, selectParsedFunctions],
  (consts, preds, funcs) => {
    let err = undefined;
    if (!consts.parsed) return "";
    if (!preds.parsed) return "";
    if (!funcs.parsed) return "";

    const constants = consts.parsed;
    const predicates = new Set(preds.parsed.keys());
    const functions = new Set(funcs.parsed.keys());

    constants.forEach((element) => {
      if (preds.parsed.has(element)) {
        err = `Constant ${element} is also defined in predicates`;
      }

      if (funcs.parsed.has(element)) {
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
  [selectParsedConstants, selectParsedPredicates, selectParsedFunctions],
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
