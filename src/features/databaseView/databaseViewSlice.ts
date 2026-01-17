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
  type TupleType,
} from "../structure/structureSlice";
import type { AppThunk, RootState } from "../../app/store";

export interface DatabaseViewEntry {
  type: TupleType;
  domainTuple: string[][];
}

export type DatabaseViewState = Record<string, DatabaseViewEntry>;

const initialState: DatabaseViewState = {};

type ValueChangedPayload = {
  tupleName: string;
  type: TupleType;
  domainTuple: string[][];
};

export const databaseViewSlice = createSlice({
  name: "databaseView",
  initialState,
  reducers: {
    valueChanged(state, action: PayloadAction<ValueChangedPayload>) {
      const { tupleName, type, domainTuple } = action.payload;

      syncInterpretation(tupleName, type, domainTuple, state);
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
  const entryKey = getKeyByTupleType(type, key);
  const entry = state[entryKey];

  if (entry) entry.domainTuple = newValue;
  else state[entryKey] = { type, domainTuple: newValue };
};

export const { valueChanged, syncDatabaseView } = databaseViewSlice.actions;

export const selectDatabaseViewValues = createSelector(
  [
    selectDomain,
    (state: RootState, key: string, type: TupleType) =>
      state.databaseView[getKeyByTupleType(type, key)],
    (_: RootState, __: string, type: TupleType) => type,
    (_: RootState, __: string, ___: TupleType, arity: number) => arity,
  ],
  (domain, entry, type, arity) => {
    const values = entry?.domainTuple ?? [];
    const databaseValuesDomain = new Set(values.flat());

    const leftovers = [...databaseValuesDomain].filter(
      (element) => !domain.value.includes(element) && element !== "",
    );

    if (type === "predicate") return { values, leftovers };

    const presentTuples = new Map(
      values.map((tuple) => [tuple.slice(0, -1).join(","), tuple]),
    );

    const filledInValues = fillInMissingTuples(
      domain.value,
      arity,
      presentTuples,
    );

    return { values: filledInValues, leftovers };
  },
);

export const updateDatabaseViewValue = ({
  domainTuple,
  type,
  tupleName,
  arity,
}: {
  domainTuple: string[][];
  type: TupleType;
  tupleName: string;
  arity: number;
}): AppThunk => {
  return (dispatch) => {
    const filteredTuples = domainTuple.filter((tuple) =>
      tuple.some((element) => element !== ""),
    );

    dispatch(valueChanged({ type, tupleName, domainTuple: filteredTuples }));

    const validTuples = domainTuple.filter((tuple) =>
      isValidTuple(tuple, arity),
    );

    dispatch(
      updaters[type](
        { value: validTuples, key: tupleName },
        { source: "databaseView" },
      ),
    );
  };
};

const updaters = {
  predicate: updateInterpretationPredicates,
  function: updateFunctionSymbols,
} as const;

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

const getKeyByTupleType = (type: TupleType, key: string) => `${type}-${key}`;

export default databaseViewSlice.reducer;
