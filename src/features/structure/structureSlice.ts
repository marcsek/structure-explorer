import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import {
  selectLanguage,
  selectParsedConstants,
  selectParsedFunctions,
  selectParsedPredicates,
  type PayloadActionSource,
} from "../language/languageSlice";
import Structure, { type DomainElement } from "../../model/Structure";
import type { Symbol } from "../../model/Language";
import type { ValidationError } from "../textView/textViewSlice";
import { createValidationError } from "../../common/errors";
import { prepareWithSourceMeta } from "../../common/redux";

export interface InterpretationState {
  text: string;
  locked: boolean;
}

export interface BaseStructureState {
  locked: boolean;
}

export interface DomainInterpretationState extends BaseStructureState {
  value: string[];
}

export interface ConstantInterpretationState extends BaseStructureState {
  value: string;
}

export interface TupleInterpretationState extends BaseStructureState {
  value: string[][];
}

export interface StructureState {
  domain: DomainInterpretationState;
  iC: Record<string, ConstantInterpretationState>;
  iP: Record<string, TupleInterpretationState>;
  iF: Record<string, TupleInterpretationState>;
}

const initialState: StructureState = {
  domain: { value: [], locked: false },
  iC: {},
  iP: {},
  iF: {},
};

export const structureSlice = createSlice({
  name: "structure",
  initialState,
  reducers: {
    importStructureState(_state, action: PayloadAction<string>) {
      return JSON.parse(action.payload);
    },

    updateDomain: {
      reducer(state, action: PayloadActionSource<string[]>) {
        state.domain.value = action.payload;
      },
      prepare: prepareWithSourceMeta<string[]>,
    },

    lockDomain(state) {
      state.domain.locked = !state.domain.locked;
    },

    updateInterpretationConstants: {
      reducer(
        state,
        action: PayloadActionSource<{
          key: string;
          value: ConstantInterpretationState["value"];
        }>,
      ) {
        const { key, value } = action.payload;

        if (state.iC[key]) state.iC[key].value = value;
        else state.iC[key] = { value, locked: false };
      },

      prepare: prepareWithSourceMeta<{
        key: string;
        value: ConstantInterpretationState["value"];
      }>,
    },

    lockInterpretationConstants(state, action: PayloadAction<{ key: string }>) {
      const { key } = action.payload;

      if (!state.iC[key]) state.iC[key] = { value: "", locked: false };

      state.iC[key].locked = !state.iC[key].locked;
    },

    updateInterpretationPredicates: {
      reducer(
        state,
        action: PayloadActionSource<{
          key: string;
          value: TupleInterpretationState["value"];
        }>,
      ) {
        const { key, value } = action.payload;

        if (state.iP[key]) state.iP[key].value = value;
        else state.iP[key] = { value: value, locked: false };
      },

      prepare: prepareWithSourceMeta<{
        key: string;
        value: TupleInterpretationState["value"];
      }>,
    },

    lockInterpretationPredicates(
      state,
      action: PayloadAction<{ key: string }>,
    ) {
      const { key } = action.payload;

      if (!state.iP[key]) state.iP[key] = { value: [], locked: false };

      state.iP[key].locked = !state.iP[key].locked;
    },

    updateFunctionSymbols: {
      reducer(
        state,
        action: PayloadActionSource<{
          key: string;
          value: TupleInterpretationState["value"];
        }>,
      ) {
        const { key, value } = action.payload;

        if (state.iF[key]) state.iF[key].value = value;
        else state.iF[key] = { value, locked: false };
      },

      prepare: prepareWithSourceMeta<{
        key: string;
        value: TupleInterpretationState["value"];
      }>,
    },

    lockFunctionSymbols(state, action: PayloadAction<{ key: string }>) {
      const { key } = action.payload;

      if (!state.iF[key]) state.iF[key] = { value: [], locked: false };

      state.iF[key].locked = !state.iF[key].locked;
    },
  },
});

export const selectDomain = (state: RootState) => state.structure.domain;
export const selectDomainLock = (state: RootState) =>
  state.structure.domain.locked;

export const selectIc = (state: RootState) => state.structure.iC;
export const selectIcName = (state: RootState, name: string) =>
  state.structure.iC[name];
export const selectIcLock = (state: RootState, name: string) =>
  state.structure.iC[name]?.locked ?? false;

export const selectIp = (state: RootState) => state.structure.iP;
export const selectIpName = (state: RootState, name: string) =>
  state.structure.iP[name];
