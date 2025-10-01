import Structure, { type Valuation } from "../Structure";
import Formula, { type SignedFormula, SignedFormulaType } from "./Formula";

/**
 * Represent conjunction
 * @author Milan Cifra
 * @author Jozef Filip
 * @class
 * @extends Formula
 */
class Conjunction extends Formula {
  /**
   *
   * @param {Formula} subLeft
   * @param {Formula} subRight
   */
  constructor(public subLeft: Formula, public subRight: Formula) {
    super([subLeft, subRight], " ∧ ", "\\land");
  }

  /**
   *
   * @param {Structure} structure
   * @param {Map} e variables valuation
   * @return {boolean}
   */
  eval(structure: Structure, e: Valuation): boolean {
    const left = this.subLeft.eval(structure, e);
    const right = this.subRight.eval(structure, e);
    return left && right;
  }

  getSubFormulas() {
    return [this.subLeft, this.subRight];
  }

  getSignedType(sign: boolean): SignedFormulaType {
    return sign ? SignedFormulaType.ALPHA : SignedFormulaType.BETA;
  }
  getSignedSubFormulas(sign: boolean): SignedFormula[] {
    return [
      { sign: sign, formula: this.subLeft },
      { sign: sign, formula: this.subRight },
    ];
  }
}

export default Conjunction;
