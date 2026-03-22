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
  getStructuredIntervalView,
  getSubstreeNodeIds,
} from "./helpers";
import { dev } from "../../common/logging";
import type { SerializedCaseTreeViewState } from "./validationSchema";
import { UndoActions } from "../undoHistory/undoHistory";

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

export const initialCaseTreeViewState: CaseTreeState = {
  // room: {
  //   rootId: "root",
  //   nodes: {
  //     root: {
  //       variable: "x",
  //       cases: [
  //         { match: "A", branch: { type: "value", value: "B" } },
  //         { match: "B", branch: { type: "ref", nodeId: "n1" } },
  //       ],
  //       default: { type: "value", value: "E" },
  //     },
  //     n1: {
  //       variable: "y",
  //       cases: [
  //         { match: "D", branch: { type: "value", value: "C" } },
  //         { match: "E", branch: { type: "value", value: "A" } },
  //       ],
  //       default: { type: "ref", nodeId: "n2" },
  //     },
  //     n2: {
  //       variable: "z",
  //       cases: [{ match: "D", branch: { type: "value", value: "C" } }],
  //     },
  //   },
  // },
};

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
          caseIdx?: number;
        }>
      >,
    ) {
      const { parentId, caseType, branchType, caseIdx, tupleName } =
        action.payload;

      if (!state[tupleName]) return;

      const newBranch: CaseTreeBranch =
        branchType === "value"
          ? { type: "value", value: "" }
          : { type: "ref", nodeId: "" };

      const parent = state[tupleName].nodes[parentId];

      if (newBranch.type === "ref") {
        const newNode: CaseTreeNode = { variable: "", cases: [] };
        const nextId = getNextNodeId(state[tupleName].nodes);

        newBranch.nodeId = nextId;
        state[tupleName].nodes[nextId] = newNode;

        newNode.default = { type: "value", value: "" };

        const previousBranch =
          caseIdx !== undefined ? parent.cases[caseIdx].branch : parent.default;

        if (previousBranch && previousBranch.type === "value")
          newNode.default.value = previousBranch.value;
      }

      if (caseType === "case" && caseIdx !== undefined) {
        parent.cases[caseIdx].branch = newBranch;
      } else if (caseType === "case") {
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
          caseType: "case" | "default";
          caseIdx?: number;
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

export const { importCaseTreeViewState, initializeTree, addCase, deleteCase } =
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
    dispatch(UndoActions.checkpoint());
  };

export const updateNode = treeUpdateWrapper(updateNodeAction);
export const updateCase = treeUpdateWrapper(updateCaseAction);
export const updateBranch = treeUpdateWrapper(updateBranchAction);

export const selectStructuredCaseView = createSelector(
  selectDomain,
  (state: RootState, tupleName: string) =>
    selectValidatedFunctions(state).parsed.get(tupleName),
  (state: RootState, tupleName: string) =>
    state.present.caseTreeView[tupleName],
  ({ value: domain }, arity, caseTree) => {
    if (!caseTree?.rootId) return undefined;

    return getStructuredIntervalView(
      caseTree.rootId,
      caseTree.nodes,
      new Set(domain),
      arity ?? 0,
    );
  },
);
