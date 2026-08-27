import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import {
  getUnarySymbolNames,
  toAritySymbols,
  updatePredicates,
} from "../language/languageSlice";
import { selectRelevantUnaryPreds } from "../structure/structureSlice";
import { fallbackToEmptyArray } from "../../shared/core/redux";
import {
  getTupleId,
  type TupleIdentity,
  type TupleInfo,
} from "../structure/tupleInfo";
import type { EditorType } from "../editors/editorTypes";
import type { SerializedEditorToolbarState } from "./validationSchema";

export type EditorToolbarEntry = {
  hoveredUnary: string[];
  selectedUnary: string[];
  deselectedDomain: string[];
  unaryFilterDomain: boolean;
  unaryFilterHovered: boolean;
  openedEditor: EditorType;
};

export type EditorToolbarState = Record<string, EditorToolbarEntry>;

export const initialEditorToolbarState: EditorToolbarState = {};

type WithTupleInfo<T = object> = {
  tupleInfo: TupleInfo;
} & T;

export const editorToolbarSlice = createSlice({
  name: "editorToolbar",
  initialState: initialEditorToolbarState,
  reducers: {
    importEditorToolbarState(
      _,
      action: PayloadAction<{
        state: SerializedEditorToolbarState;
        unaryPredicates: string[];
      }>,
    ) {
      const { state: imported, unaryPredicates } = action.payload;

      return Object.fromEntries(
        Object.entries(imported).map(([key, value]) => [
          key,
          {
            ...value,
            selectedUnary: keepExistingUnaryPreds(
              value.selectedUnary,
              unaryPredicates,
            ),
            hoveredUnary: [],
            unaryFilterHovered: false,
          },
        ]),
      );
    },

    unaryPredicateToggled(
      state,
      action: PayloadAction<WithTupleInfo<{ predicate: string | string[] }>>,
    ) {
      const { tupleInfo, predicate } = action.payload;

      const entry = getOrCreateEntry(state, tupleInfo);
      const selected = entry.selectedUnary;

      if (Array.isArray(predicate)) entry.selectedUnary = [...predicate];
      else if (selected.includes(predicate))
        entry.selectedUnary = selected.filter((pred) => pred !== predicate);
      else selected.push(predicate);
    },

    nodeToggled(state, action: PayloadAction<WithTupleInfo<{ node: string }>>) {
      const { tupleInfo, node } = action.payload;

      const entry = getOrCreateEntry(state, tupleInfo);
      const deselected = entry.deselectedDomain;

      if (deselected.includes(node))
        entry.deselectedDomain = deselected.filter(
          (element) => element !== node,
        );
      else deselected.push(node);
    },

    allNodesSelected(state, action: PayloadAction<WithTupleInfo>) {
      getOrCreateEntry(state, action.payload.tupleInfo).deselectedDomain = [];
    },

    predicateHovered(
      state,
      action: PayloadAction<WithTupleInfo<{ predicates: string[] }>>,
    ) {
      const { tupleInfo, predicates } = action.payload;

      getOrCreateEntry(state, tupleInfo).hoveredUnary = predicates;
    },

    unaryFilterDomainHovered(
      state,
      action: PayloadAction<WithTupleInfo<{ hovered: boolean }>>,
    ) {
      const { tupleInfo, hovered } = action.payload;

      getOrCreateEntry(state, tupleInfo).unaryFilterHovered = hovered;
    },

    unaryFilterDomainToggled(state, action: PayloadAction<WithTupleInfo>) {
      const entry = getOrCreateEntry(state, action.payload.tupleInfo);

      entry.unaryFilterDomain = !entry.unaryFilterDomain;
    },

    editorOpened(
      state,
      action: PayloadAction<WithTupleInfo<{ editor: EditorType }>>,
    ) {
      const { tupleInfo, editor } = action.payload;

      getOrCreateEntry(state, tupleInfo).openedEditor = editor;
    },
  },

  extraReducers(builder) {
    builder.addCase(updatePredicates, (state, action) => {
      const unaryPredicates = getUnarySymbolNames(
        toAritySymbols(action.payload),
      );

      for (const entry of Object.values(state)) {
        entry.selectedUnary = keepExistingUnaryPreds(
          entry.selectedUnary,
          unaryPredicates,
        );

        entry.hoveredUnary = keepExistingUnaryPreds(
          entry.hoveredUnary,
          unaryPredicates,
        );
      }
    });
  },
});

export const selectOpenedEditor = withTupleId(
  (state, tupleId) => getEntry(state, tupleId).openedEditor,
);

export const selectSelectedUnary = withTupleId((state, tupleId) =>
  fallbackToEmptyArray(getEntry(state, tupleId).selectedUnary),
);

