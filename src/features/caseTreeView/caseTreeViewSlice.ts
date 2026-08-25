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
  getSubtreeNodeIds,
  intervalVariables,
  rootNodeId,
  type CaseTreeBranch,
  type CaseTreeEntry,
  type CaseTreeNode,
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

export type CaseTreeState = Record<string, CaseTreeEntry>;

type WithCaseTreeId<T = object> = {
  functionName: string;
} & T;

const getNode = (
  caseTree: CaseTreeEntry,
  nodeId: string,
): CaseTreeNode | undefined => caseTree.nodes[nodeId];

const collapseBranch = (
  branch: CaseTreeBranch | undefined,
  nodes: Record<string, CaseTreeNode>,
): CaseTreeBranch | undefined => {
  if (branch?.type !== "ref") return undefined;

  const child = nodes[branch.nodeId];

  return {
    type: "value",
    value: child?.default?.type === "value" ? child.default.value : "",
  };
};

const getBranch = (node: CaseTreeNode, ref: CaseRef) =>
  ref.kind === "case" ? node.cases[ref.caseIdx]?.branch : node.default;

const setBranch = (
  node: CaseTreeNode,
  ref: CaseRef,
  branch: CaseTreeBranch,
) => {
  if (ref.kind === "default") node.default = branch;
  else {
    const caseToUpdate = node.cases[ref.caseIdx];

    if (caseToUpdate) caseToUpdate.branch = branch;
  }
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
        rootId: rootNodeId,
        nodes: { [rootNodeId]: { variable: intervalVariables[0], cases: [] } },
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
        case "value": {
          const node = getNode(caseTree, target.ref.nodeId);

          if (!node) return;

          setBranch(node, target.ref, { type: "value", value });
          return;
        }

        case "variable": {
          const node = getNode(caseTree, target.nodeId);

          if (!node) return;

          node.variable = value;
          return;
        }

        case "match": {
          const caseToUpdate = getNode(caseTree, target.nodeId)?.cases[
            target.caseIdx
          ];

          if (!caseToUpdate) return;

          caseToUpdate.match = value;
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

      const node = getNode(caseTree, target.nodeId);

      if (!node) return;

      node.cases.push(
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
        const rootNode = getNode(caseTree, caseTree.rootId);

        if (!rootNode) return;

        rootNode.variable = variable;
        rootNode.cases.push({
          match: "",
          branch: { type: "value", value: "" },
        });
        return;
      }

      const parent = getNode(caseTree, target.ref.nodeId);

      if (!parent) return;

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

      const parentNode = getNode(caseTree, ref.nodeId);

      if (!parentNode) return;

      const branch = getBranch(parentNode, ref);

      if (ref.kind === "case") parentNode.cases.splice(ref.caseIdx, 1);
      else parentNode.default = collapseBranch(branch, caseTree.nodes);

      if (!branch || branch.type === "value") return;

      const nodeIdsToDelete = getSubtreeNodeIds(branch.nodeId, caseTree.nodes);

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
  const caseTree = state.caseTreeView[tupleName];

  if (!caseTree) return;

  const domain = new Set(state.structure.domain.value);
  const arity = selectValidatedFunctions(getState()).parsed.get(tupleName);

  if (!arity) return;

  const result = generateTuples(caseTree.rootId, caseTree.nodes, domain, arity);

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
