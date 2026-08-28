import { createSelector } from "@reduxjs/toolkit";
import { shallowEqual } from "react-redux";
import {
  selectDomain,
  selectTupleInterpretation,
  selectTupleLock,
  updateFunctionSymbols,
  updateInterpretationPredicates,
} from "../structure/structureSlice";
import {
  selectFilteredDomain,
  selectHatchedDomain,
} from "../editorToolbar/editorToolbarSlice";
import { UndoActions } from "../undoHistory/undoHistory";
import type { AppThunk, RootState } from "../../app/store";
import type { TupleInfo, TupleType } from "../structure/tupleInfo";
import { domainTupleKey, type DomainTuple } from "../structure/domainTuple";

export type MatrixViewValues = Record<
  string,
  { domainTuple: DomainTuple; value: string; duplicate?: boolean }
>;

export type MatrixAxisFlags = {
  leftover: boolean;
  hatched: boolean;
  unselected: boolean;
};

export type MatrixCellState = {
  value: string;
  columnError: boolean;
  unselected: boolean;
  hatched: boolean;
  invalid: boolean;
};

const noAxisFlags: MatrixAxisFlags = {
  leftover: false,
  hatched: false,
  unselected: false,
};

const unaryRows = [""];

export const selectMatrixValues = createSelector(
  [
    (state: RootState, { name, type }: TupleInfo) =>
      selectTupleInterpretation(state, name, type)?.value,
    (_: RootState, { type }: TupleInfo) => type,
  ],
  (interpretation, tupleType) => {
    const values: MatrixViewValues = {};

    if (!interpretation) return values;

    const seenTuples = new Set<string>();

    for (const tuple of interpretation) {
      const [key, value] = createTupleValueEntry(tupleType, tuple);

      if (!seenTuples.has(key)) {
        seenTuples.add(key);
        values[key] = value;
        continue;
      }

      const [dupKey, dupValue] = createTupleValueEntry(tupleType, tuple, true);
      values[key] = { ...value, duplicate: true };
      values[dupKey] = dupValue;
    }

    return values;
  },
);

export const selectMatrixLeftovers = createSelector(
  [selectDomain, selectMatrixValues],
  (domain, values) => {
    const inDomain = new Set(domain.value);
    const seen = new Set<string>();
    const leftovers: string[] = [];

    for (const { domainTuple } of Object.values(values))
      for (const element of domainTuple) {
        if (inDomain.has(element) || seen.has(element)) continue;

        seen.add(element);
        leftovers.push(element);
      }

    return leftovers;
  },
  { memoizeOptions: { resultEqualityCheck: shallowEqual } },
);

const selectMatrixSelectedDomain = (state: RootState, tupleInfo: TupleInfo) =>
  selectFilteredDomain(state, tupleInfo, true);

const selectDomainElements = createSelector(
  [selectDomain],
  (domain) => new Set(domain.value),
);

export const selectMatrixAxisFlags = createSelector(
  [
    selectDomain,
    selectMatrixLeftovers,
    selectMatrixSelectedDomain,
    selectHatchedDomain,
  ],
  (domain, leftovers, selectedDomain, hatchedDomain) => {
    const selected = new Set(selectedDomain);
    const hatched = new Set(hatchedDomain);

    const flags = new Map<string, MatrixAxisFlags>();

    for (const element of domain.value)
      flags.set(element, {
        leftover: false,
        hatched: hatched.has(element),
        unselected: !selected.has(element) && !hatched.has(element),
      });

    for (const element of leftovers)
      flags.set(element, { leftover: true, hatched: false, unselected: false });

    return flags;
  },
);

export const selectMatrixOrderedColumns = createSelector(
  [selectDomain, selectMatrixLeftovers, selectMatrixAxisFlags],
  (domain, leftovers, flags) => {
    const selected: string[] = [];
    const unselected: string[] = [];

    for (const element of domain.value)
      (flags.get(element)?.unselected ? unselected : selected).push(element);

    return [...selected, ...leftovers, ...unselected];
  },
);

export const selectMatrixOrderedRows = (
  state: RootState,
  tupleInfo: TupleInfo,
) =>
  tupleInfo.arity === 1
    ? unaryRows
    : selectMatrixOrderedColumns(state, tupleInfo);

export const selectMatrixIsEmpty = createSelector(
  [selectMatrixOrderedColumns, selectMatrixAxisFlags],
  (columns, flags) =>
    columns.every((element) => flags.get(element)?.unselected ?? true),
);

