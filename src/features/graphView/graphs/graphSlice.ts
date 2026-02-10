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

type WithGraphId<T = object> = {
  tupleName: string;
  graphType: GraphType;
  tupleType: TupleType;
} & T;

export const initialGraphViewState: GraphManagerState = {};

export const graphManagerSlice = createSlice({
  name: "graphManager",
  initialState: initialGraphViewState,
  reducers: {
    setNodes(
      state,
      action: PayloadAction<WithGraphId<{ nodes: PredicateNodeType[] }>>,
    ) {
      const { tupleName, graphType, tupleType, nodes } = action.payload;

      const tupleId = getTupleId(tupleType, tupleName);

      state[tupleId].state[graphType].nodes = nodes;
    },

    setEdges(
      state,
      action: PayloadAction<WithGraphId<{ edges: DirectEdgeType[] }>>,
    ) {
      const { tupleName, graphType, tupleType, edges } = action.payload;

      const tupleId = getTupleId(tupleType, tupleName);

      state[tupleId].state[graphType].edges = edges;
    },

    edgeAdded(
      state,
      action: PayloadAction<WithGraphId<{ edge: DirectEdgeType }>>,
    ) {
      const { tupleName, graphType, tupleType, edge } = action.payload;

      const tupleId = getTupleId(tupleType, tupleName);

      state[tupleId].state[graphType].edges = [
        ...state[tupleId].state[graphType].edges,
        edge,
      ];
    },

    graphDidInitialLayout(
      state,
      action: PayloadAction<WithGraphId<{ didLayout: boolean }>>,
    ) {
      const { tupleName, graphType, tupleType, didLayout } = action.payload;

      const tupleId = getTupleId(tupleType, tupleName);

      state[tupleId].state[graphType].didLayout = didLayout;
    },

    onNodesChanged: {
      reducer(
        state,
        action: PayloadActionListenerIgnore<
          WithGraphId<{ changes: NodeChange<PredicateNodeType>[] }>
        >,
      ) {
        const { tupleName, graphType, tupleType, changes } = action.payload;

        const tupleId = getTupleId(tupleType, tupleName);

        state[tupleId].state[graphType].nodes = applyNodeChanges(
          changes,
          state[tupleId].state[graphType].nodes,
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
      const getTupleIntr = (tupleType: TupleType) =>
        tupleType === "predicate" ? structure.iP : structure.iF;

      const tuples = [
        ...preds.map((pred) => [...pred, "predicate"] as const),
        ...funcs.map((func) => [...func, "function"] as const),
      ];

      tuples.forEach(([tupleName, arity, tupleType]) => {
        const correctedArity = tupleType === "function" ? arity + 1 : arity;
        const tupleId = getTupleId(tupleType, tupleName);

        if (correctedArity !== 2 || tupleId in newState) return;

        const tuple = {
          name: tupleName,
          intr: [
            ...(getTupleIntr(tupleType)[tupleName]?.value ?? []),
          ] as BinaryRelation<string>,
        };

        const graphPositions = positions?.[tupleId];

        newState[tupleId] = {
          tupleType: tupleType,
          state: {
            oriented: plugins.oriented.init(
              domain,
              tuple,
              tupleType,
              graphPositions?.["oriented"],
            ),
            hasse: plugins.hasse.init(
              domain,
              tuple,
              tupleType,
              graphPositions?.["hasse"],
            ),
            bipartite: plugins.bipartite.init(
              domain,
              tuple,
              tupleType,
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

        for (const tupleId in newState) {
          const isLeftover = !newTupleNames.find(
            ({ name, kind }) => tupleId === getTupleId(kind, name),
          );

          if (isLeftover) delete newState[tupleId];
        }
      }

      return newState;
    },

    editorLocked(
      state,
      action: PayloadAction<{
        tupleName: string;
        tupleType: TupleType;
        locked: boolean;
      }>,
    ) {
      const { tupleName, tupleType, locked } = action.payload;
      const tupleId = getTupleId(tupleType, tupleName);
      const graphState = state[tupleId];

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
      const { tupleName, graphType, tupleType, warning } = action.payload;

      const tupleId = getTupleId(tupleType, tupleName);

      if (state[tupleId]) state[tupleId].state[graphType].warning = warning;
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
        const { value, key: tupleName } = action.payload;
        const tupleType = tupleUpdaterToTupleType[action.type];

        const tupleId = getTupleId(tupleType, tupleName);

        if (!(tupleId in state)) return;

        dev.time("Graph interpretation update duration");
        const graphs = state[tupleId];
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
  [
    (state: RootState, tupleName: string, tupleType: TupleType) =>
      state.present.graphView[getTupleId(tupleType, tupleName)]?.state.hasse,
  ],
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
      (_: RootState, __: string, ___: TupleType, type: T) => type,
      (state: RootState, tupleName: string, tupleType: TupleType, type: T) =>
        state.present.graphView[getTupleId(tupleType, tupleName)]?.state[type]
          ?.nodes,
      (state: RootState, tupleName: string, tupleType: TupleType) =>
        selectRelevantDomainElements(state, tupleName, tupleType, false),
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
    (
      state: RootState,
      tupleName: string,
      type: GraphType,
      tupleType: TupleType,
    ) => state.present.graphView[getTupleId(tupleType, tupleName)]?.state[type],
    (
      state: RootState,
      tupleName: string,
      _,
      tupleType: TupleType,
      includeHovered: boolean = false,
    ) =>
      selectRelevantDomainElements(state, tupleName, tupleType, includeHovered),
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
  tupleName,
  graphType,
  tupleType,
  changes,
}: {
  tupleName: string;
  graphType: GraphType;
  tupleType: TupleType;
  changes: EdgeChange<DirectEdgeType>[];
}): AppThunk => {
  return (dispatch, getState) => {
    const managerState = getState().present.graphView;
    const selectedEdges = selectEdges(
      getState(),
      tupleName,
      graphType,
      tupleType,
    );
    const tupleId = getTupleId(tupleType, tupleName);

    const newEdges = applyEdgeChanges(
      changes,
      managerState[tupleId].state[graphType].edges,
    );

    const containedRemoveChange = changes.some(
      (change) => change.type === "remove",
    );

    const relevantEdges = edgesToRelation(selectedEdges);

    //TODO: Questionable use-case for this function
    const [relation, relationSyncedEdges] = processEdgesToRelation(
      plugins[graphType],
      {
        ...managerState[tupleId].state[graphType],
        edges: newEdges,
      },
      relevantEdges,
    );

    const creator =
      tupleType === "predicate"
        ? updateInterpretationPredicates
        : updateFunctionSymbols;

    dispatch(
      setEdges({
        tupleName: tupleName,
        graphType: graphType,
        tupleType,
        edges: relationSyncedEdges,
      }),
    );
    dispatch(creator({ key: tupleName, value: relation }));
    if (containedRemoveChange) dispatch(UndoActions.checkpoint());
  };
};

export const onConnected = ({
  tupleName,
  graphType,
  tupleType,
  connection,
  breakPrevious = false,
}: {
  tupleName: string;
  graphType: GraphType;
  tupleType: TupleType;
  connection: Connection;
  breakPrevious?: boolean;
}): AppThunk => {
  return (dispatch, getState) => {
    const managerState = getState().present.graphView;
    const selectedEdges = selectEdges(
      getState(),
      tupleName,
      graphType,
      tupleType,
    );
    const tupleId = getTupleId(tupleType, tupleName);

    let newEdges = [...managerState[tupleId].state[graphType].edges];

    if (breakPrevious)
      newEdges = newEdges.filter((e) => e.source !== connection.source);

    newEdges = addEdge(connection, newEdges);

    const relevantEdges = [
      ...edgesToRelation(selectedEdges),
      [connection.source, connection.target],
    ] as [string, string][];

    const [relation] = processEdgesToRelation(
      plugins[graphType],
      {
        ...managerState[tupleId].state[graphType],
        edges: newEdges,
      },
      relevantEdges,
    );

    const updater = interpretationUpdaters[tupleType];

    dispatch(updater({ key: tupleName, value: relation }));
    dispatch(UndoActions.checkpoint());
  };
};

export const leftoverDeleted = ({
  tupleName,
  graphType,
  tupleType,
  deletedNode,
}: {
  tupleName: string;
  graphType: GraphType;
  tupleType: TupleType;
  deletedNode: string;
}): AppThunk => {
  return (dispatch, getState) => {
    const managerState = getState().present.graphView;
    const selectedEdges = selectEdges(
      getState(),
      tupleName,
      graphType,
      tupleType,
    );
    const tupleId = getTupleId(tupleType, tupleName);

    const { nodes: newNodes, edges: newEdges } = processDeleteLeftover(
      plugins[graphType],
      managerState[tupleId].state[graphType],
      deletedNode,
    );

    const [relation] = processEdgesToRelation(
      plugins[graphType],
      {
        ...managerState[tupleId].state[graphType],
        edges: newEdges,
      },
      edgesToRelation(selectedEdges),
    );

    const updater = interpretationUpdaters[tupleType];

    dispatch(
      setNodes({
        tupleName: tupleName,
        graphType: graphType,
        tupleType,
        nodes: newNodes,
      }),
    );
    dispatch(updater({ key: tupleName, value: relation }));
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
    ([tupleId, { tupleType }]) => {
      const tupleName = getKeyFromTupleId(tupleId);
      const relevantEntry = relevantSymbols[tupleName];

      if (!relevantEntry || relevantEntry.type === "constant") return false;
      return relevantEntry.arity === (tupleType === "function" ? 1 : 2);
    },
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

  for (const [tupleId, { state }] of relevantEntries) {
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
    serializedState[tupleId] = Object.fromEntries(
      graphEntries,
    ) as SerializedGraphViewState[string];
  }

  return serializedState;
};

export const edgesToRelation = (edges: Edge[]): BinaryRelation<string> =>
  edges.map(({ source, target }) => [source, target]);

export const getTupleId = (type: TupleType, key: string) => `${type}-${key}`;
export const getKeyFromTupleId = (tupleId: string) =>
  tupleId.substring(tupleId.lastIndexOf("-") + 1);

const tupleUpdaterToTupleType = {
  [updateInterpretationPredicates.type]: "predicate",
  [updateFunctionSymbols.type]: "function",
} satisfies Record<string, TupleType>;

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
