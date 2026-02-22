import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { selectLanguage } from "../language/languageSlice";
import { selectStructure } from "../structure/structureSlice";
import { selectValuation } from "../variables/variablesSlice";
import { evaluateFormula } from "../formulas/formulasSlice";

export interface QueryState {
  text: string;
  locked: boolean;
}

export interface QueriesState {
  queries: QueryState[];
}

type WithQueryId<T = object> = {
  idx: number;
} & T;

export const initialQueriesState: QueriesState = {
  queries: [],
};

function createQuery(): QueryState {
  return { text: "", locked: false };
}

export const queriesSlice = createSlice({
  name: "queries",
  initialState: initialQueriesState,
  reducers: {
    addQuery: (state) => {
      state.queries.push(createQuery());
    },

    updateQueryText: (
      state,
      action: PayloadAction<WithQueryId<{ text: string }>>,
    ) => {
      const { idx, text } = action.payload;

      if (state.queries[idx]) state.queries[idx].text = text;
    },

    lockQuery: (state, action: PayloadAction<WithQueryId>) => {
      const { idx } = action.payload;

      if (state.queries[idx])
        state.queries[idx].locked = !state.queries[idx].locked;
    },

    removeQuery: (state, action: PayloadAction<WithQueryId>) => {
      state.queries.splice(action.payload.idx, 1);
    },
  },
});

export const selectQueries = (state: RootState) =>
  state.present.queries.queries;

export const selectQueryIndexes = (state: RootState) => {
  const length = state.present.queries.queries.length;
  return Array.from({ length }, (_, i) => i);
};

export const selectQuery = (state: RootState, idx: number) =>
  state.present.queries.queries[idx];

export const selectEvaluatedQuery = createSelector(
  [selectLanguage, selectStructure, selectQuery, selectValuation],
  (language, structure, query, valuation) =>
    evaluateFormula(language, structure, query.text, valuation),
);

export const { addQuery, lockQuery, updateQueryText, removeQuery } =
  queriesSlice.actions;

export default queriesSlice.reducer;
