/**
 * Represent language of logic
 * @author Milan Cifra
 * @author Jozef Filip
 * @class
 */
import { type Language as ParserLanguage } from "@fmfi-uk-1-ain-412/js-fol-parser";
import Term from "./term/Term";
export type Symbol = string;

export class Language {
  constructor(
    public constants: Set<Symbol>,
    public predicates: Map<Symbol, number>,
    public functions: Map<Symbol, number>
  ) {}

  /**
   *
   * These functions are temporarly here until the grammar changes
   *
   *
   */

  getParserLanguage(): ParserLanguage {
    let nonLogicalSymbols = new Set([
      ...this.constants,
      ...this.functions.keys(),
      ...this.predicates.keys(),
    ]);
    console.log(nonLogicalSymbols);

    return {
      isConstant: (symbol: string): boolean => this.constants.has(symbol),
      isFunction: (symbol: string): boolean => this.functions.has(symbol),
      isPredicate: (symbol: string): boolean => this.predicates.has(symbol),
      isVariable: (symbol: string): boolean => !nonLogicalSymbols.has(symbol),
    };
  }

  checkFunctionArity(
    symbol: string,
    args: Term[],
    ee: { expected: (arg0: string) => void }
  ) {
    const a = this.functions.get(symbol);

    if (args.length !== a) {
      ee.expected(`${a} argument${a == 1 ? "" : "s"} to ${symbol}`);
    }
  }

  checkPredicateArity(
    symbol: string,
    args: Term[],
    ee: { expected: (arg0: string) => void }
  ) {
    const a = this.predicates.get(symbol);

    if (args.length !== a) {
      ee.expected(`${a} argument${a == 1 ? "" : "s"} to ${symbol}`);
    }
  }

  hasConstant(constantName: string): boolean {
    return this.constants.has(constantName);
  }

  hasPredicate(predicateName: string): boolean {
    return this.predicates.has(predicateName);
  }

  hasFunction(functionName: string): boolean {
    return this.functions.has(functionName);
  }

  /**
   * Return arity of the predicate
   * @param {string} predicateName
   * @return {int} arity of the predicate
   */
  getPredicate(predicateName: string): number {
    return this.predicates.get(predicateName)!;
  }
}

export default Language;
