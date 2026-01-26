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

const EMPTY_ARRAY: [] = [];

export const fallbackToEmptyArray = <T>(array: T[] | undefined) =>
  array === undefined || array.length === 0 ? EMPTY_ARRAY : array;
