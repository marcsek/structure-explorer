import Structure, { type DomainElement, type Valuation } from "../Structure";
import Formula, { type SignedFormula, SignedFormulaType } from "./Formula";
import type { Symbol } from "../Language";
import { dev } from "../../shared/core/logging";
import { latex } from "../../shared/core/utils";

abstract class QuantifiedFormula extends Formula {
  constructor(
    public variableName: string,
    public subFormula: Formula,
    public connective: string,
    public connectiveTex: string,
  ) {
    super([subFormula], connective, connectiveTex);
  }

  abstract eval(structure: Structure, e: Valuation): boolean;

  abstract getSignedType(sign: boolean): SignedFormulaType;

  getSignedSubFormulas(sign: boolean): SignedFormula[] {
    return [{ sign: sign, formula: this.subFormula }];
  }

  toString(): string {
    return `${this.connective}${
      this.variableName
    } ${this.subFormula.toString()}`;
  }

  toTex(): string {
    return `\\mathop{${this.connectiveTex} ${latex().escape(this.variableName).get()}} ${this.subFormula.toTex()}`;
  }

  getVariableName(): string {
    return this.variableName;
  }

  winningElements(
    sign: boolean,
    structure: Structure,
    e: Valuation,
    stableDomain?: string[],
  ): [DomainElement, number][] {
    return dev.timed("winningElements duration", () => {
      const domain = stableDomain ?? [...structure.domain];

      const signedFormula = this.getSignedSubFormulas(sign)[0];

      const cpy = new Map(e);

      let winning: [DomainElement, number][] = [];

      let idx = 0;
      for (const element of domain) {
        cpy.set(this.variableName, element);
        if (signedFormula.formula.eval(structure, cpy) !== signedFormula.sign) {
          winning.push([element, idx]);
        }
        idx++;
      }

      if (winning.length === 0) {
        winning = domain.map((e, idx) => [e, idx]);
      }

      return winning;
    });
  }

  getVariables(): Set<Symbol> {
    const variables = this.subFormula.getVariables();
    variables.add(this.variableName);
    return variables;
  }

  getFreeVariables(): Set<Symbol> {
    const variables = this.subFormula.getFreeVariables();
    variables.delete(this.variableName);
    return variables;
  }

  getSubFormulas(): Formula[] {
    return [this.subFormula];
  }
}

export default QuantifiedFormula;
