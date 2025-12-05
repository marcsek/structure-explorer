import type { ActionCreatorWithPreparedPayload } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import type { ValidationError } from "../../common/errors";

import {
  languageTextViewDescriptors,
  type LanguageTextViewTypeMap,
} from "../language/languageSlice";
import {
  structureTextViewDescriptors,
  type StructureTextViewTypeMap,
} from "../structure/structureSlice";
import {
  variablesTextViewDescriptors,
  type VariablesTextViewTypeMap,
} from "../variables/variablesSlice";

export type ActionCreatorWithMeta<
  P,
  M,
  T extends string = string,
> = ActionCreatorWithPreparedPayload<[P, M], P, T, undefined, M>;

export type PayloadType = "value" | "key";

type KeyedPayload<T> = { key: string; value: T };

interface TextViewDescriptorBase<
  TStructured,
  TPayloadType extends PayloadType,
> {
  namespace?: string;
  parse: (value: string, state: RootState) => TStructured;
  toText: (structured: TStructured) => string;
  validate: (state: RootState, key?: string) => ValidationError | undefined;
  syncActionCreator: ActionCreatorWithMeta<
    TPayloadType extends "value" ? TStructured : KeyedPayload<TStructured>,
    { source?: string }
  >;
}

export type TextViewDescriptor<TStructured> =
  | ({
      payloadType: "value";
    } & TextViewDescriptorBase<TStructured, "value">)
  | ({
      payloadType: "key";
    } & TextViewDescriptorBase<TStructured, "key">);

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

export function getKeyType(type: TextViewType) {
  return getDescriptor(type).payloadType;
}

export function getNamespace(type: TextViewType) {
  return getDescriptor(type).namespace ?? "default";
}

export type TextViewDescriptors<TMap> = {
  [K in keyof TMap]: TextViewDescriptor<TMap[K]>;
};

export function isKeyedPayloadByTextType<T = unknown>(
  payload: unknown,
  type: TextViewType,
): payload is KeyedPayload<T> {
  return getKeyType(type) === "key";
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
