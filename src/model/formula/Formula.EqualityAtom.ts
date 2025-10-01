import Structure, { type Valuation } from "../Structure";
import Term from "../term/Term";
import Formula, { type SignedFormula, SignedFormulaType } from "./Formula";

/**
 * Represent equality symbol
 * @author Milan Cifra
 * @author Jozef Filip
 * @class
 * @extends Formula
 */
class EqualityAtom extends Formula {
  /**
   *
   * @param {Term} subLeft
   * @param {Term} subRight
   */
  constructor(public subLeft: Term, public subRight: Term) {
    super([], "=", "=");
  }

  /**
   *
   * @param {Structure} structure
   * @param {Map} e
   * @return {boolean}
   */
  eval(structure: Structure, e: Valuation): boolean {
    return this.subLeft.eval(structure, e) === this.subRight.eval(structure, e);
  }

  /**
   *
   * @returns {string}
   */
  toString(): string {
    return `${this.subLeft.toString()} = ${this.subRight.toString()}`;
  }

  toTex(): string {
    return this.toString();
  }

  getSubFormulas() {
    return [];
  }

  getSignedType(_sign: boolean): SignedFormulaType {
    return SignedFormulaType.ALPHA;
  }

  getSignedSubFormulas(_sign: boolean): SignedFormula[] {
    return [];
  }
}

export default EqualityAtom;
