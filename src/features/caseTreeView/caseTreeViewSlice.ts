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
  generateTuples,
  getNextNodeId,
  getStructuredIntervalView,
  getSubstreeNodeIds,
  initializeTreeFromTuples,
  intervalVariables,
} from "./helpers";
import { dev } from "../../shared/core/logging";
import type { SerializedCaseTreeViewState } from "./validationSchema";
import { UndoActions } from "../undoHistory/undoHistory";
import type { RelevantSymbols } from "../import/importExportUtils";

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
      const { tupleName } = action.payload;

      if (tupleName in state) return;

      state[tupleName] = {
        rootId: "root",
        nodes: { root: { variable: intervalVariables[0], cases: [] } },
      };
    },

    updateTree(
      state,
      action: PayloadAction<WithCaseTreeId<{ tree: CaseTreeEntry }>>,
    ) {
      const { tupleName, tree } = action.payload;

      state[tupleName] = tree;
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
          variable?: string;
          value?: string;
          match?: string;
        }>
      >,
    ) {
      const {
        parentId,
        caseType,
        branchType,
        caseIdx,
        tupleName,
        variable,
        value,
        match,
      } = action.payload;

      if (!state[tupleName]) return;

      const newBranch: CaseTreeBranch =
        branchType === "value"
          ? { type: "value", value: value ?? "" }
          : { type: "ref", nodeId: "" };

      const parent = state[tupleName].nodes[parentId];

      if (newBranch.type === "ref") {
        const newNode: CaseTreeNode = { variable: variable ?? "", cases: [] };
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
        if (match) parent.cases[caseIdx].match = match;
      } else if (caseType === "case") {
        const newCase: CaseTreeCase = { match: match ?? "", branch: newBranch };
        parent.cases.push(newCase);
      } else {
        parent.default = newBranch;
      }
    },

    addInitialCase(
      state,
      action: PayloadAction<WithCaseTreeId<{ variable: string }>>,
    ) {
      const { tupleName, variable } = action.payload;

      if (!state[tupleName]) return;

      const rootId = state[tupleName].rootId;
      const rootNode = state[tupleName].nodes[rootId];

      rootNode.variable = variable;
      rootNode.cases.push({ match: "", branch: { type: "value", value: "" } });
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
  deleteCase: deleteCaseAction,
  initializeTree: initializeTreeAction,
} = caseTreeViewSlice.actions;

export const { importCaseTreeViewState, updateTree, addCase, addInitialCase } =
  caseTreeViewSlice.actions;

const treeUpdateWrapper =
  <T>(action: PayloadActionCreator<WithCaseTreeId<T>>) =>
  (args: WithCaseTreeId<T>): AppThunk =>
  (dispatch, getState) => {
    dispatch(action(args));

    updateInterpretation(dispatch, getState, args.tupleName);
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

export const regenerateInterpretation =
  (tupleName: string): AppThunk =>
  (dispatch, getState) =>
    updateInterpretation(dispatch, getState, tupleName);

export const updateNode = treeUpdateWrapper(updateNodeAction);
export const updateCase = treeUpdateWrapper(updateCaseAction);
export const updateBranch = treeUpdateWrapper(updateBranchAction);
export const deleteCase = treeUpdateWrapper(deleteCaseAction);

export const initializeTree =
  (tupleName: string): AppThunk =>
  (dispatch, getState) => {
    const iF = selectValidatedFunction(getState(), tupleName);

    if (iF.error || !iF.parsed || iF.parsed.length === 0) {
      return void dispatch(initializeTreeAction({ tupleName }));
    }

    const arity = iF.parsed[0].length - 1;
    const tree = initializeTreeFromTuples(iF.parsed, arity);

    dispatch(updateTree({ tupleName, tree }));
  };

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

export const getRelevantCaseTreeState = (
  state: CaseTreeState,
  relevantSymbols: RelevantSymbols,
) => {
  return Object.fromEntries(
    Object.entries(state).filter(
      ([key]) => relevantSymbols[key]?.type === "function",
    ),
  );
};
