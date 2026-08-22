import {
  parseFormulaWithPrecedence,
  SyntaxError as ParserSyntaxError,
  type FormulaFactories,
} from "@fmfi-uk-1-ain-412/js-fol-parser";
import Conjunction from "../../model/formula/Formula.Conjunction";
import Disjunction from "../../model/formula/Formula.Disjunction";
import EqualityAtom from "../../model/formula/Formula.EqualityAtom";
import Equivalence from "../../model/formula/Formula.Equivalence";
import ExistentialQuant from "../../model/formula/Formula.ExistentialQuant";
import Implication from "../../model/formula/Formula.Implication";
import Negation from "../../model/formula/Formula.Negation";
import PredicateAtom from "../../model/formula/Formula.PredicateAtom";
import UniversalQuant from "../../model/formula/Formula.UniversalQuant";
import type Term from "../../model/term/Term";
import Constant from "../../model/term/Term.Constant";
import FunctionTerm from "../../model/term/Term.FunctionTerm";
import Variable from "../../model/term/Term.Variable";
import type Language from "../../model/Language";
import type Formula from "../../model/formula/Formula";
import {
  createEvaluationError,
  createSyntaxError,
  type EvaluationError,
  type InterpretationError,
  type SyntaxError,
} from "./errors";
import ThrownEvaluationError from "../../model/EvaluationError";
import type {
  DomainElement,
  Structure,
  Valuation,
} from "../../model/Structure";
import { createSelector } from "@reduxjs/toolkit";
import { selectStructureErrors } from "../../features/structure/structureSlice";
import { selectFirstLanguageError } from "../../features/language/languageSlice";
import { selectValidatedVariables } from "../../features/variables/variablesSlice";

export function getFormulaFactories(
  language: Language,
): FormulaFactories<Term, Formula> {
  return {
    variable: (symbol) => new Variable(symbol),
    constant: (symbol) => new Constant(symbol),
    functionApplication(symbol, args, ee) {
      language.checkFunctionArity(symbol, args, ee);
      return new FunctionTerm(symbol, args);
    },
    predicateAtom(symbol, args, ee) {
      language.checkPredicateArity(symbol, args, ee);
      return new PredicateAtom(symbol, args);
    },
    equalityAtom: (lhs, rhs) => new EqualityAtom(lhs, rhs),
    negation: (subf) => new Negation(subf),
    conjunction: (lhs, rhs) => new Conjunction(lhs, rhs),
    disjunction: (lhs, rhs) => new Disjunction(lhs, rhs),
    implication: (lhs, rhs) => new Implication(lhs, rhs),
    equivalence: (lhs, rhs) => new Equivalence(lhs, rhs),
    existentialQuant: (variable, subf) => new ExistentialQuant(variable, subf),
    universalQuant: (variable, subf) => new UniversalQuant(variable, subf),
  };
}

export type ParsedFormula =
  | { formula: Formula; error?: undefined }
  | { formula?: undefined; error: SyntaxError };

export function parseFormula(text: string, language: Language): ParsedFormula {
  try {
    return {
      formula: parseFormulaWithPrecedence(
        text,
        language.getParserLanguage(),
        getFormulaFactories(language),
      ),
    };
  } catch (error) {
    if (error instanceof ParserSyntaxError) {
      return { error: createSyntaxError(error.message, error.location) };
    }

    throw error;
  }
}

export type Evaluated<T> =
  | { value: T; error?: undefined }
  | { value?: undefined; error: EvaluationError };

export function safeEval<T extends DomainElement | boolean>(
  expression: { eval: (structure: Structure, e: Valuation) => T },
  structure: Structure,
  valuation: Valuation,
): Evaluated<T> {
  try {
    return { value: expression.eval(structure, valuation) };
  } catch (error) {
    if (error instanceof ThrownEvaluationError) {
      return {
        error: createEvaluationError(error.reason, error.symbol, error.message),
      };
    }

    throw error;
  }
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
  [selectStructureErrors, selectFirstLanguageError, selectValidatedVariables],
  (structureError, languageError, { error: variablesError }) => {
    return getErrorMessageFromValidation({
      languageError,
      structureError,
      variablesError,
    });
  },
);
