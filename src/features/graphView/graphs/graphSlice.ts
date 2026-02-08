import type { PredicateNodeType } from "./graphComponents/PredicateNode";
import type { DirectEdgeType } from "./graphComponents/DirectEdge";
import {
  createSelector,
  createSlice,
  isAnyOf,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { AppThunk, RootState } from "../../../app/store.ts";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type Edge,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { isPoset, type BinaryRelation } from "./HasseDiagram/posetHelpers";
import {
  graphTypes,
  plugins,
  processDeleteLeftover,
  processEdgesToRelation,
  processFilterEdgesToShow,
  processFilterNodesToShow,
  processSyncNodes,
  processSyncPredIntr,
  type GraphState,
  type GraphType,
  type Plugin,
} from "./plugins.ts";
import { type LanguageState } from "../../language/languageSlice.ts";
import {
  updateDomain,
  updateFunctionSymbols,
  updateInterpretationPredicates,
  type StructureState,
  type TupleType,
} from "../../structure/structureSlice.ts";
import {
  selectHoveredIntr,
  selectRelevantDomainElements,
  selectSelectedDomain,
  selectUnaryFilterDomain,
} from "../../editorToolbar/editorToolbarSlice.ts";
import type { RelevantSymbols } from "../../import/importThunk.ts";
import { UndoActions } from "../../undoHistory/undoHistory.ts";
import type { SerializedGraphViewState } from "../validationSchema.ts";
import {
  prepareWithListenerIgnoreMeta,
  type PayloadActionListenerIgnore,
} from "../../../common/redux.ts";
import { dev } from "../../../common/logging.ts";

export type GraphManagerState = Record<
  string,
  {
    tupleType: TupleType;
    state: GraphState;
  }
>;

type WithGraphId<T = object> = { id: string; type: GraphType } & T;

export const initialGraphViewState: GraphManagerState = {};

export const graphManagerSlice = createSlice({
  name: "graphManager",
  initialState: initialGraphViewState,
  reducers: {
    setNodes(
      state,
      action: PayloadAction<WithGraphId<{ nodes: PredicateNodeType[] }>>,
    ) {
      const { id, type, nodes } = action.payload;
      state[id].state[type].nodes = nodes;
    },

    setEdges(
      state,
      action: PayloadAction<WithGraphId<{ edges: DirectEdgeType[] }>>,
    ) {
      const { id, type, edges } = action.payload;
      state[id].state[type].edges = edges;
    },

    edgeAdded(
      state,
      action: PayloadAction<WithGraphId<{ edge: DirectEdgeType }>>,
    ) {
      const { id, type, edge } = action.payload;
      state[id].state[type].edges = [...state[id].state[type].edges, edge];
    },

    graphDidInitialLayout(
      state,
      action: PayloadAction<WithGraphId<{ didLayout: boolean }>>,
    ) {
      const { id, type, didLayout } = action.payload;
      state[id].state[type].didLayout = didLayout;
    },

    onNodesChanged: {
      reducer(
        state,
        action: PayloadActionListenerIgnore<
          WithGraphId<{ changes: NodeChange<PredicateNodeType>[] }>
        >,
      ) {
        const { id, type, changes } = action.payload;

        state[id].state[type].nodes = applyNodeChanges(
          changes,
          state[id].state[type].nodes,
        );
      },
      prepare: prepareWithListenerIgnoreMeta<
        WithGraphId<{ changes: NodeChange<PredicateNodeType>[] }>
      >,
    },

    syncGraphView(
      state,
      action: PayloadAction<{
        structure: StructureState;
        language: LanguageState;
        positions?: SerializedGraphViewState;
        overwrite?: boolean;
      }>,
    ) {
      dev.time("Graph synchronization duration");

      const {
        structure,
        language,
        positions,
        overwrite = false,
      } = action.payload;

      const newState: GraphManagerState = overwrite ? {} : state;

      const domain = structure.domain.value;
      const preds = language.predicates.value;
      const funcs = language.functions.value;
      const tupleIntr = { ...structure.iP, ...structure.iF };

      const tuples = [
        ...preds.map((pred) => [...pred, "predicate"] as const),
        ...funcs.map((func) => [...func, "function"] as const),
      ];

      tuples.forEach(([name, arity, type]) => {
        const correctedArity = type === "function" ? arity + 1 : arity;

        if (correctedArity !== 2 || name in newState) return;

        const tuple = {
          name,
          intr: [...(tupleIntr[name]?.value ?? [])] as BinaryRelation<string>,
        };

        const graphPositions = positions?.[name];

        newState[name] = {
          tupleType: type,
          state: {
            oriented: plugins.oriented.init(
              domain,
              tuple,
              type,
              graphPositions?.["oriented"],
            ),
            hasse: plugins.hasse.init(
              domain,
              tuple,
              type,
              graphPositions?.["hasse"],
            ),
            bipartite: plugins.bipartite.init(
              domain,
              tuple,
              type,
              graphPositions?.["bipartite"],
            ),
          },
        };
      });

      dev.timeEnd("Graph synchronization duration");

      if (!overwrite) {
        const newTupleNames = [
          ...preds.map(([name]) => ({ name, kind: "predicate" as const })),
          ...funcs.map(([name]) => ({ name, kind: "function" as const })),
        ];

        for (const [key, { tupleType }] of Object.entries(newState)) {
          const isLeftover = !newTupleNames.find(
            ({ name, kind }) => name === key && kind === tupleType,
          );

          if (isLeftover) delete newState[key];
        }
      }

      return newState;
    },

    editorLocked(
      state,
      action: PayloadAction<{ id: string; locked: boolean }>,
    ) {
      const { id, locked } = action.payload;
      const graphState = state[id];

      if (!graphState) return;

      for (const graphType of graphTypes) {
        graphState.state[graphType].edges = graphState.state[
          graphType
        ].edges.map((e) => ({
          ...e,
          selectable: !locked,
          selected: false,
        }));
      }
    },

    warningChanged(
      state,
      action: PayloadAction<WithGraphId<{ warning?: string }>>,
    ) {
      const { id, type, warning } = action.payload;

      if (state[id]) state[id].state[type].warning = warning;
    },
  },

  extraReducers(builder) {
    builder.addCase(updateDomain, (state, action) => {
      dev.time("Graph domain update duration");
      for (const [, graphs] of Object.entries(state)) {
        for (const graphType of graphTypes) {
          const graphState = graphs.state[graphType];
          const plugin = plugins[graphType];
          const domain = action.payload;

          const newState = processSyncNodes(
            plugin,
            graphState,
            domain,
            graphs.tupleType,
          );

          (graphs.state[graphType] as GraphState[typeof graphType]) = newState;
        }
      }
      dev.timeEnd("Graph domain update duration");
    });

    builder.addMatcher(
      isAnyOf(updateInterpretationPredicates, updateFunctionSymbols),
      (state, action) => {
        const { value, key } = action.payload;

        if (!(key in state)) return;

        dev.time("Graph interpretation update duration");
        const graphs = state[key];
        for (const graphType of graphTypes) {
          const graphState = graphs.state[graphType];
          const plugin = plugins[graphType];

          (graphs.state[graphType] as GraphState[typeof graphType]) =
            processSyncPredIntr(
              plugin,
              graphState,
              value as BinaryRelation<string>,
              graphs.tupleType,
            );
        }

        dev.timeEnd("Graph interpretation update duration");
      },
    );
  },
});

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

export const selectPosetValidity = createSelector(
  [(state: RootState, id: string) => state.present.graphView[id]?.state.hasse],
  (graphState) => {
    if (!graphState) return true;

    const nodes = graphState.nodes.map((node) => node.id);

    const vissibleRelation = edgesToRelation(
      graphState.edges.filter(
        ({ source, target }) =>
          nodes.includes(source) && nodes.includes(target),
      ),
    );

    return isPoset(vissibleRelation);
  },
);

export function makeSelectNodes<T extends GraphType>() {
  return createSelector(
    [
      (_: RootState, __: string, type: T) => type,
      (state: RootState, id: string, type: T) =>
        state.present.graphView[id]?.state[type]?.nodes,
      (state: RootState, id: string) =>
        selectRelevantDomainElements(state, id, false),
      selectHoveredIntr,
      selectSelectedDomain,
      selectUnaryFilterDomain,
    ],
    (
      type,
      nodes,
      relevantDomain,
      hoveredPredicateIntr,
      selectedNodes,
      unaryFilterDomain,
    ): GraphState[T]["nodes"] => {
      const plugin = plugins[type] as Plugin<T>;

      if (!nodes) return [];

      return processFilterNodesToShow(
        plugin,
        nodes,
        unaryFilterDomain,
        selectedNodes,
        relevantDomain,
        hoveredPredicateIntr,
      );
    },
  );
}

export const selectEdges = createSelector(
  [
    (_: RootState, __: string, type: GraphType) => type,
    (state: RootState, id: string, type: GraphType) =>
      state.present.graphView[id]?.state[type],
    (
      state: RootState,
      id: string,
      _: GraphType,
      includeHovered: boolean = false,
    ) => selectRelevantDomainElements(state, id, includeHovered),
    selectSelectedDomain,
  ],
  (type, graphState, relevantDomain, selectedNodes) => {
    const plugin = plugins[type];

    if (!graphState) return [] as GraphState[typeof type]["edges"];

    return processFilterEdgesToShow(
      plugin,
      graphState,
      selectedNodes,
      relevantDomain,
    );
  },
);

export const onEdgesChanged = ({
  id,
  type,
  changes,
}: {
  id: string;
  type: GraphType;
  changes: EdgeChange<DirectEdgeType>[];
}): AppThunk => {
  return (dispatch, getState) => {
    const managerState = getState().present.graphView;
    const tupleType = managerState[id].tupleType;
    const selectedEdges = selectEdges(getState(), id, type);

    const newEdges = applyEdgeChanges(
      changes,
      managerState[id].state[type].edges,
    );

    const containedRemoveChange = changes.some(
      (change) => change.type === "remove",
    );

    const relevantEdges = edgesToRelation(selectedEdges);

    //TODO: Questionable use-case for this function
    const [relation, relationSyncedEdges] = processEdgesToRelation(
      plugins[type],
      {
        ...managerState[id].state[type],
        edges: newEdges,
      },
      relevantEdges,
    );

    const creator =
      tupleType === "predicate"
        ? updateInterpretationPredicates
        : updateFunctionSymbols;

    dispatch(setEdges({ id, type, edges: relationSyncedEdges }));
    dispatch(creator({ key: id, value: relation }));
    if (containedRemoveChange) dispatch(UndoActions.checkpoint());
  };
};

export const onConnected = ({
  id,
  type,
  connection,
  breakPrevious = false,
}: {
  id: string;
  type: GraphType;
  connection: Connection;
  breakPrevious?: boolean;
}): AppThunk => {
  return (dispatch, getState) => {
    const managerState = getState().present.graphView;
    const tupleType = managerState[id].tupleType;
    const selectedEdges = selectEdges(getState(), id, type);
    let newEdges = [...managerState[id].state[type].edges];

    if (breakPrevious)
      newEdges = newEdges.filter((e) => e.source !== connection.source);

    newEdges = addEdge(connection, newEdges);

    const relevantEdges = [
      ...edgesToRelation(selectedEdges),
      [connection.source, connection.target],
    ] as [string, string][];

    const [relation] = processEdgesToRelation(
      plugins[type],
      {
        ...managerState[id].state[type],
        edges: newEdges,
      },
      relevantEdges,
    );

    const updater = interpretationUpdaters[tupleType];

    dispatch(updater({ key: id, value: relation }));
    dispatch(UndoActions.checkpoint());
  };
};

export const leftoverDeleted = ({
  id,
  type,
  deletedNode,
}: {
  id: string;
  type: GraphType;
  deletedNode: string;
}): AppThunk => {
  return (dispatch, getState) => {
    const managerState = getState().present.graphView;
    const tupleType = managerState[id].tupleType;
    const selectedEdges = selectEdges(getState(), id, type);

    const { nodes: newNodes, edges: newEdges } = processDeleteLeftover(
      plugins[type],
      managerState[id].state[type],
      deletedNode,
    );

    const [relation] = processEdgesToRelation(
      plugins[type],
      {
        ...managerState[id].state[type],
        edges: newEdges,
      },
      edgesToRelation(selectedEdges),
    );

    const updater = interpretationUpdaters[tupleType];

    dispatch(setNodes({ id, type, nodes: newNodes }));
    dispatch(updater({ key: id, value: relation }));
    dispatch(UndoActions.checkpoint());
  };
};

const interpretationUpdaters = {
  predicate: updateInterpretationPredicates,
  function: updateFunctionSymbols,
} as const;

export const getGraphViewStateToExport = (
  state: RootState,
  relevantSymbols: RelevantSymbols,
): SerializedGraphViewState => {
  const relevantEntries = Object.entries(state.present.graphView).filter(
    ([key, { tupleType }]) =>
      relevantSymbols[key]?.type === tupleType &&
      relevantSymbols[key]?.arity === (tupleType === "function" ? 1 : 2),
  );

  const getNodesToExport = (
    nodes: PredicateNodeType[],
    didLayout: boolean,
  ): [string, [number, number]][] => {
    const changedNodes = didLayout ? nodes : [];

    return changedNodes.map(({ id, position: { x, y } }) => [
      id,
      [x ?? 0, y ?? 0].map(Math.trunc) as [number, number],
    ]);
  };

  const serializedState: SerializedGraphViewState = {};

  for (const [predicateName, { state }] of relevantEntries) {
    const graphEntries: [GraphType, Record<string, [number, number]>][] = [];
    for (const graphType in state) {
      const { nodes, didLayout } = state[graphType as GraphType];
      const positions = getNodesToExport(nodes, !!didLayout);

      if (positions.length === 0) continue;

      graphEntries.push([
        graphType as GraphType,
        Object.fromEntries(positions),
      ]);
    }

    if (graphEntries.length === 0) continue;
    serializedState[predicateName] = Object.fromEntries(
      graphEntries,
    ) as SerializedGraphViewState[string];
  }

  return serializedState;
};

export const edgesToRelation = (edges: Edge[]): BinaryRelation<string> =>
  edges.map(({ source, target }) => [source, target]);

export const {
  setNodes,
  setEdges,
  edgeAdded,
  onNodesChanged,
  editorLocked,
  warningChanged,
  syncGraphView,
  graphDidInitialLayout,
} = graphManagerSlice.actions;

export default graphManagerSlice.reducer;
