import { createSelector, createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  selectConstantsValidation,
  selectFunctionsValidation,
  selectLanguage,
  selectPredicatesValidation,
  updateConstants,
  updateFunctions,
  updatePredicates,
} from "../language/languageSlice";
import type { AppThunk, RootState } from "../../app/store";
import {
  parseConstants,
  parseDomain,
  parseFunctions,
  parsePredicates,
  SyntaxError as ParserSyntaxError,
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
  type ConstantInterpretationState,
  type TupleInterpretationState,
} from "../structure/structureSlice";
import {
  selectVariablesValidation,
  updateVariables,
} from "../variables/variablesSlice";

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

export const updaterTypeToTextView = {
  [updateConstants.type]: "constants",
  [updatePredicates.type]: "predicates",
  [updateFunctions.type]: "functions",
  [updateDomain.type]: "domain",
  [updateInterpretationConstants.type]: "constant_interpretation",
  [updateInterpretationPredicates.type]: "predicate_interpretation",
  [updateFunctionSymbols.type]: "function_interpretation",
} as const;

interface BaseError {
  kind: string;
  message: string;
}

export interface SyntaxError extends BaseError {
  kind: "syntax";
  location: ParserSyntaxError["location"];
}

export interface ValidationError extends BaseError {
  kind: "validation";
}

export type InterpretationError = SyntaxError | ValidationError;

export interface TextViewEntry {
  type: TextViewTypes;
  value: string;
  parseError?: SyntaxError;
}

export type TextViewState = Record<string, TextViewEntry>;

const initialState: TextViewState = {
  constants: { value: "", type: "constants" },
  predicates: { value: "", type: "predicates" },
  functions: { value: "", type: "functions" },
  domain: { value: "", type: "domain" },
  variables: { value: "", type: "variables" },
};

export const textViewSlice = createSlice({
  name: "textView",
  initialState,
  reducers: {
    textViewChanged(
      state,
      action: PayloadAction<{
        key: string;
        type: TextViewTypes;
        value: string;
      }>,
    ) {
      const { key, value, type } = action.payload;

      if (state[key]) state[key].value = value;
      else state[key] = { value, type };
    },

    textViewParseErrorChanged(
      state,
      action: PayloadAction<{
        key: string;
        parseError: SyntaxError | undefined;
      }>,
    ) {
      const { key, parseError } = action.payload;

      if (state[key]) state[key].parseError = parseError;
    },
  },

  extraReducers(builder) {
    builder.addMatcher(
      isAnyOf(
        ...[updateConstants, updatePredicates, updateFunctions, updateDomain],
      ),
      (state, action) => {
        const key = updaterTypeToTextView[action.type];

        if (action.meta.source !== "textView")
          if (state[key])
            state[key].value = convertStructuredToText(key, action.payload);
          else
            state[key] = {
              value: convertStructuredToText(key, action.payload),
              type: key,
            };
      },
    );

    builder.addMatcher(
      isAnyOf(
        ...[
          updateInterpretationPredicates,
          updateInterpretationConstants,
          updateFunctionSymbols,
        ],
      ),
      (state, action) => {
        const key = updaterTypeToTextView[action.type];

        if (action.meta.source !== "textView")
          if (state[action.payload.key])
            state[action.payload.key].value = convertStructuredToText(
              key,
              action.payload.value,
            );
          else
            state[action.payload.key] = {
              value: convertStructuredToText(key, action.payload.value),
              type: key,
            };
      },
    );
  },
});

const convertStructuredToText = (
  textType: TextViewTypes,
  structured: unknown,
) => {
  if (["constants", "domain"].includes(textType))
    return (structured as string[]).join(", ");
  else if (["predicates", "functions"].includes(textType))
    return (structured as SymbolWithArity[])
      .map(({ name, arity }) => `${name}/${arity}`)
      .join(", ");
  else if (
    ["predicate_interpretation", "function_interpretation"].includes(textType)
  )
    return (structured as TupleInterpretationState["value"])
      .map((tuple) => (tuple.length == 1 ? tuple[0] : `(${tuple.join(",")})`))
      .join(", ");
  else if (textType === "constant_interpretation")
    return structured as ConstantInterpretationState["value"];

  return "";
};

