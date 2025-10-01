import Structure, { type Valuation } from "../Structure";
import Formula, { type SignedFormula, SignedFormulaType } from "./Formula";
import Implication from "./Formula.Implication";

/**
 * Represent equality symbol
 * @author Richard Toth
 * @author Jozef Filip
 * @class
 * @extends Formula
 */
class Equivalence extends Formula {
  /**
   *
   * @param {Formula} subLeft
   * @param {Formula} subRight
   */
  constructor(public subLeft: Formula, public subRight: Formula) {
    super([subLeft, subRight], "↔", "\\leftrightarrow");
  }

  /**
   *
   * @param {Structure} structure
   * @param {Map} e
   * @return {boolean}
   */
  eval(structure: Structure, e: Valuation): boolean {
    const left = this.subLeft.eval(structure, e);
    const right = this.subRight.eval(structure, e);
    return left === right;
  }

  /**
   *
   * @returns {string}
   */
  toString(): string {
    return `(${this.subLeft.toString()} ↔ ${this.subRight.toString()})`;
  }

  toTex(): string {
    return `(${this.subLeft.toString()} ${
      this.connective
    } ${this.subRight.toString()})`;
  }

  getSubFormulas(): Formula[] {
    const toRightImpl = new Implication(this.subLeft, this.subRight);
    const toLeftImpl = new Implication(this.subRight, this.subLeft);
    return [toRightImpl, toLeftImpl];
  }

  getSignedType(sign: boolean): SignedFormulaType {
    return sign ? SignedFormulaType.ALPHA : SignedFormulaType.BETA;
  }
  getSignedSubFormulas(sign: boolean): SignedFormula[] {
    const toRightImpl = new Implication(this.subLeft, this.subRight);
    const toLeftImpl = new Implication(this.subRight, this.subLeft);

    return [
      { sign: sign, formula: toLeftImpl },
      { sign: sign, formula: toRightImpl },
    ];
  }
}

export default Equivalence;
