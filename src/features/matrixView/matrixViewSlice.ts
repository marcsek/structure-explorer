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
  type TupleInterpretation,
} from "../structure/structureSlice";
import type { AppThunk, RootState } from "../../app/store";

export interface MatrixViewEntry {
  type: "function" | "predicate";
  values: Record<string, { domainTuple: string[]; value: string }>;
}

export type MatrixViewState = Record<string, MatrixViewEntry>;

const initialState: MatrixViewState = {};

type ValueChangedPayload = {
  tupleName: string;
  type: "function" | "predicate";
  value: string;
  domainTuple: string[];
};

export const matrixViewSlice = createSlice({
  name: "matrixView",
  initialState,
  reducers: {
    valueChanged(state, action: PayloadAction<ValueChangedPayload>) {
      const { tupleName, type, value, domainTuple } = action.payload;

      const entryKey = getKeyByTupleType(type, tupleName);
      const entry = state[entryKey];
      const key = getKeyFromDomainTuple(domainTuple);

      if (entry) entry.values[key] = { value, domainTuple };
      else
        state[entryKey] = { type, values: { [key]: { domainTuple, value } } };
    },

    syncMatrixView(
      state,
      action: PayloadAction<{ structure: StructureState }>,
    ) {
      const { structure } = action.payload;

      const sources = [
        { entries: structure.iP, kind: "predicate" },
        { entries: structure.iF, kind: "function" },
      ] as const;

      for (const { entries, kind } of sources) {
        for (const [key, { value }] of Object.entries(entries)) {
          const newValues = Object.fromEntries(
            value.map((tuple) => createTupleValueEntry(kind, tuple)),
          );

          syncInterpretation(key, kind, newValues, state);
        }
      }
    },
  },

  extraReducers(builder) {
    builder.addCase(updateInterpretationPredicates, (state, action) =>
      handleUpdateInterpretation("predicate")(state, action.payload),
    );

    builder.addCase(updateFunctionSymbols, (state, action) =>
      handleUpdateInterpretation("function")(state, action.payload),
    );
  },
});

type InterpretationPayload = {
  key: string;
  value: TupleInterpretation;
};

const handleUpdateInterpretation =
  (tupleType: MatrixViewEntry["type"]) =>
  (state: MatrixViewState, payload: InterpretationPayload) => {
    const { key, value } = payload;

    const newValues = Object.fromEntries(
      value.map((tuple) => createTupleValueEntry(tupleType, tuple)),
    );

    syncInterpretation(key, tupleType, newValues, state);
  };

const syncInterpretation = (
  key: string,
  tupleType: MatrixViewEntry["type"],
  newValues: MatrixViewEntry["values"],
  state: MatrixViewState,
) => {
  const entryKey = getKeyByTupleType(tupleType, key);
  const entry = state[entryKey];

  if (entry) entry.values = newValues;
  else state[entryKey] = { type: tupleType, values: newValues };
};

export const { valueChanged, syncMatrixView } = matrixViewSlice.actions;

export const selectMatrixValuesWithLeftovers = createSelector(
  [
    selectDomain,
    (state: RootState, key: string, type: MatrixViewEntry["type"]) =>
      state.matrixView[getKeyByTupleType(type, key)],
  ],
  (domain, entry) => {
    if (!entry) return { values: {}, leftovers: [] };

    const { values } = entry;

    const matrixEntryDomain = new Set(
      Object.values(values).flatMap(({ domainTuple }) => domainTuple),
    );

    const leftovers = [...matrixEntryDomain].filter(
      (element) => !domain.value.includes(element),
    );

    return { values, leftovers };
  },
);

export const updateMatrixValue = ({
  domainTuple,
  type,
  tupleName,
  value: newValue,
}: {
  domainTuple: string[];
  type: MatrixViewEntry["type"];
  tupleName: string;
  value: string;
}): AppThunk => {
  return (dispatch, getState) => {
    const entry = getState().matrixView[getKeyByTupleType(type, tupleName)];

    const entryKey = getKeyFromDomainTuple(domainTuple);

    if (type === "predicate") newValue = entry?.values[entryKey] ? "" : "in";

    dispatch(valueChanged({ type, value: newValue, tupleName, domainTuple }));

    const { values: updatedValues } =
      getState().matrixView[getKeyByTupleType(type, tupleName)];

    const newInterpretation = generateTupleInterpretation(type, updatedValues);

    dispatch(updaters[type]({ value: newInterpretation, key: tupleName }));
  };
};

const updaters = {
  predicate: updateInterpretationPredicates,
  function: updateFunctionSymbols,
} as const;

const getKeyByTupleType = (type: MatrixViewEntry["type"], key: string) =>
  `${type}-${key}`;

const createTupleValueEntry = (
  type: MatrixViewEntry["type"],
  tuple: string[],
) => {
  const domainTuple = type === "function" ? tuple.slice(0, -1) : tuple;
  const value = type === "function" ? (tuple.at(-1) ?? "") : "in";

  return [getKeyFromDomainTuple(domainTuple), { domainTuple, value }];
};

const generateTupleInterpretation = (
  type: MatrixViewEntry["type"],
  values: MatrixViewEntry["values"],
) => {
  const interpretation: string[][] = [];
  for (const { domainTuple, value } of Object.values(values)) {
    if (value)
      interpretation.push(
        type === "predicate" ? domainTuple : [...domainTuple, value],
      );
  }

  return interpretation;
};

export const getKeyFromDomainTuple = (domainTuple: string[]) =>
  domainTuple.join("");

export default matrixViewSlice.reducer;
