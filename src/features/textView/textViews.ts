import type { PayloadAction, UnknownAction } from "@reduxjs/toolkit";
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

export interface ActionCreatorWithMeta<
  P,
  T extends string,
  M extends object = object,
> {
  (payload: P, meta: M): PayloadAction<P, T, M>;
  type: T;
  match(action: unknown): action is PayloadAction<P, T, M>;
}

export type TextViewTypes =
  | "constants"
  | "predicates"
  | "functions"
  | "domain"
  | "constant_interpretation"
  | "predicate_interpretation"
  | "function_interpretation"
  | "variables";

export interface TextViewDescriptor<TParsed> {
  parse: (value: string, state: RootState) => TParsed;
  update: (key: string, parsed: TParsed) => UnknownAction;
  toText: (structured: unknown) => string;
  validate?: (state: RootState, key?: string) => ValidationError | undefined;
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
    toText: (structured) => (structured as string[]).join(", "),
    update: (_, parsed) => updateConstants(parsed, { source: "textView" }),
    validate: (state) => selectConstantsValidation(state)?.error,
  },

  predicates: {
    parse: (value) => parsePredicates(value),
    toText: (structured) =>
      (structured as SymbolWithArity[])
        .map(({ name, arity }) => `${name}/${arity}`)
        .join(", "),
    update: (_, parsed) => updatePredicates(parsed, { source: "textView" }),
    validate: (state) => selectPredicatesValidation(state)?.error,
  },

  functions: {
    parse: (value) => parseFunctions(value),
    toText: (structured) =>
      (structured as SymbolWithArity[])
        .map(({ name, arity }) => `${name}/${arity}`)
        .join(", "),
    update: (_, parsed) => updateFunctions(parsed, { source: "textView" }),
    validate: (state) => selectFunctionsValidation(state)?.error,
  },

  domain: {
    parse: (value) => parseDomain(value),
    toText: (structured) => (structured as string[]).join(", "),
    update: (_, parsed) => updateDomain(parsed, { source: "textView" }),
    validate: (state) => selectDomainValidation(state)?.error,
  },

  constant_interpretation: {
    parse: (value) => value,
    toText: (v) => v as string,
    update: (key, parsed) =>
      updateInterpretationConstants(
        { key, value: parsed },
        { source: "textView" },
      ),
    validate: (state, key) =>
      selectConstantsInterpretationValidation(state, key!)?.error,
  },

  predicate_interpretation: {
    parse: (value) => parseTuples(value),
    toText: (v) =>
      (v as TupleInterpretationState["value"])
        .map((tuple) =>
          tuple.length === 1 ? tuple[0] : `(${tuple.join(",")})`,
        )
        .join(", "),
    update: (key, parsed) =>
      updateInterpretationPredicates(
        { key, value: parsed },
        { source: "textView" },
      ),
    validate: (state, key) =>
      selectPredicatesInterpretationValidation(state, key!)?.error,
  },

  function_interpretation: {
    parse: (value) => parseTuples(value),
    toText: (v) =>
      (v as TupleInterpretationState["value"])
        .map((tuple) =>
          tuple.length === 1 ? tuple[0] : `(${tuple.join(",")})`,
        )
        .join(", "),
    update: (key, parsed) =>
      updateFunctionSymbols({ key, value: parsed }, { source: "textView" }),
    validate: (state, key) =>
      selectFunctionsInterpretationValidation(state, key!)?.error,
  },

  variables: {
    parse: (value, state) =>
      parseValuation(value, selectLanguage(state).getParserLanguage()),
    toText: (structured) => JSON.stringify(structured),
    update: (_, parsed) => updateVariables(parsed, { source: "textView" }),
    validate: (state) => selectVariablesValidation(state)?.error,
  },
};
