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
  type SemanticError,
  type ValidationError,
} from "../../shared/core/errors";
import {
  prepareWithSourceMeta,
  type LockableValue,
  type Validated,
} from "../../shared/core/redux";
import type { SerializedStructureState } from "./validationSchema";
import {
  getTupleLength,
  type TupleIdentity,
  type TupleInfo,
  type TupleType,
} from "./tupleInfo";
import {
  domainTupleKey,
  domainTupleNoun,
  formatDomainTuple,
  type DomainTuple,
} from "./domainTuple";
import { capitalize, withArticle } from "../../shared/core/wordForms";
import { dev } from "../../shared/core/logging";

export type DomainRepresentation = DomainElement[];
export type ConstantInterpretation = DomainElement;
export type TupleInterpretation = DomainTuple[];

export interface StructureState {
  domain: LockableValue<DomainRepresentation>;
  iC: Record<string, LockableValue<ConstantInterpretation>>;
  iP: Record<string, LockableValue<TupleInterpretation>>;
  iF: Record<string, LockableValue<TupleInterpretation>>;
}

const tupleStateKey = { predicate: "iP", function: "iF" } as const;

type Interpretations<T> = Record<string, LockableValue<T>>;
type UpdatePayload<T> = { key: string; value: T };

export const initialStructureState: StructureState = {
  domain: { value: [], locked: false },
  iC: {},
  iP: {},
  iF: {},
};

const setInterpretation = <T>(
  interpretations: Interpretations<T>,
  key: string,
  value: NoInfer<T>,
) => {
  const entry: LockableValue<T> | undefined = interpretations[key];

  if (entry) entry.value = value;
  else interpretations[key] = { value, locked: false };
};

const toggleLock = <T>(
  interpretations: Interpretations<T>,
  key: string,
  emptyValue: NoInfer<T>,
) => {
  const entry: LockableValue<T> | undefined = interpretations[key];

  if (entry) entry.locked = !entry.locked;
  else interpretations[key] = { value: emptyValue, locked: true };
};

export const structureSlice = createSlice({
  name: "structure",
  initialState: initialStructureState,
  reducers: {
    importStructureState(
      state,
      action: PayloadAction<{
        state: SerializedStructureState;
        merge?: boolean;
      }>,
    ) {
      const { state: imported, merge = false } = action.payload;

      if (!merge) return imported;

      for (const stateKey of ["iC", "iP", "iF"] as const)
        Object.assign(state[stateKey], imported[stateKey]);

      state.domain = imported.domain;
    },

    updateDomain: {
      reducer(state, action: PayloadActionSource<DomainRepresentation>) {
        state.domain.value = action.payload;
      },
      prepare: prepareWithSourceMeta<DomainRepresentation>,
    },

    lockDomain(state) {
      state.domain.locked = !state.domain.locked;
    },

    updateInterpretationConstants: {
      reducer(
        state,
        action: PayloadActionSource<UpdatePayload<ConstantInterpretation>>,
      ) {
        const { key, value } = action.payload;
        setInterpretation(state.iC, key, value);
      },
      prepare: prepareWithSourceMeta<UpdatePayload<ConstantInterpretation>>,
    },

    lockInterpretationConstants(state, action: PayloadAction<{ key: string }>) {
      toggleLock(state.iC, action.payload.key, "");
    },

    updateInterpretationPredicates: {
      reducer(
        state,
        action: PayloadActionSource<UpdatePayload<TupleInterpretation>>,
      ) {
        const { key, value } = action.payload;
        setInterpretation(state.iP, key, value);
      },
      prepare: prepareWithSourceMeta<UpdatePayload<TupleInterpretation>>,
    },

    lockInterpretationPredicates(
      state,
      action: PayloadAction<{ key: string }>,
    ) {
      toggleLock(state.iP, action.payload.key, []);
    },

    updateFunctionSymbols: {
      reducer(
        state,
        action: PayloadActionSource<UpdatePayload<TupleInterpretation>>,
      ) {
        const { key, value } = action.payload;
        setInterpretation(state.iF, key, value);
      },
      prepare: prepareWithSourceMeta<UpdatePayload<TupleInterpretation>>,
    },

    lockFunctionSymbols(state, action: PayloadAction<{ key: string }>) {
      toggleLock(state.iF, action.payload.key, []);
    },
  },
});

const getTupleInterpretation = (
  structure: StructureState,
  name: string,
  type: TupleType,
): LockableValue<TupleInterpretation> | undefined =>
  structure[tupleStateKey[type]][name];

export const removeInvalidEntries = ({
  tupleInfo,
}: {
  tupleInfo: TupleInfo;
}): AppThunk => {
  return (dispatch, getState) => {
    const { name, type } = tupleInfo;

    const structure = getState().present.structure;
    const domain = new Set(structure.domain.value);
    const tuples = getTupleInterpretation(structure, name, type)?.value ?? [];

    const seen = new Set<string>();
    const filtered = tuples.filter((tuple) => {
      const key = domainTupleKey(tuple);

      if (seen.has(key)) return false;
      seen.add(key);

      return tuple.every((element) => domain.has(element));
    });

    dispatch(updateActionByType[type]({ key: name, value: filtered }));
  };
};

