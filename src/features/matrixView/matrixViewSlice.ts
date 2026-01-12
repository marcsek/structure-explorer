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

      const entryKey = `${type}-${tupleName}`;
      const entry = state[entryKey];
      const key = getKeyFromDomainTuple(domainTuple);

      if (entry) entry.values[key] = { value, domainTuple };
      else
        state[entryKey] = {
          type,
          values: { [key]: { domainTuple, value } },
        };
    },

    syncMatrixView(
      state,
      action: PayloadAction<{ structure: StructureState }>,
    ) {
      const { structure } = action.payload;

      for (const [key, { value }] of Object.entries(structure.iP)) {
        const newValues = Object.fromEntries(
          value.map((tuple) => [
            getKeyFromDomainTuple(tuple),
            { domainTuple: tuple, value: "in" },
          ]),
        );

        syncInterpretation(key, "predicate", newValues, state);
      }

      for (const [key, { value }] of Object.entries(structure.iF)) {
        const newValues = Object.fromEntries(
          value.map((tuple) => [
            getKeyFromDomainTuple(tuple.slice(0, -1)),
            { domainTuple: tuple.slice(0, -1), value: tuple.at(-1) ?? "" },
          ]),
        );

        syncInterpretation(key, "function", newValues, state);
      }
    },
  },

  extraReducers(builder) {
    builder.addCase(updateInterpretationPredicates, (state, action) => {
      const { key, value } = action.payload;

      const newValues = Object.fromEntries(
        value.map((tuple) => [
          getKeyFromDomainTuple(tuple),
          { domainTuple: tuple, value: "in" },
        ]),
      );

      syncInterpretation(key, "predicate", newValues, state);
    });

    builder.addCase(updateFunctionSymbols, (state, action) => {
      const { key, value } = action.payload;

      const newValues = Object.fromEntries(
        value.map((tuple) => [
          getKeyFromDomainTuple(tuple.slice(0, -1)),
          { domainTuple: tuple.slice(0, -1), value: tuple.at(-1) ?? "" },
        ]),
      );

      syncInterpretation(key, "function", newValues, state);
    });
  },
});

const syncInterpretation = (
  key: string,
  type: MatrixViewEntry["type"],
  newValues: MatrixViewEntry["values"],
  state: MatrixViewState,
) => {
  const entryKey = `${type}-${key}`;
  const entry = state[entryKey];

  if (entry) entry.values = newValues;
  else state[entryKey] = { type, values: newValues };
};

export const { valueChanged, syncMatrixView } = matrixViewSlice.actions;

export const selectMatrixLeftovers = createSelector(
  [
    selectDomain,
    (state: RootState, key: string, type: "function" | "predicate") =>
      state.matrixView[`${type}-${key}`],
  ],
  (domain, entry) => {
    const matrixEntryDomain = new Set(
      Object.values(entry?.values ?? []).flatMap(
        ({ domainTuple }) => domainTuple,
      ),
    );

    const leftover = [...matrixEntryDomain].filter(
      (x) => !domain.value.includes(x),
    );

    return leftover;
  },
);

export const selectMatrixValues = createSelector(
  [
    (state: RootState, key: string, type: MatrixViewEntry["type"]) =>
      state.matrixView[`${type}-${key}`],
  ],
  (entry: MatrixViewEntry | undefined) => {
    return entry?.values ?? {};
  },
);

export const updateMatrixValue = ({
  domainTuple,
  type,
  tupleName,
  value,
}: {
  domainTuple: string[];
  type: "predicate" | "function";
  tupleName: string;
  value?: string;
}): AppThunk => {
  return (dispatch, getState) => {
    let entry = getState().matrixView[`${type}-${tupleName}`];

    const entryKey = getKeyFromDomainTuple(domainTuple);

    let newValue = value ?? "";
    if (type === "predicate") newValue = entry?.values[entryKey] ? "" : "in";

    dispatch(valueChanged({ type, value: newValue, tupleName, domainTuple }));

    entry = getState().matrixView[`${type}-${tupleName}`];

    const newInterpretation: string[][] = [];
    for (const value of Object.values(entry.values)) {
      if (value.value)
        newInterpretation.push(
          type === "predicate"
            ? value.domainTuple
            : [...value.domainTuple, value.value],
        );
    }

    const updater =
      type === "predicate"
        ? updateInterpretationPredicates
        : updateFunctionSymbols;

    dispatch(updater({ value: newInterpretation, key: tupleName }));
  };
};

export const getKeyFromDomainTuple = (domainTuple: string[]) =>
  domainTuple.join("");

export default matrixViewSlice.reducer;
