import {
  type SymbolWithArity,
  parseConstants,
  parsePredicates,
  parseFunctions,
} from "@fmfi-uk-1-ain-412/js-fol-parser";
import type {
  TextViewDescriptors,
  TextViewSyncEntry,
} from "../textView/textViews";
import {
  type ConstantsRepresentation,
  selectValidatedConstants,
  updateConstants,
  selectValidatedPredicates,
  updatePredicates,
  selectValidatedFunctions,
  updateFunctions,
  type LanguageState,
} from "./languageSlice";

export interface LanguageTextViewTypeMap {
  constants: ConstantsRepresentation;
  predicates: SymbolWithArity[];
  functions: SymbolWithArity[];
}

export const languageTextViewDescriptors: TextViewDescriptors<LanguageTextViewTypeMap> =
  {
    constants: {
      payloadType: "value",
      parse: (value) => parseConstants(value),
      toText: (structured) => structured.join(", "),
      validate: (state) => selectValidatedConstants(state)?.error,
      syncActionCreator: updateConstants,
    },

    predicates: {
      payloadType: "value",
      parse: (value) => parsePredicates(value),
      toText: (structured) =>
        structured.map(({ name, arity }) => `${name}/${arity}`).join(", "),
      validate: (state) => selectValidatedPredicates(state)?.error,
      syncActionCreator: updatePredicates,
    },

    functions: {
      payloadType: "value",
      parse: (value) => parseFunctions(value),
      toText: (structured) =>
        structured.map(({ name, arity }) => `${name}/${arity}`).join(", "),
      validate: (state) => selectValidatedFunctions(state)?.error,
      syncActionCreator: updateFunctions,
    },
  };

export const getLanguageTextViewSyncEntries = (language: LanguageState) => {
  const result: TextViewSyncEntry[] = [];

  const mapArityTuples = (items: [string, number][]) =>
    items.map(([name, arity]) => ({ name, arity }));

  result.push({
    textViewType: "constants",
    value: languageTextViewDescriptors.constants.toText(
      language.constants.value,
    ),
  });

  result.push({
    textViewType: "predicates",
    value: languageTextViewDescriptors.predicates.toText(
      mapArityTuples(language.predicates.value),
    ),
  });

  result.push({
    textViewType: "functions",
    value: languageTextViewDescriptors.functions.toText(
      mapArityTuples(language.functions.value),
    ),
  });

  return result;
};