export const selectIpLock = (state: RootState, name: string) =>
  state.structure.iP[name]?.locked ?? false;

export const selectIf = (state: RootState) => state.structure.iF;
export const selectIfName = (state: RootState, name: string) =>
  state.structure.iF[name];
export const selectIfLock = (state: RootState, name: string) =>
  state.structure.iF[name]?.locked ?? false;

export const selectDomainValidation = createSelector(
  [(state: RootState) => state.structure.domain],
  ({ value: domain }) => {
    if (domain.length === 0)
      return createValidationError("Domain cannot be empty");

    return { error: undefined };
  },
);

export const selectParsedDomain = createSelector(
  [selectDomainValidation, (state: RootState) => state.structure.domain],
  ({ error }, { value }) => {
    if (error) return { error };

    return { parsed: value };
  },
);

export const selectConstantsInterpretationValidation = createSelector(
  [selectIcName, selectParsedDomain],
  (constant, domain) => {
    if (!constant || constant.value === "")
      return createValidationError("Interpretation must be defined");

    if (!domain.parsed || !domain.parsed.includes(constant.value))
      return createValidationError("This element is not in domain.");

    return { error: undefined };
  },
);

export const selectParsedConstant = createSelector(
  [selectConstantsInterpretationValidation, selectIcName],
  ({ error }, iC) => {
    return { error, parsed: iC?.value };
  },
);

export const selectPredicatesInterpretationValidation = createSelector(
  [
    selectIpName,
    selectParsedDomain,
    selectParsedPredicates,
    (_: RootState, name: string) => name,
  ],
  (interpretation, domain, preds, name) => {
    if (!preds.parsed) return undefined;
    if (!domain.parsed) return undefined;
    if (!interpretation) return undefined;

    const arity = preds.parsed.get(name);
    const size = arity === 1 ? "element" : `${arity}-tuple`;

    let error: { error?: ValidationError } = { error: undefined };

    for (const tuple of interpretation.value) {
      if (tuple.length !== arity) {
        const actual_size = tuple.length === 1 ? "element" : `${arity}-tuple`;
        error = createValidationError(
          `(${tuple}) is a ${actual_size}, but should be a ${size}, becasue aritiy of ${name} is ${arity}`,
        );
        break;
      }

      for (const element of tuple) {
        if (domain.parsed.includes(element) === false) {
          error = createValidationError(`Element ${element} is not in domain.`);
          break;
        }
      }

      for (const tuple2 of interpretation.value) {
        if (
          JSON.stringify(tuple) === JSON.stringify(tuple2) &&
          tuple != tuple2
        ) {
          error = createValidationError(
            `${size} (${tuple}) is already in predicate.`,
          );

          break;
        }
      }
    }

    return error;
  },
);

export const selectParsedPredicate = createSelector(
  [selectPredicatesInterpretationValidation, selectIpName],
  (error, iP) => {
    if (!error) return {};

    return { parsed: iP?.value, error: error.error };
  },
);

function getAllPossibleCombinations(arr: string[], size: number): string[][] {
  const result: string[][] = [];

  const generateCombinations = (current: string[]) => {
    if (current.length === size) {
      result.push([...current]);
      return;
    }

    for (let i = 0; i < arr.length; i++) {
      current.push(arr[i]);
      generateCombinations(current);
      current.pop();
    }
  };

  generateCombinations([]);
  return result;
}

