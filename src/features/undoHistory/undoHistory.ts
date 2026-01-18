import {
  createAction,
  type Action,
  type Reducer,
  type UnknownAction,
} from "@reduxjs/toolkit";
import reduxUndo, {
  ActionTypes as ReduxUndoTypes,
  ActionCreators as ReduxUndoCreators,
  type UndoableOptions,
  includeAction,
} from "redux-undo";

export const UndoActionTypes = {
  ...ReduxUndoTypes,
  CHECKPOINT: "@@structure-explorer/CHECKPOINT",
};

export const UndoActions = {
  ...ReduxUndoCreators,
  checkpoint: createAction(UndoActionTypes.CHECKPOINT),
};

const reduxUndoOptions: UndoableOptions = {
  debug: import.meta.env.DEV,
  filter: includeAction(UndoActionTypes.CHECKPOINT),
};

export const undoable = <State, A extends Action = UnknownAction>(
  reducer: Reducer<State, A>,
) => reduxUndo(reducer, reduxUndoOptions);

// TODO: Figure out if needed
//
// const withCustomLogic =
//   (reducer: Reducer<RootState>): Reducer<RootState> =>
//   (state, action) => {
//     if (!state) return reducer(state, action);
//
//     switch (action.type) {
//       case "REPLACE_PRESENT":
//         return {
//           ...state,
//           _latestUnfiltered: state.present,
//         };
//
//       default:
//         return reducer(state, action);
//     }
//   };
