import { createListenerMiddleware } from "@reduxjs/toolkit";
import {
  selectParsedDomain,
  selectParsedPredicate,
  selectStructure,
  updateDomain,
  updateInterpretationPredicates,
} from "../../structure/structureSlice";
import type { RootState } from "../../../app/store";
import {
  domainChanged,
  predicateInterpretationChanged,
  predicatesChanged,
} from "./graphSlice";
import {
  selectParsedPredicates,
  updatePredicates,
} from "../../language/languageSlice";

export const graphSliceListener = createListenerMiddleware<RootState>();

graphSliceListener.startListening({
  actionCreator: updateInterpretationPredicates,
  effect(action, api) {
    const state = api.getState();
    const parsedPredicate = selectParsedPredicate(state, action.payload.key);

    if (!parsedPredicate.error && parsedPredicate.parsed)
      api.dispatch(
        predicateInterpretationChanged({
          name: action.payload.key,
          intr: parsedPredicate.parsed,
        }),
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
  actionCreator: updatePredicates,
  effect(_, api) {
    const state = api.getState();
    const parsedPredicates = selectParsedPredicates(state);
    const structure = selectStructure(state);

    if (!parsedPredicates.error && parsedPredicates.parsed) {
      api.dispatch(
        predicatesChanged({
          domain: [...structure.domain],
          preds: [...parsedPredicates.parsed.entries()],
          predicateIntr: Object.fromEntries(
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
