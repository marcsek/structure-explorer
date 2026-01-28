import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { selectRelevantUnaryPreds } from "../graphView/graphs/graphSlice";
import type { RootState } from "../../app/store";
import { updatePredicates } from "../language/languageSlice";
import { fallbackToEmptyArray } from "../../common/redux";
import { updateDomain } from "../structure/structureSlice";
import type { EditorType } from "../structure/InterpretationEditor";
import type { RelevantSymbols } from "../import/importThunk";
import type { SerializedEditorToolbarState } from "./validationSchema";

export type EditorToolbarEntry = {
  hoveredUnary: string[];
  selectedUnary: string[];
  selectedDomain?: string[] | undefined;
  unaryFilterDomain: boolean;
  unaryFilterHovered: boolean;
  openedEditor: EditorType;
};

export type EditorToolbarState = Record<string, EditorToolbarEntry>;

const initialState: EditorToolbarState = {};

type WithEditorId<T = object> = { id: string } & T;

export const editorToolbarSlice = createSlice({
  name: "editorToolbar",
  initialState,
  reducers: {
    importEditorToolbarState(
      _,
      action: PayloadAction<SerializedEditorToolbarState>,
    ) {
      return action.payload;
    },

    unaryPredicateToggled(
      state,
      action: PayloadAction<WithEditorId<{ predicate: string | string[] }>>,
    ) {
      const { id, predicate } = action.payload;

      state[id] = initializeStateIfNotSet(state[id]);

      const selected = state[id].selectedUnary;

      if (Array.isArray(predicate)) state[id].selectedUnary = predicate;
      else if (selected.includes(predicate))
        state[id].selectedUnary = selected.filter((pred) => pred != predicate);
      else selected.push(predicate);
    },

    nodeToggled(
      state,
      action: PayloadAction<WithEditorId<{ domain: string[]; node?: string }>>,
    ) {
      const { id, domain, node: toggledNode = "" } = action.payload;

      state[id] = initializeStateIfNotSet(state[id], domain);

      const selectedNodes = state[id].selectedDomain ?? domain;

      if (toggledNode === "") state[id].selectedDomain = undefined;
      else if (selectedNodes.includes(toggledNode))
        state[id].selectedDomain = selectedNodes.filter(
          (selectedNode) => selectedNode != toggledNode,
        );
      else {
        const newSelectedDomain = [...selectedNodes, toggledNode];
        state[id].selectedDomain =
          newSelectedDomain.length === domain.length
            ? undefined
            : newSelectedDomain;
      }
    },

    predicateHovered(
      state,
      action: PayloadAction<WithEditorId<{ predicates: string[] }>>,
    ) {
      const { id, predicates } = action.payload;

      state[id] = initializeStateIfNotSet(state[id]);

      state[id].hoveredUnary = predicates;
    },

    unaryFilterDomainHovered(
      state,
      action: PayloadAction<WithEditorId<{ hovered: boolean }>>,
    ) {
      const { id, hovered } = action.payload;

      state[id] = initializeStateIfNotSet(state[id]);

      state[id].unaryFilterHovered = hovered;
    },

    unaryFilterDomainToggled(state, action: PayloadAction<WithEditorId>) {
      const { id } = action.payload;

      state[id] = initializeStateIfNotSet(state[id]);

      state[id].unaryFilterDomain = !state[id].unaryFilterDomain;
    },

    editorOpened(
      state,
      action: PayloadAction<WithEditorId<{ editor: EditorType }>>,
    ) {
      const { id, editor } = action.payload;

      state[id] = initializeStateIfNotSet(state[id]);

      state[id].openedEditor = editor;
    },
  },

  extraReducers(builder) {
    builder.addCase(updateDomain, (state) => {
      for (const entry of Object.values(state)) {
        entry.selectedDomain = undefined;
      }
    });

    builder.addCase(updatePredicates, (state, action) => {
      const unaryPredicates = action.payload
        .filter(({ arity }) => arity === 1)
        .map(({ name }) => name);

      for (const [predName, value] of Object.entries(state)) {
        const newSelectedUnary = value.selectedUnary.filter((selectedPred) =>
          unaryPredicates.includes(selectedPred),
        );

        const newHoveredUnary = value.hoveredUnary.filter((hoveredPred) =>
          unaryPredicates.includes(hoveredPred),
        );

        state[predName].selectedUnary = newSelectedUnary;
        state[predName].hoveredUnary = newHoveredUnary;
      }
    });
  },
});

export const selectOpenedEditor = (state: RootState, id: string) =>
  state.present.editorToolbar[id]?.openedEditor ?? "text";

export const selectSelectedUnary = (state: RootState, id: string) =>
  fallbackToEmptyArray(state.present.editorToolbar[id]?.selectedUnary);

