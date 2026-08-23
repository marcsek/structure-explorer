import { createListenerMiddleware, isAnyOf } from "@reduxjs/toolkit";
import {
  selectValidatedFunction,
  updateDomain,
  updateFunctionSymbols,
} from "../structure/structureSlice";
import type { RootState } from "../../app/store";
import { selectValidatedFunctions } from "../language/languageSlice";
import { copyNode } from "./model/caseTree";
import { generateTuples, updateCaseTree } from "./model/tuples";
import { updateTree } from "./caseTreeViewSlice";

export const caseTreeListener = createListenerMiddleware<RootState>();

caseTreeListener.startListening({
  matcher: isAnyOf(updateDomain, updateFunctionSymbols),
  effect(action, api) {
    const state = api.getState().present;
    const caseTrees = state.caseTreeView;
    const domain = new Set(state.structure.domain.value);

    if (updateFunctionSymbols.match(action)) {
      const functionName = action.payload.key;
      const validation = selectValidatedFunction(api.getState(), functionName);

      if (action.meta.source === "caseTreeView" || validation.error) return;

      const caseTreeEntry = state.caseTreeView[functionName];
      if (!caseTreeEntry) return;

      const nodesCopy = Object.fromEntries(
        Object.entries(caseTreeEntry.nodes).map(([k, node]) => [
          k,
          copyNode(node),
        ]),
      );
      const caseTreeCopy = { ...caseTreeEntry, nodes: nodesCopy };

      updateCaseTree(caseTreeCopy, action.payload.value);

      return void api.dispatch(
        updateTree({ functionName, tree: caseTreeCopy }),
      );
    }

    for (const [tupleName, view] of Object.entries(caseTrees)) {
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
