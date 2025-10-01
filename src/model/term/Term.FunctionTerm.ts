import Structure, { type DomainElement, type Valuation } from "../Structure";
import type { Symbol } from "../Language";
import Term from "./Term";

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
  constructor(public name: string, public terms: Term[]) {
    super();
  }

  /**
   * Return intepretation of function.
   * @param {Structure} structure
   * @param {Map} e variables valuation
   * @returns {string} domain item
   */
  eval(structure: Structure, e: Valuation): DomainElement {
    let interpretedParams: string[] = [];
    this.terms.forEach((term) => {
      interpretedParams.push(term.eval(structure, e));
    });

    const interpretation = structure.iF.get(this.name);

    if (interpretation === undefined) {
      throw new Error(
        `The interpretation of the function symbol ${this.name} is not defined.`
      );
    }

    const interpretedValue = structure.iFGet(this.name, interpretedParams);

    if (interpretedValue === undefined) {
      throw new Error(
        `The interpretation of the function symbol ${this.name} for ${
          interpretedParams.length > 1
            ? `(${interpretedParams})`
            : interpretedParams
        } is not defined`
      );
    }
    return interpretedValue;
  }

  /**
   * Return string representation of function term
   * @returns {string}
   */
  toString(): string {
    let res = this.name + "(";
    for (let i = 0; i < this.terms.length; i++) {
      if (i > 0) {
        res += ", ";
      }
      res += this.terms[i].toString();
    }
    res += ")";
    return res;
  }

  toTex(): string {
    return this.toString();
  }

  getVariables(): Set<Symbol> {
    const vars: Set<Symbol> = new Set();
    this.terms.forEach((term) =>
      term.getVariables().forEach((variable) => vars.add(variable))
    );
    return vars;
  }
}

export default FunctionTerm;
