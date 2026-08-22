import { type Location } from "@fmfi-uk-1-ain-412/js-fol-parser";
import type { EvaluationErrorReason } from "../../model/EvaluationError";

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

export interface EvaluationError extends BaseError {
  kind: "evaluation";
  reason: EvaluationErrorReason;
  symbol: string;
}

export const createSyntaxError = (
  message: string,
  location?: Location,
): SyntaxError => {
  return { kind: "syntax", message, location };
};

export const createSemanticError = (
  message: string,
  repairable = false,
): SemanticError => {
  return { kind: "semantic", message, repairable };
};

export const createEvaluationError = (
  reason: EvaluationErrorReason,
  symbol: string,
  message: string,
): EvaluationError => {
  return { kind: "evaluation", reason, symbol, message };
};

export type InterpretationError = SyntaxError | SemanticError;
