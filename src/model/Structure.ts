/**
 * Represent components_parts
 * @author Milan Cifra
 * @author Jozef Filip
 * @class
 */

import { type Symbol, Language } from "./Language";

export type DomainElement = string;

export type Valuation = Map<Symbol, DomainElement>;

export class Structure {
  /**
   *
   * @param {Language} language
   */

  constructor(
    public language: Language,
    public domain: Set<DomainElement>,
    public iC: Map<Symbol, DomainElement>,
    public iP: Map<Symbol, Set<DomainElement[]>>,
    public iF: Map<Symbol, Map<DomainElement[], DomainElement>>
  ) {}

  iPHas(symbol: Symbol, tuple: DomainElement[]): boolean {
    const predicateSet = this.iP.get(symbol);
    if (!predicateSet) return false;

    let has = false;
    predicateSet.forEach((element) => {
      if (JSON.stringify(element) === JSON.stringify(tuple)) {
        has = true;
        return true;
      }
    });

    return has;
  }

  iFHas(symbol: Symbol, tuple: DomainElement[]): boolean {
    const functionMap = this.iF.get(symbol);
    if (!functionMap) return false;

    let has = false;
    functionMap.forEach((_, key) => {
      if (JSON.stringify(key) === JSON.stringify(tuple)) {
        has = true;
        return true;
      }
    });

    return has;
  }

  iFGet(symbol: Symbol, tuple: DomainElement[]): DomainElement | undefined {
    const functionMap = this.iF.get(symbol);
    if (!functionMap) return undefined;

    let element = "";
    functionMap.forEach((value, key) => {
      if (JSON.stringify(key) === JSON.stringify(tuple)) {
        element = value;
        return true;
      }
    });

    return element;
  }
}

export default Structure;
