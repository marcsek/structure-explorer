import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import {
  parseConstants,
  parsePredicates,
  parseFunctions,
  SyntaxError,
} from "@fmfi-uk-1-ain-412/js-fol-parser";
import Language from "../../model/Language";

export interface LanguageState {
  constants: { text: string; locked: boolean };
  predicates: { text: string; locked: boolean };
  functions: { text: string; locked: boolean };
}

const initialState: LanguageState = {
  constants: {
    text: "",
    locked: false,
  },
  predicates: {
    text: "",
    locked: false,
  },
  functions: {
    text: "",
    locked: false,
  },
};

export const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    importLanguageState: (_state, action: PayloadAction<string>) => {
      return JSON.parse(action.payload);
    },

    updateConstants: (state, action: PayloadAction<string>) => {
      state.constants.text = action.payload;
    },

    lockConstants: (state) => {
      state.constants.locked = !state.constants.locked;
    },

    updatePredicates: (state, action: PayloadAction<string>) => {
      state.predicates.text = action.payload;
    },

    lockPredicates: (state) => {
      state.predicates.locked = !state.predicates.locked;
    },

    updateFunctions: (state, action: PayloadAction<string>) => {
      state.functions.text = action.payload;
    },

    lockFunctions: (state) => {
      state.functions.locked = !state.functions.locked;
    },
  },
});

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
export const selectConstantsText = (state: RootState) =>
  state.language.constants.text;
export const selectConstantsLock = (state: RootState) =>
  state.language.constants.locked;
export const selectPredicatesText = (state: RootState) =>
  state.language.predicates.text;
export const selectPredicatesLock = (state: RootState) =>
  state.language.predicates.locked;
export const selectFunctionsText = (state: RootState) =>
  state.language.functions.text;
export const selectFunctionsLock = (state: RootState) =>
  state.language.functions.locked;

export const selectParsedConstants = createSelector(
  [selectConstantsText],
  (constants) => {
    try {
      const parsed = parseConstants(constants);
      parsed.forEach((element) => {
        if (parsed.filter((element2) => element === element2).length > 1) {
          throw new Error(`Constant ${element} is already defined`);
        }
      });

      return { parsed: new Set(parsed) };
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof Error) {
        return { error: error };
      }

      throw error;
    }
  }
);
export const selectParsedPredicates = createSelector(
  [selectPredicatesText],
  (predicates) => {
    try {
      const parsed = parsePredicates(predicates);

      parsed.forEach((element) => {
        if (
          parsed.filter((element2) => element.name === element2.name).length > 1
        ) {
          throw new Error(`Predicate ${element.name} is already defined`);
        }
      });

      return {
        parsed: new Map(parsed.map(({ name, arity }) => [name, arity])),
      };
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof Error) {
        return { error: error };
      }

      throw error;
    }
  }
);

export const selectParsedFunctions = createSelector(
  [selectFunctionsText],
  (functions) => {
    try {
      const parsed = parseFunctions(functions);

      parsed.forEach((element) => {
        if (
          parsed.filter((element2) => element.name === element2.name).length > 1
        ) {
          throw new Error(`Function ${element.name} is already defined`);
        }
      });

      return {
        parsed: new Map(parsed.map(({ name, arity }) => [name, arity])),
      };
    } catch (error) {
      if (error instanceof SyntaxError || error instanceof Error) {
        return { error: error };
      }

      throw error;
    }
  }
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
  }
);

export const selectLanguage = createSelector(
  [selectParsedConstants, selectParsedPredicates, selectParsedFunctions],
  (constants, predicates, functions) => {
    return new Language(
      constants.parsed ?? new Set(),
      predicates.parsed ?? new Map(),
      functions.parsed ?? new Map()
    );
  }
);
