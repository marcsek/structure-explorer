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
  selectValidatedDomain,
  selectStructure,
} from "../structure/structureSlice";
import UniversalQuant from "../../model/formula/Formula.UniversalQuant";
import { selectValuation } from "../variables/variablesSlice";
import QuantifiedFormula from "../../model/formula/QuantifiedFormula";
import type { ReactNode } from "react";
import type { SerializedFormulasState } from "./validationSchema";
import type Language from "../../model/Language";
import type Structure from "../../model/Structure";

export interface FormulaState {
  name?: string;
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

export const initialFormulasState: FormulasState = {
  allFormulas: [],
};

type NewFormulaOptions = {
  name?: string;
  text?: string;
};

function newFormulaState(options: NewFormulaOptions = {}): FormulaState {
  return {
    name: options.name,
    text: options.text ?? "",
    locked: false,
    lockedGuess: false,
    guess: null,
    gameChoices: [],
  };
}

export const formulasSlice = createSlice({
  name: "formulas",
  initialState: initialFormulasState,
  reducers: {
    importFormulasState: (
      _state,
      action: PayloadAction<SerializedFormulasState>,
    ) => {
      return action.payload;
    },

    addFormulas: (
      state,
      action: PayloadAction<NewFormulaOptions[] | undefined>,
    ) => {
      if (!action.payload) {
        state.allFormulas.push(newFormulaState());
      } else {
        action.payload.forEach((options) =>
          state.allFormulas.push(newFormulaState(options)),
        );
      }
    },

    syncContextFormulas(state, action: PayloadAction<Record<string, string>>) {
      state.allFormulas.forEach(({ name }, idx) => {
        if (!name || !(name in action.payload)) return;
        state.allFormulas[idx].text = action.payload[name];
      });
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
      action: PayloadAction<{ id: number; index: number }>,
    ) => {
      const { id, index } = action.payload;

      state.allFormulas[id].gameChoices.splice(index);
      console.log(
        "AFTER BACK",
        state.allFormulas[id].gameChoices.splice(index),
      );
    },

    addAlpha: (
      state,
      action: PayloadAction<{
        id: number;
        formula: 0 | 1 | undefined;
      }>,
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
      }>,
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
      }>,
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
      }>,
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
      action: PayloadAction<{ id: number; text: string }>,
    ) => {
      const { id, text } = action.payload;
      state.allFormulas[id].text = text;
    },

    updateGuess: (
      state,
      action: PayloadAction<{ id: number; guess: boolean | null }>,
    ) => {
      const { id, guess } = action.payload;
      state.allFormulas[id].guess = guess;
      state.allFormulas[id].gameChoices = [];
    },
  },
});

export const {
  addFormulas,
  removeFormula,
  gameGoBack,
  addAlpha,
  addBeta,
  addGamma,
  addDelta,
  updateText,
  syncContextFormulas,
  updateGuess,
  importFormulasState,
  lockFormula,
  lockFormulaGuess,
} = formulasSlice.actions;

export const selectFormulaGuess = (state: RootState, id: number) =>
  selectFormula(state, id).guess;

export const selectFormulaChoices = (state: RootState, id: number) =>
  selectFormula(state, id).gameChoices;

export const selectFormulas = (state: RootState) =>
  state.present.formulas.allFormulas;
export const selectFormula = (state: RootState, id: number) =>
  state.present.formulas.allFormulas[id];

export const selectFormulaLock = (state: RootState, id: number) =>
  selectFormula(state, id).locked;

export const selectFormulaGuessLock = (state: RootState, id: number) =>
  selectFormula(state, id).lockedGuess;

