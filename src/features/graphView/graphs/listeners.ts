import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import { selectStructure } from "../../structure/structureSlice";
import type { RootState } from "../../../app/store";
import { tuplesChanged } from "./graphSlice";
import {
  selectValidatedFunctions,
  selectValidatedPredicates,
  updateFunctions,
  updatePredicates,
} from "../../language/languageSlice";

export const graphSliceListener = createListenerMiddleware<RootState>();

graphSliceListener.startListening({
  matcher: isAnyOf(updatePredicates, updateFunctions),
  effect(_, api) {
    const state = api.getState();

    const parsedPredicates = selectValidatedPredicates(state);
    const parsedFuncs = selectValidatedFunctions(state);
    const structure = selectStructure(state);

    if (!parsedPredicates.error && !parsedFuncs.error) {
      // probably only temporary until state management is refactored
      const funcIntr = [...structure.iF.entries()].map(
        ([key, map]) =>
          [
            key,
            [...map.entries()]
              .filter(([d, r]) => d.length > 0 && r !== undefined)
              .map(([d, r]) => [d[0], r]),
          ] as const,
      );

      const predIntr = [...structure.iP.entries()].map(
        ([key, set]) =>
          [key, [...set].filter((arr) => arr.length > 0)] as const,
      );

      console.time("Graph initialization duration");
      api.dispatch(
        tuplesChanged({
          domain: [...structure.domain],
          preds: [...parsedPredicates.parsed.entries()],
          funcs: [...parsedFuncs.parsed.entries()],
          tupleIntr: Object.fromEntries(new Map([...predIntr, ...funcIntr])),
        }),
      );
      console.timeEnd("Graph initialization duration");

      // api.dispatch({ type: "REPLACE_PRESENT" });
    }
  },
});
