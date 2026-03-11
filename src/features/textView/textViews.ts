import type { ActionCreatorWithPreparedPayload } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { SemanticError, ValidationError } from "../../common/errors";

import {
  type LanguageTextViewTypeMap,
  languageTextViewDescriptors,
} from "../language/textViewDescriptors";
import {
  structureTextViewDescriptors,
  type StructureTextViewTypeMap,
} from "../structure/textViewDescriptors";
import {
  type VariablesTextViewTypeMap,
  variablesTextViewDescriptors,
} from "../variables/textViewDescriptors";
export type ActionCreatorWithMeta<
  P,
  M,
  T extends string = string,
> = ActionCreatorWithPreparedPayload<[P, M], P, T, undefined, M>;

type KeyedPayload<T> = { key: string; value: T };

interface TextViewDescriptorBase<TStructured, TPayload> {
  parse: (value: string, state: RootState) => TStructured;
  toText: (structured: TStructured) => string;
  validate: (
    state: RootState,
    key?: string,
  ) => ValidationError | SemanticError | undefined;
  syncActionCreator: ActionCreatorWithMeta<TPayload, { source?: string }>;
}

export type TextViewDescriptor<TStructured> =
  | ({
      payloadType: "value";
    } & TextViewDescriptorBase<TStructured, TStructured>)
  | ({
      payloadType: "key";
    } & TextViewDescriptorBase<TStructured, KeyedPayload<TStructured>>);

type TypeMap = LanguageTextViewTypeMap &
  StructureTextViewTypeMap &
  VariablesTextViewTypeMap;

export const textViewDescriptors: {
  [T in keyof TypeMap]: TextViewDescriptor<TypeMap[T]>;
} = {
  ...languageTextViewDescriptors,
  ...structureTextViewDescriptors,
  ...variablesTextViewDescriptors,
};

export type TextViewType = keyof TypeMap;

export type StructuredOf<T extends TextViewType> = TypeMap[T];

export function getDescriptor<T extends TextViewType>(
  type: T,
): (typeof textViewDescriptors)[T] {
  return textViewDescriptors[type];
}

export type TextViewDescriptors<TMap> = {
  [K in keyof TMap]: TextViewDescriptor<TMap[K]>;
};

export interface TextViewSyncEntry {
  textViewType: TextViewType;
  key?: string;
  value: string;
}

export function isKeyedPayloadByTextType<T = unknown>(
  _payload: unknown,
  type: TextViewType,
): _payload is KeyedPayload<T> {
  return getDescriptor(type).payloadType === "key";
}

export const textTypeToSyncReducer = Object.fromEntries(
  Object.entries(textViewDescriptors).map(([key, descriptor]) => [
    key,
    descriptor.syncActionCreator,
  ]),
);

export const textViewSyncReducers = Object.values(textTypeToSyncReducer);

export const syncReducerTypeToTextType: Record<string, TextViewType> =
  Object.fromEntries(
    Object.entries(textTypeToSyncReducer).map(
      ([textType, action]) => [action.type, textType] as [string, TextViewType],
    ),
  );
