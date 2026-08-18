import {
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { RootState } from "../../app/store";
import { updatePredicates } from "../language/languageSlice";
import { fallbackToEmptyArray } from "../../shared/core/redux";
import { updateDomain } from "../structure/structureSlice";
import {
  getTupleId,
  type TupleIdentity,
  type TupleInfo,
} from "../structure/tupleInfo";
import type { EditorType } from "../editors/editorTypes";
import type { RelevantSymbols } from "../import/importExportUtils.ts";
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

type WithTupleInfo<T = object> = {
  tupleInfo: TupleInfo;
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

    nodeToggled(
      state,
      action: PayloadAction<WithTupleInfo<{ domain: string[]; node?: string }>>,
    ) {
      const { tupleInfo, domain, node: toggledNode = "" } = action.payload;

      const entry = getOrCreateEntry(state, tupleInfo);
      const selectedNodes = entry.selectedDomain ?? domain;

      if (toggledNode === "") entry.selectedDomain = undefined;
      else if (selectedNodes.includes(toggledNode))
        entry.selectedDomain = selectedNodes.filter(
          (selectedNode) => selectedNode !== toggledNode,
        );
      else {
        // Done this way to preserve order
        const newSelectedDomain = domain.filter((element) =>
          [...selectedNodes, toggledNode].includes(element),
        );

        entry.selectedDomain =
          newSelectedDomain.length === domain.length
            ? undefined
            : newSelectedDomain;
      }
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
    builder.addCase(updateDomain, (state) => {
      for (const entry of Object.values(state)) {
        entry.selectedDomain = undefined;
      }
    });

    builder.addCase(updatePredicates, (state, action) => {
      const unaryPredicates = action.payload
        .filter(({ arity }) => arity === 1)
        .map(({ name }) => name);

      for (const entry of Object.values(state)) {
        entry.selectedUnary = entry.selectedUnary.filter((selectedPred) =>
          unaryPredicates.includes(selectedPred),
        );

        entry.hoveredUnary = entry.hoveredUnary.filter((hoveredPred) =>
          unaryPredicates.includes(hoveredPred),
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

export const selectUnaryFilterDomain = withTupleId(
  (state, tupleId) => getEntry(state, tupleId).unaryFilterDomain,
);

export const selectUnaryFilterDomainHovered = withTupleId(
  (state, tupleId) => getEntry(state, tupleId).unaryFilterHovered,
);

export const selectSelectedDomain = createSelector(
  [
    (state: RootState) => state.present.structure.domain,
    withTupleId(
      (state: RootState, tupleId: string) =>
        getEntry(state, tupleId).selectedDomain,
    ),
  ],
  (domain, selectedNodes) =>
    selectedNodes ? [...selectedNodes] : [...domain.value],
);

export const selectRelevantConstants = createSelector(
  [
    (state: RootState) => state.present.language.constants.value,
    (state: RootState) => state.present.structure.iC,
    (_: RootState, domainElement: string) => domainElement,
  ],
  (constants, iC, domainElement) =>
    constants.filter((c) => iC[c]?.value === domainElement),
);

export const selectUnaryPreds = createSelector(
  [(state: RootState) => state.present.language.predicates.value],
  (preds) => preds.filter(([, arity]) => arity === 1),
);

export const selectRelevantUnaryPreds = createSelector(
  [
    (state: RootState) => state.present.structure.iP,
    (_: RootState, domainElement: string) => domainElement,
  ],
  (predicates, domainElements) =>
    Object.keys(predicates).filter((p) =>
      (predicates[p] ?? []).value.some(
        (t) => t.length === 1 && t[0] === domainElements,
      ),
    ),
);

export const selectPredicatesToDisplay = createSelector(
  [
    selectSelectedUnary,
    selectHoveredUnary,
    (state: RootState, _: TupleInfo, domainId: string) =>
      selectRelevantUnaryPreds(state, domainId),
  ],
  (selectedUnary, hoveredUnary, relevantUnary) => {
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
    selectUnaryFilterDomain,
    selectHoveredUnary,
    (_: RootState, __: TupleInfo, includeHovered: boolean = false) =>
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

export const selectHatchedDomain = createSelector(
  [
    selectHoveredIntr,
    selectUnaryFilterDomain,
    selectSelectedDomain,
    selectRelevantDomainElements,
  ],
  (hoveredIntr, unaryFilterDomain, selectedDomain, relevantDomain) => {
    const hoveredElements = hoveredIntr?.flat() ?? [];

    if (
      hoveredElements.length === 0 ||
      relevantDomain !== undefined ||
      !unaryFilterDomain
    )
      return [];

    return selectedDomain.filter(
      (element) => !hoveredElements.includes(element),
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

    const tupleId = getTupleId({ type: relevantSymbol.type, name: tupleName });
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

const defaultEntry: EditorToolbarEntry = {
  hoveredUnary: [],
  selectedUnary: [],
  selectedDomain: undefined,
  unaryFilterDomain: false,
  unaryFilterHovered: false,
  openedEditor: "text",
};

const createEntry = (): EditorToolbarEntry => ({
  ...defaultEntry,
  hoveredUnary: [],
  selectedUnary: [],
});

const getOrCreateEntry = (
  state: EditorToolbarState,
  tupleInfo: TupleIdentity,
): EditorToolbarEntry => (state[getTupleId(tupleInfo)] ??= createEntry());

const getEntry = (state: RootState, tupleId: string): EditorToolbarEntry =>
  state.present.editorToolbar[tupleId] ?? defaultEntry;

function withTupleId<R, A extends unknown[]>(
  selector: (state: RootState, tupleId: string, ...args: A) => R,
) {
  return (state: RootState, tupleInfo: TupleIdentity, ...args: A): R =>
    selector(state, getTupleId(tupleInfo), ...args);
}