const evaluateFormula = (
  language: Language,
  structure: Structure,
  form: FormulaState,
  valuation: Map<string, string>,
) => {
  console.time("selectEvaluatedFormula duration");
  const factories = {
    variable: (symbol: string, _ee: ErrorExpected) => new Variable(symbol),
    constant: (symbol: string, _ee: ErrorExpected) => new Constant(symbol),
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

  try {
    const formula = parseFormulaWithPrecedence(
      form.text,
      language.getParserLanguage(),
      factories,
    );

    const value = formula.eval(structure, valuation);
    console.timeEnd("selectEvaluatedFormula duration");
    return { evaluated: value, formula: formula };
  } catch (error) {
    console.log("ERROR");
    if (error instanceof Error) {
      return { error: error };
    }

    if (error instanceof SyntaxError) {
      console.timeEnd("selectEvaluatedFormula duration");
      return { error: error };
    }
  }

  console.timeEnd("selectEvaluatedFormula duration");
  return {};
};

export const selectEvaluatedFormula = createSelector(
  [selectLanguage, selectStructure, selectFormula, selectValuation],
  (language, structure, form, valuation) =>
    evaluateFormula(language, structure, form, valuation),
);

export const selectEvaluatedFormulas = createSelector(
  [selectLanguage, selectStructure, selectFormulas, selectValuation],
  (language, structure, allFormulas, valuation) =>
    allFormulas.map((form) =>
      evaluateFormula(language, structure, form, valuation),
    ),
);

export const selectCurrentGameFormula = createSelector(
  [selectFormulaChoices, selectEvaluatedFormula, selectFormulaGuess],
  (choices, { formula }, userGuess): SignedFormula => {
    let newFormula: SignedFormula = { sign: userGuess!, formula: formula! };

    console.log("SELECT CUR", newFormula, choices, userGuess);

    for (const { formula, type } of choices) {
      let newPotentialFormula: SignedFormula | undefined = undefined;

      if (
        newFormula.formula.getSignedSubFormulas(newFormula.sign).length === 0
      ) {
        return newFormula;
      }

      if (type === "alpha" || type === "beta") {
        newPotentialFormula = newFormula.formula.getSignedSubFormulas(
          newFormula.sign,
        )[formula!];
      }

      if (type === "delta" || type === "gamma") {
        newPotentialFormula = newFormula.formula.getSignedSubFormulas(
          newFormula.sign,
        )[0];
      }

      if (!newPotentialFormula) return newFormula;
      newFormula = newPotentialFormula;
    }

    return newFormula;
  },
);

export const selectCurrentAssignment = createSelector(
  [
    selectFormulaChoices,
    selectEvaluatedFormula,
    selectValuation,
    selectFormulaGuess,
    selectValidatedDomain,
  ],
  (choices, { formula }, e, userGuess, { parsed: domain }) => {
    let newFormula: SignedFormula = { sign: userGuess!, formula: formula! };

    console.time("selectCurrentAssignment duration");
    let current = new Map(e);

    if (domain === undefined) {
      return current;
    }

    for (const { formula, element, type } of choices) {
      if (
        !newFormula ||
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
            newFormula.sign,
          )[0];
        }
      }
    }
    console.timeEnd("selectCurrentAssignment duration");
    return current;
  },
);

export const selectGameButtons = createSelector(
  [
    selectCurrentGameFormula,
    selectValidatedDomain,
    selectStructure,
    selectCurrentAssignment,
  ],
  ({ sign, formula }, { parsed: domain }, structure, e) => {
    console.time("selectGameButtons duration");

    if (formula.getSignedSubFormulas(sign).length === 0) {
      console.timeEnd("selectGameButtons duration");
      return;
    }

    if (
      formula.getSignedType(sign) === SignedFormulaType.DELTA &&
      formula instanceof QuantifiedFormula
    ) {
      console.timeEnd("selectGameButtons duration");
      return {
        values: domain ?? [],
        elements: domain ?? [],
        type: "delta",
        variableName: formula.variableName,
      };
    }

    if (formula.getSignedType(sign) === SignedFormulaType.BETA) {
      console.timeEnd("selectGameButtons duration");
      return {
        values: formula
          .getSignedSubFormulas(sign)
          .map(
            ({ formula: f, sign: s }) =>
              `ℳ ${s === true ? "⊨" : "⊭"} ${f.toString()}`,
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

      console.timeEnd("selectGameButtons duration");
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

      console.timeEnd("selectGameButtons duration");
      return {
        values: ["Continue"],
        elements: winners,
        type: "gamma",
      };
    }
  },
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

    console.time("selectHistoryData duration");

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
          currentValuation,
        )[0];
      } else if (type === "gamma" && f instanceof QuantifiedFormula) {
        step.winElement = f.winningElements(s, structure, currentValuation)[0];
      }

      history.push(step);
    };

    try {
      addStep();
    } catch (error) {}

    console.log("FORMULA", formula, choices, history);
    for (const { formula: formulaIndex, element, type } of choices) {
      console.log("CURRENT", f);

      // If type doesn't match choice's type, cut-off history
      if (f.getSignedType(s) !== type) {
        if (history.length) history.pop();
        break;
      }

      if (type === "alpha" || type === "beta") {
        const subs = f.getSignedSubFormulas(s);
        currentFormula = f.getSignedSubFormulas(s)[formulaIndex!];

        console.log("CURRENT FORMULA AL", currentFormula);
        console.log("CURRENT SUBS", f.getSignedSubFormulas(s));

        // If type matches choice's type, but the selected formula doesn't exist
        // TODO: Is that possible?
        if (!currentFormula) {
          break;
        }

        f = currentFormula.formula;
        s = currentFormula.sign;
      } else if (
        (type === "gamma" || type === "delta") &&
        f instanceof QuantifiedFormula
      ) {
        const varName = f.getVariableName();
        currentValuation.set(varName, element!);
        currentFormula = f.getSignedSubFormulas(s)[0];

        console.log("CURRENT FORMULA GAM", currentFormula);
        console.log("CURRENT SUBS", f.getSignedSubFormulas(s));

        // Same as above
        if (!currentFormula) {
          break;
        }

        f = currentFormula.formula;
        s = currentFormula.sign;
      }

      try {
        addStep();
      } catch (error) {}
    }

    console.timeEnd("selectHistoryData duration");
    return history;
  },
);

