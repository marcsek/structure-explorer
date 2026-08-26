import Structure, { type DomainElement, type Valuation } from "../Structure";
import type { Symbol } from "../Language";
import Term from "./Term";
import EvaluationError from "../EvaluationError";

/**
 * Represent function term
 * @author Milan Cifra
 * @author Jozef Filip
 * @class
 * @extends Term
 */
class FunctionTerm extends Term {
  /**
   *
   * @param {string} name name of the function
   * @param {Term[]} terms parameters of function
   */
  constructor(
    public name: string,
    public terms: Term[],
  ) {
    super();
  }

  /**
   * Return intepretation of function.
   * @param {Structure} structure
   * @param {Map} e variables valuation
   * @returns {string} domain item
   */
  eval(structure: Structure, e: Valuation): DomainElement {
    const interpretedParams: string[] = [];
    this.terms.forEach((term) => {
      interpretedParams.push(term.eval(structure, e));
    });

    const interpretation = structure.iF.get(this.name);

    if (interpretation === undefined) {
      throw new EvaluationError(
        "undefinedFunction",
        this.name,
        `The interpretation of the function symbol ${this.name} is not defined.`,
      );
    }

    const interpretedValue = structure.iFGet(this.name, interpretedParams);

    if (interpretedValue === undefined) {
      throw new EvaluationError(
        "undefinedFunctionValue",
        this.name,
        `The interpretation of the function symbol ${this.name} is not defined for ${
          interpretedParams.length > 1
            ? `(${interpretedParams})`
            : interpretedParams
        }.`,
      );
    }
    return interpretedValue;
  }

  /**
   * Return string representation of function term
   * @returns {string}
   */
  toString(): string {
    return `${this.name}(${this.terms.map((t) => t.toString()).join(", ")})`;
  }

  toTex(): string {
    const escapedName = this.name.replace(/_/g, "\\_");
    return `\\text{${escapedName}}(${this.terms.map((t) => t.toTex()).join(", ")})`;
  }

  getVariables(): Set<Symbol> {
    const vars: Set<Symbol> = new Set();
    this.terms.forEach((term) =>
      term.getVariables().forEach((variable) => vars.add(variable)),
    );
    return vars;
  }
}

export default FunctionTerm;