export const selectFunctionsInterpretationValidation = createSelector(
  [
    selectIfName,
    selectParsedDomain,
    selectParsedFunctions,
    (_: RootState, name: string) => name,
  ],
  (interpretation, domain, functions, name) => {
    if (!functions.parsed) return undefined;
    if (!domain.parsed) return undefined;

    const arity = functions.parsed.get(name) ?? 0;
    let all = getAllPossibleCombinations(domain.parsed, arity);
    let examples = all.slice(0, 3).map((element) => `(${element.join(",")})`);

    if (!interpretation || interpretation.value.length === 0) {
      const examplePrints = all.length <= 3 ? `${examples}` : `${examples}...`;
      const actualSize = all[0].length === 1 ? "elements" : `${arity}-tuples`;

      return createValidationError(
        `Function is not fully defined, for example these ${actualSize} do not have assigned value: ${examplePrints}`,
      );
    }

    const size = arity === 1 ? "element" : `${arity + 1}-tuple`;

    let error: { error?: ValidationError } = { error: undefined };

    interpretation.value.forEach((tuple) => {
      if (arity !== undefined && tuple.length != arity + 1) {
        const actual_size = tuple.length === 1 ? "element" : `${arity}-tuple`;
        error = createValidationError(
          `(${tuple}) is a ${actual_size}, but should be a ${size}, becasue aritiy of ${name} is ${arity}. Format is: (n-elements,mapped_element)`,
        );
        return;
      }

      tuple.forEach((element) => {
        if (!domain.parsed.includes(element)) {
          error = createValidationError(`Element ${element} is not in domain.`);
          return;
        }
      });

      if (error.error) return error;

      interpretation.value.forEach((tuple2) => {
        if (
          JSON.stringify(tuple.slice(0, -1)) ===
            JSON.stringify(tuple2.slice(0, -1)) &&
          tuple != tuple2
        ) {
          tuple = tuple.slice(0, -1);
          const actual_size = tuple.length === 1 ? "element" : `${arity}-tuple`;
          error = createValidationError(
            `${actual_size} (${tuple}) has already defined value.`,
          );
        }
      });

      if (
        all.filter(
          (i) => JSON.stringify(i) === JSON.stringify(tuple.slice(0, -1)),
        ).length === 1
      ) {
        all = all.filter(
          (i) => JSON.stringify(i) !== JSON.stringify(tuple.slice(0, -1)),
        );
        examples = all.slice(0, 3).map((element) => `(${element.join(",")})`);
      }
    });

    if (!error.error && all.length !== 0) {
      const examplePrints = all.length <= 3 ? `${examples}` : `${examples}...`;
      const actual_size = all[0].length === 1 ? "elements" : `${arity}-tuples`;
      error = createValidationError(
        `Function is not fully defined, for example these ${actual_size} do not have assigned value: ${examplePrints}`,
      );
    }

    return error;
  },
);

export const selectParsedFunction = createSelector(
  [selectFunctionsInterpretationValidation, selectIfName],
  (error, iF) => {
    if (!error) return {};

    return { parsed: iF?.value, error: error.error };
  },
);

export const selectStructureErrors = createSelector(
  [
    (state: RootState) => state,
    selectParsedConstants,
    selectParsedPredicates,
    selectParsedFunctions,
    selectParsedDomain,
  ],
  (state, constants, predicates, functions, domain) => {
    if (domain.error !== undefined) return false;

    for (const name of constants.parsed ?? []) {
      if (selectParsedConstant(state, name).error !== undefined) {
        return false;
      }
    }

    for (const [name] of predicates.parsed ?? []) {
      if (selectParsedPredicate(state, name).error !== undefined) {
        return false;
      }
    }

    for (const [name] of functions.parsed ?? []) {
      if (selectParsedFunction(state, name).error !== undefined) {
        return false;
      }
    }

    return true;
  },
);

export const selectStructure = createSelector(
  [(state: RootState) => state, selectLanguage, selectParsedDomain],
  (state, language, domain) => {
    const usedConstants = language.constants;
    const usedPredicates = language.predicates;
    const usedFunctions = language.functions;

    const iC = new Map<Symbol, DomainElement>();
    const iP = new Map<Symbol, Set<DomainElement[]>>();
    const iF = new Map<Symbol, Map<DomainElement[], DomainElement>>();

    usedConstants.forEach((name) => {
      const value = selectParsedConstant(state, name).parsed ?? "";
      iC.set(name, value);
    });

    usedPredicates.forEach((_, name) => {
      const value = selectParsedPredicate(state, name)?.parsed ?? [[]];
      iP.set(name, new Set(value));
    });

    usedFunctions.forEach((_, name) => {
      const valuation = selectParsedFunction(state, name).parsed ?? [[]];

      const map = new Map<DomainElement[], DomainElement>();

      valuation.forEach((value) => {
        map.set(value.slice(0, -1), value.slice(-1)[0]);
      });

      iF.set(name, map);
    });

    return new Structure(language, new Set(domain.parsed ?? []), iC, iP, iF);
  },
);

export const {
  updateDomain,
  updateInterpretationConstants,
  updateInterpretationPredicates,
  updateFunctionSymbols,
  importStructureState,
  lockDomain,
  lockInterpretationConstants,
  lockInterpretationPredicates,
  lockFunctionSymbols,
} = structureSlice.actions;
export default structureSlice.reducer;
