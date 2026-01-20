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
    if (state === undefined || state._latestUnfiltered === undefined)
      return reducer(state, action);

    if (action.type !== UndoActionTypes.CHECKPOINT)
      return reducer(state, action);

    const { present, _latestUnfiltered } = state;

    if (comparator(_latestUnfiltered, present)) return state;

    return reducer(state, action);
  };