export const selectIsVerifiedGame = createSelector(
  [selectHistoryData, selectStructure],
  (data, structure) => {
    if (data.length === 0) return false;

    const last = data.at(-1);

    if (last === undefined) return false;

    console.time("selectIsVerifiedGame duration");
    try {
      console.timeEnd("selectIsVerifiedGame duration");
      return (
        (last.sf.formula instanceof PredicateAtom ||
          last.sf.formula instanceof EqualityAtom) &&
        last.sf.formula.eval(structure, last.valuation) === last.sf.sign
      );
    } catch (error) {
      console.timeEnd("selectIsVerifiedGame duration");
      return false;
    }
  },
);

export const selectGameResetIndex = createSelector(
  [
    selectHistoryData,
    selectStructure,
    selectFormulaChoices,
    selectValidatedDomain,
  ],
  (data, structure, choices, domain) => {
    if (data.length === 0) return 0;

    console.time("selectGameResetIndex duration");
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
        console.timeEnd("selectGameResetIndex duration");
        return index - 1;
      }

      let prevWinningFormula = undefined;

      try {
        prevWinningFormula =
          prev.type === "alpha" || prev.type === "beta"
            ? prev.sf.formula.winningSubformulas(
                prev.sf.sign,
                structure,
                prev.valuation,
              )[0]
            : undefined;
      } catch (error) {}

      const prevWinningElementValue =
        (prev.type === "gamma" || prev.type === "delta") &&
        prev.sf.formula instanceof QuantifiedFormula
          ? prev.sf.formula.winningElements(
              prev.sf.sign,
              structure,
              prev.valuation,
            )[0]
          : undefined;

      // const prevWinningElementValues =
      //   (prev.type === "gamma" || prev.type === "delta") &&
      //   prev.sf.formula instanceof QuantifiedFormula
      //     ? prev.sf.formula.winningElements(
      //         prev.sf.sign,
      //         structure,
      //         prev.valuation,
      //       )
      //     : undefined;
      //
      // console.log(prevWinningElementValues);

      const prevVariableName =
        prev.sf.formula instanceof QuantifiedFormula
          ? prev.sf.formula.variableName
          : undefined;

      const prevWinningFormulaStr = prevWinningFormula
        ? prevWinningFormula.formula.signedFormulaToString(
            prevWinningFormula.sign,
          )
        : undefined;
      const currentFormulaStr = sf.formula.signedFormulaToString(sf.sign);
      if (
        prevWinningFormula &&
        prevWinningFormulaStr !== currentFormulaStr &&
        prev.sf.formula.eval(structure, prev.valuation) !== prev.sf.sign &&
        prev.type === "alpha"
      ) {
        console.timeEnd("selectGameResetIndex duration");
        return index - 1;
      }

      if (
        prevWinningElementValue !== undefined &&
        prevVariableName !== undefined &&
        valuation.get(prevVariableName) !== prevWinningElementValue &&
        prev.type === "gamma"
      ) {
        console.timeEnd("selectGameResetIndex duration");
        return index - 1;
      }
      index++;
    }

    console.timeEnd("selectGameResetIndex duration");
    return index;
  },
);

export default formulasSlice.reducer;
