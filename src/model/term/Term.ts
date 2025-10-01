import Expression from "../Expression";
import type { Symbol } from "../Language";
import Structure, { type DomainElement } from "../Structure";

/**
 * Represent simple term.
 * @author Milan Cifra
 * @author Jozef Filip
 * @class
 * @abstract
 *
 */
abstract class Term extends Expression {
  abstract eval(
    structure: Structure,
    e: Map<Symbol, DomainElement>
  ): DomainElement;
}

export default Term;
