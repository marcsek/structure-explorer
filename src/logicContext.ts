import React, { useContext, useEffect, useMemo } from "react";
import type { SymbolWithArity } from "@fmfi-uk-1-ain-412/js-fol-parser";
import { useAppDispatch } from "./app/hooks";
import {
  editModeChanged,
  updateConstants,
  updateFunctions,
  updatePredicates,
} from "./features/language/languageSlice";
import { UndoActions } from "./features/undoHistory/undoHistory";
import { syncContextFormulas } from "./features/formulas/formulasSlice";

export interface ContextFormula {
  name: string;
  formula: string;
}

export interface LogicContext {
  constants: Array<string>;
  predicates: Array<SymbolWithArity>;
  functions: Array<SymbolWithArity>;

  formulas: Array<ContextFormula>;
  axioms: Array<ContextFormula>;
  theorems: Array<ContextFormula>;

  getFormula: (name: string) => { type: string; formula: string } | undefined;
}

export interface CellContext extends LogicContext {
  isConstant: (symbol: string) => boolean;
  isPredicate: (symbol: string) => boolean;
  isFunction: (symbol: string) => boolean;
  isVariable: (symbol: string) => boolean;
  symbolExits: (symbol: string) => boolean;
  symbolArity: (symbol: string) => number | undefined;
}

export const LogicContext = React.createContext<CellContext | undefined>(
  undefined,
);

export function useLogicContext(): CellContext | undefined {
  return useContext(LogicContext);
}

export function useSyncLanguageContext() {
  const context = useLogicContext();
  const dispatch = useAppDispatch();

  const hasContext = !!context;

  const constants = context?.constants;
  const predicates = context?.predicates;
  const functions = context?.functions;

  useEffect(() => {
    if (!hasContext) return;
    dispatch(editModeChanged(false));
  }, [dispatch, hasContext]);

  useEffect(() => {
    if (!hasContext) return;

    dispatch(updateConstants(constants ?? []));
    dispatch(updatePredicates(predicates ?? []));
    dispatch(updateFunctions(functions ?? []));

    dispatch(UndoActions.clearHistory());
  }, [constants, predicates, functions, dispatch, hasContext]);

  return { context, hasContext };
}

export type FormulaType = "formula" | "axiom" | "theorem";
export interface Formula extends ContextFormula {
  type: FormulaType;
}

export function useFormulasContext() {
  const context = useLogicContext();

  const hasContext = !!context;

  const namedFormulas = context?.formulas;
  const axioms = context?.axioms;

  const formulasByType = useMemo<[FormulaType, ContextFormula[]][]>(
    () => [
      ["formula", namedFormulas ?? []],
      ["axiom", axioms ?? []],
    ],
    [namedFormulas, axioms],
  );

  const formulas = useMemo<Formula[]>(
    () =>
      formulasByType.flatMap(([type, formulas]) =>
        formulas.map(({ name, formula }) => ({ name, formula, type })),
      ),
    [formulasByType],
  );

  return { context, hasContext, formulas, formulasByType };
}

export function useSyncFormulasContext() {
  const dispatch = useAppDispatch();
  const { hasContext, formulas, ...rest } = useFormulasContext();

  useEffect(() => {
    if (!hasContext) return;

    const formulasToText = Object.fromEntries(
      formulas.map(({ name, formula }) => [name, formula]),
    );

    dispatch(syncContextFormulas(formulasToText));
    dispatch(UndoActions.clearHistory());
  }, [hasContext, dispatch, formulas]);

  return { hasContext, formulas, ...rest };
}
