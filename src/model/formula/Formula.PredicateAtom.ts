import Formula, { type SignedFormula, SignedFormulaType } from "./Formula";
import Term from "../term/Term";
import Structure, { type Valuation } from "../Structure";
import type { Symbol } from "../Language";
import EvaluationError from "../EvaluationError";

/**
 * Represent predicate symbol
 * @author Milan Cifra
 * @author Jozef Filip
 * @class
 * @extends Formula
 */
class PredicateAtom extends Formula {
  /**
   *
   * @param {string} name
   * @param {Term[]} terms
   */
  constructor(
    public name: string,
    public terms: Term[] = [],
  ) {
    super([], "", "");
  }

  /**
   *
   * @param {Structure} structure
   * @param {Map} e
   * @return {boolean}
   */
  eval(structure: Structure, e: Valuation): boolean {
    const translatedTerms = this.terms.map((term) => term.eval(structure, e));

    const interpretation = structure.iP.get(this.name);

    if (interpretation === undefined) {
      throw new EvaluationError(
        "undefinedPredicate",
        this.name,
        `The interpretation of the predicate symbol ${this.name} is not defined`,
      );
    }

    return structure.iPHas(this.name, translatedTerms);
  }

  /**
   *
   * @returns {string}
   */
  toString(): string {
    return `${this.name}(${this.terms.join(", ")})`;
  }

  toTex(): string {
    const escapedName = this.name.replace(/_/g, "\\_");
    return `\\text{${escapedName}}(${this.terms.map((t) => t.toTex()).join(", ")})`;
  }

  getSubFormulas(): Formula[] {
    return [];
  }

  getSignedType(): SignedFormulaType {
    return SignedFormulaType.ALPHA;
  }
  getSignedSubFormulas(): SignedFormula[] {
    return [];
  }

  getVariables(): Set<Symbol> {
    return new Set(this.terms.flatMap((t) => [...t.getVariables()]));
  }

  getFreeVariables(): Set<Symbol> {
    return this.getVariables();
  }
}

export default PredicateAtom;
