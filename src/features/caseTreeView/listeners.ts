import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
  updateDomain,
  updateFunctionSymbols,
} from "../structure/structureSlice";
import type { RootState } from "../../app/store";
import { selectValidatedFunctions } from "../language/languageSlice";
import { generateTuples } from "./helpers";

export const caseTreeListener = createListenerMiddleware<RootState>();

caseTreeListener.startListening({
  matcher: isAnyOf(updateDomain),
  effect(_, api) {
    const state = api.getState().present;
    const intervalViews = state.caseTreeView;

    for (const [tupleName, view] of Object.entries(intervalViews)) {
      const { rootId, nodes } = view;
      const domain = new Set(state.structure.domain.value);
      const arity = selectValidatedFunctions(api.getState()).parsed.get(
        tupleName,
      );

      if (!arity) return;

      const result = generateTuples(rootId, nodes, domain, arity);

      if (!result.ok) return;

      api.dispatch(
        updateFunctionSymbols(
          { key: tupleName, value: result.tuples },
          { source: "caseTreeView" },
        ),
      );
    }
  },
});