const parserByTextType = {
  constants: parseConstants,
  predicates: parsePredicates,
  functions: parseFunctions,
  domain: parseDomain,
  predicate_interpretation: parseTuples,
  constant_interpretation: (value: string) => value,
  function_interpretation: parseTuples,
  variables: parseValuation,
} as const satisfies Record<TextViewTypes, unknown>;

const parseByTextType = (
  textType: TextViewTypes,
  toParse: string,
  state: RootState,
) => {
  try {
    if (textType === "variables")
      return {
        parsed: parserByTextType[textType](
          toParse,
          selectLanguage(state).getParserLanguage(),
        ),
      };
    else return { parsed: parserByTextType[textType](toParse) };
  } catch (error) {
    if (error instanceof ParserSyntaxError) {
      return {
        error: {
          kind: "syntax",
          message: error.message,
          location: error.location,
        } as SyntaxError,
      };
    }

    throw error;
  }
};

const updaterByTextType = {
  constants: updateConstants,
  predicates: updatePredicates,
  functions: updateFunctions,
  domain: updateDomain,
  predicate_interpretation: updateInterpretationPredicates,
  constant_interpretation: updateInterpretationConstants,
  function_interpretation: updateFunctionSymbols,
  variables: updateVariables,
} as const satisfies Record<TextViewTypes, unknown>;

const updateActionByTextType = <T extends TextViewTypes>(
  textType: T,
  key: string,
  parsed: ReturnType<(typeof parserByTextType)[T]>,
) => {
  // I know it, just can't prove it.
  if (
    textType === "constant_interpretation" ||
    textType === "predicate_interpretation" ||
    textType === "function_interpretation"
  ) {
    return updaterByTextType[textType](
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { key, value: parsed } as any,
      { source: "textView" },
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return updaterByTextType[textType](parsed as any, { source: "textView" });
};

export const updateTextView = ({
  key: keyIn,
  type,
  value,
}: {
  key?: string;
  type: TextViewTypes;
  value: string;
}): AppThunk => {
  return (dispatch, getState) => {
    const key = keyIn ?? type;

    dispatch(textViewChanged({ key, type, value }));

    const { parsed, error } = parseByTextType(type, value, getState());

    if (error) {
      dispatch(textViewParseErrorChanged({ key, parseError: error }));
      return;
    }

    dispatch(textViewParseErrorChanged({ key, parseError: undefined }));
    dispatch(updateActionByTextType(type, key, parsed));
  };
};

const validatorByTextType = {
  constants: selectConstantsValidation,
  predicates: selectPredicatesValidation,
  functions: selectFunctionsValidation,
  domain: selectDomainValidation,
  variables: selectVariablesValidation,
} as const;

const getValidator = (state: RootState, type: TextViewTypes, key: string) => {
  if (type === "predicate_interpretation")
    return selectPredicatesInterpretationValidation(state, key);
  else if (type === "constant_interpretation")
    return selectConstantsInterpretationValidation(state, key);
  else if (type === "function_interpretation")
    return selectFunctionsInterpretationValidation(state, key);
  else return validatorByTextType[type](state);
};

export const selectValidatedTextView = createSelector(
  [
    (_, type: TextViewTypes) => type,
    (_, __, key?: string) => key,
    (state: RootState, type: TextViewTypes, key?: string) =>
      getValidator(state, type, key ?? type),
    (state: RootState, type, key?: string) => state.textView[key ?? type],
  ],
  (_, __, validationError, entry) => {
    if (!entry) return { value: "", error: validationError?.error };

    const { value, parseError } = entry;
    const error = parseError || validationError?.error || undefined;

    return { value, error };
  },
);

export const { textViewChanged, textViewParseErrorChanged } =
  textViewSlice.actions;

export default textViewSlice.reducer;
