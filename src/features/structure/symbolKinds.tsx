import { createSelector } from "@reduxjs/toolkit";
import {
  selectValidatedConstants,
  selectValidatedFunctions,
  selectValidatedPredicates,
} from "../language/languageSlice";
import type { ValidationError } from "../../shared/core/errors";

export const selectConstantSymbols = createSelector(
  [selectValidatedConstants],
  ({ parsed, error }) => ({ parsed: [...parsed], error }),
);

const toArraySelection = ({
  parsed,
  error,
}: {
  parsed: Map<string, number>;
  error?: ValidationError;
}) => ({
  parsed: [...parsed].map(([name, arity]) => ({ name, arity })),
  error,
});

export const selectPredicateSymbols = createSelector(
  [selectValidatedPredicates],
  toArraySelection,
);

export const selectFunctionSymbols = createSelector(
  [selectValidatedFunctions],
  toArraySelection,
);
