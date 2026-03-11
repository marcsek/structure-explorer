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
      const previous = parseQuery(language, prevQuery.text);
      const current = parseQuery(language, newText);

      if (
        previous.error !== current.error ||
        (previous.formula &&
          current.formula &&
          previous.formula.toString() !== current.formula.toString())
      ) {
        api.dispatch(
          updateQueryStaleness({ idx: action.payload.idx, stale: true }),
        );
      }

      return;
    }

    if (updateQueryVariablesText.match(action)) {
      const state = api.getOriginalState();
      const queryIdx = action.payload.idx;

      const previous = selectParsedQueryVariables(state, queryIdx);
      const current = selectParsedQueryVariables(api.getState(), queryIdx);

      if (
        previous.error !== current.error ||
        (previous.parsed &&
          current.parsed &&
          previous.parsed.toString() !== current.parsed.toString())
      ) {
        api.dispatch(
          updateQueryStaleness({ idx: action.payload.idx, stale: true }),
        );
      }

      return;
    }

    api.dispatch(allQueriesStale());
  },
});
