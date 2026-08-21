import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk, RootState } from "../../app/store";
import {
  parseFormulaWithPrecedence,
  SyntaxError,
} from "@fmfi-uk-1-ain-412/js-fol-parser";
import {
  type SignedFormula,
  SignedFormulaType,
} from "../../model/formula/Formula";
import PredicateAtom from "../../model/formula/Formula.PredicateAtom";
import EqualityAtom from "../../model/formula/Formula.EqualityAtom";
import { selectLanguage } from "../language/languageSlice";
import {
  selectValidatedDomain,
  selectStructure,
  selectDomain,
} from "../structure/structureSlice";
import { selectValuation } from "../variables/variablesSlice";
import QuantifiedFormula from "../../model/formula/QuantifiedFormula";
import type { SerializedFormulasState } from "./validationSchema";
import type Language from "../../model/Language";
import type Structure from "../../model/Structure";
import { dev } from "../../shared/core/logging";
import { plural, toBe } from "../../shared/core/wordForms";
import { getFormulaFactories } from "../../shared/core/formulas";
import { getRandomElement } from "../../shared/core/utils";

export interface FormulaState {
  name?: string;
  text: string;
  guess: boolean | null;
  locked: boolean;
  lockedGuess: boolean;
  gameChoices: {
    formula?: number;
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

        if (state.allFormulas[idx].text !== action.payload[name])
          state.allFormulas[idx].gameChoices = [];

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
    },

    addAlpha: (
      state,
      action: PayloadAction<{
        id: number;
        formula: number | undefined;
      }>,
    ) => {
      const { id, formula } = action.payload;

      state.allFormulas[id].gameChoices.push({ formula, type: "alpha" });
    },

    addBeta: (
      state,
      action: PayloadAction<{
        id: number;
        formula: number | undefined;
      }>,
    ) => {
      const { id, formula } = action.payload;

      state.allFormulas[id].gameChoices.push({ formula, type: "beta" });
    },

    addGamma: (
      state,
      action: PayloadAction<{
        id: number;
        element: string;
      }>,
    ) => {
      const { id, element } = action.payload;

      state.allFormulas[id].gameChoices.push({ element, type: "gamma" });
    },

