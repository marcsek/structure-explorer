import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import Constant from "../../model/term/Term.Constant";
import Variable from "../../model/term/Term.Variable";
import {
  type ErrorExpected,
  parseFormulaWithPrecedence,
  SyntaxError,
} from "@fmfi-uk-1-ain-412/js-fol-parser";
import Formula, {
  type SignedFormula,
  SignedFormulaType,
} from "../../model/formula/Formula";
import Term from "../../model/term/Term";
import FunctionTerm from "../../model/term/Term.FunctionTerm";
import PredicateAtom from "../../model/formula/Formula.PredicateAtom";
import EqualityAtom from "../../model/formula/Formula.EqualityAtom";
import Negation from "../../model/formula/Formula.Negation";
import Conjunction from "../../model/formula/Formula.Conjunction";
import Disjunction from "../../model/formula/Formula.Disjunction";
import Implication from "../../model/formula/Formula.Implication";
import Equivalence from "../../model/formula/Formula.Equivalence";
import ExistentialQuant from "../../model/formula/Formula.ExistentialQuant";
import { selectLanguage } from "../language/languageSlice";
import {
  selectParsedDomain,
  selectStructure,
} from "../structure/structureSlice";
import UniversalQuant from "../../model/formula/Formula.UniversalQuant";
import { selectValuation } from "../variables/variablesSlice";
import QuantifiedFormula from "../../model/formula/QuantifiedFormula";
import type { ReactNode } from "react";

export interface FormulaState {
  text: string;
  guess: boolean | null;
  locked: boolean;
  lockedGuess: boolean;
  gameChoices: {
    formula?: 0 | 1;
    element?: string;
    type: "alpha" | "beta" | "gamma" | "delta";
  }[];
}

export interface FormulasState {
  allFormulas: FormulaState[];
}

const initialState: FormulasState = {
  allFormulas: [],
};

function newFormulaState() {
  return {
    text: "",
    locked: false,
    lockedGuess: false,
    guess: null,
    gameChoices: [],
  };
}

export const formulasSlice = createSlice({
  name: "formulas",
  initialState,
  reducers: {
    importFormulasState: (_state, action: PayloadAction<string>) => {
      return JSON.parse(action.payload);
    },

    addFormula: (state) => {
      state.allFormulas.push(newFormulaState());
    },

    lockFormula: (state, action: PayloadAction<number>) => {
      state.allFormulas[action.payload].locked =
        !state.allFormulas[action.payload].locked;
    },

    lockFormulaGuess: (state, action: PayloadAction<number>) => {
      state.allFormulas[action.payload].lockedGuess =
        !state.allFormulas[action.payload].lockedGuess;
    },

    gameGoBack: (
      state,
      action: PayloadAction<{ id: number; index: number }>
    ) => {
      const { id, index } = action.payload;

      state.allFormulas[id].gameChoices.splice(index);
    },

    addAlpha: (
      state,
      action: PayloadAction<{
        id: number;
        formula: 0 | 1 | undefined;
      }>
    ) => {
      const { id, formula } = action.payload;

      state.allFormulas[id].gameChoices.push({
        formula: formula,
        type: "alpha",
      });
    },

    addBeta: (
      state,
      action: PayloadAction<{
        id: number;
        formula: 0 | 1 | undefined;
      }>
    ) => {
      const { id, formula } = action.payload;

      state.allFormulas[id].gameChoices.push({
        formula: formula,
        type: "beta",
      });
    },

    addGamma: (
      state,
      action: PayloadAction<{
        id: number;
        element: string;
      }>
    ) => {
      const { id, element } = action.payload;

      state.allFormulas[id].gameChoices.push({
        element: element,
        type: "gamma",
      });
    },

    addDelta: (
      state,
      action: PayloadAction<{
        id: number;
        element: string;
      }>
    ) => {
      const { id, element } = action.payload;

      state.allFormulas[id].gameChoices.push({
        element: element,
        type: "delta",
      });
    },

    removeFormula: (state, action: PayloadAction<number>) => {
      state.allFormulas.splice(action.payload, 1);
    },

    updateText: (
      state,
      action: PayloadAction<{ id: number; text: string }>
    ) => {
      const { id, text } = action.payload;
      state.allFormulas[id].text = text;
    },

    updateGuess: (
      state,
      action: PayloadAction<{ id: number; guess: boolean | null }>
    ) => {
      const { id, guess } = action.payload;
      state.allFormulas[id].guess = guess;
      state.allFormulas[id].gameChoices = [];
    },
  },
  extraReducers: (_builder) => {},
});

