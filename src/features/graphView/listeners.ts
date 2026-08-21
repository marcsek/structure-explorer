import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { syncGraphView } from "./graphViewSlice";
import {
  selectSymbolsClash,
  selectValidatedFunctions,
  selectValidatedPredicates,
  updateFunctions,
  updatePredicates,
} from "../language/languageSlice";
import { dev } from "../../shared/core/logging";

export const graphViewListener = createListenerMiddleware<RootState>();

graphViewListener.startListening({
  matcher: isAnyOf(updatePredicates, updateFunctions),
  effect(_, api) {
    const state = api.getState();

    const parsedPredicates = selectValidatedPredicates(state);
    const parsedFuncs = selectValidatedFunctions(state);
    const symbolsClash = selectSymbolsClash(state);
    const { language, structure } = api.getState().present;

    if (!parsedPredicates.error && !parsedFuncs.error && !symbolsClash) {
      dev.time("Graph initialization duration");

      api.dispatch(syncGraphView({ structure, language }));

      dev.timeEnd("Graph initialization duration");
    }
  },
});
