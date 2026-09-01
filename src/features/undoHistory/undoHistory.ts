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
import type {
  RootReducerEntryName,
  RootStateWithoutHistory,
} from "../../app/store";

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

export interface UndoHistoryConfig {
  equalityExcluded: RootReducerEntryName[];
  pinned: RootReducerEntryName[];
}

export const undoable = <A extends Action = UnknownAction>(
  reducer: Reducer<RootStateWithoutHistory, A>,
  { equalityExcluded, pinned }: UndoHistoryConfig,
) =>
  withPinnedSlices(
    withStateComparator(reduxUndo(reducer, reduxUndoOptions), equalityExcluded),
    pinned,
  );

const isHistoryEquivalent = (
  previous: RootStateWithoutHistory,
  present: RootStateWithoutHistory,
  equalityExcluded: RootReducerEntryName[],
) =>
  (Object.keys(previous) as RootReducerEntryName[])
    .filter((key) => !equalityExcluded.includes(key))
    .every((key) => previous[key] === present[key]);

const withStateComparator =
  <A extends Action = UnknownAction>(
    reducer: Reducer<StateWithHistory<RootStateWithoutHistory>, A>,
    equalityExcluded: RootReducerEntryName[],
  ): Reducer<StateWithHistory<RootStateWithoutHistory>, A> =>
  (state, action) => {
    if (state === undefined || state._latestUnfiltered === undefined)
      return reducer(state, action);

    if (action.type !== UndoActionTypes.CHECKPOINT)
      return reducer(state, action);

    const { present, _latestUnfiltered } = state;

    if (isHistoryEquivalent(_latestUnfiltered, present, equalityExcluded))
      return state;

    return reducer(state, action);
  };

const withPinnedSlices =
  <A extends Action = UnknownAction>(
    reducer: Reducer<StateWithHistory<RootStateWithoutHistory>, A>,
    pinned: RootReducerEntryName[],
  ): Reducer<StateWithHistory<RootStateWithoutHistory>, A> =>
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

const restorePinnedSlices = (
  target: RootStateWithoutHistory,
  source: RootStateWithoutHistory,
  pinned: RootReducerEntryName[],
): RootStateWithoutHistory => {
  if (pinned.every((key) => target[key] === source[key])) return target;

  return pinned.reduce(
    (restored, key) => ({ ...restored, [key]: source[key] }),
    { ...target },
  );
};
