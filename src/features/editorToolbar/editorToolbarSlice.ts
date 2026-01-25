import {
  createSelector,
  createSlice,
  isAnyOf,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  domainChanged,
  selectRelevantUnaryPreds,
} from "../graphView/graphs/graphSlice";
import type { RootState } from "../../app/store";
import { selectStructure } from "../structure/structureSlice";
import { updateFunctions, updatePredicates } from "../language/languageSlice";

export type EditorToolbarEntry = {
  hoveredUnary: string[];
  selectedUnary: string[];
  selectedDomain: string[] | undefined;
  unaryFilterDomain: boolean;
  unaryFilterHovered: boolean;
};

export type EditorToolbarState = Record<string, EditorToolbarEntry>;

const initialState: EditorToolbarState = {};

type WithEditorId<T = object> = { id: string } & T;

export const editorToolbarSlice = createSlice({
  name: "editorToolbar",
  initialState,
  reducers: {
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

      if (toggledNode === "") state[id].selectedDomain = domain;
      else if (selectedNodes.includes(toggledNode))
        state[id].selectedDomain = selectedNodes.filter(
          (selectedNode) => selectedNode != toggledNode,
        );
      else state[id].selectedDomain = [...selectedNodes, toggledNode];
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
  },

  extraReducers(builder) {
    builder.addCase(domainChanged, (state, action) => {
      for (const entry of Object.values(state)) {
        entry.selectedDomain = action.payload;
      }
    });

    builder.addMatcher(
      isAnyOf(updatePredicates, updateFunctions),
      (state, action) => {
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
      },
    );
  },
});

export const selectSelectedUnary = createSelector(
  [
    (state: RootState, id: string) =>
      state.present.editorToolbar[id]?.selectedUnary,
  ],
  (selectedUnary) => selectedUnary ?? [],
);

export const selectHoveredUnary = createSelector(
  [
    (state: RootState, id: string) =>
      state.present.editorToolbar[id]?.hoveredUnary,
  ],
  (hoveredUnary) => hoveredUnary ?? [],
);

export const selectUnaryFilterDomain = createSelector(
  [
    (state: RootState, id: string) =>
      state.present.editorToolbar[id]?.unaryFilterDomain,
  ],
  (unaryFilterDomain) => unaryFilterDomain ?? true,
);

export const selectUnaryFilterDomainHovered = createSelector(
  [
    (state: RootState, id: string) =>
      state.present.editorToolbar[id]?.unaryFilterHovered,
  ],
  (unaryFilterHovered) => unaryFilterHovered ?? false,
);

export const selectSelectedDomain = createSelector(
  [
    (state: RootState) => state.present.structure.domain,
    (state: RootState, id: string) =>
      state.present.editorToolbar[id]?.selectedDomain,
  ],
  (domain, selectedNodes) => {
    return selectedNodes ? [...selectedNodes] : [...domain.value];
  },
);

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
      relevantUnary
        .filter((relevant) => vissiblePreds.includes(relevant))
        ?.sort() ?? [];

    const previewed = relevantUnary.filter(
      (predicate) =>
        hoveredUnary.includes(predicate) && !selectedUnary.includes(predicate),
    );

    return [toDisplay, previewed];
  },
);

export const selectRelevantDomainElements = createSelector(
  [
    selectStructure,
    selectSelectedUnary,
    selectUnaryFilterDomainHovered,
    selectUnaryFilterDomain,
    selectHoveredUnary,
    (_: RootState, __: string, includeHovered: boolean = false) =>
      includeHovered,
  ],
  (
    struct,
    selectedUnary,
    unaryFilterHovered,
    unaryFilterDomain,
    hoveredUnary,
    includeHovered,
  ) => {
    const selectedPreds = [...selectedUnary];

    if (includeHovered) {
      if (unaryFilterHovered) return [...struct.domain];

      selectedPreds.push(...hoveredUnary);
    }

    if (selectedPreds.length === 0 || !unaryFilterDomain) return undefined;

    const selectedDomain = new Set(
      selectedPreds.flatMap((pred) =>
        [...(struct.iP.get(pred)?.values() ?? [])].flat(),
      ),
    );

    return [...struct.domain].filter((element) => selectedDomain.has(element));
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
  [selectStructure, selectHoveredUnary, selectUnaryFilterDomainHovered],
  (struct, hoveredUnary, unaryFilterHovered) => {
    if (unaryFilterHovered) return [[...struct.domain]];

    if (hoveredUnary.length === 0) return undefined;

    return hoveredUnary.map((hoveredPredicate) =>
      [...(struct.iP.get(hoveredPredicate)?.values() ?? [])].flat(),
    );
  },
);

export default editorToolbarSlice.reducer;

export const {
  nodeToggled,
  predicateHovered,
  unaryFilterDomainHovered,
  unaryFilterDomainToggled,
  unaryPredicateToggled,
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
  };
};
