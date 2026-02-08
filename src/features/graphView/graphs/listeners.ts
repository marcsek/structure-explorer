import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import type { RootState } from "../../../app/store";
import { syncGraphView } from "./graphSlice";
import {
  selectSymbolsClash,
  selectValidatedFunctions,
  selectValidatedPredicates,
  updateFunctions,
  updatePredicates,
} from "../../language/languageSlice";
import { dev } from "../../../common/logging";

export const graphSliceListener = createListenerMiddleware<RootState>();

graphSliceListener.startListening({
  matcher: isAnyOf(updatePredicates, updateFunctions),
  effect(_, api) {
    const state = api.getState();

    const parsedPredicates = selectValidatedPredicates(state);
    const parsedFuncs = selectValidatedFunctions(state);
    const symbolsClash = selectSymbolsClash(state);
    const { language, structure } = api.getState().present;

    dev.log("GRAPHS", symbolsClash, api.getState().present);
    if (!parsedPredicates.error && !parsedFuncs.error && !symbolsClash) {
      dev.time("Graph initialization duration");

      dev.log("SYNC");
      api.dispatch(syncGraphView({ structure, language }));

      dev.timeEnd("Graph initialization duration");
    }
  },
});
