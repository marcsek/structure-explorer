import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import {
  updateDomain,
  updateFunctionSymbols,
  updateInterpretationConstants,
  updateInterpretationPredicates,
} from "../structure/structureSlice";
import { updateVariables } from "../variables/variablesSlice";
import {
  allQueriesStale,
  parseQuery,
  selectParsedQueryVariables,
  selectQuery,
  updateQueryStaleness,
  updateQueryText,
  updateQueryVariablesText,
} from "./queriesSlice";
import { selectLanguage } from "../language/languageSlice";

export const querySliceListener = createListenerMiddleware<RootState>();

const errorsDiffer = (previous: unknown, current: unknown) =>
  !!previous !== !!current;

const sameVariables = (
  previous: string[] | undefined,
  current: string[] | undefined,
) =>
  previous === current ||
  (previous !== undefined &&
    current !== undefined &&
    previous.length === current.length &&
    previous.every((v, i) => v === current[i]));

const actionsThatMakeQueryStale = [
  updateDomain,
  updateInterpretationConstants,
  updateInterpretationPredicates,
  updateFunctionSymbols,
  updateVariables,
  updateQueryText,
  updateQueryVariablesText,
];

querySliceListener.startListening({
  matcher: isAnyOf(...actionsThatMakeQueryStale),
  effect(action, api) {
    if (updateQueryText.match(action)) {
      const state = api.getOriginalState();
      const queryIdx = action.payload.idx;
      const newText = action.payload.text;

      const language = selectLanguage(state);

      const prevQuery = selectQuery(state, queryIdx);
      if (!prevQuery) return;

      const previous = parseQuery(language, prevQuery.text);
      const current = parseQuery(language, newText);

      if (
        errorsDiffer(previous.error, current.error) ||
        previous.formula?.toString() !== current.formula?.toString()
      ) {
        api.dispatch(updateQueryStaleness({ idx: queryIdx, stale: true }));
      }

      return;
    }

    if (updateQueryVariablesText.match(action)) {
      const queryIdx = action.payload.idx;

      const previous = selectParsedQueryVariables(
        api.getOriginalState(),
        queryIdx,
      );
      const current = selectParsedQueryVariables(api.getState(), queryIdx);

      if (
        errorsDiffer(previous.error, current.error) ||
        !sameVariables(previous.parsed, current.parsed)
      ) {
        api.dispatch(updateQueryStaleness({ idx: queryIdx, stale: true }));
      }

      return;
    }

    api.dispatch(allQueriesStale());
  },
});
