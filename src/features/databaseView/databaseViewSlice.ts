import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  selectDomain,
  updateFunctionSymbols,
  updateInterpretationPredicates,
} from "../structure/structureSlice";
import type { AppThunk, RootState } from "../../app/store";

export interface DatabaseViewEntry {
  type: "function" | "predicate";
  domainTuple: string[][];
}

export type DatabaseViewState = Record<string, DatabaseViewEntry>;

const initialState: DatabaseViewState = {};

type ValueChangedPayload = {
  tupleName: string;
  type: "function" | "predicate";
  domainTuple: string[][];
};

export const databaseViewSlice = createSlice({
  name: "databaseView",
  initialState,
  reducers: {
    valueChanged(state, action: PayloadAction<ValueChangedPayload>) {
      const { tupleName, type, domainTuple } = action.payload;

      const entryKey = `${type}-${tupleName}`;
      const entry = state[entryKey];

      if (entry) entry.domainTuple = domainTuple;
      else state[entryKey] = { type, domainTuple };
    },
  },

  extraReducers(builder) {
    builder.addCase(updateInterpretationPredicates, (state, action) => {
      if (action.meta.source === "databaseView") return;

      const entryKey = `predicate-${action.payload.key}`;
      const entry = state[entryKey];

      if (entry) entry.domainTuple = action.payload.value;
      else
        state[entryKey] = {
          type: "predicate",
          domainTuple: action.payload.value,
        };
    });

    builder.addCase(updateFunctionSymbols, (state, action) => {
      if (action.meta.source === "databaseView") return;

      const entryKey = `function-${action.payload.key}`;
      const entry = state[entryKey];

      if (entry) entry.domainTuple = action.payload.value;
      else
        state[entryKey] = {
          type: "function",
          domainTuple: action.payload.value,
        };
    });
  },
});

export const { valueChanged } = databaseViewSlice.actions;

export const selectDatabaseViewLeftovers = createSelector(
  [
    selectDomain,
    (state: RootState, key: string, type: "function" | "predicate") =>
      state.databaseView[`${type}-${key}`],
  ],
  (domain, entry) => {
    const matrixEntryDomain = new Set(entry?.domainTuple.flat() ?? []);

    const leftover = [...matrixEntryDomain].filter(
      (x) => !domain.value.includes(x) && x !== "",
    );

    return leftover;
  },
);

export const selectDatabaseViewValues = createSelector(
  [
    selectDomain,
    (_: RootState, __: string, type: DatabaseViewEntry["type"]) => type,
    (state: RootState, key: string, type: DatabaseViewEntry["type"]) =>
      state.databaseView[`${type}-${key}`],
    (_: RootState, __: string, ___: DatabaseViewEntry["type"], arity: number) =>
      arity,
  ],
  (domain, type, entry: DatabaseViewEntry | undefined, arity) => {
    const domainTuple = entry?.domainTuple ?? [];

    if (type === "predicate") return domainTuple;

    if (domainTuple.length === Math.pow(domain.value.length, arity))
      return domainTuple;

    const presentTuples = new Map(
      domainTuple.map((tuple) => [tuple.slice(0, -1).join(","), tuple]),
    );

    const filledInTuples = fillInMissingTuples(
      domain.value,
      arity,
      presentTuples,
    );

    return filledInTuples;
  },
);

export const updateDatabaseViewValue = ({
  domainTuple,
  type,
  tupleName,
}: {
  domainTuple: string[][];
  type: "predicate" | "function";
  tupleName: string;
}): AppThunk => {
  return (dispatch) => {
    const filteredTuples = domainTuple.filter((tuple) =>
      tuple.some((element) => element !== ""),
    );

    dispatch(valueChanged({ type, tupleName, domainTuple: filteredTuples }));

    if (domainTuple.length === 0) return;

    const arity = domainTuple[0].length;

    const validTuples = domainTuple.filter((tuple) =>
      isValidTuple(tuple, arity),
    );

    const updater =
      type === "predicate"
        ? updateInterpretationPredicates
        : updateFunctionSymbols;
    dispatch(
      updater(
        { value: validTuples, key: tupleName },
        { source: "databaseView" },
      ),
    );
  };
};

export const isValidTuple = (tuple: string[], arity: number) =>
  tuple.length === arity && tuple.every((element) => element !== "");

function fillInMissingTuples(
  domain: string[],
  n: number,
  present: Map<string, string[]>,
) {
  const result: string[][] = [];

  function backtrack(path: string[]) {
    if (path.length === n) {
      if (present.has(path.join(",")))
        result.push(present.get(path.join(","))!);
      else result.push([...path, ""]);

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
