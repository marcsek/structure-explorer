import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { selectRelevantUnaryPreds } from "../graphView/graphs/graphSlice";
import type { RootState } from "../../app/store";
import { updatePredicates } from "../language/languageSlice";
import { fallbackToEmptyArray } from "../../common/redux";
import { updateDomain, type TupleType } from "../structure/structureSlice";
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

export const initialEditorToolbarState: EditorToolbarState = {};

type WithToolbarId<T = object> = {
  tupleName: string;
  tupleType: TupleType;
} & T;

export const editorToolbarSlice = createSlice({
  name: "editorToolbar",
  initialState: initialEditorToolbarState,
  reducers: {
    importEditorToolbarState(
      _,
      action: PayloadAction<SerializedEditorToolbarState>,
    ) {
      return Object.fromEntries(
        Object.entries(action.payload).map(([key, value]) => [
          key,
          { ...value, hoveredUnary: [], unaryFilterHovered: false },
        ]),
      );
    },

    unaryPredicateToggled(
      state,
      action: PayloadAction<WithToolbarId<{ predicate: string | string[] }>>,
    ) {
      const { tupleName, tupleType, predicate } = action.payload;

      const tupleId = getTupleId(tupleType, tupleName);

      state[tupleId] = initializeStateIfNotSet(state[tupleId]);

      const toolbarState = state[tupleId];
      const selected = toolbarState.selectedUnary;

      if (Array.isArray(predicate)) toolbarState.selectedUnary = predicate;
      else if (selected.includes(predicate))
        toolbarState.selectedUnary = selected.filter(
          (pred) => pred != predicate,
        );
      else selected.push(predicate);
    },

    nodeToggled(
      state,
      action: PayloadAction<WithToolbarId<{ domain: string[]; node?: string }>>,
    ) {
      const {
        tupleName,
        tupleType,
        domain,
        node: toggledNode = "",
      } = action.payload;

      const tupleId = getTupleId(tupleType, tupleName);

      state[tupleId] = initializeStateIfNotSet(state[tupleId], domain);

      const toolbarState = state[tupleId];
      const selectedNodes = toolbarState.selectedDomain ?? domain;

      if (toggledNode === "") toolbarState.selectedDomain = undefined;
      else if (selectedNodes.includes(toggledNode))
        toolbarState.selectedDomain = selectedNodes.filter(
          (selectedNode) => selectedNode != toggledNode,
        );
      else {
        // Done this way to preserve order
        const newSelectedDomain = domain.filter((element) =>
          [...selectedNodes, toggledNode].includes(element),
        );

        toolbarState.selectedDomain =
          newSelectedDomain.length === domain.length
            ? undefined
            : newSelectedDomain;
      }
    },

    predicateHovered(
      state,
      action: PayloadAction<WithToolbarId<{ predicates: string[] }>>,
    ) {
      const { tupleName, tupleType, predicates } = action.payload;

      const tupleId = getTupleId(tupleType, tupleName);

      state[tupleId] = initializeStateIfNotSet(state[tupleId]);
      state[tupleId].hoveredUnary = predicates;
    },

    unaryFilterDomainHovered(
      state,
      action: PayloadAction<WithToolbarId<{ hovered: boolean }>>,
    ) {
      const { tupleName, tupleType, hovered } = action.payload;

      const tupleId = getTupleId(tupleType, tupleName);

      state[tupleId] = initializeStateIfNotSet(state[tupleId]);
      state[tupleId].unaryFilterHovered = hovered;
    },

    unaryFilterDomainToggled(state, action: PayloadAction<WithToolbarId>) {
      const { tupleName, tupleType } = action.payload;

      const tupleId = getTupleId(tupleType, tupleName);

      state[tupleId] = initializeStateIfNotSet(state[tupleId]);
      state[tupleId].unaryFilterDomain = !state[tupleId].unaryFilterDomain;
    },

    editorOpened(
      state,
      action: PayloadAction<WithToolbarId<{ editor: EditorType }>>,
    ) {
      const { tupleName, tupleType, editor } = action.payload;

      const tupleId = getTupleId(tupleType, tupleName);

      state[tupleId] = initializeStateIfNotSet(state[tupleId]);
      state[tupleId].openedEditor = editor;
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

      for (const [tupleId, value] of Object.entries(state)) {
        const newSelectedUnary = value.selectedUnary.filter((selectedPred) =>
          unaryPredicates.includes(selectedPred),
        );

        const newHoveredUnary = value.hoveredUnary.filter((hoveredPred) =>
          unaryPredicates.includes(hoveredPred),
        );

        state[tupleId].selectedUnary = newSelectedUnary;
        state[tupleId].hoveredUnary = newHoveredUnary;
      }
    });
  },
});

