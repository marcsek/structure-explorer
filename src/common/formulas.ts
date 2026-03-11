import type { ErrorExpected } from "@fmfi-uk-1-ain-412/js-fol-parser";
import Conjunction from "../model/formula/Formula.Conjunction";
import Disjunction from "../model/formula/Formula.Disjunction";
import EqualityAtom from "../model/formula/Formula.EqualityAtom";
import Equivalence from "../model/formula/Formula.Equivalence";
import ExistentialQuant from "../model/formula/Formula.ExistentialQuant";
import Implication from "../model/formula/Formula.Implication";
import Negation from "../model/formula/Formula.Negation";
import PredicateAtom from "../model/formula/Formula.PredicateAtom";
import UniversalQuant from "../model/formula/Formula.UniversalQuant";
import type Term from "../model/term/Term";
import Constant from "../model/term/Term.Constant";
import FunctionTerm from "../model/term/Term.FunctionTerm";
import Variable from "../model/term/Term.Variable";
import type Language from "../model/Language";
import type Formula from "../model/formula/Formula";
import type { InterpretationError } from "./errors";
import { createSelector } from "@reduxjs/toolkit";
import { selectStructureErrors } from "../features/structure/structureSlice";
import { selectLanguageErrors } from "../features/language/languageSlice";
import { selectValidatedVariables } from "../features/variables/variablesSlice";

export function getFormulaFactories(language: Language) {
  return {
    variable: (symbol: string) => new Variable(symbol),
    constant: (symbol: string) => new Constant(symbol),
    functionApplication: (
      symbol: string,
      args: Array<Term>,
      ee: ErrorExpected,
    ) => {
      language.checkFunctionArity(symbol, args, ee);
      return new FunctionTerm(symbol, args);
    },
    predicateAtom: (symbol: string, args: Array<Term>, ee: ErrorExpected) => {
      language.checkPredicateArity(symbol, args, ee);
      return new PredicateAtom(symbol, args);
    },
    equalityAtom: (lhs: Term, rhs: Term) => new EqualityAtom(lhs, rhs),
    negation: (subf: Formula) => new Negation(subf),
    conjunction: (lhs: Formula, rhs: Formula) => new Conjunction(lhs, rhs),
    disjunction: (lhs: Formula, rhs: Formula) => new Disjunction(lhs, rhs),
    implication: (lhs: Formula, rhs: Formula) => new Implication(lhs, rhs),
    equivalence: (lhs: Formula, rhs: Formula) => new Equivalence(lhs, rhs),
    existentialQuant: (variable: string, subf: Formula) =>
      new ExistentialQuant(variable, subf),
    universalQuant: (variable: string, subf: Formula) =>
      new UniversalQuant(variable, subf),
  };
}

export function getErrorMessageFromValidation(
  errors: Partial<{
    languageError: InterpretationError;
    structureError: InterpretationError;
    variablesError: InterpretationError;
  }>,
) {
  const locations: string[] = [];

  if (errors.languageError) locations.push("language");
  if (errors.structureError) locations.push("structure");
  if (errors.variablesError) locations.push("variable assignment");

  if (locations.length === 0) return "";
  return `There are errors in: ${locations.join(", ")}.`;
}

export const selectNonFormulaValidationError = createSelector(
  [selectStructureErrors, selectLanguageErrors, selectValidatedVariables],
  (structureError, languageError, { error: variablesError }) => {
    return getErrorMessageFromValidation({
      languageError,
      structureError,
      variablesError,
    });
  },
);
