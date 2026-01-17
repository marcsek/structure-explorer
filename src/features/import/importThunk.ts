import type { XYPosition } from "@xyflow/react";
import type { AppDispatch, AppThunk, RootState } from "../../app/store";
import { syncDatabaseView } from "../databaseView/databaseViewSlice";
import { importFormulasState } from "../formulas/formulasSlice";
import {
  getGraphViewStateToExport,
  syncGraphView,
} from "../graphView/graphs/graphSlice";
import type { GraphType } from "../graphView/graphs/plugins";
import {
  importLanguageState,
  type LanguageState,
} from "../language/languageSlice";
import {
  getRelevantStructureState,
  importStructureState,
  type TupleType,
} from "../structure/structureSlice";
import { importTeacherMode } from "../teacherMode/teacherModeslice";
import { syncTextView } from "../textView/textViewSlice";
import { importVariablesState } from "../variables/variablesSlice";
import type { TextViewSyncEntry } from "../textView/textViews";
import { getStructureTextViewSyncEntries } from "../structure/textViewDescriptors";
import { getLanguageTextViewSyncEntries } from "../language/textViewDescriptors";
import { getVariablesTextViewSyncEntries } from "../variables/textViewDescriptors";

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
    if (excludeLanguage) {
      const relevantSymbols = getRelevantSymbols(getState().language);
      const relevantInputStructure = getRelevantStructureState(
        importedState.structure,
        relevantSymbols,
      );

      dispatch(
        importStructureState({ state: relevantInputStructure, merge: true }),
      );
    } else {
      dispatch(importLanguageState(importedState.language));
      dispatch(importStructureState({ state: importedState.structure }));
    }

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
      structure: getRelevantStructureState(state.structure, relevantSymbols),
      graphView: getGraphViewStateToExport(state, relevantSymbols),
    },
    null,
    2,
  );
};
