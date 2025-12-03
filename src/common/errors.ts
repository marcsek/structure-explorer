import { type Location } from "@fmfi-uk-1-ain-412/js-fol-parser";

export interface BaseError {
  kind: string;
  message: string;
}

export interface SyntaxError extends BaseError {
  kind: "syntax";
  location: Location;
}

export interface ValidationError extends BaseError {
  kind: "validation";
}

export const createValidationError = (message: string): ValidationError => {
  return { kind: "validation", message };
};

export type InterpretationError = SyntaxError | ValidationError;
