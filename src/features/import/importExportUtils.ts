import type { AppDispatch, AppThunk, RootState } from "../../app/store";
import { syncDatabaseView } from "../databaseView/databaseViewSlice";
import { importFormulasState } from "../formulas/formulasSlice";
import { syncGraphView } from "../graphView/graphViewSlice";
import { getGraphViewStateToExport } from "../graphView/graphViewSerialization";
import type { GraphType } from "../graphView/graphs/registry";
import {
  getUnarySymbolNames,
  importLanguageState,
  type LanguageState,
} from "../language/languageSlice";
import { importStructureState } from "../structure/structureSlice";
import { getRelevantStructureState } from "../structure/structureSerialization";
import type { TupleType } from "../structure/tupleInfo";
import { importTeacherMode } from "../teacherMode/teacherModeSlice";
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
import { importEditorToolbarState } from "../editorToolbar/editorToolbarSlice";
import { getEditorToolbarStateToExport } from "../editorToolbar/editorToolbarSerialization";
import { importQueriesState } from "../queries/queriesSlice";
import { getQueriesStateToExport } from "../queries/queriesSerialization";
import { importCaseTreeViewState } from "../caseTreeView/caseTreeViewSlice";
import { getCaseTreeStateToExport } from "../caseTreeView/caseTreeViewSerialization";

export interface ImportedAppState extends Omit<
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

    // Mind the order
    dispatch(importVariablesState(importedState.variables));
    dispatch(importTeacherMode(importedState.teacherMode));
    dispatch(importFormulasState(importedState.formulas));
    dispatch(importQueriesState(importedState.queries));

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
        overwrite: true,
      }),
    );
    dispatch(importCaseTreeViewState(importedState.caseTreeView));

    // Needs to be last so it doesn't open uninitialized editor
    dispatch(
      importEditorToolbarState({
        state: importedState.editorToolbar,
        unaryPredicates: getUnarySymbolNames(language.predicates.value),
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
  const symbols: RelevantSymbols = {};

  const addSymbol = (key: string, value: RelevantSymbols[string]) => {
    if (key in symbols) {
      console.warn(
        `Found duplicate symbol name: "${key}" while exporting Structure Explorer state`,
      );
    }
    symbols[key] = value;
  };

  language.constants.value.forEach((cnst) =>
    addSymbol(cnst, { type: "constant" }),
  );
  language.predicates.value.forEach(([key, arity]) =>
    addSymbol(key, { type: "predicate", arity }),
  );
  language.functions.value.forEach(([key, arity]) =>
    addSymbol(key, { type: "function", arity }),
  );

  return symbols;
};

export const getAppStateToExport = (state: RootState): SerializedAppState => {
  const relevantSymbols = getRelevantSymbols(state.present.language);

  return {
    version: SERIALIZED_STATE_VERSION,
    formulas: state.present.formulas,
    queries: getQueriesStateToExport(state.present.queries),
    language: state.present.language,
    variables: state.present.variables,
    teacherMode: state.present.teacherMode,
    structure: getRelevantStructureState(
      state.present.structure,
      relevantSymbols,
    ),
    graphView: getGraphViewStateToExport(
      state.present.graphView,
      relevantSymbols,
    ),
    editorToolbar: getEditorToolbarStateToExport(
      state.present.editorToolbar,
      relevantSymbols,
    ),
    caseTreeView: getCaseTreeStateToExport(
      state.present.caseTreeView,
      relevantSymbols,
    ),
  };
};
