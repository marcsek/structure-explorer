import { createSelector } from "@reduxjs/toolkit";
import {
  selectDomain,
  selectInterpretationByType,
  updateFunctionSymbols,
  updateInterpretationPredicates,
} from "../structure/structureSlice";
import type { RootState } from "../../app/store";
import type { TupleInfo, TupleType } from "../structure/tupleInfo";

export type MatrixViewValues = Record<
  string,
  { domainTuple: string[]; value: string; duplicate?: boolean }
>;

export const selectMatrixValuesWithInvalid = createSelector(
  [
    selectDomain,
    (state: RootState, { name, type }: TupleInfo) =>
      selectInterpretationByType(state, name, type)?.value,
    (_: RootState, { type }: TupleInfo) => type,
  ],
  (domain, interpretation, tupleType) => {
    if (!interpretation) return { values: {}, leftovers: [] };

    const seenTuples = new Set<string>();
    const values: MatrixViewValues = {};
    const matrixDomain = new Set<string>();

    for (const tuple of interpretation) {
      const [key, value] = createTupleValueEntry(tupleType, tuple);
      value.domainTuple.forEach((e) => matrixDomain.add(e));

      if (!seenTuples.has(key)) {
        seenTuples.add(key);
        values[key] = value;
        continue;
      }

      const [dupKey, dupValue] = createTupleValueEntry(tupleType, tuple, true);
      values[key] = { ...value, duplicate: true };
      values[dupKey] = dupValue;
    }

    const leftovers = [...matrixDomain].filter(
      (e) => !domain.value.includes(e),
    );

    return { values, leftovers };
  },
);

export const updaters = {
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

export const getKeyFromDomainTuple = (
  domainTuple: string[],
  duplicate: boolean = false,
) => `${domainTuple.join(",")}${duplicate ? "-d" : ""}`;
