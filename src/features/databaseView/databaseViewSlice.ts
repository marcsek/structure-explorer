import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  selectDomain,
  updateFunctionSymbols,
  updateInterpretationPredicates,
  type StructureState,
} from "../structure/structureSlice";
import { UndoActions } from "../undoHistory/undoHistory";
import { getTupleId, getTupleLength } from "../structure/tupleInfo";
import type { AppThunk, RootState } from "../../app/store";
import type { TupleInfo, TupleType } from "../structure/tupleInfo";
import type { DomainTuple } from "../structure/domainTuple";

export interface DatabaseViewEntry {
  type: TupleType;
  domainTuple: DomainTuple[];
}

export type DatabaseViewState = Record<string, DatabaseViewEntry>;

const initialState: DatabaseViewState = {};

type ValueChangedPayload = {
  tupleInfo: TupleInfo;
  domainTuple: DomainTuple[];
};

export const databaseViewSlice = createSlice({
  name: "databaseView",
  initialState,
  reducers: {
    valueChanged(state, action: PayloadAction<ValueChangedPayload>) {
      const {
        tupleInfo: { name, type },
        domainTuple,
      } = action.payload;

      syncInterpretation(name, type, domainTuple, state);
    },

    syncDatabaseView(
      state,
      action: PayloadAction<{ structure: StructureState }>,
    ) {
      const { structure } = action.payload;

      const entries = [
        ["predicate", structure.iP],
        ["function", structure.iF],
      ] as const;

      for (const [intrType, intrState] of entries)
        for (const [key, { value }] of Object.entries(intrState))
          syncInterpretation(key, intrType, value, state);
    },
  },

  // This is done even for tuples with arities that aren't supported (and that's fine).
  extraReducers(builder) {
    builder.addCase(updateInterpretationPredicates, (state, action) => {
      if (action.meta.source === "databaseView") return;

      const { key, value } = action.payload;
      syncInterpretation(key, "predicate", value, state);
    });

    builder.addCase(updateFunctionSymbols, (state, action) => {
      if (action.meta.source === "databaseView") return;

      const { key, value } = action.payload;
      syncInterpretation(key, "function", value, state);
    });
  },
});

const syncInterpretation = (
  key: string,
  type: TupleType,
  newValue: DatabaseViewEntry["domainTuple"],
  state: DatabaseViewState,
) => {
  const entryKey = getTupleId({ type, name: key });
  const entry = state[entryKey];

  if (entry) entry.domainTuple = newValue;
  else state[entryKey] = { type, domainTuple: newValue };
};

export const { valueChanged, syncDatabaseView } = databaseViewSlice.actions;

export const updateDatabaseViewValue = ({
  domainTuple,
  tupleInfo,
}: {
  domainTuple: DomainTuple[];
  tupleInfo: TupleInfo;
}): AppThunk => {
  return (dispatch) => {
    const { type, name, arity } = tupleInfo;

    const nonEmptyTuples = domainTuple.filter(isNonEmptyTuple);
    dispatch(valueChanged({ tupleInfo, domainTuple: nonEmptyTuples }));

    const validTuples = domainTuple.filter((tuple) =>
      isValidTuple(tuple, arity),
    );

    dispatch(
      updaters[type](
        { value: validTuples, key: name },
        { source: "databaseView" },
      ),
    );
  };
};

const updaters = {
  predicate: updateInterpretationPredicates,
  function: updateFunctionSymbols,
} as const;

export const isNonEmptyTuple = (tuple: string[]) =>
  tuple.some((element) => element !== "");

export const isValidTuple = (tuple: string[], arity: number) =>
  tuple.length === arity && tuple.every((element) => element !== "");

export type DatabaseRowState = {
  duplicate: boolean;
  isLast: boolean;
};

export type DatabaseCellState = {
  value: string;
  leftover: boolean;
  invalid: boolean;
  readOnly: boolean;
  showIndicator: boolean;
};

