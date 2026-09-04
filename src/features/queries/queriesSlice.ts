import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { selectLanguage } from "../language/languageSlice";
import { selectStructure } from "../structure/structureSlice";
import { selectValuation } from "../variables/variablesSlice";
import {
  parseFormula,
  safeEval,
  validateAssignedFreeVariables,
} from "../../shared/core/formulas";
import type Formula from "../../model/formula/Formula";

import {
  createSemanticError,
  type FormulaError,
} from "../../shared/core/errors";
import {
  parseQueryVariables,
  validateQueryVariables,
} from "../../shared/core/parsers/queryVariables";
import type { SerializedQueriesState } from "./validationSchema";
import { plural, toBe } from "../../shared/core/wordForms";

export interface QueryState {
  text: string;
  variablesText: string;
  stale: boolean;
  locked: boolean;
}

export interface QueriesState {
  queries: QueryState[];
}

type WithQueryIndex<T = object> = {
  idx: number;
} & T;

export const initialQueriesState: QueriesState = {
  queries: [],
};

function createQuery(): QueryState {
  return { text: "", variablesText: "", stale: false, locked: false };
}

export const queriesSlice = createSlice({
  name: "queries",
  initialState: initialQueriesState,
  reducers: {
    importQueriesState: (
      _state,
      action: PayloadAction<SerializedQueriesState>,
    ) => {
      return {
        queries: action.payload.queries.map((q) => ({ ...q, stale: false })),
      };
    },

    addQuery: (state) => {
      state.queries.push(createQuery());
    },

    updateQueryText: (
      state,
      action: PayloadAction<WithQueryIndex<{ text: string }>>,
    ) => {
      const { idx, text } = action.payload;

      if (state.queries[idx]) state.queries[idx].text = text;
    },

    updateQueryVariablesText: (
      state,
      action: PayloadAction<WithQueryIndex<{ text: string }>>,
    ) => {
      const { idx, text } = action.payload;

      if (state.queries[idx]) state.queries[idx].variablesText = text;
    },

    allQueriesStale: (state) => {
      for (const query of state.queries) query.stale = true;
    },

    updateQueryStaleness: (
      state,
      action: PayloadAction<WithQueryIndex<{ stale: boolean }>>,
    ) => {
      const { idx, stale } = action.payload;

      if (state.queries[idx]) state.queries[idx].stale = stale;
    },

    toggleQueryLock: (state, action: PayloadAction<WithQueryIndex>) => {
      const { idx } = action.payload;

      if (state.queries[idx])
        state.queries[idx].locked = !state.queries[idx].locked;
    },

    removeQuery: (state, action: PayloadAction<WithQueryIndex>) => {
      state.queries.splice(action.payload.idx, 1);
    },
  },
});

export const selectQueries = (state: RootState) =>
  state.present.queries.queries;

export const selectQueryIndexes = createSelector([selectQueries], (queries) =>
  Array.from({ length: queries.length }, (_, i) => i),
);

export const selectQuery = (
  state: RootState,
  idx: number,
): QueryState | undefined => state.present.queries.queries[idx];

export const selectParsedQueryVariables = createSelector(
  [selectQuery],
  (query) => {
    if (!query) return undefined;

    const { parsed, error } = parseQueryVariables(query?.variablesText);
    if (error) return { error };

    const validationError = validateQueryVariables(parsed);
    if (validationError) return { error: validationError };

    return { parsed };
  },
);

export const selectParsedQuery = createSelector(
  [selectLanguage, selectQuery],
  (language, query) => (query ? parseFormula(query.text, language) : undefined),
);

export type EvaluatedQuery =
  | { formula: Formula; error?: undefined }
  | { formula?: undefined; error: FormulaError };

export const selectEvaluatedQuery = createSelector(
  [
    selectStructure,
    selectParsedQuery,
    selectParsedQueryVariables,
    selectValuation,
  ],
  (
    structure,
    parsed,
    queryVariables,
    valuation,
  ): EvaluatedQuery | undefined => {
    if (!parsed || !queryVariables) return undefined;

    if (queryVariables.error) return { error: queryVariables.error };

    const newValuation = new Map(valuation);
    for (const variable of queryVariables.parsed) {
      newValuation.set(variable, [...structure.domain].at(0) ?? "");
    }

    if (!parsed.formula) return parsed;

    const freeVariables = parsed.formula.getFreeVariables();
    const unassignedError = validateAssignedFreeVariables(
      parsed.formula,
      newValuation,
      "not listed among query variables or assigned any value " +
        "by the global assignment 𝑒.",
    );

    if (unassignedError) return { error: unassignedError };

    const { error } = safeEval(parsed.formula, structure, newValuation);

    if (error) return { error };

    const notFree = [...queryVariables.parsed].filter(
      (v) => !freeVariables.has(v),
    );

    const notFreeLen = notFree.length;
    if (notFreeLen > 0) {
      return {
        error: createSemanticError(
          `Query ${plural(notFreeLen, "variable")} ${notFree.join(", ")} ${toBe(notFreeLen)} ` +
            `not free on the right-hand side of the query definition.`,
        ),
      };
    }

    return parsed;
  },
);

export type QueryResult = string[];

export const getQueryResults = createSelector(
  [
    selectParsedQueryVariables,
    selectEvaluatedQuery,
    selectStructure,
    selectValuation,
  ],
  (queryVariables, query, structure, structureValuation) => {
    if (!queryVariables?.parsed || !query?.formula) return [];

    const satisfying: QueryResult[] = [];

    const variables = queryVariables.parsed;
    const valuationLen = queryVariables.parsed.length;
    const domain = [...structure.domain];
    const enhancedValuation = new Map(structureValuation);

    for (const valuation of permutations(domain, valuationLen)) {
      for (let i = 0; i < valuationLen; i++) {
        enhancedValuation.set(variables[i], valuation[i]);
      }

      const { value, error } = safeEval(
        query.formula,
        structure,
        enhancedValuation,
      );

      if (error) {
        console.error(error);
        continue;
      }

      if (value) satisfying.push(valuation);
    }

    return satisfying;
  },
);

function* permutations<T>(domain: T[], n: number): Generator<T[]> {
  if (n <= 0) {
    yield [];
    return;
  }

  for (const element of domain) {
    for (const permutation of permutations(domain, n - 1)) {
      yield [element, ...permutation];
    }
  }
}

export const {
  importQueriesState,
  addQuery,
  allQueriesStale,
  updateQueryStaleness,
  toggleQueryLock,
  updateQueryText,
  updateQueryVariablesText,
  removeQuery,
} = queriesSlice.actions;

export default queriesSlice.reducer;