export const selectOpenedEditor = withToolbarId(
  (state, tupleId) =>
    state.present.editorToolbar[tupleId]?.openedEditor ?? "text",
);

export const selectSelectedUnary = withToolbarId((state, tupleId) =>
  fallbackToEmptyArray(state.present.editorToolbar[tupleId]?.selectedUnary),
);

export const selectHoveredUnary = withToolbarId((state, tupleId) =>
  fallbackToEmptyArray(state.present.editorToolbar[tupleId]?.hoveredUnary),
);

export const selectUnaryFilterDomain = withToolbarId(
  (state, tupleId) =>
    state.present.editorToolbar[tupleId]?.unaryFilterDomain ?? false,
);

export const selectUnaryFilterDomainHovered = withToolbarId(
  (state, tupleId) =>
    state.present.editorToolbar[tupleId]?.unaryFilterHovered ?? false,
);

export const selectSelectedDomain = createSelector(
  [
    (state: RootState) => state.present.structure.domain,
    withToolbarId(
      (state: RootState, toolbarId: string) =>
        state.present.editorToolbar[toolbarId]?.selectedDomain,
    ),
  ],
  (domain, selectedNodes) =>
    selectedNodes ? [...selectedNodes] : [...domain.value],
);

export const selectPredicatesToDisplay = createSelector(
  [
    selectSelectedUnary,
    selectHoveredUnary,
    (state: RootState, _: string, __: TupleType, domainId: string) =>
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

export const selectRelevantDomainElements = createSelector(
  [
    (state: RootState) => state.present.structure.iP,
    (state: RootState) => state.present.structure.domain,
    selectSelectedUnary,
    selectUnaryFilterDomainHovered,
    selectUnaryFilterDomain,
    selectHoveredUnary,
    (
      _: RootState,
      __: string,
      ___: TupleType,
      includeHovered: boolean = false,
    ) => includeHovered,
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
  editorToolbar: SerializedEditorToolbarState,
  relevantSymbols: RelevantSymbols,
): SerializedEditorToolbarState => {
  const stateToExport: SerializedEditorToolbarState = {};

  for (const [tupleName, relevantSymbol] of Object.entries(relevantSymbols)) {
    if (relevantSymbol.type === "constant") continue;

    const tupleId = getTupleId(relevantSymbol.type, tupleName);
    const toolbarEntry = editorToolbar[tupleId];

    if (!toolbarEntry) continue;

    const { openedEditor, selectedUnary, unaryFilterDomain, selectedDomain } =
      toolbarEntry;

    stateToExport[tupleId] = {
      openedEditor,
      selectedUnary,
      unaryFilterDomain,
      selectedDomain,
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
    unaryFilterDomain: false,
    unaryFilterHovered: false,
    openedEditor: "text",
  };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withToolbarId<R, A extends any[]>(
  selector: (state: RootState, tupleId: string, ...args: A) => R,
) {
  return (
    state: RootState,
    tupleName: string,
    tupleType: TupleType,
    ...args: A
  ): R => selector(state, getTupleId(tupleType, tupleName), ...args);
}

const getTupleId = (type: TupleType, key: string) => `${type}-${key}`;
