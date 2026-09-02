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
  limit: 30,
};

const timeTravelActionTypes: string[] = [
  UndoActionTypes.UNDO,
  UndoActionTypes.REDO,
  UndoActionTypes.JUMP,
  UndoActionTypes.JUMP_TO_PAST,
  UndoActionTypes.JUMP_TO_FUTURE,
];

export type StateComparator<State> = (
  previous: State,
  present: State,
) => boolean;

export interface UndoHistoryConfig<State> {
  isEquivalent: StateComparator<State>;
  pinned: (keyof State)[];
}

export const undoable = <
  State extends object,
  A extends Action = UnknownAction,
>(
  reducer: Reducer<State, A>,
  { isEquivalent, pinned }: UndoHistoryConfig<State>,
) =>
  withPinnedSlices(
    withStateComparator(reduxUndo(reducer, reduxUndoOptions), isEquivalent),
    pinned,
  );

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

const withPinnedSlices =
  <State extends object, A extends Action = UnknownAction>(
    reducer: Reducer<StateWithHistory<State>, A>,
    pinned: (keyof State)[],
  ): Reducer<StateWithHistory<State>, A> =>
  (state, action) => {
    const nextState = reducer(state, action);

    if (state === undefined || !timeTravelActionTypes.includes(action.type))
      return nextState;

    const present = restorePinnedSlices(
      nextState.present,
      state.present,
      pinned,
    );

    if (present === nextState.present) return nextState;

    return { ...nextState, present, _latestUnfiltered: present };
  };

const restorePinnedSlices = <State extends object>(
  target: State,
  source: State,
  pinned: (keyof State)[],
): State => {
  if (pinned.every((key) => target[key] === source[key])) return target;

  return pinned.reduce(
    (restored, key) => ({ ...restored, [key]: source[key] }),
    { ...target },
  );
};