export const selectMatrixAxisClass = (
  state: RootState,
  tupleInfo: TupleInfo,
  element: string,
) => {
  const { leftover, hatched, unselected } =
    selectMatrixAxisFlags(state, tupleInfo).get(element) ?? noAxisFlags;

  if (leftover) return "error";
  if (hatched) return "hatched";

  return unselected ? "unselected" : "";
};

export const selectMatrixCell = (
  state: RootState,
  tupleInfo: TupleInfo,
  row: string,
  col: string,
): MatrixCellState => {
  const key = getKeyFromDomainTuple(getDomainTuple(tupleInfo, row, col));
  const entry = selectMatrixValues(state, tupleInfo)[key];

  const flags = selectMatrixAxisFlags(state, tupleInfo);
  const rowFlags = flags.get(row) ?? noAxisFlags;
  const colFlags = flags.get(col) ?? noAxisFlags;

  const value = entry?.value ?? "";
  const outsideDomain =
    tupleInfo.type === "function" &&
    !!value &&
    !selectDomainElements(state).has(value);

  return {
    value,
    columnError: colFlags.leftover,
    unselected: rowFlags.unselected || colFlags.unselected,
    hatched: rowFlags.hatched || colFlags.hatched,
    invalid:
      outsideDomain ||
      rowFlags.leftover ||
      colFlags.leftover ||
      !!entry?.duplicate,
  };
};

type MatrixCellIdentity = {
  tupleInfo: TupleInfo;
  row: string;
  col: string;
};

export const matrixCellChanged = ({
  tupleInfo,
  row,
  col,
  value,
}: MatrixCellIdentity & { value: string }): AppThunk => {
  return (dispatch, getState) => {
    const state = getState();

    if (selectTupleLock(state, tupleInfo)) return;

    const { type, name } = tupleInfo;
    const values = selectMatrixValues(state, tupleInfo);
    const flags = selectMatrixAxisFlags(state, tupleInfo);

    const domainTuple = getDomainTuple(tupleInfo, row, col);
    const key = getKeyFromDomainTuple(domainTuple);
    const newValues = { ...values };

    const hasDuplicate = newValues[key]?.duplicate;
    newValues[key] = {
      ...(newValues[key] ?? { duplicate: false, domainTuple }),
      value,
    };

    if (hasDuplicate) {
      const duplicateKey = getKeyFromDomainTuple(domainTuple, true);
      newValues[duplicateKey] = { ...newValues[duplicateKey], value };
    }

    const newInterpretation = generateTupleInterpretation(type, newValues);

    dispatch(updaters[type]({ value: newInterpretation, key: name }));

    const isInsideLeftover = domainTuple.some(
      (element) => flags.get(element)?.leftover,
    );
    const willBeResolvedInvalid =
      (isInsideLeftover || hasDuplicate) && value === "";

    if (type === "function" && willBeResolvedInvalid)
      dispatch(UndoActions.checkpoint());
  };
};

export const matrixCellToggled = ({
  tupleInfo,
  row,
  col,
}: MatrixCellIdentity): AppThunk => {
  return (dispatch, getState) => {
    const { value } = selectMatrixCell(getState(), tupleInfo, row, col);

    dispatch(
      matrixCellChanged({ tupleInfo, row, col, value: value ? "" : "in" }),
    );
    dispatch(UndoActions.checkpoint());
  };
};

const updaters = {
  predicate: updateInterpretationPredicates,
  function: updateFunctionSymbols,
} as const;

const createTupleValueEntry = (
  type: TupleType,
  tuple: string[],
  isDuplicate: boolean = false,
) => {
  const domainTuple = [...(type === "function" ? tuple.slice(0, -1) : tuple)];
  const value = type === "function" ? (tuple.at(-1) ?? "") : "in";

  let key = getKeyFromDomainTuple(domainTuple);
  if (isDuplicate) key = `${key}-d`;

  return [key, { domainTuple, value, duplicate: isDuplicate }] as const;
};

export const generateTupleInterpretation = (
  type: TupleType,
  values: MatrixViewValues,
) => {
  const interpretation: string[][] = [];
  for (const { domainTuple, value } of Object.values(values)) {
    if (!value) continue;
    interpretation.push(
      type === "predicate" ? domainTuple : [...domainTuple, value],
    );
  }

  return interpretation;
};

export const getDomainTuple = (
  { arity }: TupleInfo,
  row: string,
  col: string,
): DomainTuple => (arity === 1 ? [col] : [row, col]);

export const getKeyFromDomainTuple = (
  domainTuple: DomainTuple,
  duplicate: boolean = false,
) => `${domainTupleKey(domainTuple)}${duplicate ? "-d" : ""}`;