    addDelta: (
      state,
      action: PayloadAction<{
        id: number;
        element: string;
      }>,
    ) => {
      const { id, element } = action.payload;

      state.allFormulas[id].gameChoices.push({ element, type: "delta" });
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
  formText: string,
  valuation: Map<string, string>,
) => {
  dev.time(`selectEvaluatedFormula duration (${formText})`);

  const factories = getFormulaFactories(language);

  try {
    const formula = parseFormulaWithPrecedence(
      formText,
      language.getParserLanguage(),
      factories,
    );

    const freeVariables = formula.getFreeVariables();
    const unsetFreeVars = [...freeVariables].filter((v) => !valuation.has(v));

    const unsetFreeVarsLen = unsetFreeVars.length;
    if (unsetFreeVars.length > 0) {
      const correctPluralVars = plural(unsetFreeVarsLen, "variable");
      const correctPluralVerb = toBe(unsetFreeVarsLen);

      return {
        error: new Error(
          `The ${correctPluralVars} ${unsetFreeVars.join(", ")} ${correctPluralVerb} free, 
but ${correctPluralVerb} not assigned any value by the variable assignment 𝑒.`,
        ),
      };
    }

    const evaluated = formula.eval(structure, valuation);

    dev.timeEnd(`selectEvaluatedFormula duration (${formText})`);

    return { evaluated, formula };
  } catch (error) {
    if (error instanceof Error) {
      dev.timeEnd(`selectEvaluatedFormula duration (${formText})`);

      return { error: error };
    }

    if (error instanceof SyntaxError) {
      dev.timeEnd(`selectEvaluatedFormula duration (${formText})`);

      return { error: error };
    }
  }

  dev.timeEnd(`selectEvaluatedFormula duration (${formText})`);

  return {};
};

export const selectEvaluatedFormula = createSelector(
  [selectLanguage, selectStructure, selectFormula, selectValuation],
  (language, structure, form, valuation) =>
    evaluateFormula(language, structure, form.text, valuation),
);

export const selectEvaluatedFormulas = createSelector(
  [selectLanguage, selectStructure, selectFormulas, selectValuation],
  (language, structure, allFormulas, valuation) =>
    allFormulas.map((form) =>
      evaluateFormula(language, structure, form.text, valuation),
    ),
);

export const selectCurrentGameFormula = createSelector(
  [selectFormulaChoices, selectEvaluatedFormula, selectFormulaGuess],
  (choices, { formula }, userGuess): SignedFormula => {
    let newFormula: SignedFormula = { sign: userGuess!, formula: formula! };

    for (const { formula, type } of choices) {
      const subs = newFormula.formula.getSignedSubFormulas(newFormula.sign);

      if (subs.length === 0) {
        return newFormula;
      }

      if (type === "delta" || type === "gamma") {
        newFormula = subs[0];
        continue;
      }

      if (formula === undefined || formula >= subs.length) {
        return newFormula;
      }

      newFormula = subs[formula];
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
    const current = new Map(e);

    if (domain === undefined) {
      return current;
    }

    for (const { formula, element, type } of choices) {
      if (!newFormula) return current;

      const subs = newFormula.formula.getSignedSubFormulas(newFormula.sign);

      if (subs.length === 0) {
        continue;
      }

      if (type === "alpha" || type === "beta") {
        newFormula = subs[formula ?? 0];
        continue;
      }

      const uFormula = newFormula.formula;

      if (uFormula instanceof QuantifiedFormula && element) {
        current.set(uFormula.getVariableName(), element);
      }

      newFormula = subs[0];
    }

    return current;
  },
);

interface HistoryStep {
  sf: SignedFormula;
  rootFormulaEval: boolean;
  valuation: Map<string, string>;
  type: "alpha" | "beta" | "gamma" | "delta";
  winFormula?: SignedFormula;
  winElement?: string;
  winIndex?: number;
}

function getStep(
  signedFormula: SignedFormula,
  valuation: Map<string, string>,
  structure: Structure,
  stableDomain: string[],
  rootFormulaEval: boolean,
  choiceIndex?: number,
) {
  const { formula, sign } = signedFormula;
  const type = formula.getSignedType(sign);

  const step: HistoryStep = {
    sf: signedFormula,
    rootFormulaEval,
    valuation,
    type,
  };

  const subFormulas = formula.getSignedSubFormulas(sign);

  if (type === "beta" || type === "delta" || subFormulas.length === 0) {
    return step;
  }

  step.winIndex = choiceIndex;

  if (type === "alpha") {
    const winFormulas = formula.winningSubformulas(sign, structure, valuation);
    const wFormulasStrings = winFormulas.map(([{ formula }]) =>
      formula.signedFormulaToString(sign),
    );

    // If win index is invalid, set it to any winIndex. This will enable
    // selectGameResetIndex to reset properly.
    // TODO: Cut-off history here?
    if (
      step.winIndex === undefined ||
      !wFormulasStrings.includes(
        subFormulas[step.winIndex].formula.signedFormulaToString(sign) ?? "",
      )
    ) {
      const [, wFormulaIndex] = winFormulas[0];
      step.winIndex = wFormulaIndex;
    }

    step.winFormula = subFormulas[step.winIndex];
  }

  if (type === "gamma" && formula instanceof QuantifiedFormula) {
    const winElements = formula.winningElements(
      sign,
      structure,
      valuation,
      stableDomain,
    );
    const wElementsIndexes = winElements.map(([, idx]) => idx);

    if (
      step.winIndex === undefined ||
      !wElementsIndexes.includes(step.winIndex)
    ) {
      const [, wElementIndex] = winElements[0];
      step.winIndex = wElementIndex;
    }

    step.winElement = stableDomain[step.winIndex];
  }

  dev.log("STEP", step);
  return step;
}

export const selectHistoryData = createSelector(
  [
    selectFormulaChoices,
    selectEvaluatedFormula,
    selectFormulaGuess,
    selectValuation,
    selectStructure,
    selectDomain,
  ],
  (
    choices,
    { formula, evaluated },
    initialGuess,
    valuation,
    structure,
    { value: domain },
  ) => {
    const history: HistoryStep[] = [];

    if (!formula || evaluated === undefined || initialGuess === null) {
      return [];
    }

    dev.time("selectHistoryData duration");

    const addHistoryStep = (
      signedFormula: SignedFormula,
      valuation: Map<string, string>,
      choiceIndex?: number,
    ) => {
      try {
        history.push(
          getStep(
            signedFormula,
            valuation,
            structure,
            domain,
            evaluated,
            choiceIndex,
          ),
        );
      } catch (error) {
        console.error(error);
      }
    };

    let curSignedFormula: SignedFormula = { sign: initialGuess, formula };
    let curValuation = new Map(valuation);

    for (const { formula: formulaIndex, element, type } of choices) {
      const { formula: curFormula, sign } = curSignedFormula;

      // If formula and choice type don't match, cut-off history
      if (curFormula.getSignedType(sign) !== type) {
        if (history.length) history.pop();
        break;
      }

      if (type === "alpha" || type === "beta") {
        const nextFormula =
          curFormula.getSignedSubFormulas(sign)[formulaIndex!];

        if (!nextFormula) {
          break;
        }

        addHistoryStep(curSignedFormula, new Map(curValuation), formulaIndex);

        curSignedFormula = nextFormula;
      } else if (curFormula instanceof QuantifiedFormula) {
        const varName = curFormula.getVariableName();
        const nextValuation = new Map(curValuation);
        const nextFormula = curFormula.getSignedSubFormulas(sign)[0];

        nextValuation.set(varName, element!);

        if (!nextFormula) {
          break;
        }

        const elementIdx = domain.indexOf(element ?? "");
        const choiceIdx = elementIdx === -1 ? undefined : elementIdx;

        addHistoryStep(curSignedFormula, curValuation, choiceIdx);

        curSignedFormula = nextFormula;
        curValuation = nextValuation;
      }
    }

    addHistoryStep(curSignedFormula, curValuation);

    dev.log(history);
    dev.timeEnd("selectHistoryData duration");

    return history;
  },
);

export function getDiffAndNew(
  a: Map<string, string>,
  b: Map<string, string>,
): Map<string, string> {
  return new Map(
    Array.from(b.entries()).filter(
      ([key, value]) => !a.has(key) || a.get(key) !== value,
    ),
  );
}

export const selectGameButtons = createSelector(
  [
    selectCurrentGameFormula,
    selectValidatedDomain,
    selectHistoryData,
    selectValuation,
  ],
  ({ sign, formula }, { parsed: domain }, history, initialValuation) => {
    const latestHistory = history.at(-1);

    if (formula.getSignedSubFormulas(sign).length === 0 || !latestHistory) {
      return;
    }

    const signedType = formula.getSignedType(sign);

    switch (signedType) {
      case SignedFormulaType.ALPHA:
        return { type: "alpha" } as const;

      case SignedFormulaType.BETA: {
        const valuationDiff = getDiffAndNew(
          initialValuation,
          latestHistory?.valuation ?? new Map(),
        );

        return {
          type: "beta",
          subFormulas: formula.getSignedSubFormulas(sign),
          valuationDiff,
        } as const;
      }

      case SignedFormulaType.GAMMA:
        return { type: "gamma" } as const;

      case SignedFormulaType.DELTA:
        return {
          type: "delta",
          elements: domain ?? [],
          variableName: (formula as QuantifiedFormula).variableName,
        } as const;
    }
  },
);

export const selectIsVerifiedGame = createSelector(
  [selectHistoryData, selectStructure],
  (data, structure) => {
    if (data.length === 0) return undefined;

    const last = data.at(-1);
    const first = data.at(0);

    if (last === undefined || first === undefined) return undefined;

    const lastFormula = last.sf.formula;

    try {
      if (
        lastFormula instanceof PredicateAtom ||
        lastFormula instanceof EqualityAtom
      ) {
        const originallyCorrect = first.rootFormulaEval === first.sf.sign;
        const didWin =
          lastFormula.eval(structure, last.valuation) === last.sf.sign;

        if (originallyCorrect && !didWin) return undefined;

        return didWin;
      }
    } catch (error) {
      console.error(error);
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

    dev.time("selectGameResetIndex duration");
    let index = 0;

    for (const { sf, valuation } of data) {
      const prev = data[index - 1];

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
        dev.timeEnd("selectGameResetIndex duration");
        return index - 1;
      }

      const prevWinningFormula =
        prev.type === "alpha" || prev.type === "beta"
          ? prev.winFormula
          : undefined;

      const prevWinningElementValue =
        (prev.type === "gamma" || prev.type === "delta") &&
        prev.sf.formula instanceof QuantifiedFormula
          ? prev.winElement
          : undefined;

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
        dev.timeEnd("selectGameResetIndex duration");
        return index - 1;
      }

      if (
        prevWinningElementValue !== undefined &&
        prevVariableName !== undefined &&
        valuation.get(prevVariableName) !== prevWinningElementValue &&
        prev.type === "gamma"
      ) {
        dev.timeEnd("selectGameResetIndex duration");
        return index - 1;
      }
      index++;
    }

    dev.timeEnd("selectGameResetIndex duration");

    return index;
  },
);

export const updateFormulaText =
  ({ id, text }: { id: number; text: string }): AppThunk =>
  (dispatch, getState) => {
    const language = selectLanguage(getState());
    const structure = selectStructure(getState());
    const valuation = selectValuation(getState());

    const prevText = getState().present.formulas.allFormulas[id].text;
    const previous = evaluateFormula(language, structure, prevText, valuation);

    const current = evaluateFormula(language, structure, text, valuation);

    if (
      previous.formula &&
      current.formula &&
      previous.formula.toString() !== current.formula.toString()
    ) {
      dispatch(gameGoBack({ id, index: 0 }));
    }

    dispatch(updateText({ id, text }));
  };

export type GameChoice =
  | { id: number; type: "alpha" }
  | { id: number; formula: number; type: "beta" }
  | { id: number; type: "gamma" }
  | { id: number; element: string; type: "delta" };

export const addGameChoice =
  (gameChoice: GameChoice): AppThunk =>
  (dispatch, getState) => {
    const { id } = gameChoice;

    if (gameChoice.type === "beta") {
      dispatch(addBeta({ id, formula: gameChoice.formula }));
      return;
    } else if (gameChoice.type === "delta") {
      dispatch(addDelta({ id, element: gameChoice.element }));
      return;
    }

    const state = getState();
    const { sign, formula } = selectCurrentGameFormula(state, id);
    const struct = selectStructure(getState());
    const valuation = selectCurrentAssignment(state, id);

    if (gameChoice.type === "alpha") {
      const winFormulas = formula.winningSubformulas(sign, struct, valuation);
      const [, winFormulaIndex] = getRandomElement(winFormulas);

      dispatch(addAlpha({ id, formula: winFormulaIndex }));
    } else if (
      gameChoice.type === "gamma" &&
      formula instanceof QuantifiedFormula
    ) {
      const winElements = formula.winningElements(sign, struct, valuation);
      const [wElement] = getRandomElement(winElements);

      dispatch(addGamma({ id, element: wElement }));
    }
  };

export default formulasSlice.reducer;
