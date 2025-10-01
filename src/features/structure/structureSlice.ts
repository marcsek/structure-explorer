import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import {
  parseDomain,
  SyntaxError,
  parseTuples,
} from "@fmfi-uk-1-ain-412/js-fol-parser";
import {
  selectLanguage,
  selectParsedConstants,
  selectParsedFunctions,
  selectParsedPredicates,
} from "../language/languageSlice";
import Structure, { type DomainElement } from "../../model/Structure";
import type { Symbol } from "../../model/Language";

export interface InterpretationState {
  text: string;
  locked: boolean;
}

export interface StructureState {
  domain: { text: string; locked: boolean };
  iC: Record<string, InterpretationState>;
  iP: Record<string, InterpretationState>;
  iF: Record<string, InterpretationState>;
}

const initialState: StructureState = {
  domain: { text: "", locked: false },
  iC: {},
  iP: {},
  iF: {},
};

export const structureSlice = createSlice({
  name: "structure",
  initialState,
  reducers: {
    importStructureState: (_state, action: PayloadAction<string>) => {
      return JSON.parse(action.payload);
    },
    updateDomain: (state, action: PayloadAction<string>) => {
      state.domain.text = action.payload;
    },

    lockDomain: (state) => {
      state.domain.locked = !state.domain.locked;
    },

    updateInterpretationConstants: (
      state,
      action: PayloadAction<{ key: string; value: string }>
    ) => {
      const { key, value } = action.payload;
      if (state.iC[key] === undefined) {
        state.iC[key] = { text: value, locked: false };
      }

      state.iC[key].text = value;
    },

    lockInterpretationConstants: (
      state,
      action: PayloadAction<{ key: string }>
    ) => {
      const { key } = action.payload;
      if (state.iC[key] === undefined) {
        state.iC[key] = { text: "", locked: false };
      }

      state.iC[key].locked = !state.iC[key].locked;
    },

    updateInterpretationPredicates: (
      state,
      action: PayloadAction<{ key: string; value: string }>
    ) => {
      const { key, value } = action.payload;
      if (state.iP[key] === undefined) {
        state.iP[key] = { text: value, locked: false };
      }

      state.iP[key].text = value;
    },

    lockInterpretationPredicates: (
      state,
      action: PayloadAction<{ key: string }>
    ) => {
      const { key } = action.payload;
      if (state.iP[key] === undefined) {
        state.iP[key] = { text: "", locked: false };
      }

      state.iP[key].locked = !state.iP[key].locked;
    },

    updateFunctionSymbols: (
      state,
      action: PayloadAction<{ key: string; value: string }>
    ) => {
      const { key, value } = action.payload;
      if (state.iF[key] === undefined) {
        state.iF[key] = { text: value, locked: false };
      }

      state.iF[key].text = value;
    },

    lockFunctionSymbols: (state, action: PayloadAction<{ key: string }>) => {
      const { key } = action.payload;
      if (state.iF[key] === undefined) {
        state.iF[key] = { text: "", locked: false };
      }

      state.iF[key].locked = !state.iF[key].locked;
    },
  },
});

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

export const selectDomain = (state: RootState) => state.structure.domain;
export const selectDomainText = (state: RootState) =>
  state.structure.domain.text;
export const selectDomainLock = (state: RootState) =>
  state.structure.domain.locked;

export const selectIc = (state: RootState) => state.structure.iC;
export const selectIcName = (state: RootState, name: string) =>
  state.structure.iC[name];

export const selectIp = (state: RootState) => state.structure.iP;
export const selectIpName = (state: RootState, name: string) =>
  state.structure.iP[name];

export const selectIf = (state: RootState) => state.structure.iF;
export const selectIfName = (state: RootState, name: string) =>
  state.structure.iF[name];

export const selectParsedDomain = createSelector(
  [selectDomainText],
  (domain) => {
    try {
      let parsedDomain = parseDomain(domain);
      if (parsedDomain.length === 0)
        return {
          error: new Error("Domain cannot be empty"),
        };

      return { parsed: parsedDomain };
    } catch (error) {
      if (error instanceof SyntaxError) {
        return { error: error };
      }

      throw error;
    }
  }
);

export const selectParsedConstant = createSelector(
  [selectIcName, selectParsedDomain],
  (constant, domain) => {
    if (constant === undefined || constant.text === "") {
      const err = new Error("Interpretation must be defined");
      return { error: err };
    }

    if (
      domain.parsed === undefined ||
      domain.parsed.includes(constant.text) === false
    ) {
      const err = new Error("This element is not in domain.");
      return { error: err };
    }

    return { parsed: constant.text };
  }
);

