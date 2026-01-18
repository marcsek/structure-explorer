import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
  selectValidatedDomain,
  selectValidatedFunction,
  selectValidatedPredicate,
  selectStructure,
  updateDomain,
  updateFunctionSymbols,
  updateInterpretationPredicates,
} from "../../structure/structureSlice";
import type { RootState } from "../../../app/store";
import {
  domainChanged,
  tupleInterpretationChanged,
  tuplesChanged,
} from "./graphSlice";
import {
  selectValidatedFunctions,
  selectValidatedPredicates,
  updateFunctions,
  updatePredicates,
} from "../../language/languageSlice";

export const graphSliceListener = createListenerMiddleware<RootState>();

graphSliceListener.startListening({
  matcher: isAnyOf(updateInterpretationPredicates, updateFunctionSymbols),
  effect(action, api) {
    const state = api.getState();

    let key: string = "";
    let tupleIntr: string[][] = [];

    if (updateInterpretationPredicates.match(action)) {
      const parsedPredicate = selectValidatedPredicate(
        state,
        action.payload.key,
      );

      if (!parsedPredicate.parsed) return;

      key = action.payload.key;
      tupleIntr = parsedPredicate.parsed;
    } else if (updateFunctionSymbols.match(action)) {
      const parsedFunction = selectValidatedFunction(state, action.payload.key);

      if (!parsedFunction.parsed) return;

      key = action.payload.key;
      tupleIntr = parsedFunction.parsed;
    }

    api.dispatch(tupleInterpretationChanged({ name: key, intr: tupleIntr }));
    // api.dispatch({ type: "REPLACE_PRESENT" });
  },
});

graphSliceListener.startListening({
  actionCreator: updateDomain,
  effect(_, api) {
    const state = api.getState();
    const parsedDomain = selectValidatedDomain(state);

    if (!parsedDomain.error && parsedDomain.parsed) {
      api.dispatch(domainChanged(parsedDomain.parsed));
      // api.dispatch({ type: "REPLACE_PRESENT" });
    }
  },
});

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

      api.dispatch(
        tuplesChanged({
          domain: [...structure.domain],
          preds: [...parsedPredicates.parsed.entries()],
          funcs: [...parsedFuncs.parsed.entries()],
          tupleIntr: Object.fromEntries(new Map([...predIntr, ...funcIntr])),
        }),
      );
      // api.dispatch({ type: "REPLACE_PRESENT" });
    }
  },
});
