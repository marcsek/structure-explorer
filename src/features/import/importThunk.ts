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
  updateConstants,
  updateFunctions,
  updatePredicates,
} from "../language/languageSlice";
import { syncMatrixView } from "../matrixView/matrixViewSlice";
import { importStructureState } from "../structure/structureSlice";
import { importTeacherMode } from "../teacherMode/teacherModeslice";
import { importTextViewState } from "../textView/textViewSlice";
import { importVariablesState } from "../variables/variablesSlice";

export interface ImportedAppState
  extends Omit<
    RootState,
    "graphView" | "matrixView" | "databaseView" | "editorToolbar"
  > {
  graphView: Record<string, Record<GraphType, Record<string, XYPosition>>>;
}

export const importAppState =
  (importedState: ImportedAppState, excludeLanguage = false): AppThunk =>
  (dispatch, getState) => {
    if (!excludeLanguage) {
      dispatch(importLanguageState(importedState.language));
      dispatch(importTextViewState(importedState.textView));
    } else {
      // TODO: Just a HACK. Need to rethink how updating of textView is handled
      //       or disable importing while inside language context altogether.
      dispatch(importTextViewState(importedState.textView));
      dispatch(updateConstants(getState().language.constants.value));
      dispatch(
        updatePredicates(
          getState().language.predicates.value.map(([name, arity]) => ({
            name,
            arity,
          })),
        ),
      );
      dispatch(
        updateFunctions(
          getState().language.functions.value.map(([name, arity]) => ({
            name,
            arity,
          })),
        ),
      );
    }

    dispatch(importFormulasState(importedState.formulas));
    dispatch(importStructureState(importedState.structure));
    dispatch(importVariablesState(importedState.variables));
    dispatch(importTeacherMode(importedState.teacherMode));

    const { structure, language } = getState();

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

export const getAppStateToExportJSON = (state: RootState) => {
  return JSON.stringify(
    {
      formulas: state.formulas,
      language: state.language,
      structure: state.structure,
      variables: state.variables,
      teacherMode: state.teacherMode,
      textView: state.textView,
      graphView: getGraphViewStateToExport(state),
    },
    null,
    2,
  );
};