export const {
  addFormula,
  removeFormula,
  gameGoBack,
  addAlpha,
  addBeta,
  addGamma,
  addDelta,
  updateText,
  updateGuess,
  importFormulasState,
  lockFormula,
  lockFormulaGuess,
} = formulasSlice.actions;

export const selectFormulaGuess = (state: RootState, id: number) =>
  selectFormula(state, id).guess;

export const selectFormulaChoices = (state: RootState, id: number) =>
  selectFormula(state, id).gameChoices;

export const selectFormulas = (state: RootState) => state.formulas.allFormulas;
export const selectFormula = (state: RootState, id: number) =>
  state.formulas.allFormulas[id];

export const selectFormulaLock = (state: RootState, id: number) =>
  selectFormula(state, id).locked;

export const selectFormulaGuessLock = (state: RootState, id: number) =>
  selectFormula(state, id).lockedGuess;

export const selectEvaluatedFormula = createSelector(
  [selectLanguage, selectStructure, selectFormula, selectValuation],
  (language, structure, form, valuation) => {
    const factories = {
      variable: (symbol: string, _ee: ErrorExpected) => new Variable(symbol),
      constant: (symbol: string, _ee: ErrorExpected) => new Constant(symbol),
      functionApplication: (
        symbol: string,
        args: Array<Term>,
        ee: ErrorExpected
      ) => {
        language.checkFunctionArity(symbol, args, ee);
        return new FunctionTerm(symbol, args);
      },
      predicateAtom: (symbol: string, args: Array<Term>, ee: ErrorExpected) => {
        language.checkPredicateArity(symbol, args, ee);
        return new PredicateAtom(symbol, args);
      },
      equalityAtom: (lhs: Term, rhs: Term, _ee: ErrorExpected) =>
        new EqualityAtom(lhs, rhs),
      negation: (subf: Formula, _ee: ErrorExpected) => new Negation(subf),
      conjunction: (lhs: Formula, rhs: Formula, _ee: ErrorExpected) =>
        new Conjunction(lhs, rhs),
      disjunction: (lhs: Formula, rhs: Formula, _ee: ErrorExpected) =>
        new Disjunction(lhs, rhs),
      implication: (lhs: Formula, rhs: Formula, _ee: ErrorExpected) =>
        new Implication(lhs, rhs),
      equivalence: (lhs: Formula, rhs: Formula, _ee: ErrorExpected) =>
        new Equivalence(lhs, rhs),
      existentialQuant: (variable: string, subf: Formula, _ee: ErrorExpected) =>
        new ExistentialQuant(variable, subf),
      universalQuant: (variable: string, subf: Formula, _ee: ErrorExpected) =>
        new UniversalQuant(variable, subf),
    };

    //console.log(language);
    //console.log(structure);

    try {
      const formula = parseFormulaWithPrecedence(
        form.text,
        language.getParserLanguage(),
        factories
      );
      //error = formula.toString();

      const value = formula.eval(structure, valuation);
      return { evaluated: value, formula: formula };
    } catch (error) {
      if (error instanceof Error) {
        return { error: error };
      }

      if (error instanceof SyntaxError) {
        return { error: error };
      }
    }

    return {};
  }
);

export const selectCurrentGameFormula = createSelector(
  [selectFormulaChoices, selectEvaluatedFormula, selectFormulaGuess],
  (choices, { formula }, userGuess): SignedFormula => {
    let newFormula: SignedFormula = { sign: userGuess!, formula: formula! };

    for (const { formula, type } of choices) {
      if (
        newFormula.formula.getSignedSubFormulas(newFormula.sign).length === 0
      ) {
        return newFormula;
      }

      if (type === "alpha" || type === "beta") {
        newFormula = newFormula.formula.getSignedSubFormulas(newFormula.sign)[
          formula!
        ];
      }

      if (type === "delta" || type === "gamma") {
        newFormula = newFormula.formula.getSignedSubFormulas(
          newFormula.sign
        )[0];
      }
    }

    return newFormula;
  }
);

