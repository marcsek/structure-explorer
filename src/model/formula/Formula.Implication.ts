import Structure, { type Valuation } from "../Structure";
import Formula, { type SignedFormula, SignedFormulaType } from "./Formula";

/**
 * Represent implication
 * @author Milan Cifra
 * @author Jozef Filip
 * @class
 * @extends Formula
 */
class Implication extends Formula {
  /**
   *
   * @param {Formula} subLeft
   * @param {Formula} subRight
   */

  constructor(public subLeft: Formula, public subRight: Formula) {
    super([subLeft, subRight], "→", "\\rightarrow");
    this.subLeft = subLeft;
    this.subRight = subRight;
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
    return !left || right;
  }

  getSubFormulas(): Formula[] {
    return [this.subLeft, this.subRight];
  }

  getSignedType(sign: boolean): SignedFormulaType {
    return sign ? SignedFormulaType.BETA : SignedFormulaType.ALPHA;
  }
  getSignedSubFormulas(sign: boolean): SignedFormula[] {
    return [
      { sign: !sign, formula: this.subLeft },
      { sign: sign, formula: this.subRight },
    ];
  }
}

export default Implication;
