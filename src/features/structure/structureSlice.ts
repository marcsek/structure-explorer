import { createSelector, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { AppThunk, RootState } from "../../app/store";
import {
  selectLanguage,
  selectValidatedConstants,
  selectValidatedFunctions,
  selectValidatedPredicates,
  type PayloadActionSource,
} from "../language/languageSlice";
import Structure, { type DomainElement } from "../../model/Structure";
import type { Symbol } from "../../model/Language";
import {
  createSemanticError,
  createValidationError,
  type ValidationError,
} from "../../common/errors";
import {
  prepareWithSourceMeta,
  type LockableValue,
  type Validated,
} from "../../common/redux";
import type {
  TextViewDescriptors,
  TextViewSyncEntry,
} from "../textView/textViews";
import { parseDomain, parseTuples } from "@fmfi-uk-1-ain-412/js-fol-parser";
import type { RelevantSymbols } from "../import/importThunk";

export type DomainRepresentation = string[];
export type ConstantInterpretation = string;
export type TupleInterpretation = string[][];

export interface StructureState {
  domain: LockableValue<DomainRepresentation>;
  iC: Record<string, LockableValue<ConstantInterpretation>>;
  iP: Record<string, LockableValue<TupleInterpretation>>;
  iF: Record<string, LockableValue<TupleInterpretation>>;
}

// Helper type
type InterpretationMap = {
  constant: StructureState["iC"];
  predicate: StructureState["iP"];
  function: StructureState["iF"];
};

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
    importStructureState(
      state,
      action: PayloadAction<{ state: StructureState; merge?: boolean }>,
    ) {
      const { state: newState, merge = false } = action.payload;

      if (!merge) return newState;

      for (const [name, value] of Object.entries(newState.iC)) {
        state.iC[name] = value;
      }

      for (const [name, value] of Object.entries(newState.iP)) {
        state.iP[name] = value;
      }

      for (const [name, value] of Object.entries(newState.iF)) {
        state.iF[name] = value;
      }

      state.domain = newState.domain;
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
          value: ConstantInterpretation;
        }>,
      ) {
        const { key, value } = action.payload;

        if (state.iC[key]) state.iC[key].value = value;
        else state.iC[key] = { value, locked: false };
      },

      prepare: prepareWithSourceMeta<{
        key: string;
        value: ConstantInterpretation;
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
          value: TupleInterpretation;
        }>,
      ) {
        const { key, value } = action.payload;

        if (state.iP[key]) state.iP[key].value = value;
        else state.iP[key] = { value: value, locked: false };
      },

      prepare: prepareWithSourceMeta<{
        key: string;
        value: TupleInterpretation;
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
          value: TupleInterpretation;
        }>,
      ) {
        const { key, value } = action.payload;

        if (state.iF[key]) state.iF[key].value = value;
        else state.iF[key] = { value, locked: false };
      },

      prepare: prepareWithSourceMeta<{
        key: string;
        value: TupleInterpretation;
      }>,
    },

    lockFunctionSymbols(state, action: PayloadAction<{ key: string }>) {
      const { key } = action.payload;

      if (!state.iF[key]) state.iF[key] = { value: [], locked: false };

      state.iF[key].locked = !state.iF[key].locked;
    },
  },
});

function getInterpretationByType<T extends keyof InterpretationMap>(
  state: StructureState,
  name: string,
  type: T,
): InterpretationMap[T][string] {
  const map = {
    constant: state.iC,
    predicate: state.iP,
    function: state.iF,
  };

  return map[type][name] as InterpretationMap[T][string];
}

export const removeInvalidEntries = ({
  key,
  type,
}: {
  key: string;
  type: "predicate" | "function";
}): AppThunk => {
  return (dispatch, getState) => {
    const state = getState().structure;

    const entry = getInterpretationByType(state, key, type);
    const domain = state.domain;

    const seen = new Set<string>();
    const filtered = entry.value.filter((tuple) => {
      const key = tuple.join(",");

      if (seen.has(key)) return false;
      seen.add(key);

      if (!tuple.every((element) => domain.value.includes(element)))
        return false;

      return true;
    });

    const updater =
      type === "predicate"
        ? updateInterpretationPredicates
        : updateFunctionSymbols;

    dispatch(updater({ key, value: filtered }));
  };
};

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

export const selectInterpretationByType = (
  state: RootState,
  name: string,
  type: "predicate" | "function" | "constant",
) => getInterpretationByType(state.structure, name, type);

export const selectValidatedDomain = createSelector(
  [(state: RootState) => state.structure.domain],
  ({ value: domain }): Validated<string[]> => {
    const result: Validated<DomainRepresentation> = { parsed: domain };

    if (domain.length === 0)
      result.error = createValidationError("Domain cannot be empty");

    return result;
  },
);

