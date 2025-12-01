import { createSelector, createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk, RootState } from "../../app/store";
import { SyntaxError as ParserSyntaxError } from "@fmfi-uk-1-ain-412/js-fol-parser";
import {
  textViewDescriptors,
  textViewSyncReducers,
  syncReducerTypeToTextType,
  type TextViewType,
} from "./textViews";

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
  type: TextViewType;
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
        type: TextViewType;
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
    builder.addMatcher(isAnyOf(...textViewSyncReducers), (state, action) => {
      const textType = syncReducerTypeToTextType[action.type];
      const key = "key" in action.payload ? action.payload.key : textType;

      const payloadValue =
        "value" in action.payload ? action.payload.value : action.payload;

      if (action.meta.source !== "textView") {
        const textValue = convertStructuredToText(textType, payloadValue);

        if (state[key]) state[key].value = textValue;
        else state[key] = { value: textValue, type: textType };
      }
    });
  },
});

export const updateTextView = ({
  key: keyIn,
  type,
  value,
}: {
  key?: string;
  type: TextViewType;
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

export const selectValidatedTextView = createSelector(
  [
    (_, type: TextViewType) => type,
    (_, __, key?: string) => key,
    (state: RootState, type: TextViewType, key?: string) =>
      getValidator(state, type, key ?? type),
    (state: RootState, type, key?: string) => state.textView[key ?? type],
  ],
  (_, __, validationError, entry) => {
    if (!entry) return { value: "", error: validationError };

    const { value, parseError } = entry;
    const error = parseError || validationError || undefined;

    return { value, error };
  },
);

export const { textViewChanged, textViewParseErrorChanged } =
  textViewSlice.actions;

export default textViewSlice.reducer;

const parseByTextType = <T extends TextViewType>(
  textType: T,
  toParse: string,
  state: RootState,
) => {
  try {
    return { parsed: textViewDescriptors[textType].parse(toParse, state) };
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

export const convertStructuredToText = <T extends TextViewType>(
  type: T,
  structured: ReturnType<(typeof textViewDescriptors)[T]["parse"]>,
): string => {
  return textViewDescriptors[type].toText(structured);
};

const updateActionByTextType = <T extends TextViewType>(
  textType: T,
  key: string,
  parsed: ReturnType<(typeof textViewDescriptors)[T]["parse"]>,
) => {
  return textViewDescriptors[textType].syncAction(key, parsed);
};

const getValidator = (state: RootState, type: TextViewType, key: string) => {
  return textViewDescriptors[type].validate(state, key);
};
