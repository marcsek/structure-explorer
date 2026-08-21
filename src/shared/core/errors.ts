import { type Location } from "@fmfi-uk-1-ain-412/js-fol-parser";

export interface BaseError {
  kind: string;
  message: string;
}

export interface SyntaxError extends BaseError {
  kind: "syntax";
  location?: Location;
}

export interface SemanticError extends BaseError {
  kind: "semantic";
  repairable: boolean;
}

export const createSemanticError = (
  message: string,
  repairable = false,
): SemanticError => {
  return { kind: "semantic", message, repairable };
};

export type InterpretationError = SyntaxError | SemanticError;
