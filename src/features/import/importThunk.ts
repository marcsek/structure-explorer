import type { AppDispatch, RootState } from "../../app/store";
import { importFormulasState } from "../formulas/formulasSlice";
import { importLanguageState } from "../language/languageSlice";
import { importStructureState } from "../structure/structureSlice";
import { importTeacherMode } from "../teacherMode/teacherModeslice";
import { importVariablesState } from "../variables/variablesSlice";

export const importAppState =
  (importedState: RootState) => (dispatch: AppDispatch) => {
    dispatch(importFormulasState(JSON.stringify(importedState.formulas)));
    dispatch(importLanguageState(JSON.stringify(importedState.language)));
    dispatch(importStructureState(JSON.stringify(importedState.structure)));
    dispatch(importVariablesState(JSON.stringify(importedState.variables)));
    dispatch(importTeacherMode(JSON.stringify(importedState.teacherMode)));
  };

export const exportAppState =
  () => (_: AppDispatch, getState: () => RootState) => {
    const state = getState();

    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "structure-explorer.json";
    a.click();
    URL.revokeObjectURL(url);
  };
