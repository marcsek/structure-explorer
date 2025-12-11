import { createSelector, createSlice, isAnyOf } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk, RootState } from "../../app/store";
import { SyntaxError as ParserSyntaxError } from "@fmfi-uk-1-ain-412/js-fol-parser";
import {
  textViewDescriptors,
  textViewSyncReducers,
  syncReducerTypeToTextType,
  type TextViewType,
  getDescriptor,
  isKeyedPayloadByTextType as isKeyedPayload,
  type StructuredOf,
} from "./textViews";
import type { SyntaxError } from "../../common/errors";

export interface TextViewEntry {
  type: TextViewType;
  value: string;
  parseError?: SyntaxError;
}

export type TextViewState = Record<string, TextViewEntry>;

const initialState: TextViewState = {};

export const textViewSlice = createSlice({
  name: "textView",
  initialState: initialState,
  reducers: {
    textViewChanged(
      state,
      action: PayloadAction<{
        key: string;
        type: TextViewType;
        value: string;
      }>,
    ) {
      const { key: inKey, value, type } = action.payload;

      const key = getKeyByType(type, inKey);

      if (state[key]) state[key] = { ...state[key], value, type };
      else state[key] = { value, type };
    },

    textViewParseErrorChanged(
      state,
      action: PayloadAction<{
        key: string;
        type: TextViewType;
        parseError: SyntaxError | undefined;
      }>,
    ) {
      const { key: inKey, type, parseError } = action.payload;

      const key = getKeyByType(type, inKey);

      if (state[key]) state[key] = { ...state[key], type, parseError };
    },
  },

  extraReducers(builder) {
    builder.addMatcher(isAnyOf(...textViewSyncReducers), (state, action) => {
      const textType = syncReducerTypeToTextType[action.type];

      if (action.meta.source !== "textView") {
        const { key: inKey, value } = isKeyedPayload(action.payload, textType)
          ? action.payload
          : { key: textType, value: action.payload };

        const textValue = convertStructuredToText(textType, value);

        const key = getKeyByType(textType, inKey);

        state[key] = { value: textValue, type: textType };
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
      dispatch(textViewParseErrorChanged({ key, type, parseError: error }));
      return;
    }

    dispatch(textViewParseErrorChanged({ key, type, parseError: undefined }));
    dispatch(updateActionByTextType(type, key, parsed));
  };
};

export const selectValidatedTextView = createSelector(
  [
    (_, type: TextViewType) => type,
    (_, type: TextViewType, key: string = type) => key,
    (state: RootState, type: TextViewType, key: string = type) =>
      selectValidation(state, type, key),
    (state: RootState, type: TextViewType, key: string = type) =>
      state.textView[getKeyByType(type, key)],
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
    return { parsed: getDescriptor(textType).parse(toParse, state) };
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
  structured: StructuredOf<T>,
): string => {
  return getDescriptor(type).toText(structured);
};

const updateActionByTextType = <T extends TextViewType>(
  textType: T,
  key: string,
  parsed: StructuredOf<T>,
) => {
  const descriptor = textViewDescriptors[textType];

  if (descriptor.payloadType === "key")
    return descriptor.syncActionCreator(
      { key, value: parsed },
      { source: "textView" },
    );

  return descriptor.syncActionCreator(parsed, { source: "textView" });
};

const selectValidation = (
  state: RootState,
  type: TextViewType,
  key: string,
) => {
  return textViewDescriptors[type].validate(state, key);
};

const getKeyByType = (type: TextViewType, key: string) => {
  if (getDescriptor(type).payloadType === "key") return `${type}-${key}`;

  return key;
};
