import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
  updateDomain,
  updateFunctionSymbols,
} from "../structure/structureSlice";
import type { RootState } from "../../app/store";
import { selectValidatedFunctions } from "../language/languageSlice";
import { copyNode, generateTuples, updateCaseTree } from "./helpers";
import { updateTree } from "./caseTreeViewSlice";

export const caseTreeListener = createListenerMiddleware<RootState>();

caseTreeListener.startListening({
  matcher: isAnyOf(updateDomain, updateFunctionSymbols),
  effect(action, api) {
    const state = api.getState().present;
    const intervalViews = state.caseTreeView;
    const domain = new Set(state.structure.domain.value);

    if (updateFunctionSymbols.match(action)) {
      const tupleName = action.payload.key;

      if (action.meta.source === "caseTreeView") return;

      const caseTreeEntry = state.caseTreeView[tupleName];
      if (!caseTreeEntry) return;

      const nodesCopy = Object.fromEntries(
        Object.entries(caseTreeEntry.nodes).map(([k, node]) => [
          k,
          copyNode(node),
        ]),
      );
      const caseTreeCopy = { ...caseTreeEntry, nodes: nodesCopy };

      updateCaseTree(caseTreeCopy, action.payload.value);

      return void api.dispatch(updateTree({ tupleName, tree: caseTreeCopy }));
    }

    for (const [tupleName, view] of Object.entries(intervalViews)) {
      const { rootId, nodes } = view;
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