export const selectHoveredUnary = withTupleId((state, tupleId) =>
  fallbackToEmptyArray(getEntry(state, tupleId).hoveredUnary),
);

export const selectUnaryFilterDomainEnabled = withTupleId(
  (state, tupleId) => getEntry(state, tupleId).unaryFilterDomain,
);

export const selectUnaryFilterDomainHovered = withTupleId(
  (state, tupleId) => getEntry(state, tupleId).unaryFilterHovered,
);

export const selectSelectedDomain = createSelector(
  [
    (state: RootState) => state.present.structure.domain,
    withTupleId((state: RootState, tupleId: string) =>
      fallbackToEmptyArray(getEntry(state, tupleId).deselectedDomain),
    ),
  ],
  (domain, deselectedNodes) =>
    deselectedNodes.length === 0
      ? [...domain.value]
      : domain.value.filter((element) => !deselectedNodes.includes(element)),
);

export const selectPredicatesToDisplay = createSelector(
  [
    selectSelectedUnary,
    selectHoveredUnary,
    (state: RootState, _: TupleInfo, domainId: string) =>
      selectRelevantUnaryPreds(state, domainId),
  ],
  (selectedUnary, hoveredUnary, relevantUnary): [string[], string[]] => {
    const visiblePreds = [...hoveredUnary, ...selectedUnary];

    const toDisplay = relevantUnary.filter((relevant) =>
      visiblePreds.includes(relevant),
    );

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
    selectUnaryFilterDomainEnabled,
    selectHoveredUnary,
    (_: RootState, __: TupleInfo, includeHovered: boolean = false) =>
      includeHovered,
  ],
  (
    iP,
    domain,
    selectedUnary,
    unaryFilterDomainHovered,
    unaryFilterDomain,
    hoveredUnary,
    includeHovered,
  ) => {
    const selectedPreds = [...selectedUnary];

    if (includeHovered) {
      if (unaryFilterDomainHovered) return [...domain.value];

      selectedPreds.push(...hoveredUnary);
    }

    if (selectedPreds.length === 0 || !unaryFilterDomain) return undefined;

    const selectedDomain = new Set(
      selectedPreds.flatMap((pred) => (iP[pred]?.value ?? []).flat()),
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

export const selectHoveredDomainElements = createSelector(
  [
    (state: RootState) => state.present.structure.iP,
    (state: RootState) => state.present.structure.domain,
    selectHoveredUnary,
    selectUnaryFilterDomainHovered,
  ],
  (iP, domain, hoveredUnary, unaryFilterDomainHovered) => {
    if (unaryFilterDomainHovered) return new Set(domain.value);

    if (hoveredUnary.length === 0) return undefined;

    return new Set(
      hoveredUnary.flatMap((hoveredPredicate) =>
        (iP[hoveredPredicate]?.value ?? []).flat(),
      ),
    );
  },
);

export const selectHatchedDomain = createSelector(
  [
    selectHoveredDomainElements,
    selectUnaryFilterDomainEnabled,
    selectSelectedDomain,
    selectRelevantDomainElements,
  ],
  (hoveredIntr, unaryFilterDomain, selectedDomain, relevantDomain) => {
    if (
      !hoveredIntr ||
      hoveredIntr.size === 0 ||
      relevantDomain !== undefined ||
      !unaryFilterDomain
    )
      return [];

    return selectedDomain.filter((element) => !hoveredIntr.has(element));
  },
);

export default editorToolbarSlice.reducer;

export const {
  importEditorToolbarState,
  allNodesSelected,
  nodeToggled,
  predicateHovered,
  unaryFilterDomainHovered,
  unaryFilterDomainToggled,
  unaryPredicateToggled,
  editorOpened,
} = editorToolbarSlice.actions;

const createEntry = (): EditorToolbarEntry => ({
  hoveredUnary: [],
  selectedUnary: [],
  deselectedDomain: [],
  unaryFilterDomain: false,
  unaryFilterHovered: false,
  openedEditor: "text",
});

const getOrCreateEntry = (
  state: EditorToolbarState,
  tupleInfo: TupleIdentity,
): EditorToolbarEntry => (state[getTupleId(tupleInfo)] ??= createEntry());

const getEntry = (state: RootState, tupleId: string): EditorToolbarEntry =>
  state.present.editorToolbar[tupleId] ?? createEntry();

function withTupleId<R, A extends unknown[]>(
  selector: (state: RootState, tupleId: string, ...args: A) => R,
) {
  return (state: RootState, tupleInfo: TupleIdentity, ...args: A): R =>
    selector(state, getTupleId(tupleInfo), ...args);
}

const keepExistingUnaryPreds = (
  predicates: string[],
  existingPredicates: string[],
) => predicates.filter((pred) => existingPredicates.includes(pred));
