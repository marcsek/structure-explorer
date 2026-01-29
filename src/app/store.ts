import {
  combineReducers,
  configureStore,
  type Action,
  type ThunkAction,
} from "@reduxjs/toolkit";
import formulasReducer from "../features/formulas/formulasSlice";
import languageReducer from "../features/language/languageSlice";
import structureReducer from "../features/structure/structureSlice";
import variablesReducer from "../features/variables/variablesSlice";
import teacherModeReducer from "../features/teacherMode/teacherModeslice";
import graphViewReducer from "../features/graphView/graphs/graphSlice";
import textViewReducer from "../features/textView/textViewSlice";
import editorToolbarReducer from "../features/editorToolbar/editorToolbarSlice";
import databaseViewReducer from "../features/databaseView/databaseViewSlice.ts";
import errorAlertReducer from "../features/errorAlert/errorAlertSlice.ts";
import { graphSliceListener } from "../features/graphView/graphs/listeners";
import { undoable } from "../features/undoHistory/undoHistory.ts";

const rootReducer = {
  formulas: formulasReducer,
  language: languageReducer,
  structure: structureReducer,
  variables: variablesReducer,
  teacherMode: teacherModeReducer,
  graphView: graphViewReducer,
  textView: textViewReducer,
  databaseView: databaseViewReducer,
  editorToolbar: editorToolbarReducer,
  errorAlert: errorAlertReducer,
};

const historyEqualityExcludedReducers: RootReducerEntryName[] = [
  "teacherMode",
  "editorToolbar",
];

const comparator = (
  prev: RootStateWithoutHistory,
  next: RootStateWithoutHistory,
) => {
  return (Object.keys(rootReducer) as RootReducerEntryName[])
    .filter((key) => !historyEqualityExcludedReducers.includes(key))
    .every((key) => prev[key] === next[key]);
};

const undoReducer = undoable(combineReducers(rootReducer), comparator);

export const createStore = () =>
  configureStore({
    reducer: undoReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(graphSliceListener.middleware),
  });

export type AppStore = ReturnType<typeof createStore>;
export type AppDispatch = AppStore["dispatch"];
export type AppThunk<ThunkReturnType = void> = ThunkAction<
  ThunkReturnType,
  RootState,
  unknown,
  Action
>;

export type RootState = ReturnType<typeof undoReducer>;
// Exporting RootStateWithoutHistory this way in order to avoid circular dependency.
export type RootStateWithoutHistory = {
  [K in keyof typeof rootReducer]: ReturnType<(typeof rootReducer)[K]>;
};
export type RootReducerEntryName = keyof RootStateWithoutHistory;
