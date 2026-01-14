import type { XYPosition } from "@xyflow/react";
import type { AppDispatch, AppThunk, RootState } from "../../app/store";
import { syncDatabaseView } from "../databaseView/databaseViewSlice";
import { importFormulasState } from "../formulas/formulasSlice";
import {
  getGraphViewStateToExport,
  syncGraphView,
  type TupleType,
} from "../graphView/graphs/graphSlice";
import type { GraphType } from "../graphView/graphs/plugins";
import {
  getLanguageTextViewSyncEntries,
  importLanguageState,
  type LanguageState,
} from "../language/languageSlice";
import { syncMatrixView } from "../matrixView/matrixViewSlice";
import {
  getStructureStateToExport,
  getStructureTextViewSyncEntries,
  importStructureState,
} from "../structure/structureSlice";
import { importTeacherMode } from "../teacherMode/teacherModeslice";
import { syncTextView } from "../textView/textViewSlice";
import {
  getVariablesTextViewSyncEntries,
  importVariablesState,
} from "../variables/variablesSlice";
import type { TextViewSyncEntry } from "../textView/textViews";

export interface ImportedAppState
  extends Omit<
    RootState,
    "graphView" | "matrixView" | "databaseView" | "editorToolbar" | "textView"
  > {
  graphView: Record<string, Record<GraphType, Record<string, XYPosition>>>;
}

export const importAppState =
  (importedState: ImportedAppState, excludeLanguage = false): AppThunk =>
  (dispatch, getState) => {
    if (!excludeLanguage) dispatch(importLanguageState(importedState.language));

    const relevantSymbols = getRelevantSymbols(getState().language);

    dispatch(
      importStructureState(
        getStructureStateToExport(importedState.structure, relevantSymbols),
      ),
    );
    dispatch(importFormulasState(importedState.formulas));
    dispatch(importVariablesState(importedState.variables));
    dispatch(importTeacherMode(importedState.teacherMode));

    const { language, structure, variables } = getState();

    const textViewSyncEntries: TextViewSyncEntry[] = [
      ...getLanguageTextViewSyncEntries(language),
      ...getStructureTextViewSyncEntries(structure),
      ...getVariablesTextViewSyncEntries(variables),
    ];

    dispatch(syncTextView(textViewSyncEntries));
    dispatch(syncMatrixView({ structure }));
    dispatch(syncDatabaseView({ structure }));
    dispatch(
      syncGraphView({
        structure,
        language,
        positions: importedState.graphView,
      }),
    );
  };

export const exportAppState =
  () => (_: AppDispatch, getState: () => RootState) => {
    const json = getAppStateToExportJSON(getState());
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const downloadLink = document.createElement("a");

    downloadLink.href = url;
    downloadLink.download = "structure-explorer.json";
    downloadLink.click();

    URL.revokeObjectURL(url);
  };

export type RelevantSymbols = Record<
  string,
  { type: TupleType; arity: number } | { type: "constant" }
>;

const getRelevantSymbols = (language: LanguageState): RelevantSymbols => {
  return {
    ...Object.fromEntries(
      language.constants.value.map((cnst) => [cnst, { type: "constant" }]),
    ),
    ...Object.fromEntries(
      language.predicates.value.map(([key, arity]) => [
        key,
        { type: "predicate", arity },
      ]),
    ),
    ...Object.fromEntries(
      language.functions.value.map(([key, arity]) => [
        key,
        { type: "function", arity },
      ]),
    ),
  };
};

export const getAppStateToExportJSON = (state: RootState) => {
  const relevantSymbols = getRelevantSymbols(state.language);

  return JSON.stringify(
    {
      formulas: state.formulas,
      language: state.language,
      variables: state.variables,
      teacherMode: state.teacherMode,
      structure: getStructureStateToExport(state.structure, relevantSymbols),
      graphView: getGraphViewStateToExport(state, relevantSymbols),
    },
    null,
    2,
  );
};
