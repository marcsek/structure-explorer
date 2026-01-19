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
  type StateWithHistory,
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

export type StateComparator<State> = (
  previous: State,
  present: State,
) => boolean;

export const undoable = <State, A extends Action = UnknownAction>(
  reducer: Reducer<State, A>,
  comparator: StateComparator<State>,
) => withStateComparator(reduxUndo(reducer, reduxUndoOptions), comparator);

const withStateComparator =
  <State, A extends Action = UnknownAction>(
    reducer: Reducer<StateWithHistory<State>, A>,
    comparator: StateComparator<State>,
  ): Reducer<StateWithHistory<State>, A> =>
  (state, action) => {
    if (
      !state ||
      !state._latestUnfiltered ||
      action.type !== UndoActionTypes.CHECKPOINT ||
      !comparator(state._latestUnfiltered, state.present)
    )
      return reducer(state, action);

    return state;
  };