export const selectCurrentAssignment = createSelector(
  [
    selectFormulaChoices,
    selectEvaluatedFormula,
    selectValuation,
    selectFormulaGuess,
    selectParsedDomain,
  ],
  (choices, { formula }, e, userGuess, { parsed: domain }) => {
    let newFormula: SignedFormula = { sign: userGuess!, formula: formula! };

    let current = new Map(e);

    if (domain === undefined) {
      return current;
    }

    for (const { formula, element, type } of choices) {
      if (
        newFormula.formula.getSignedSubFormulas(newFormula.sign).length === 0
      ) {
        continue;
      }

      if (type === "alpha" || type === "beta") {
        newFormula = newFormula.formula.getSignedSubFormulas(newFormula.sign)[
          formula!
        ];
      }

      if (type === "delta" || type === "gamma") {
        let f = newFormula.formula;
        if (f instanceof QuantifiedFormula) {
          current.set(f.getVariableName(), element!);
          newFormula = newFormula.formula.getSignedSubFormulas(
            newFormula.sign
          )[0];
        }
      }
    }
    return current;
  }
);

export const selectGameButtons = createSelector(
  [
    selectCurrentGameFormula,
    selectParsedDomain,
    selectStructure,
    selectCurrentAssignment,
  ],
  ({ sign, formula }, { parsed: domain }, structure, e) => {
    console.log(`${sign === true ? "T" : "F"} ${formula.toString()}`);

    if (formula.getSignedSubFormulas(sign).length === 0) {
      return;
    }

    console.log(formula.getSignedType(sign));

    if (
      formula.getSignedType(sign) === SignedFormulaType.DELTA &&
      formula instanceof QuantifiedFormula
    ) {
      return {
        values: domain ?? [],
        elements: domain ?? [],
        type: "delta",
        variableName: formula.variableName,
      };
    }

    if (formula.getSignedType(sign) === SignedFormulaType.BETA) {
      return {
        values: formula
          .getSignedSubFormulas(sign)
          .map(
            ({ formula: f, sign: s }) =>
              `ℳ ${s === true ? "⊨" : "⊭"} ${f.toString()}`
          ),
        subformulas: formula.getSignedSubFormulas(sign),
        type: "beta",
      };
    }

    if (formula.getSignedType(sign) === SignedFormulaType.ALPHA) {
      let winners = formula.winningSubformulas(sign, structure, e);

      if (winners.length === 0) {
        winners = formula.getSignedSubFormulas(sign);
      }

      return {
        values: ["Continue"],
        subformulas: winners,
        type: "alpha",
      };
    }

    if (
      formula.getSignedType(sign) === SignedFormulaType.GAMMA &&
      formula instanceof QuantifiedFormula
    ) {
      let qf = formula;

      let winners = qf.winningElements(sign, structure, e);

      if (winners.length === 0) {
        winners = domain ?? ["domain error"];
      }

      return {
        values: ["Continue"],
        elements: winners,
        type: "gamma",
      };
    }
  }
);

export type BubbleFormat = {
  text: ReactNode;
  sender: "game" | "player";
  goBack?: number;
  win?: boolean;
  lose?: boolean;
};

