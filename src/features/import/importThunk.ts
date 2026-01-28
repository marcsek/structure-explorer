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
import { UndoActions } from "../undoHistory/undoHistory";
import {
  SERIALIZED_STATE_VERSION,
  type SerializedAppState,
} from "./validationSchema";
import {
  getRelevantEditorToolbarState,
  importEditorToolbarState,
} from "../editorToolbar/editorToolbarSlice";

export interface ImportedAppState
  extends Omit<
    RootState["present"],
    "graphView" | "matrixView" | "databaseView" | "editorToolbar" | "textView"
  > {
  graphView: Record<
    string,
    Record<GraphType, Record<string, [number, number]>>
  >;
}

export const importAppState =
  (importedState: SerializedAppState, excludeLanguage = false): AppThunk =>
  (dispatch, getState) => {
    if (excludeLanguage) {
      const relevantSymbols = getRelevantSymbols(getState().present.language);
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
    dispatch(importEditorToolbarState(importedState.editorToolbar));

    const { language, structure, variables } = getState().present;

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

    dispatch(UndoActions.clearHistory());
  };

export const exportAppState =
  () => (_: AppDispatch, getState: () => RootState) => {
    const json = JSON.stringify(getAppStateToExport(getState()), null, 2);
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

export const getAppStateToExport = (state: RootState): SerializedAppState => {
  const relevantSymbols = getRelevantSymbols(state.present.language);

  return {
    version: SERIALIZED_STATE_VERSION,
    formulas: state.present.formulas,
    language: state.present.language,
    variables: state.present.variables,
    teacherMode: state.present.teacherMode,
    structure: getRelevantStructureState(
      state.present.structure,
      relevantSymbols,
    ),
    graphView: getGraphViewStateToExport(state, relevantSymbols),
    editorToolbar: getRelevantEditorToolbarState(
      state.present.editorToolbar,
      relevantSymbols,
    ),
  };
};
