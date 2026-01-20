import { createSelector } from "@reduxjs/toolkit";
import {
  selectDomain,
  selectInterpretationByType,
  updateFunctionSymbols,
  updateInterpretationPredicates,
  type TupleType,
} from "../structure/structureSlice";
import type { RootState } from "../../app/store";

export type MatrixViewValues = Record<
  string,
  { domainTuple: string[]; value: string; duplicate?: boolean }
>;

export const selectMatrixValuesWithInvalid = createSelector(
  [
    selectDomain,
    (state: RootState, key: string, type: TupleType) =>
      selectInterpretationByType(state, key, type)?.value,
    (_: RootState, __: string, type: TupleType) => type,
  ],
  (domain, interpretation, tupleType) => {
    if (!interpretation) return { values: {}, leftovers: [] };

    const seenTuples = new Set<string>();
    const values = Object.fromEntries(
      interpretation.flatMap((tuple) => {
        let entry = createTupleValueEntry(tupleType, tuple);

        const [entryKey] = entry;

        const wasSeen = seenTuples.has(entryKey);
        seenTuples.add(entryKey);

        if (!wasSeen) return [entry];

        const duplicateEntry = createTupleValueEntry(tupleType, tuple, true);
        entry = [entry[0], { ...entry[1], duplicate: true }];

        return [entry, duplicateEntry];
      }),
    );

    const matrixEntryDomain = new Set(
      Object.values(values).flatMap(({ domainTuple }) => domainTuple),
    );

    const leftovers = [...matrixEntryDomain].filter(
      (element) => !domain.value.includes(element),
    );

    console.log(values);

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
    if (value)
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
