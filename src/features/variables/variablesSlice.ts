import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { parseValuation, SyntaxError } from "@fmfi-uk-1-ain-412/js-fol-parser";
import { selectLanguage } from "../language/languageSlice";
import { selectParsedDomain } from "../structure/structureSlice";

export interface VariablesState {
  text: string;
  locked: boolean;
}

const initialState: VariablesState = {
  text: "",
  locked: false,
};

export const variablesSlice = createSlice({
  name: "variables",
  initialState,
  reducers: {
    importVariablesState: (_state, action: PayloadAction<string>) => {
      return JSON.parse(action.payload);
    },
    updateVariables: (state, action: PayloadAction<string>) => {
      state.text = action.payload;
    },
    lockVariables: (state) => {
      state.locked = !state.locked;
    },
  },
});

export const { updateVariables, importVariablesState, lockVariables } =
  variablesSlice.actions;

export default variablesSlice.reducer;

export const selectVariablesText = (state: RootState) => state.variables.text;
export const selectVariablesLock = (state: RootState) => state.variables.locked;

export const selectParsedVariables = createSelector(
  [selectVariablesText, selectLanguage, selectParsedDomain],
  (variables, language, domain) => {
    try {
      const vars = parseValuation(variables, language.getParserLanguage());
      let err = undefined;
      const varsMap = vars.map(([from, to]) => {
        if (
          (domain.parsed && domain.parsed.includes(to) == false) ||
          !domain.parsed
        ) {
          err = new Error(`${to} is not an element of domain`);
        }

        return { from: from, to: to };
      });

      if (err) return { error: err };

      return { parsed: varsMap };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { error: error };
      }

      throw error;
    }
  }
);

export const selectValuation = createSelector(
  [selectParsedVariables],
  (variables) => {
    if (variables.parsed === undefined) return new Map<string, string>();

    return new Map(variables.parsed.map(({ from, to }) => [from, to]));
  }
);