export const selectParsedPredicate = createSelector(
  [
    selectIpName,
    selectParsedDomain,
    selectParsedPredicates,
    (_: RootState, name: string) => name,
  ],
  (interpretation, domain, preds, name) => {
    if (!preds.parsed) return {};
    if (!domain.parsed) return {};
    if (!interpretation) return {};

    try {
      const interpretationText = interpretation.text;
      const arity = preds.parsed.get(name);
      const parsed = parseTuples(interpretationText);
      const size = arity === 1 ? "element" : `${arity}-tuple`;

      let err = undefined;

      parsed.forEach((tuple) => {
        if (tuple.length !== arity) {
          const actual_size = tuple.length === 1 ? "element" : `${arity}-tuple`;
          err = new Error(
            `(${tuple}) is a ${actual_size}, but should be a ${size}, becasue aritiy of ${name} is ${arity}`
          );
          return;
        }

        tuple.forEach((element) => {
          if (domain.parsed.includes(element) === false) {
            err = new Error(`Element ${element} is not in domain.`);
            return;
          }
        });

        parsed.forEach((tuple2) => {
          if (
            JSON.stringify(tuple) === JSON.stringify(tuple2) &&
            tuple != tuple2
          ) {
            err = new Error(`${size} (${tuple}) is already in predicate.`);
            return;
          }
        });
      });
      return { error: err, parsed: parsed };
    } catch (error) {
      if (error instanceof Error || error instanceof SyntaxError) {
        return { error: error };
      }

      throw error;
    }
  }
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

export const selectParsedFunction = createSelector(
  [
    selectIfName,
    selectParsedDomain,
    selectParsedFunctions,
    (_: RootState, name: string) => name,
  ],
  (interpretation, domain, functions, name) => {
    if (!functions.parsed) return {};
    if (!domain.parsed) return {};

    try {
      const arity = functions.parsed.get(name) ?? 0;
      let all = getAllPossibleCombinations(domain.parsed, arity);
      let examples = all.slice(0, 3).map((element) => `(${element.join(",")})`);

      if (!interpretation) {
        const examplePrints =
          all.length <= 3 ? `${examples}` : `${examples}...`;
        const actualSize = all[0].length === 1 ? "elements" : `${arity}-tuples`;
        return {
          error: new Error(
            `Function is not fully defined, for example these ${actualSize} do not have assigned value: ${examplePrints}`
          ),
        };
      }

      const interpretationText = interpretation.text;
      const parsed = parseTuples(interpretationText);
      const size = arity === 1 ? "element" : `${arity + 1}-tuple`;

      let err: Error | undefined = undefined;

      parsed.forEach((tuple) => {
        if (arity !== undefined && tuple.length != arity + 1) {
          const actual_size = tuple.length === 1 ? "element" : `${arity}-tuple`;
          err = new Error(
            `(${tuple}) is a ${actual_size}, but should be a ${size}, becasue aritiy of ${name} is ${arity}. Format is: (n-elements,mapped_element)`
          );
          return;
        }

        tuple.forEach((element) => {
          if (domain.parsed.includes(element) === false) {
            err = new Error(`Element ${element} is not in domain.`);
            return;
          }
        });

        if (err) {
          return { error: err };
        }

        parsed.forEach((tuple2) => {
          if (
            JSON.stringify(tuple.slice(0, -1)) ===
              JSON.stringify(tuple2.slice(0, -1)) &&
            tuple != tuple2
          ) {
            tuple = tuple.slice(0, -1);
            const actual_size =
              tuple.length === 1 ? "element" : `${arity}-tuple`;
            err = new Error(
              `${actual_size} (${tuple}) has already defined value.`
            );
          }
        });

        if (
          all.filter(
            (i) => JSON.stringify(i) === JSON.stringify(tuple.slice(0, -1))
          ).length === 1
        ) {
          all = all.filter(
            (i) => JSON.stringify(i) !== JSON.stringify(tuple.slice(0, -1))
          );
          examples = all.slice(0, 3).map((element) => `(${element.join(",")})`);
        }
      });

      if (err === undefined && all.length !== 0) {
        const examplePrints =
          all.length <= 3 ? `${examples}` : `${examples}...`;
        const actual_size =
          all[0].length === 1 ? "elements" : `${arity}-tuples`;
        err = new Error(
          `Function is not fully defined, for example these ${actual_size} do not have assigned value: ${examplePrints}`
        );
      }

      return { error: err, parsed: parsed };
    } catch (error) {
      if (error instanceof Error || error instanceof SyntaxError) {
        return { error: error };
      }

      throw error;
    }
  }
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

    for (const [name, _] of predicates.parsed ?? []) {
      if (selectParsedPredicate(state, name).error !== undefined) {
        return false;
      }
    }

    for (const [name, _] of functions.parsed ?? []) {
      if (selectParsedFunction(state, name).error !== undefined) {
        return false;
      }
    }

    return true;
  }
);

export const selectStructure = createSelector(
  [(state: RootState) => state, selectLanguage, selectParsedDomain],
  (state, language, domain) => {
    const usedConstants = language.constants;
    const usedPredicates = language.predicates;
    const usedFunctions = language.functions;

    let iC = new Map<Symbol, DomainElement>();
    let iP = new Map<Symbol, Set<DomainElement[]>>();
    let iF = new Map<Symbol, Map<DomainElement[], DomainElement>>();

    usedConstants.forEach((name) => {
      const value = selectParsedConstant(state, name).parsed ?? "";
      iC.set(name, value);
    });

    usedPredicates.forEach((_, name) => {
      const value = selectParsedPredicate(state, name).parsed ?? [[]];
      iP.set(name, new Set(value));
    });

    usedFunctions.forEach((_, name) => {
      const valuation = selectParsedFunction(state, name).parsed ?? [[]];

      let map = new Map<DomainElement[], DomainElement>();

      valuation.forEach((value) => {
        map.set(value.slice(0, -1), value.slice(-1)[0]);
      });

      iF.set(name, map);
    });

    return new Structure(language, new Set(domain.parsed ?? []), iC, iP, iF);
  }
);

export default structureSlice.reducer;
