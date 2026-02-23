import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { selectLanguage } from "../language/languageSlice";
import { selectStructure } from "../structure/structureSlice";
import { selectValuation } from "../variables/variablesSlice";
import { SyntaxError as ParserSyntaxError } from "@fmfi-uk-1-ain-412/js-fol-parser";
import { getFormulaFactories } from "../../common/formulas";
import type Language from "../../model/Language";
import {
  parseConstants,
  parseFormulaWithPrecedence,
} from "@fmfi-uk-1-ain-412/js-fol-parser";

export interface QueryState {
  text: string;
  variablesText: string;
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
  return { text: "", variablesText: "", locked: false };
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

    updateQueryVariablesText: (
      state,
      action: PayloadAction<WithQueryId<{ text: string }>>,
    ) => {
      const { idx, text } = action.payload;

      if (state.queries[idx]) state.queries[idx].variablesText = text;
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

const parseQuery = (language: Language, formText: string) => {
  const factories = getFormulaFactories(language);

  try {
    const formula = parseFormulaWithPrecedence(
      formText,
      language.getParserLanguage(),
      factories,
    );

    return { formula };
  } catch (error) {
    if (error instanceof Error) return { error };
  }

  return {};
};

export const selectQueries = (state: RootState) =>
  state.present.queries.queries;

export const selectQueryIndexes = (state: RootState) => {
  const length = state.present.queries.queries.length;
  return Array.from({ length }, (_, i) => i);
};

export const selectQuery = (state: RootState, idx: number) =>
  state.present.queries.queries[idx];

export const selectParsedQueryVariables = createSelector(
  [selectQuery],
  ({ variablesText }) => {
    let parsed: string[] = [];
    try {
      parsed = parseConstants(variablesText);
    } catch (error) {
      if (error instanceof ParserSyntaxError) {
        const adjustedMessage = error.message.replace("constant", "variable");
        return { error: { ...error, message: adjustedMessage } };
      }
      throw error;
    }

    return { parsed };
  },
);

export const selectEvaluatedQuery = createSelector(
  [
    selectLanguage,
    selectStructure,
    selectQuery,
    selectParsedQueryVariables,
    selectValuation,
  ],
  (language, structure, query, queryVariables, valuation) => {
    if (queryVariables.error)
      return {
        error: new Error(
          `Invalid query variables: ${queryVariables.error.message}`,
        ),
      };

    const newValuation = new Map(valuation);
    for (const variable of queryVariables.parsed) {
      newValuation.set(variable, "");
    }

    const parsed = parseQuery(language, query.text);

    if (!parsed.formula) return parsed;

    // Eval to detect non-parse errors (e.g., unassigned free variables)
    try {
      parsed.formula.eval(structure, newValuation);
    } catch (error) {
      if (error instanceof Error) return { error };
    }

    const freeVariables = parsed.formula.getFreeVariables();
    const notFree = [...queryVariables.parsed].filter(
      (v) => !freeVariables.has(v),
    );

    const notFreeLen = notFree.length;
    if (notFreeLen > 0) {
      const correctPluralVars = `variable${notFreeLen > 1 ? "s" : ""}`;
      const correctPluralVerb = notFreeLen > 1 ? "are" : "is";

      return {
        error: new Error(
          `Query ${correctPluralVars} ${notFree.join(", ")} ${correctPluralVerb} not free.`,
        ),
      };
    }

    return parsed;
  },
);

export interface QueryResult {
  valuation: string[];
  ok: boolean;
}

export const getQueryResults = createSelector(
  [
    selectParsedQueryVariables,
    selectEvaluatedQuery,
    selectStructure,
    selectValuation,
  ],
  (queryVariables, query, structure, structureValuation) => {
    if (queryVariables.error || query.error || !query.formula) return [];

    const result: QueryResult[] = [];

    const variables = queryVariables.parsed;
    const valuationLen = queryVariables.parsed.length;
    const domain = [...structure.domain];
    const enhancedValuation = new Map(structureValuation);

    for (const valuation of permutations(domain, valuationLen)) {
      for (let i = 0; i < valuationLen; i++) {
        enhancedValuation.set(variables[i], valuation[i]);
      }

      try {
        const ok = query.formula.eval(structure, enhancedValuation);
        result.push({ valuation, ok });
      } catch (error) {
        console.error(error);
      }
    }

    return result;
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
  addQuery,
  lockQuery,
  updateQueryText,
  updateQueryVariablesText,
  removeQuery,
} = queriesSlice.actions;

export default queriesSlice.reducer;
