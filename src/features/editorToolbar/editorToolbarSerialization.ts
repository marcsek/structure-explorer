import type { RelevantSymbols } from "../import/importExportUtils.ts";
import { getTupleId } from "../structure/tupleInfo";
import type { EditorToolbarState } from "./editorToolbarSlice.ts";
import type { SerializedEditorToolbarState } from "./validationSchema";

export const getEditorToolbarStateToExport = (
  editorToolbar: EditorToolbarState,
  relevantSymbols: RelevantSymbols,
): SerializedEditorToolbarState => {
  const stateToExport: SerializedEditorToolbarState = {};

  for (const [tupleName, relevantSymbol] of Object.entries(relevantSymbols)) {
    if (relevantSymbol.type === "constant") continue;

    const tupleId = getTupleId({ type: relevantSymbol.type, name: tupleName });
    const toolbarEntry = editorToolbar[tupleId];

    if (!toolbarEntry) continue;

    const { openedEditor, selectedUnary, unaryFilterDomain, deselectedDomain } =
      toolbarEntry;

    stateToExport[tupleId] = {
      openedEditor,
      selectedUnary,
      unaryFilterDomain,
      deselectedDomain,
    };
  }

  return stateToExport;
};
