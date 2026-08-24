import {
  createSelector,
  createSlice,
  type Action,
  type PayloadAction,
  type PayloadActionCreator,
  type ThunkDispatch,
} from "@reduxjs/toolkit";
import type { AppThunk, RootState } from "../../app/store";
import {
  selectDomain,
  selectValidatedFunction,
  updateFunctionSymbols,
} from "../structure/structureSlice";
import { selectValidatedFunctions } from "../language/languageSlice";
import {
  getNextNodeId,
  getSubstreeNodeIds,
  intervalVariables,
} from "./model/caseTree";
import { generateTuples, initializeTreeFromTuples } from "./model/tuples";
import { flattenCaseTree } from "./model/flattenTree";
import type {
  AppendTarget,
  BranchTarget,
  CaseRef,
  EditTarget,
} from "./model/targets";
import { dev } from "../../shared/core/logging";
import type { SerializedCaseTreeViewState } from "./validationSchema";
import { UndoActions } from "../undoHistory/undoHistory";

export type CaseTreeBranch =
  { type: "value"; value: string } | { type: "ref"; nodeId: string };

export interface CaseTreeCase {
  match: string;
  branch: CaseTreeBranch;
}

export interface CaseTreeNode {
  variable: string;
  cases: CaseTreeCase[];
  default?: CaseTreeBranch;
}

export interface CaseTreeEntry {
  rootId: string;
  nodes: Record<string, CaseTreeNode>;
}

export type CaseTreeState = Record<string, CaseTreeEntry>;

type WithCaseTreeId<T = object> = {
  functionName: string;
} & T;

const getBranch = (node: CaseTreeNode, ref: CaseRef) =>
  ref.kind === "case" ? node.cases[ref.caseIdx]?.branch : node.default;

const setBranch = (
  node: CaseTreeNode,
  ref: CaseRef,
  branch: CaseTreeBranch,
) => {
  if (ref.kind === "default") node.default = branch;
  else node.cases[ref.caseIdx].branch = branch;
};

export const initialCaseTreeViewState: CaseTreeState = {};

export const caseTreeViewSlice = createSlice({
  name: "caseTreeView",
  initialState: initialCaseTreeViewState,
  reducers: {
    importCaseTreeViewState(
      _,
      action: PayloadAction<SerializedCaseTreeViewState>,
    ) {
      return action.payload;
    },

    initializeTree(state, action: PayloadAction<WithCaseTreeId>) {
      const { functionName } = action.payload;

      if (functionName in state) return;

      state[functionName] = {
        rootId: "root",
        nodes: { root: { variable: intervalVariables[0], cases: [] } },
      };
    },

    updateTree(
      state,
      action: PayloadAction<WithCaseTreeId<{ tree: CaseTreeEntry }>>,
    ) {
      const { functionName, tree } = action.payload;

      state[functionName] = tree;
    },

    editCaseTree(
      state,
      action: PayloadAction<
        WithCaseTreeId<{ target: EditTarget; value: string }>
      >,
    ) {
      const { target, value, functionName } = action.payload;
      const caseTree = state[functionName];

      if (!caseTree) return;

      switch (target.kind) {
        case "value":
          setBranch(caseTree.nodes[target.ref.nodeId], target.ref, {
            type: "value",
            value,
          });
          return;

        case "variable":
          caseTree.nodes[target.nodeId].variable = value;
          return;

        case "match": {
          const caseToUpdate =
            caseTree.nodes[target.nodeId].cases[target.caseIdx];

          if (caseToUpdate) caseToUpdate.match = value;
          return;
        }
      }
    },

    appendCase(
      state,
      action: PayloadAction<
        WithCaseTreeId<{ target: AppendTarget; value: string }>
      >,
    ) {
      const { target, value, functionName } = action.payload;
      const caseTree = state[functionName];

      if (!caseTree) return;

      caseTree.nodes[target.nodeId].cases.push(
        target.kind === "appendValue"
          ? { match: "", branch: { type: "value", value } }
          : { match: value, branch: { type: "value", value: "" } },
      );
    },

    branchVariable(
      state,
      action: PayloadAction<
        WithCaseTreeId<{ target: BranchTarget; variable: string }>
      >,
    ) {
      const { target, variable, functionName } = action.payload;
      const caseTree = state[functionName];

      if (!caseTree) return;

      if (target.kind === "initial") {
        const rootNode = caseTree.nodes[caseTree.rootId];

        rootNode.variable = variable;
        rootNode.cases.push({
          match: "",
          branch: { type: "value", value: "" },
        });
        return;
      }

      const parent = caseTree.nodes[target.ref.nodeId];
      const previousBranch = getBranch(parent, target.ref);
      const nextId = getNextNodeId(caseTree.nodes);

      caseTree.nodes[nextId] = {
        variable,
        cases: [],
        default: {
          type: "value",
          value: previousBranch?.type === "value" ? previousBranch.value : "",
        },
      };

      setBranch(parent, target.ref, { type: "ref", nodeId: nextId });
    },

    deleteCase(state, action: PayloadAction<WithCaseTreeId<{ ref: CaseRef }>>) {
      const { ref, functionName } = action.payload;
      const caseTree = state[functionName];

      if (!caseTree) return;

      const parentNode = caseTree.nodes[ref.nodeId];
      const branch = getBranch(parentNode, ref);

      if (ref.kind === "case") parentNode.cases.splice(ref.caseIdx, 1);
      else parentNode.default = undefined;

      if (!branch || branch.type === "value") return;

      const nodeIdsToDelete = getSubstreeNodeIds(branch.nodeId, caseTree.nodes);

      nodeIdsToDelete.forEach((id) => delete caseTree.nodes[id]);
    },
  },
});

