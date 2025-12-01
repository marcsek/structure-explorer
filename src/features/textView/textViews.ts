import type { UnknownAction } from "@reduxjs/toolkit";
import {
  selectConstantsValidation,
  selectFunctionsValidation,
  selectLanguage,
  selectPredicatesValidation,
  updateConstants,
  updateFunctions,
  updatePredicates,
} from "../language/languageSlice";
import type { RootState } from "../../app/store";
import {
  parseConstants,
  parseDomain,
  parseFunctions,
  parsePredicates,
  parseTuples,
  parseValuation,
  type SymbolWithArity,
} from "@fmfi-uk-1-ain-412/js-fol-parser";
import {
  selectConstantsInterpretationValidation,
  selectDomainValidation,
  selectFunctionsInterpretationValidation,
  selectPredicatesInterpretationValidation,
  updateDomain,
  updateFunctionSymbols,
  updateInterpretationConstants,
  updateInterpretationPredicates,
  type TupleInterpretationState,
} from "../structure/structureSlice";
import {
  selectVariablesValidation,
  updateVariables,
} from "../variables/variablesSlice";
import type { ValidationError } from "./textViewSlice";

export type TextViewType =
  | "constants"
  | "predicates"
  | "functions"
  | "domain"
  | "constant_interpretation"
  | "predicate_interpretation"
  | "function_interpretation"
  | "variables";

export interface TextViewDescriptor<TStructured> {
  parse: (value: string, state: RootState) => TStructured;
  syncAction: (key: string, parsed: TStructured) => UnknownAction;
  toText: (structured: TStructured) => string;
  validate: (state: RootState, key?: string) => ValidationError | undefined;
}

interface TextViewTypeMap {
  constants: string[];
  predicates: SymbolWithArity[];
  functions: SymbolWithArity[];
  domain: string[];
  constant_interpretation: string;
  predicate_interpretation: TupleInterpretationState["value"];
  function_interpretation: TupleInterpretationState["value"];
  variables: ReturnType<typeof parseValuation>;
}

export const textViewDescriptors: {
  [T in keyof TextViewTypeMap]: TextViewDescriptor<TextViewTypeMap[T]>;
} = {
  constants: {
    parse: (value) => parseConstants(value),
    toText: (structured) => structured.join(", "),
    syncAction: (_, parsed) =>
      textTypeToSyncReducer.constants(parsed, { source: "textView" }),
    validate: (state) => selectConstantsValidation(state)?.error,
  },

  predicates: {
    parse: (value) => parsePredicates(value),
    toText: (structured) =>
      structured.map(({ name, arity }) => `${name}/${arity}`).join(", "),
    syncAction: (_, parsed) =>
      textTypeToSyncReducer.predicates(parsed, { source: "textView" }),
    validate: (state) => selectPredicatesValidation(state)?.error,
  },

  functions: {
    parse: (value) => parseFunctions(value),
    toText: (structured) =>
      structured.map(({ name, arity }) => `${name}/${arity}`).join(", "),
    syncAction: (_, parsed) =>
      textTypeToSyncReducer.functions(parsed, { source: "textView" }),
    validate: (state) => selectFunctionsValidation(state)?.error,
  },

  domain: {
    parse: (value) => parseDomain(value),
    toText: (structured) => structured.join(", "),
    syncAction: (_, parsed) =>
      textTypeToSyncReducer.domain(parsed, { source: "textView" }),
    validate: (state) => selectDomainValidation(state)?.error,
  },

  constant_interpretation: {
    parse: (value) => value,
    toText: (structured) => structured,
    syncAction: (key, parsed) =>
      textTypeToSyncReducer.constant_interpretation(
        { key, value: parsed },
        { source: "textView" },
      ),
    validate: (state, key) =>
      selectConstantsInterpretationValidation(state, key!)?.error,
  },

  predicate_interpretation: {
    parse: (value) => parseTuples(value),
    toText: (structured) =>
      structured
        .map((tuple) =>
          tuple.length === 1 ? tuple[0] : `(${tuple.join(",")})`,
        )
        .join(", "),
    syncAction: (key, parsed) =>
      textTypeToSyncReducer.predicate_interpretation(
        { key, value: parsed },
        { source: "textView" },
      ),
    validate: (state, key) =>
      selectPredicatesInterpretationValidation(state, key!)?.error,
  },

  function_interpretation: {
    parse: (value) => parseTuples(value),
    toText: (structured) =>
      structured
        .map((tuple) =>
          tuple.length === 1 ? tuple[0] : `(${tuple.join(",")})`,
        )
        .join(", "),
    syncAction: (key, parsed) =>
      textTypeToSyncReducer.function_interpretation(
        { key, value: parsed },
        { source: "textView" },
      ),
    validate: (state, key) =>
      selectFunctionsInterpretationValidation(state, key!)?.error,
  },

  variables: {
    parse: (value, state) =>
      parseValuation(value, selectLanguage(state).getParserLanguage()),
    toText: (structured) =>
      structured.map(([from, to]) => `${from}->${to}`).join(", "),
    syncAction: (_, parsed) =>
      textTypeToSyncReducer.variables(parsed, { source: "textView" }),
    validate: (state) => selectVariablesValidation(state)?.error,
  },
};

export const textTypeToSyncReducer = {
  constants: updateConstants,
  predicates: updatePredicates,
  functions: updateFunctions,
  domain: updateDomain,
  predicate_interpretation: updateInterpretationPredicates,
  constant_interpretation: updateInterpretationConstants,
  function_interpretation: updateFunctionSymbols,
  variables: updateVariables,
} as const satisfies Record<TextViewType, unknown>;

export const textViewSyncReducers = Object.values(textTypeToSyncReducer);

export const syncReducerTypeToTextType: Record<string, TextViewType> =
  Object.entries(textTypeToSyncReducer).reduce(
    (acc, [textType, action]) => {
      acc[action.type] = textType as TextViewType;
      return acc;
    },
    {} as Record<string, TextViewType>,
  );
