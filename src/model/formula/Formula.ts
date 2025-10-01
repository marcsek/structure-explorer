import Expression from "../Expression";
import type { Symbol } from "../Language";
import { Structure, type Valuation } from "../Structure";

export enum SignedFormulaType {
  ALPHA = "alpha",
  BETA = "beta",
  GAMMA = "gamma",
  DELTA = "delta",
}

export type SignedFormula = {
  sign: boolean;
  formula: Formula;
};

/**
 * Represent simple formula
 * @author Milan Cifra
 * @author Jozef Filip
 * @class
 * @abstract
 * @extends Expression
 */
abstract class Formula extends Expression {
  constructor(
    protected subFormulas: Formula[],
    protected connective: string,
    protected connectiveTex: string
  ) {
    super();
  }

  getSubFormulas(): Formula[] {
    return this.subFormulas;
  }

  toString(): string {
    return `(${this.getSubFormulas().join(` ${this.connective} `)})`;
  }

  toTex(): string {
    return `(${this.getSubFormulas().join(` ${this.connectiveTex} `)})`;
  }

  gameDepth(sign: boolean): number {
    return Math.max(
      ...this.getSignedSubFormulas(sign).map(({ formula: f }) =>
        f.gameDepth(sign)
      )
    ) +
      this.getSignedType(sign) ===
      SignedFormulaType.BETA ||
      this.getSignedType(sign) === SignedFormulaType.DELTA
      ? 2
      : 1;
  }

  signedFormulaToString(sign: boolean): string {
    return `${sign === true ? "T" : "F"} ${this.toString()}`;
  }

  winningSubformulas(
    sign: boolean,
    structure: Structure,
    e: Valuation
  ): SignedFormula[] {
    const formulas = this.getSignedSubFormulas(sign);

    let shortest = undefined;
    let winning: SignedFormula[] = [];

    for (const { sign, formula } of formulas) {
      let current = { sign: sign, formula: formula };
      if (formula.eval(structure, e) !== sign) {
        if (!shortest) {
          shortest = current;
          winning.push(shortest);
        }

        if (
          shortest.formula.gameDepth(shortest.sign) > formula.gameDepth(sign)
        ) {
          shortest = current;
          winning = [shortest];
        } else if (
          shortest.formula.gameDepth(shortest.sign) === formula.gameDepth(sign)
        ) {
          winning.push(current);
        }
      }
    }

    if (winning.length === 0) {
      return formulas;
    }

    return winning;
  }

  abstract eval(structure: Structure, e: Valuation): boolean;

  getVariables(): Set<Symbol> {
    const vars: Set<Symbol> = new Set();
    this.subFormulas.forEach((formula) =>
      formula.getVariables().forEach((variable) => vars.add(variable))
    );
    return vars;
  }

  abstract getSignedType(sign: boolean): SignedFormulaType;

  abstract getSignedSubFormulas(sign: boolean): SignedFormula[];
}

export default Formula;
