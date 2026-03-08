import {
  createSelector,
  createSlice,
  type PayloadAction,
  type PayloadActionCreator,
} from "@reduxjs/toolkit";
import type { AppThunk, RootState } from "../../app/store";
import {
  selectDomain,
  updateFunctionSymbols,
} from "../structure/structureSlice";
import { selectValidatedFunctions } from "../language/languageSlice";
import {
  generateTuples,
  getNextNodeId,
  getSubstreeNodeIds,
  validateTreeNode,
} from "./helpers";
import { dev } from "../../common/logging";

export type CaseTreeBranch =
  | { type: "value"; value: string }
  | { type: "ref"; nodeId: string };

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
  tupleName: string;
} & T;

const initialState: CaseTreeState = {};

export const caseTreeViewSlice = createSlice({
  name: "caseTreeView",
  initialState,
  reducers: {
    importState() {},

    initializeTree(state, action: PayloadAction<WithCaseTreeId>) {
      const { tupleName } = action.payload;

      if (tupleName in state) return;

      state[tupleName] = {
        rootId: "root",
        nodes: { root: { variable: "", cases: [] } },
      };
    },

    updateNode(
      state,
      action: PayloadAction<
        WithCaseTreeId<{ nodeId: string; variable: string }>
      >,
    ) {
      const { nodeId, variable, tupleName } = action.payload;

      if (state[tupleName]) state[tupleName].nodes[nodeId].variable = variable;
    },

    updateCase(
      state,
      action: PayloadAction<
        WithCaseTreeId<{ nodeId: string; caseIdx: number; match: string }>
      >,
    ) {
      const { nodeId, caseIdx, match, tupleName } = action.payload;

      const caseToUpdate = state[tupleName]?.nodes[nodeId].cases[caseIdx];

      if (caseToUpdate) caseToUpdate.match = match;
    },

    updateBranch(
      state,
      action: PayloadAction<
        WithCaseTreeId<{
          nodeId: string;
          branch: CaseTreeBranch;
          caseIdx?: number;
        }>
      >,
    ) {
      const { nodeId, caseIdx, branch, tupleName } = action.payload;

      if (!state[tupleName]) return;

      const node = state[tupleName].nodes[nodeId];

      if (caseIdx === undefined) node.default = branch;
      else node.cases[caseIdx].branch = branch;
    },

    addCase(
      state,
      action: PayloadAction<
        WithCaseTreeId<{
          parentId: string;
          caseType: "case" | "default";
          branchType: "value" | "ref";
        }>
      >,
    ) {
      const { parentId, caseType, branchType, tupleName } = action.payload;

      if (!state[tupleName]) return;

      const newBranch: CaseTreeBranch =
        branchType === "value"
          ? { type: "value", value: "" }
          : { type: "ref", nodeId: "" };

      if (newBranch.type === "ref") {
        const newNode: CaseTreeNode = { variable: "", cases: [] };
        const nextId = getNextNodeId(state[tupleName].nodes);

        newBranch.nodeId = nextId;
        state[tupleName].nodes[nextId] = newNode;
      }

      const parent = state[tupleName].nodes[parentId];
      if (caseType === "case") {
        const newCase: CaseTreeCase = { match: "", branch: newBranch };
        parent.cases.push(newCase);
      } else {
        parent.default = newBranch;
      }
    },

    deleteCase(
      state,
      action: PayloadAction<
        WithCaseTreeId<{
          parentId: string;
          caseIdx?: number;
          caseType: "case" | "default";
        }>
      >,
    ) {
      const { parentId, tupleName, caseType, caseIdx } = action.payload;
      const caseTree = state[tupleName];

      if (!caseTree) return;

      const parentNode = caseTree.nodes[parentId];

      let branch: CaseTreeBranch | undefined;
      if (caseType === "case" && caseIdx !== undefined) {
        branch = parentNode.cases[caseIdx].branch;
        parentNode.cases.splice(caseIdx, 1);
      } else if (caseType === "default") {
        branch = parentNode.default;
        parentNode.default = undefined;
      }

      if (!branch || branch.type === "value") return;

      const nodeIdsToDelete = getSubstreeNodeIds(branch.nodeId, caseTree.nodes);

      nodeIdsToDelete.forEach((id) => delete caseTree.nodes[id]);
    },
  },
});

export default caseTreeViewSlice.reducer;

const {
  updateNode: updateNodeAction,
  updateCase: updateCaseAction,
  updateBranch: updateBranchAction,
} = caseTreeViewSlice.actions;

export const { importState, initializeTree, addCase, deleteCase } =
  caseTreeViewSlice.actions;

const treeUpdateWrapper =
  <T>(action: PayloadActionCreator<WithCaseTreeId<T>>) =>
  (args: WithCaseTreeId<T>): AppThunk =>
  (dispatch, getState) => {
    dispatch(action(args));

    const tupleName = args.tupleName;
    const state = getState().present;
    const { rootId, nodes } = state.caseTreeView[tupleName];
    const domain = new Set(state.structure.domain.value);
    const arity = selectValidatedFunctions(getState()).parsed.get(tupleName);

    if (!arity) return;

    const result = generateTuples(rootId, nodes, domain, arity);

    if (!result.ok) return;

    dev.log("Generated tuples", result.tuples);
    dispatch(updateFunctionSymbols({ key: tupleName, value: result.tuples }));
  };

export const updateNode = treeUpdateWrapper(updateNodeAction);
export const updateCase = treeUpdateWrapper(updateCaseAction);
export const updateBranch = treeUpdateWrapper(updateBranchAction);

export const selectTreeNodeValidation = createSelector(
  [
    selectDomain,
    (state: RootState, tupleName: string) =>
      selectValidatedFunctions(state).parsed.get(tupleName),
    (state: RootState, tupleName: string) =>
      state.present.caseTreeView[tupleName],
  ],
  ({ value: domain }, arity, caseTree) => {
    if (!arity || !caseTree) return {};

    return validateTreeNode(
      caseTree.rootId,
      caseTree.nodes,
      new Set(domain),
      arity,
    );
  },
);

export const selectMaxDepthReached = createSelector(
  [
    (state: RootState, tupleName: string) =>
      selectValidatedFunctions(state).parsed.get(tupleName),
    (state: RootState, tupleName: string) =>
      state.present.caseTreeView[tupleName],
    (_: RootState, __: string, nodeId: string) => nodeId,
  ],
  (arity, caseTree, targetNodeId) => {
    if (!arity) return false;

    const nodeStack = [{ nodeId: caseTree.rootId, depth: 1 }];
    while (nodeStack.length > 0) {
      const { nodeId, depth } = nodeStack.pop()!;
      const node = caseTree.nodes[nodeId];

      if (targetNodeId === nodeId) return depth >= arity;

      const branches = [...node.cases.map((c) => c.branch)];
      if (node.default) branches.push(node.default);

      for (const branch of branches) {
        if (branch.type === "value") continue;

        nodeStack.push({
          nodeId: branch.nodeId,
          depth: depth + 1,
        });
      }
    }

    return false;
  },
);

export const selectSwitchExhausted = createSelector(
  [
    selectDomain,
    (state: RootState, tupleName: string) =>
      state.present.caseTreeView[tupleName],
    (_: RootState, __: string, nodeId: string) => nodeId,
  ],
  ({ value: domain }, caseTree, targetNodeId) => {
    if (domain.length === 0) return false;

    const node = caseTree.nodes[targetNodeId];
    return node.cases.length === domain.length;
  },
);
