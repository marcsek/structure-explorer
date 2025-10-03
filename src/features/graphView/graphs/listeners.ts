import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
  selectParsedDomain,
  selectParsedFunction,
  selectParsedPredicate,
  selectStructure,
  updateDomain,
  updateFunctionSymbols,
  updateInterpretationPredicates,
} from "../../structure/structureSlice";
import type { RootState } from "../../../app/store";
import {
  domainChanged,
  predicateInterpretationChanged,
  predicatesChanged,
} from "./graphSlice";
import {
  selectParsedFunctions,
  selectParsedPredicates,
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
      const parsedPredicate = selectParsedPredicate(state, action.payload.key);

      if (parsedPredicate.error || !parsedPredicate.parsed) return;

      key = action.payload.key;
      tupleIntr = parsedPredicate.parsed;
    } else if (updateFunctionSymbols.match(action)) {
      const parsedFunction = selectParsedFunction(state, action.payload.key);

      if (!parsedFunction.parsed) return;

      key = action.payload.key;
      tupleIntr = parsedFunction.parsed;
    }

    api.dispatch(
      predicateInterpretationChanged({ name: key, intr: tupleIntr }),
    );
  },
});

graphSliceListener.startListening({
  actionCreator: updateDomain,
  effect(_, api) {
    const state = api.getState();
    const parsedDomain = selectParsedDomain(state);

    if (!parsedDomain.error && parsedDomain.parsed)
      api.dispatch(domainChanged(parsedDomain.parsed));
  },
});

graphSliceListener.startListening({
  matcher: isAnyOf(updatePredicates, updateFunctions),
  effect(_, api) {
    const state = api.getState();
    const parsedPredicates = selectParsedPredicates(state);
    const parsedFuncs = selectParsedFunctions(state);
    const structure = selectStructure(state);

    if (
      !parsedPredicates.error &&
      parsedPredicates.parsed &&
      parsedFuncs.parsed
    ) {
      api.dispatch(
        predicatesChanged({
          domain: [...structure.domain],
          preds: [...parsedPredicates.parsed.entries()],
          funcs: [...parsedFuncs.parsed.entries()],
          tupleIntr: Object.fromEntries(
            new Map(
              Array.from(structure.iP.entries()).map(([key, set]) => [
                key,
                [...set].filter((arr) => arr.length > 0),
              ]),
            ),
          ),
        }),
      );
    }
  },
});
