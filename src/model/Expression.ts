/**
 * Represent expression in logic
 * @author Milan Cifra
 * @author Jozef Filip
 * @class
 * @abstract
 */
import type { Symbol } from "./Language";
import { type DomainElement, Structure } from "./Structure";

abstract class Expression {
  abstract toString(): string;
  abstract toTex(): string;

  abstract eval(
    structure: Structure,
    e: Map<Symbol, DomainElement>
  ): DomainElement | boolean;

  abstract getVariables(): Set<Symbol>;
}

export default Expression;
