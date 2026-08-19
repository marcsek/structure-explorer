import type { RelevantSymbols } from "../import/importExportUtils.ts";
import type { StructureState } from "./structureSlice";

const filterRelevantSymbolsByType = <T>(
  record: Record<string, T>,
  relevantSymbols: RelevantSymbols,
  type: RelevantSymbols[string]["type"],
): Record<string, T> =>
  Object.fromEntries(
    Object.entries(record).filter(
      ([key]) => relevantSymbols[key]?.type === type,
    ),
  );

export const getRelevantStructureState = (
  structure: StructureState,
  relevantSymbols: RelevantSymbols,
): StructureState => ({
  ...structure,
  iC: filterRelevantSymbolsByType(structure.iC, relevantSymbols, "constant"),
  iP: filterRelevantSymbolsByType(structure.iP, relevantSymbols, "predicate"),
  iF: filterRelevantSymbolsByType(structure.iF, relevantSymbols, "function"),
});