const noTuples: DomainTuple[] = [];

const selectDatabaseRawTuples = (
  state: RootState,
  tupleInfo: TupleInfo,
): DomainTuple[] =>
  state.present.databaseView[getTupleId(tupleInfo)]?.domainTuple ?? noTuples;

const selectDatabaseLeftovers = createSelector(
  [selectDomain, selectDatabaseRawTuples],
  (domain, tuples) => {
    const inDomain = new Set(domain.value);
    const leftovers = new Set<string>();

    for (const tuple of tuples)
      for (const element of tuple)
        if (element !== "" && !inDomain.has(element)) leftovers.add(element);

    return leftovers;
  },
);

const selectDatabaseTuples = createSelector(
  [
    selectDomain,
    selectDatabaseRawTuples,
    selectDatabaseLeftovers,
    (_: RootState, { type }: TupleInfo) => type,
    (_: RootState, { arity }: TupleInfo) => arity,
  ],
  (domain, tuples, leftovers, type, arity) => {
    if (type === "predicate") return tuples;

    const presentTuples = new Map(
      tuples.map((tuple) => [tuple.slice(0, -1).join(","), tuple]),
    );

    const containingLeftoverTuples = tuples.filter(
      (tuple) =>
        tuple.slice(0, -1).some((element) => leftovers.has(element)) &&
        tuple.at(-1) !== "",
    );

    return [
      ...containingLeftoverTuples,
      ...fillInMissingTuples(domain.value, arity, presentTuples),
    ];
  },
);

const selectDatabaseDuplicateRows = createSelector(
  [selectDatabaseTuples],
  (tuples) => {
    const seen = new Map<string, number>();
    const duplicates = new Set<number>();

    tuples.forEach((tuple, idx) => {
      if (tuple.includes("")) return;

      const key = tuple.join(",");
      const firstIdx = seen.get(key);

      if (firstIdx === undefined) seen.set(key, idx);
      else duplicates.add(firstIdx).add(idx);
    });

    return duplicates;
  },
);

const selectDatabaseHasDraftRow = (state: RootState, tupleInfo: TupleInfo) => {
  const { type, arity } = tupleInfo;
  const tuples = selectDatabaseTuples(state, tupleInfo);

  return (
    type !== "function" &&
    (tuples.length === 0 || isValidTuple(tuples.at(-1)!, arity))
  );
};

export const selectDatabaseRowCount = (
  state: RootState,
  tupleInfo: TupleInfo,
) =>
  selectDatabaseTuples(state, tupleInfo).length +
  (selectDatabaseHasDraftRow(state, tupleInfo) ? 1 : 0);

export const selectDatabaseIsEmpty = (state: RootState, tupleInfo: TupleInfo) =>
  selectDomain(state).value.length === 0 &&
  selectDatabaseTuples(state, tupleInfo).length === 0;

const selectDatabaseTuple = (
  state: RootState,
  tupleInfo: TupleInfo,
  rowIdx: number,
): DomainTuple =>
  selectDatabaseTuples(state, tupleInfo)[rowIdx] ?? emptyTuple(tupleInfo.arity);

export const selectDatabaseRow = (
  state: RootState,
  tupleInfo: TupleInfo,
  rowIdx: number,
): DatabaseRowState => ({
  duplicate: selectDatabaseDuplicateRows(state, tupleInfo).has(rowIdx),
  isLast: rowIdx === selectDatabaseRowCount(state, tupleInfo) - 1,
});

export const selectDatabaseCell = (
  state: RootState,
  tupleInfo: TupleInfo,
  rowIdx: number,
  colIdx: number,
): DatabaseCellState => {
  const { type, arity } = tupleInfo;

  const value = selectDatabaseTuple(state, tupleInfo, rowIdx)[colIdx] ?? "";
  const leftover = selectDatabaseLeftovers(state, tupleInfo).has(value);
  const duplicate = selectDatabaseDuplicateRows(state, tupleInfo).has(rowIdx);
  const isLast = rowIdx === selectDatabaseRowCount(state, tupleInfo) - 1;

  return {
    value,
    leftover,
    invalid: leftover || duplicate,
    readOnly: type === "function" && colIdx !== getTupleLength(type, arity) - 1,
    showIndicator: !isLast || type === "function",
  };
};