export const selectDomain = (state: RootState) =>
  state.present.structure.domain;
export const selectDomainLock = (state: RootState) =>
  selectDomain(state).locked;

export const selectTupleInterpretation = (
  state: RootState,
  name: string,
  type: TupleType,
) => getTupleInterpretation(state.present.structure, name, type);

export const selectIcEntry = (
  state: RootState,
  name: string,
): LockableValue<ConstantInterpretation> | undefined =>
  state.present.structure.iC[name];
export const selectIpEntry = (state: RootState, name: string) =>
  selectTupleInterpretation(state, name, "predicate");
export const selectIfEntry = (state: RootState, name: string) =>
  selectTupleInterpretation(state, name, "function");

export const selectIcLock = (state: RootState, name: string) =>
  selectIcEntry(state, name)?.locked ?? false;

export const selectTupleLock = (
  state: RootState,
  { name, type }: TupleIdentity,
) => selectTupleInterpretation(state, name, type)?.locked ?? false;

export const selectIpLock = (state: RootState, name: string) =>
  selectTupleLock(state, { name, type: "predicate" });
export const selectIfLock = (state: RootState, name: string) =>
  selectTupleLock(state, { name, type: "function" });

export const selectValidatedDomain = createSelector(
  [(state: RootState) => state.present.structure.domain.value],
  (domain): Validated<DomainRepresentation> => ({
    parsed: domain,
    error:
      domain.length === 0
        ? createValidationError("Domain cannot be empty.")
        : undefined,
  }),
);

export const selectValidatedConstant = createSelector(
  [selectIcEntry, selectValidatedDomain],
  (constant, domain): Validated<ConstantInterpretation> => {
    const parsed = constant?.value ?? "";

    if (parsed === "")
      return {
        parsed,
        error: createValidationError("Interpretation must be defined."),
      };

    if (!domain.parsed.includes(parsed))
      return {
        parsed,
        error: createValidationError("This element is not in domain."),
      };

    return { parsed };
  },
);

export type ValidatedTuples = {
  parsed: TupleInterpretation;
  error?: ValidationError | SemanticError;
};

const findPredicateError = (
  tuples: TupleInterpretation,
  domain: ReadonlySet<string>,
  name: string,
  arity: number,
) => {
  const seen = new Set<string>();

  for (const tuple of tuples) {
    if (tuple.length !== arity)
      return createValidationError(
        `${formatDomainTuple(tuple)} is ${withArticle(domainTupleNoun(tuple.length))}, but should be ${withArticle(domainTupleNoun(arity))}, because arity of ${name} is ${arity}.`,
      );

    const unknownElement = tuple.find((element) => !domain.has(element));
    if (unknownElement !== undefined)
      return createValidationError(
        `Element ${unknownElement} is not in domain.`,
      );

    const key = domainTupleKey(tuple);
    if (seen.has(key))
      return createValidationError(
        `${capitalize(domainTupleNoun(arity))} ${formatDomainTuple(tuple)} is already in predicate.`,
      );

    seen.add(key);
  }
};

export const selectValidatedPredicate = createSelector(
  [
    selectIpEntry,
    selectValidatedDomain,
    selectValidatedPredicates,
    (_: RootState, name: string) => name,
  ],
  (interpretation, domain, predicates, name): ValidatedTuples => {
    const parsed = interpretation?.value ?? [];

    const arity = predicates.parsed.get(name);
    if (arity === undefined) return { parsed };

    return {
      parsed,
      error: findPredicateError(parsed, new Set(domain.parsed), name, arity),
    };
  },
);

const findFunctionError = (
  tuples: TupleInterpretation,
  domain: ReadonlySet<string>,
  name: string,
  arity: number,
) => {
  const expectedLength = getTupleLength("function", arity);
  const definedArguments = new Set<string>();

  for (const tuple of tuples) {
    if (tuple.length !== expectedLength)
      return createValidationError(
        `${formatDomainTuple(tuple)} is ${withArticle(domainTupleNoun(tuple.length))}, but should be ${withArticle(domainTupleNoun(expectedLength))}, because arity of ${name} is ${arity}. Format is: (n-elements,mapped_element).`,
      );

    const unknownElement = tuple.find((element) => !domain.has(element));
    if (unknownElement !== undefined)
      return createValidationError(
        `Element ${unknownElement} is not in domain.`,
      );

    const args = tuple.slice(0, -1);
    const key = domainTupleKey(args);
    if (definedArguments.has(key))
      return createValidationError(
        `${capitalize(domainTupleNoun(arity))} ${formatDomainTuple(args)} has already defined value.`,
      );

    definedArguments.add(key);
  }
};

