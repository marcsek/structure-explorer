import type { Symbol } from "./Language";

export type EvaluationErrorReason =
  | "undefinedConstant"
  | "undefinedFunction"
  | "undefinedFunctionValue"
  | "undefinedPredicate"
  | "unassignedVariable";

/**
 * Represents error thrown by {@link Expression.eval}.
 * @author Jakub Marček
 * @class
 */
export class EvaluationError extends Error {
  constructor(
    public readonly reason: EvaluationErrorReason,
    public readonly symbol: Symbol,
    message: string,
  ) {
    super(message);
    this.name = "EvaluationError";
  }
}

export default EvaluationError;