export const selectValidatedConstant = createSelector(
  [selectIcName, selectValidatedDomain],
  (constant, domain) => {
    const result: Validated<ConstantInterpretation> = {
      parsed: constant?.value ?? "",
    };

    if (!constant || constant.value === "")
      result.error = createValidationError("Interpretation must be defined");
    else if (!domain.parsed || !domain.parsed.includes(constant.value))
      result.error = createValidationError("This element is not in domain.");

    return result;
  },
);

export const selectValidatedPredicate = createSelector(
  [
    selectIpName,
    selectValidatedDomain,
    selectValidatedPredicates,
    (_: RootState, name: string) => name,
  ],
  (interpretation, domain, preds, name) => {
    if (!preds.parsed) return {};
    if (!domain.parsed) return {};
    if (!interpretation) return {};

    const arity = preds.parsed.get(name);
    const size = arity === 1 ? "element" : `${arity}-tuple`;

    let error: ValidationError | undefined = undefined;

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

    console.log("error", error, interpretation.value);
    return { parsed: interpretation.value ?? [], error };
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

export const selectValidatedFunction = createSelector(
  [
    selectIfName,
    selectValidatedDomain,
    selectValidatedFunctions,
    (_: RootState, name: string) => name,
  ],
  (interpretation, domain, functions, name) => {
    if (functions.parsed.size === 0) return {};
    if (domain.parsed.length === 0) return {};

    const arity = functions.parsed.get(name) ?? 0;
    let all = getAllPossibleCombinations(domain.parsed, arity);
    let examples = all.slice(0, 3).map((element) => `(${element.join(",")})`);

    if (!interpretation || interpretation.value.length === 0) {
      const examplePrints = all.length <= 3 ? `${examples}` : `${examples}...`;
      const actualSize = all[0].length === 1 ? "elements" : `${arity}-tuples`;

      return {
        error: createSemanticError(
          `Function is not fully defined, for example these ${actualSize} do not have assigned value: ${examplePrints}`,
        ),
      };
    }

    const size = arity === 1 ? "element" : `${arity + 1}-tuple`;

    let error: ValidationError | undefined = undefined;

    interpretation.value.forEach((tuple) => {
      if (arity !== undefined && tuple.length != arity + 1) {
        const actual_size = tuple.length === 1 ? "element" : `${arity}-tuple`;
        error = createValidationError(
          `(${tuple}) is a ${actual_size}, but should be a ${size}, becasue aritiy of ${name} is ${arity}. Format is: (n-elements,mapped_element)`,
        );
        return;
      }

      tuple.forEach((element) => {
        if (!domain.parsed?.includes(element)) {
          error = createValidationError(`Element ${element} is not in domain.`);
          return;
        }
      });

      if (error) return error;

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

    if (!error && all.length !== 0) {
      const examplePrints = all.length <= 3 ? `${examples}` : `${examples}...`;
      const actual_size = all[0].length === 1 ? "elements" : `${arity}-tuples`;
      const semanticError = createSemanticError(
        `Function is not fully defined, for example these ${actual_size} do not have assigned value: ${examplePrints}`,
      );
      return { parsed: interpretation?.value ?? [], error: semanticError };
    }

    return { parsed: interpretation?.value ?? [], error };
  },
);

export const selectStructureErrors = createSelector(
  [
    (state: RootState) => state,
    selectValidatedConstants,
    selectValidatedPredicates,
    selectValidatedFunctions,
    selectValidatedDomain,
  ],
  (state, constants, predicates, functions, domain) => {
    if (domain.error !== undefined) return false;

    for (const name of constants.parsed ?? []) {
      if (selectValidatedConstant(state, name).error !== undefined) {
        return false;
      }
    }

    for (const [name] of predicates.parsed ?? []) {
      if (selectValidatedPredicate(state, name).error !== undefined) {
        return false;
      }
    }

    for (const [name] of functions.parsed ?? []) {
      if (selectValidatedFunction(state, name).error !== undefined) {
        return false;
      }
    }

    return true;
  },
);

export const selectHasWrongArityError = createSelector(
  [
    selectInterpretationByType,
    (state: RootState, _: string, type: "predicate" | "function") =>
      type === "predicate"
        ? selectValidatedPredicates(state)
        : selectValidatedFunctions(state),
    (_: RootState, name: string) => name,
    (_: RootState, __: string, type: "predicate" | "function") => type,
  ],
  (interpretation, { parsed: predicates }, name, type) => {
    const arity = predicates.get(name);

    if (arity === undefined || !interpretation) return false;

    return (interpretation.value as TupleInterpretation).some(
      (tuple) => tuple.length !== (type === "function" ? arity + 1 : arity),
    );
  },
);

export const selectStructure = createSelector(
  [(state: RootState) => state, selectLanguage, selectValidatedDomain],
  (state, language, domain) => {
    const usedConstants = language.constants;
    const usedPredicates = language.predicates;
    const usedFunctions = language.functions;

    const iC = new Map<Symbol, DomainElement>();
    const iP = new Map<Symbol, Set<DomainElement[]>>();
    const iF = new Map<Symbol, Map<DomainElement[], DomainElement>>();

    usedConstants.forEach((name) => {
      const value = selectValidatedConstant(state, name).parsed ?? "";
      iC.set(name, value);
    });

    usedPredicates.forEach((_, name) => {
      const value = selectValidatedPredicate(state, name)?.parsed ?? [[]];
      iP.set(name, new Set(value));
    });

    usedFunctions.forEach((_, name) => {
      const valuation = selectValidatedFunction(state, name).parsed ?? [[]];

      const map = new Map<DomainElement[], DomainElement>();

      valuation.forEach((value) => {
        map.set(value.slice(0, -1), value.slice(-1)[0]);
      });

      iF.set(name, map);
    });

    return new Structure(language, new Set(domain.parsed ?? []), iC, iP, iF);
  },
);

export const getRelevantStructureState = (
  structure: StructureState,
  relevantSymbols: RelevantSymbols,
): StructureState => {
  const relevantConstants = Object.fromEntries(
    Object.entries(structure.iC).filter(
      ([key]) => relevantSymbols[key]?.type === "constant",
    ),
  );

  const relevantPredicateInterpretations = Object.fromEntries(
    Object.entries(structure.iP).filter(
      ([key]) => relevantSymbols[key]?.type === "predicate",
    ),
  );

  const relevantFunctionInterpretation = Object.fromEntries(
    Object.entries(structure.iF).filter(
      ([key]) => relevantSymbols[key]?.type === "function",
    ),
  );

  return {
    ...structure,
    iC: relevantConstants,
    iP: relevantPredicateInterpretations,
    iF: relevantFunctionInterpretation,
  };
};

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

export interface StructureTextViewTypeMap {
  domain: DomainRepresentation;
  constant_interpretation: ConstantInterpretation;
  predicate_interpretation: TupleInterpretation;
  function_interpretation: TupleInterpretation;
}

export const structureTextViewDescriptors: TextViewDescriptors<StructureTextViewTypeMap> =
  {
    domain: {
      payloadType: "value",
      parse: (value) => parseDomain(value),
      toText: (structured) => structured.join(", "),
      validate: (state) => selectValidatedDomain(state)?.error,
      syncActionCreator: updateDomain,
    },

    constant_interpretation: {
      payloadType: "key",
      parse: (value) => value,
      toText: (structured) => structured,
      validate: (state, key) => selectValidatedConstant(state, key!).error,
      syncActionCreator: updateInterpretationConstants,
    },

    predicate_interpretation: {
      payloadType: "key",
      parse: (value) => parseTuples(value),
      toText: (structured) =>
        structured
          .map((tuple) =>
            tuple.length === 1 ? tuple[0] : `(${tuple.join(",")})`,
          )
          .join(", "),
      validate: (state, key) => selectValidatedPredicate(state, key!).error,
      syncActionCreator: updateInterpretationPredicates,
    },

    function_interpretation: {
      payloadType: "key",
      parse: (value) => parseTuples(value),
      toText: (structured) =>
        structured
          .map((tuple) =>
            tuple.length === 1 ? tuple[0] : `(${tuple.join(",")})`,
          )
          .join(", "),
      validate: (state, key) => selectValidatedFunction(state, key!).error,
      syncActionCreator: updateFunctionSymbols,
    },
  };

export const getStructureTextViewSyncEntries = (structure: StructureState) => {
  const { domain, iC, iP, iF } = structure;
  const descriptors = structureTextViewDescriptors;

  const result: TextViewSyncEntry[] = [
    {
      textViewType: "domain",
      value: descriptors.domain.toText(domain.value),
    },
  ];

  const interpretationConfigs = [
    { entries: iC, type: "constant_interpretation" },
    { entries: iP, type: "predicate_interpretation" },
    { entries: iF, type: "function_interpretation" },
  ] as const;

  for (const { entries, type } of interpretationConfigs) {
    for (const [name, { value }] of Object.entries(entries)) {
      result.push({
        textViewType: type,
        key: name,
        value: descriptors[type].toText(value),
      });
    }
  }

  return result;
};
