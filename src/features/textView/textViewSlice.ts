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
  type TextViewSyncEntry,
} from "./textViews";
import type { SyntaxError } from "../../common/errors";
import { dev } from "../../common/logging";
import { UndoActions } from "../undoHistory/undoHistory";

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
        parseError: SyntaxError | undefined;
      }>,
    ) {
      const { key: inKey, value, type, parseError } = action.payload;

      const key = getKeyByType(type, inKey);

      if (state[key]) state[key] = { ...state[key], value, type, parseError };
      else state[key] = { value, type, parseError };
    },

    syncTextView(_, action: PayloadAction<TextViewSyncEntry[]>) {
      const syncEntries = action.payload;

      const newState: TextViewState = {};

      for (const { value, textViewType, key } of syncEntries) {
        const actualKey = key ?? textViewType;

        const textViewKey = getKeyByType(textViewType, actualKey);
        newState[textViewKey] = { value, type: textViewType };
      }

      return newState;
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

    const { parsed, error } = parseByTextType(type, value, getState());

    if (error) {
      dispatch(textViewChanged({ key, type, value, parseError: error }));
      return;
    }

    dispatch(textViewChanged({ key, type, value, parseError: undefined }));

    dev.time(`Duration of ${key} text parent state update`);
    dispatch(updateActionByTextType(type, key, parsed));
    dev.timeEnd(`Duration of ${key} text parent state update`);
  };
};

export const textViewCheckpoint = (): AppThunk => (dispatch, getState) => {
  const currentTextView = getState().present.textView;
  const previousTextView = getState()._latestUnfiltered?.textView;

  if (!previousTextView) {
    dispatch(UndoActions.checkpoint());
    return;
  }

  for (const key in currentTextView) {
    if (currentTextView[key].value !== previousTextView[key]?.value) {
      dispatch(UndoActions.checkpoint());
      return;
    }
  }
};

export const selectValidatedTextView = createSelector(
  [
    (state: RootState, type: TextViewType, key: string = type) =>
      selectValidation(state, type, key),
    (state: RootState, type: TextViewType, key: string = type) =>
      state.present.textView[getKeyByType(type, key)],
  ],
  (validationError, entry) => {
    if (!entry) return { value: "", error: validationError };

    const { value, parseError } = entry;
    const error = parseError || validationError || undefined;

    return { value, error };
  },
);

export const { textViewChanged, syncTextView } = textViewSlice.actions;

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

export const selectValidation = (
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