export const selectHistoryData = createSelector(
  [
    selectFormulaChoices,
    selectEvaluatedFormula,
    selectFormulaGuess,
    selectValuation,
    selectStructure,
  ],
  (choices, { formula }, initialGuess, valuation, structure) => {
    const history: {
      sf: SignedFormula;
      valuation: Map<string, string>;
      type: "alpha" | "beta" | "gamma" | "delta";
      winFormula?: SignedFormula;
      winElement?: string;
    }[] = [];

    if (!formula) return [];

    let currentValuation = new Map(valuation);
    let currentFormula: SignedFormula = {
      sign: initialGuess!,
      formula: formula!,
    };

    let { formula: f, sign: s } = currentFormula;

    const addStep = () => {
      const type = f.getSignedType(s);
      const step: {
        sf: SignedFormula;
        valuation: Map<string, string>;
        type: "alpha" | "beta" | "gamma" | "delta";
        winFormula?: SignedFormula;
        winElement?: string;
      } = {
        sf: currentFormula,
        valuation: new Map(currentValuation),
        type,
      };

      if (type === "alpha") {
        step.winFormula = f.winningSubformulas(
          s,
          structure,
          currentValuation
        )[0];
      } else if (type === "gamma" && f instanceof QuantifiedFormula) {
        step.winElement = f.winningElements(s, structure, currentValuation)[0];
      }

      history.push(step);
    };

    try {
      addStep();
    } catch (error) {}

    for (const { formula: formulaIndex, element, type } of choices) {
      if (type === "alpha" || type === "beta") {
        currentFormula = f.getSignedSubFormulas(s)[formulaIndex!];
        f = currentFormula.formula;
        s = currentFormula.sign;
      } else if (
        (type === "gamma" || type === "delta") &&
        f instanceof QuantifiedFormula
      ) {
        const varName = f.getVariableName();
        currentValuation.set(varName, element!);

        currentFormula = f.getSignedSubFormulas(s)[0];
        f = currentFormula.formula;
        s = currentFormula.sign;
      }

      try {
        addStep();
      } catch (error) {}
    }

    return history;
  }
);

export const selectIsVerifiedGame = createSelector(
  [selectHistoryData, selectStructure],
  (data, structure) => {
    if (data.length === 0) return false;

    const last = data.at(-1);

    if (last === undefined) return false;
    try {
      return (
        (last.sf.formula instanceof PredicateAtom ||
          last.sf.formula instanceof EqualityAtom) &&
        last.sf.formula.eval(structure, last.valuation) === last.sf.sign
      );
    } catch (error) {
      return false;
    }
  }
);

export const selectGameResetIndex = createSelector(
  [
    selectHistoryData,
    selectStructure,
    selectFormulaChoices,
    selectParsedDomain,
  ],
  (data, structure, choices, domain) => {
    if (data.length === 0) return 0;

    let index = 0;

    for (const { sf, valuation } of data) {
      let prev = data[index - 1];

      if (prev === undefined) {
        index++;
        continue;
      }

      if (
        choices[index - 1] &&
        choices[index - 1].element !== undefined &&
        domain.error === undefined &&
        domain.parsed &&
        domain.parsed.includes(choices[index - 1].element!) === false
      ) {
        return index - 1;
      }

      let prevWinningFormula = undefined;

      try {
        prevWinningFormula =
          prev.type === "alpha" || prev.type === "beta"
            ? prev.sf.formula.winningSubformulas(
                prev.sf.sign,
                structure,
                prev.valuation
              )[0]
            : undefined;
      } catch (error) {}

      const prevWinningElementValue =
        (prev.type === "gamma" || prev.type === "delta") &&
        prev.sf.formula instanceof QuantifiedFormula
          ? prev.sf.formula.winningElements(
              prev.sf.sign,
              structure,
              prev.valuation
            )[0]
          : undefined;

      const prevWinningElementValues =
        (prev.type === "gamma" || prev.type === "delta") &&
        prev.sf.formula instanceof QuantifiedFormula
          ? prev.sf.formula.winningElements(
              prev.sf.sign,
              structure,
              prev.valuation
            )
          : undefined;

      console.log(prevWinningElementValues);

      const prevVariableName =
        prev.sf.formula instanceof QuantifiedFormula
          ? prev.sf.formula.variableName
          : undefined;

      const prevWinningFormulaStr = prevWinningFormula
        ? prevWinningFormula.formula.signedFormulaToString(
            prevWinningFormula.sign
          )
        : undefined;
      const currentFormulaStr = sf.formula.signedFormulaToString(sf.sign);
      if (
        prevWinningFormula &&
        prevWinningFormulaStr !== currentFormulaStr &&
        prev.sf.formula.eval(structure, prev.valuation) !== prev.sf.sign &&
        prev.type === "alpha"
      ) {
        return index - 1;
      }

      if (
        prevWinningElementValue !== undefined &&
        prevVariableName !== undefined &&
        valuation.get(prevVariableName) !== prevWinningElementValue &&
        prev.type === "gamma"
      ) {
        return index - 1;
      }
      index++;
    }

    console.log(data);

    return index;
  }
);

export default formulasSlice.reducer;
