import type { RelevantSymbols } from "../import/importExportUtils";
import type { CaseTreeState } from "./caseTreeViewSlice";

export const getRelevantCaseTreeState = (
  state: CaseTreeState,
  relevantSymbols: RelevantSymbols,
) => {
  return Object.fromEntries(
    Object.entries(state).filter(
      ([key]) => relevantSymbols[key]?.type === "function",
    ),
  );
};
