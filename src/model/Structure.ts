/**
 * Represent components_parts
 * @author Milan Cifra
 * @author Jozef Filip
 * @author Jakub Marček
 * @class
 */

import { type Symbol, Language } from "./Language";

export type DomainElement = string;

export type Valuation = Map<Symbol, DomainElement>;

const tupleKey = (tuple: DomainElement[]) => tuple.join(",");

export class Structure {
  private readonly iPKeys = new Map<Symbol, Set<string>>();
  private readonly iFValues = new Map<Symbol, Map<string, DomainElement>>();

  /**
   *
   * @param {Language} language
   */

  constructor(
    public language: Language,
    public domain: Set<DomainElement>,
    public iC: Map<Symbol, DomainElement>,
    public iP: Map<Symbol, Set<DomainElement[]>>,
    public iF: Map<Symbol, Map<DomainElement[], DomainElement>>,
  ) {
    // Indexes tuples for faster lookups.
    for (const [symbol, predicateSet] of iP) {
      const keys = new Set<string>();
      for (const element of predicateSet) keys.add(tupleKey(element));

      this.iPKeys.set(symbol, keys);
    }

    for (const [symbol, functionMap] of iF) {
      const values = new Map<string, DomainElement>();
      for (const [key, value] of functionMap) values.set(tupleKey(key), value);

      this.iFValues.set(symbol, values);
    }
  }

  iPHas(symbol: Symbol, tuple: DomainElement[]): boolean {
    const keys = this.iPKeys.get(symbol);
    if (!keys) return false;

    return keys.has(tupleKey(tuple));
  }

  iFHas(symbol: Symbol, tuple: DomainElement[]): boolean {
    const values = this.iFValues.get(symbol);
    if (!values) return false;

    return values.has(tupleKey(tuple));
  }

  iFGet(symbol: Symbol, tuple: DomainElement[]): DomainElement | undefined {
    const values = this.iFValues.get(symbol);
    if (!values) return undefined;

    return values.get(tupleKey(tuple));
  }
}

export default Structure;