const findUndefinedArguments = (
  tuples: TupleInterpretation,
  domain: DomainRepresentation,
  arity: number,
  limit: number,
) => {
  const defined = new Set(
    tuples.map((tuple) => domainTupleKey(tuple.slice(0, -1))),
  );
  const undefinedArguments: string[][] = [];

  const visitArguments = (args: string[]) => {
    if (undefinedArguments.length >= limit) return;

    if (args.length === arity) {
      if (!defined.has(domainTupleKey(args)))
        undefinedArguments.push([...args]);
      return;
    }

    for (const element of domain) {
      args.push(element);
      visitArguments(args);
      args.pop();
    }
  };

  visitArguments([]);
  return undefinedArguments;
};

const MAX_EXAMPLES = 3;

export const selectValidatedFunction = createSelector(
  [
    selectIfEntry,
    selectValidatedDomain,
    selectValidatedFunctions,
    (_: RootState, name: string) => name,
  ],
  (interpretation, domain, functions, name): ValidatedTuples => {
    const parsed = interpretation?.value ?? [];

    const arity = functions.parsed.get(name);
    if (arity === undefined || domain.parsed.length === 0) return { parsed };

    const error = findFunctionError(
      parsed,
      new Set(domain.parsed),
      name,
      arity,
    );
    if (error) return { parsed, error };

    const undefinedArguments = findUndefinedArguments(
      parsed,
      domain.parsed,
      arity,
      MAX_EXAMPLES + 1,
    );
    if (undefinedArguments.length === 0) return { parsed };

    const examples = undefinedArguments
      .slice(0, MAX_EXAMPLES)
      .map(formatDomainTuple)
      .join(",");
    const ellipsis = undefinedArguments.length > MAX_EXAMPLES ? "..." : ".";

    return {
      parsed,
      error: createSemanticError(
        `Function is not fully defined, for example these ${domainTupleNoun(arity)}s do not have assigned value: ${examples}${ellipsis}`,
      ),
    };
  },
);

export const selectTupleValidation = (
  state: RootState,
  name: string,
  type: TupleType,
) => validationSelectorByType[type](state, name).error;

const findFirstError = <E>(
  names: Iterable<string>,
  validate: (name: string) => { error?: E },
) => {
  for (const name of names) {
    const { error } = validate(name);
    if (error) return error;
  }
};

// Validating a single symbol needs the whole state, which makes this selector recompute on every
// change. That is not that bad, since all the per-symbol selectors it calls are memoized.
export const selectStructureErrors = createSelector(
  [
    (state: RootState) => state,
    selectValidatedConstants,
    selectValidatedPredicates,
    selectValidatedFunctions,
    selectValidatedDomain,
  ],
  (state, constants, predicates, functions, domain) =>
    domain.error ??
    findFirstError(constants.parsed, (name) =>
      selectValidatedConstant(state, name),
    ) ??
    findFirstError(predicates.parsed.keys(), (name) =>
      selectValidatedPredicate(state, name),
    ) ??
    findFirstError(functions.parsed.keys(), (name) =>
      selectValidatedFunction(state, name),
    ),
);

export const selectHasWrongArityError = createSelector(
  [
    selectTupleInterpretation,
    (state: RootState, name: string, type: TupleType) =>
      validatedSymbolsByType[type](state).parsed.get(name),
    (_: RootState, __: string, type: TupleType) => type,
  ],
  (interpretation, arity, type) => {
    if (arity === undefined || !interpretation) return false;

    return interpretation.value.some(
      (tuple) => tuple.length !== getTupleLength(type, arity),
    );
  },
);

export const selectStructure = createSelector(
  [
    (state: RootState) => state.present.structure.iC,
    (state: RootState) => state.present.structure.iP,
    (state: RootState) => state.present.structure.iF,
    selectLanguage,
    selectValidatedDomain,
  ],
  (constants, predicates, functions, language, rawDomain) => {
    dev.time("selectStructure duration");

    const domain = new Set(rawDomain.error ? [] : rawDomain.parsed);

    const iC = new Map<Symbol, DomainElement>(
      [...language.constants].map((name) => [
        name,
        constants[name]?.value ?? "",
      ]),
    );

    const iP = new Map<Symbol, Set<DomainElement[]>>(
      [...language.predicates.keys()].map((name) => [
        name,
        new Set(predicates[name]?.value ?? []),
      ]),
    );

    const iF = new Map<Symbol, Map<DomainElement[], DomainElement>>(
      [...language.functions.keys()].map((name) => [
        name,
        new Map(
          (functions[name]?.value ?? []).map((tuple) => [
            tuple.slice(0, -1),
            tuple.at(-1) ?? "",
          ]),
        ),
      ]),
    );

    dev.timeEnd("selectStructure duration");

    return new Structure(language, domain, iC, iP, iF);
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

const updateActionByType = {
  predicate: updateInterpretationPredicates,
  function: updateFunctionSymbols,
} as const;

const validationSelectorByType = {
  predicate: selectValidatedPredicate,
  function: selectValidatedFunction,
} as const;

const validatedSymbolsByType = {
  predicate: selectValidatedPredicates,
  function: selectValidatedFunctions,
} as const;

export default structureSlice.reducer;
