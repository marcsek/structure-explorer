import type { Symbol } from "../Language";
import { Structure, type Valuation, type DomainElement } from "../Structure";
import Term from "./Term";

/**
 * Variable
 * @author Milan Cifra
 * @author Jozef Filip
 * @class
 * @extends Term
 */
class Variable extends Term {
  /**
   *
   * @param {string} name
   */
  constructor(public name: Symbol) {
    super();
  }

  /**
   * Return intepretation of variable.
   * @param {Structure} structure
   * @param {Map} e variables valuation
   * @return {DomainElement} domain item
   */
  eval(_: Structure, e: Valuation): DomainElement {
    const v = e.get(this.name);
    if (v === undefined) {
      throw new Error(`The variable ${this.name} is free,
        but it is not assigned any value by the variable assignment 𝑒.`);
    }
    return v;
  }

  /**
   * Return string representation of variable
   * @returns {DomainElement}
   */
  toString(): DomainElement {
    return this.name;
  }

  toTex(): string {
    return this.toString();
  }

  createCopy(): Variable {
    return new Variable(this.name);
  }

  getVariables(): Set<Symbol> {
    return new Set([this.name]);
  }
}

export default Variable;