type DatabaseRowIdentity = {
  tupleInfo: TupleInfo;
  rowIdx: number;
};

export const databaseCellChanged = ({
  tupleInfo,
  rowIdx,
  colIdx,
  value,
}: DatabaseRowIdentity & {
  colIdx: number;
  value: string;
}): AppThunk<boolean | null> => {
  return (dispatch, getState) => {
    const tuples = selectDatabaseTuples(getState(), tupleInfo);

    let newTuples: DomainTuple[];
    let checkpointOnBlur: boolean | null = null;

    if (rowIdx >= tuples.length) {
      const draftTuple = emptyTuple(tupleInfo.arity);
      draftTuple[colIdx] = value;

      newTuples = [...tuples, draftTuple];
    } else {
      const newTuple = [...tuples[rowIdx]];
      newTuple[colIdx] = value;

      if (countEmpty(newTuple) === 1 && countEmpty(tuples[rowIdx]) === 0)
        checkpointOnBlur = true;
      else if (newTuple.every((element) => element === ""))
        checkpointOnBlur = false;

      newTuples = [...tuples];
      newTuples[rowIdx] = newTuple;
    }

    dispatch(
      updateDatabaseViewValue({
        tupleInfo: withTupleLength(tupleInfo),
        domainTuple: newTuples,
      }),
    );

    return checkpointOnBlur;
  };
};

export const databaseCellBlurred = ({
  tupleInfo,
  rowIdx,
  checkpointOnBlur,
}: DatabaseRowIdentity & {
  checkpointOnBlur: boolean | null;
}): AppThunk => {
  return (dispatch, getState) => {
    if (tupleInfo.type === "function") {
      dispatch(UndoActions.checkpoint());
      return;
    }

    if (checkpointOnBlur !== null) {
      if (checkpointOnBlur) dispatch(UndoActions.checkpoint());
      return;
    }

    const tuple = selectDatabaseTuple(getState(), tupleInfo, rowIdx);

    if (isValidTuple(tuple, tupleInfo.arity))
      dispatch(UndoActions.checkpoint());
  };
};

export const databaseTupleDeleted = ({
  tupleInfo,
  rowIdx,
}: DatabaseRowIdentity): AppThunk => {
  return (dispatch, getState) => {
    const tuples = selectDatabaseTuples(getState(), tupleInfo);

    dispatch(
      updateDatabaseViewValue({
        tupleInfo: withTupleLength(tupleInfo),
        domainTuple: tuples.filter((_, idx) => idx !== rowIdx),
      }),
    );

    if (tuples[rowIdx].every((element) => element !== ""))
      dispatch(UndoActions.checkpoint());
  };
};

const withTupleLength = ({ type, name, arity }: TupleInfo): TupleInfo => ({
  type,
  name,
  arity: getTupleLength(type, arity),
});

const emptyTuple = (arity: number): DomainTuple =>
  Array.from({ length: arity }, () => "");

const countEmpty = (tuple: DomainTuple) =>
  tuple.filter((element) => element === "").length;

function fillInMissingTuples(
  domain: string[],
  n: number,
  present: Map<string, DomainTuple>,
) {
  const result: DomainTuple[] = [];

  function backtrack(path: string[]) {
    if (path.length === n) {
      const key = path.join(",");

      result.push(present.get(key) ?? [...path, ""]);

      return;
    }

    for (let i = 0; i < domain.length; i++) {
      path.push(domain[i]);
      backtrack(path);
      path.pop();
    }
  }

  backtrack([]);
  return result;
}

export default databaseViewSlice.reducer;
