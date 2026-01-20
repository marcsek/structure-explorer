import React, { useContext, useEffect } from "react";
import type { SymbolWithArity } from "@fmfi-uk-1-ain-412/js-fol-parser";
import { useAppDispatch } from "./app/hooks";
import {
  updateConstants,
  updateFunctions,
  updatePredicates,
} from "./features/language/languageSlice";
import { UndoActions } from "./features/undoHistory/undoHistory";

export interface Formula {
  name: string;
  formula: string;
}

export interface LogicContext {
  constants: Array<string>;
  predicates: Array<SymbolWithArity>;
  functions: Array<SymbolWithArity>;

  formulas: Array<Formula>;
  axioms: Array<Formula>;
  theorems: Array<Formula>;

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

export function useSyncLogicContext() {
  const context = useLogicContext();
  const dispatch = useAppDispatch();

  const hasContext = !!context;

  const constants = context?.constants;
  const predicates = context?.predicates;
  const functions = context?.functions;

  useEffect(() => {
    if (!hasContext) return;

    dispatch(updateConstants(constants ?? []));
    dispatch(updatePredicates(predicates ?? []));
    dispatch(updateFunctions(functions ?? []));

    dispatch(UndoActions.clearHistory());
  }, [constants, predicates, functions, dispatch, hasContext]);

  return { context, hasContext };
}