export default caseTreeViewSlice.reducer;

const {
  editCaseTree: editCaseTreeAction,
  deleteCase: deleteCaseAction,
  initializeTree: initializeTreeAction,
} = caseTreeViewSlice.actions;

export const {
  importCaseTreeViewState,
  updateTree,
  appendCase,
  branchVariable,
} = caseTreeViewSlice.actions;

export const regenerateInterpretation =
  (tupleName: string): AppThunk =>
  (dispatch, getState) => {
    updateInterpretation(dispatch, getState, tupleName);
    dispatch(UndoActions.checkpoint());
  };

const treeUpdateWrapper =
  <T>(action: PayloadActionCreator<WithCaseTreeId<T>>) =>
  (args: WithCaseTreeId<T>): AppThunk =>
  (dispatch, getState) => {
    dispatch(action(args));
    updateInterpretation(dispatch, getState, args.functionName);
    dispatch(UndoActions.checkpoint());
  };

const updateInterpretation = (
  dispatch: ThunkDispatch<RootState, unknown, Action>,
  getState: () => RootState,
  tupleName: string,
) => {
  const state = getState().present;
  const { rootId, nodes } = state.caseTreeView[tupleName];
  const domain = new Set(state.structure.domain.value);
  const arity = selectValidatedFunctions(getState()).parsed.get(tupleName);

  if (!arity) return;

  const result = generateTuples(rootId, nodes, domain, arity);

  if (!result.ok) return;

  dev.log("Generated tuples", result.tuples);
  dispatch(
    updateFunctionSymbols(
      { key: tupleName, value: result.tuples },
      { source: "caseTreeView" },
    ),
  );
};

export const deleteCase = treeUpdateWrapper(deleteCaseAction);
export const editCaseTree = treeUpdateWrapper(editCaseTreeAction);

export const initializeTree =
  (functionName: string): AppThunk =>
  (dispatch, getState) => {
    const functions = selectValidatedFunctions(getState());
    const iF = selectValidatedFunction(getState(), functionName);
    const arity = functions.parsed.get(functionName);

    if (arity === undefined || iF.error || iF.parsed.length === 0) {
      return void dispatch(initializeTreeAction({ functionName }));
    }

    const tree = initializeTreeFromTuples(iF.parsed, arity);

    dispatch(updateTree({ functionName, tree }));
  };

export const selectCasePaths = createSelector(
  selectDomain,
  (state: RootState, tupleName: string) =>
    selectValidatedFunctions(state).parsed.get(tupleName),
  (state: RootState, tupleName: string) =>
    state.present.caseTreeView[tupleName],
  ({ value: domain }, arity, caseTree) => {
    if (!caseTree?.rootId) return undefined;

    return flattenCaseTree(
      caseTree.rootId,
      caseTree.nodes,
      new Set(domain),
      arity ?? 0,
    );
  },
);

export const selectCaseTreeOutOfSync = createSelector(
  [
    selectCasePaths,
    (state: RootState, functionName: string) =>
      selectValidatedFunction(state, functionName).error,
  ],
  (casePaths, error) =>
    !!error && !!casePaths && casePaths.every((path) => path.error === ""),
);
