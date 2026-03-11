import { type Action, type PayloadAction } from "@reduxjs/toolkit";
import type { ValidationError } from "./errors";

export interface LockableValue<T> {
  locked: boolean;
  value: T;
}

export type Validated<T> = {
  parsed: T;
  error?: ValidationError;
};

export const prepareWithSourceMeta = <P>(
  payload: P,
  meta: { source?: string } = {},
) => ({
  payload,
  meta,
});

export const prepareWithListenerIgnoreMeta = <P>(
  payload: P,
  meta: { ignore?: boolean } = {},
) => ({
  payload,
  meta,
});

export type PayloadActionListenerIgnore<P = void> = PayloadAction<
  P,
  string,
  { ignore?: boolean }
>;

export const listenerShouldIgnore = (action: Action): boolean =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (action as any).meta?.ignore === true;

const EMPTY_ARRAY: [] = [];

export const fallbackToEmptyArray = <T>(array: T[] | undefined) =>
  array === undefined || array.length === 0 ? EMPTY_ARRAY : array;