export const selectHoveredUnary = (state: RootState, id: string) =>
  fallbackToEmptyArray(state.present.editorToolbar[id]?.hoveredUnary);

export const selectUnaryFilterDomain = (state: RootState, id: string) =>
  state.present.editorToolbar[id]?.unaryFilterDomain ?? true;

export const selectUnaryFilterDomainHovered = (state: RootState, id: string) =>
  state.present.editorToolbar[id]?.unaryFilterHovered ?? false;

export const selectSelectedDomain = createSelector(
  [
    (state: RootState) => state.present.structure.domain,
    (state: RootState, id: string) =>
      state.present.editorToolbar[id]?.selectedDomain,
  ],
  (domain, selectedNodes) =>
    selectedNodes ? [...selectedNodes] : [...domain.value],
);

// TODO: too specific
export const selectPredicatesToDisplay = createSelector(
  [
    selectSelectedUnary,
    selectHoveredUnary,
    (state: RootState, __: string, domainId: string) =>
      selectRelevantUnaryPreds(state, domainId),
  ],
  (selectedUnary, hoveredUnary, relevantUnary) => {
    const vissiblePreds = [...hoveredUnary, ...selectedUnary];

    const toDisplay =
      relevantUnary.filter((relevant) => vissiblePreds.includes(relevant)) ??
      [];

    const previewed = relevantUnary.filter(
      (predicate) =>
        hoveredUnary.includes(predicate) && !selectedUnary.includes(predicate),
    );

    return [toDisplay, previewed];
  },
);

// TODO: ???
export const selectRelevantDomainElements = createSelector(
  [
    (state: RootState) => state.present.structure.iP,
    (state: RootState) => state.present.structure.domain,
    selectSelectedUnary,
    selectUnaryFilterDomainHovered,
    selectUnaryFilterDomain,
    selectHoveredUnary,
    (_: RootState, __: string, includeHovered: boolean = false) =>
      includeHovered,
  ],
  (
    iP,
    domain,
    selectedUnary,
    unaryFilterHovered,
    unaryFilterDomain,
    hoveredUnary,
    includeHovered,
  ) => {
    const selectedPreds = [...selectedUnary];

    if (includeHovered) {
      if (unaryFilterHovered) return [...domain.value];

      selectedPreds.push(...hoveredUnary);
    }

    if (selectedPreds.length === 0 || !unaryFilterDomain) return undefined;

    const selectedDomain = new Set(
      selectedPreds.flatMap((pred) => [...(iP[pred]?.value ?? [])].flat()),
    );

    return domain.value.filter((element) => selectedDomain.has(element));
  },
);

export const selectFilteredDomain = createSelector(
  [selectSelectedDomain, selectRelevantDomainElements],
  (selectedDomain, relevantDomain) => {
    if (!relevantDomain || relevantDomain.length === 0) return selectedDomain;

    const result = relevantDomain.filter((element) =>
      selectedDomain.includes(element),
    );

    return result;
  },
);

export const selectHoveredIntr = createSelector(
  [
    (state: RootState) => state.present.structure.iP,
    (state: RootState) => state.present.structure.domain,
    selectHoveredUnary,
    selectUnaryFilterDomainHovered,
  ],
  (iP, domain, hoveredUnary, unaryFilterHovered) => {
    if (unaryFilterHovered) return [[...domain.value]];

    if (hoveredUnary.length === 0) return undefined;

    return hoveredUnary.map((hoveredPredicate) =>
      [...(iP[hoveredPredicate]?.value ?? [])].flat(),
    );
  },
);

export const getRelevantEditorToolbarState = (
  editorToolbar: EditorToolbarState,
  relevantSymbols: RelevantSymbols,
): EditorToolbarState => {
  const stateToExport: EditorToolbarState = {};

  for (const [name, entry] of Object.entries(editorToolbar)) {
    if (!relevantSymbols[name] || relevantSymbols[name].type === "constant")
      continue;

    stateToExport[name] = {
      ...entry,
      hoveredUnary: [],
      unaryFilterHovered: false,
    };
  }

  return stateToExport;
};

export default editorToolbarSlice.reducer;

export const {
  importEditorToolbarState,
  nodeToggled,
  predicateHovered,
  unaryFilterDomainHovered,
  unaryFilterDomainToggled,
  unaryPredicateToggled,
  editorOpened,
} = editorToolbarSlice.actions;

const initializeStateIfNotSet = (
  state: EditorToolbarEntry | undefined,
  selectedNodes?: string[],
): EditorToolbarEntry => {
  if (state) return state;

  return {
    hoveredUnary: [],
    selectedUnary: [],
    selectedDomain: selectedNodes,
    unaryFilterDomain: true,
    unaryFilterHovered: false,
    openedEditor: "text",
  };
};
