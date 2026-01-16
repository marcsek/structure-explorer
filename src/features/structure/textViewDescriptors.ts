import type {
  TextViewDescriptors,
  TextViewSyncEntry,
} from "../textView/textViews";
import { parseDomain, parseTuples } from "@fmfi-uk-1-ain-412/js-fol-parser";
import {
  selectValidatedConstant,
  selectValidatedDomain,
  selectValidatedFunction,
  selectValidatedPredicate,
  updateDomain,
  updateFunctionSymbols,
  updateInterpretationConstants,
  updateInterpretationPredicates,
  type ConstantInterpretation,
  type DomainRepresentation,
  type StructureState,
  type TupleInterpretation,
} from "./structureSlice";

export interface StructureTextViewTypeMap {
  domain: DomainRepresentation;
  constant_interpretation: ConstantInterpretation;
  predicate_interpretation: TupleInterpretation;
  function_interpretation: TupleInterpretation;
}

export const structureTextViewDescriptors: TextViewDescriptors<StructureTextViewTypeMap> =
  {
    domain: {
      payloadType: "value",
      parse: (value) => parseDomain(value),
      toText: (structured) => structured.join(", "),
      validate: (state) => selectValidatedDomain(state)?.error,
      syncActionCreator: updateDomain,
    },

    constant_interpretation: {
      payloadType: "key",
      parse: (value) => value,
      toText: (structured) => structured,
      validate: (state, key) => selectValidatedConstant(state, key!).error,
      syncActionCreator: updateInterpretationConstants,
    },

    predicate_interpretation: {
      payloadType: "key",
      parse: (value) => parseTuples(value),
      toText: (structured) =>
        structured
          .map((tuple) =>
            tuple.length === 1 ? tuple[0] : `(${tuple.join(",")})`,
          )
          .join(", "),
      validate: (state, key) => selectValidatedPredicate(state, key!).error,
      syncActionCreator: updateInterpretationPredicates,
    },

    function_interpretation: {
      payloadType: "key",
      parse: (value) => parseTuples(value),
      toText: (structured) =>
        structured
          .map((tuple) =>
            tuple.length === 1 ? tuple[0] : `(${tuple.join(",")})`,
          )
          .join(", "),
      validate: (state, key) => selectValidatedFunction(state, key!).error,
      syncActionCreator: updateFunctionSymbols,
    },
  };

export const getStructureTextViewSyncEntries = (structure: StructureState) => {
  const { domain, iC, iP, iF } = structure;
  const descriptors = structureTextViewDescriptors;

  const result: TextViewSyncEntry[] = [
    {
      textViewType: "domain",
      value: descriptors.domain.toText(domain.value),
    },
  ];

  const interpretationConfigs = [
    { entries: iC, type: "constant_interpretation" },
    { entries: iP, type: "predicate_interpretation" },
    { entries: iF, type: "function_interpretation" },
  ] as const;

  for (const { entries, type } of interpretationConfigs) {
    for (const [name, { value }] of Object.entries(entries)) {
      result.push({
        textViewType: type,
        key: name,
        value: descriptors[type].toText(value),
      });
    }
  }

  return result;
};
