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
  graphs,
  graphTypes,
  readGraph,
  updateGraph,
  type GraphModelFor,
  type GraphStates,
  type GraphType,
} from "./graphRegistry.ts";
import { type LanguageState } from "../../language/languageSlice.ts";
import {
  updateDomain,
  updateFunctionSymbols,
  updateInterpretationPredicates,
  type StructureState,
} from "../../structure/structureSlice.ts";
import {
  selectHoveredIntr,
  selectRelevantDomainElements,
  selectSelectedDomain,
  selectUnaryFilterDomain,
} from "../../editorToolbar/editorToolbarSlice.ts";
import {
  getTupleId,
  type TupleInfo,
  type TupleType,
} from "../../structure/tupleInfo";
import type { RelevantSymbols } from "../../import/importExportUtils.ts";
import { UndoActions } from "../../undoHistory/undoHistory.ts";
import type { SerializedGraphViewState } from "../validationSchema.ts";
import {
  prepareWithListenerIgnoreMeta,
  type PayloadActionListenerIgnore,
} from "../../../shared/core/redux.ts";
import { dev } from "../../../shared/core/logging.ts";

export type GraphManagerState = Record<
  string,
  {
    tupleType: TupleType;
    state: GraphStates;
  }
>;

type WithGraphId<T = object> = {
  tupleInfo: TupleInfo;
  graphType: GraphType;
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
      const { tupleInfo, graphType, nodes } = action.payload;

      const tupleId = getTupleId(tupleInfo);

      state[tupleId].state[graphType].nodes = nodes;
    },

    setEdges(
      state,
      action: PayloadAction<WithGraphId<{ edges: DirectEdgeType[] }>>,
    ) {
      const { tupleInfo, graphType, edges } = action.payload;

      const tupleId = getTupleId(tupleInfo);

      state[tupleId].state[graphType].edges = edges;
    },

    edgeAdded(
      state,
      action: PayloadAction<WithGraphId<{ edge: DirectEdgeType }>>,
    ) {
      const { tupleInfo, graphType, edge } = action.payload;

      const tupleId = getTupleId(tupleInfo);

      state[tupleId].state[graphType].edges = [
        ...state[tupleId].state[graphType].edges,
        edge,
      ];
    },

    graphDidInitialLayout(
      state,
      action: PayloadAction<WithGraphId<{ didLayout: boolean }>>,
    ) {
      const { tupleInfo, graphType, didLayout } = action.payload;

      const tupleId = getTupleId(tupleInfo);

      state[tupleId].state[graphType].didLayout = didLayout;
    },

    onNodesChanged: {
      reducer(
        state,
        action: PayloadActionListenerIgnore<
          WithGraphId<{ changes: NodeChange<PredicateNodeType>[] }>
        >,
      ) {
        const { tupleInfo, graphType, changes } = action.payload;

        const tupleId = getTupleId(tupleInfo);

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
        const tupleId = getTupleId({ type: tupleType, name: tupleName });

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
            oriented: graphs.oriented.init(
              domain,
              tuple,
              tupleType,
              graphPositions?.["oriented"],
            ),
            hasse: graphs.hasse.init(
              domain,
              tuple,
              tupleType,
              graphPositions?.["hasse"],
            ),
            bipartite: graphs.bipartite.init(
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
            ({ name, kind }) => tupleId === getTupleId({ type: kind, name }),
          );

          if (isLeftover) delete newState[tupleId];
        }
      }

      return newState;
    },

    editorLocked(
      state,
      action: PayloadAction<{ tupleInfo: TupleInfo; locked: boolean }>,
    ) {
      const { tupleInfo, locked } = action.payload;
      const tupleId = getTupleId(tupleInfo);
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
      const { tupleInfo, graphType, warning } = action.payload;

      const tupleId = getTupleId(tupleInfo);

      if (state[tupleId]) state[tupleId].state[graphType].warning = warning;
    },
  },

  extraReducers(builder) {
    builder.addCase(updateDomain, (state, action) => {
      dev.time("Graph domain update duration");
      const domain = action.payload;

      for (const [, entry] of Object.entries(state)) {
        for (const graphType of graphTypes) {
          updateGraph(entry.state, graphType, (ops, graphState) =>
            ops.syncNodes(graphState, domain, entry.tupleType),
          );
        }
      }
      dev.timeEnd("Graph domain update duration");
    });

    builder.addMatcher(
      isAnyOf(updateInterpretationPredicates, updateFunctionSymbols),
      (state, action) => {
        const { value, key: tupleName } = action.payload;
        const tupleType = tupleUpdaterToTupleType[action.type];

        const tupleId = getTupleId({ type: tupleType, name: tupleName });

        if (!(tupleId in state)) return;

        dev.time("Graph interpretation update duration");
        const entry = state[tupleId];
        for (const graphType of graphTypes) {
          updateGraph(entry.state, graphType, (ops, graphState) =>
            ops.syncPredIntr(
              graphState,
              value as BinaryRelation<string>,
              entry.tupleType,
            ),
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
    (state: RootState, tupleInfo: TupleInfo) =>
      state.present.graphView[getTupleId(tupleInfo)]?.state.hasse,
  ],
  (graphState) => {
    if (!graphState) return true;

    const nodes = graphState.nodes.map((node) => node.id);

    const visibleRelation = edgesToRelation(
      graphState.edges.filter(
        ({ source, target }) =>
          nodes.includes(source) && nodes.includes(target),
      ),
    );

    return isPoset(visibleRelation);
  },
);

export function makeSelectNodes<T extends GraphType>() {
  return createSelector(
    [
      (_: RootState, __: TupleInfo, type: T) => type,
      (state: RootState, tupleInfo: TupleInfo, type: T) =>
        state.present.graphView[getTupleId(tupleInfo)]?.state[type]?.nodes,
      (state: RootState, tupleInfo: TupleInfo) =>
        selectRelevantDomainElements(state, tupleInfo, false),
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
    ): GraphStates[T]["nodes"] => {
      const graph = graphs[type] as GraphModelFor<T>;

      if (!nodes) return [];

      return graph.filterNodesToShow(
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
    (state: RootState, tupleInfo: TupleInfo, type: GraphType) =>
      state.present.graphView[getTupleId(tupleInfo)]?.state[type],
    (
      state: RootState,
      tupleInfo: TupleInfo,
      _,
      includeHovered: boolean = false,
    ) => selectRelevantDomainElements(state, tupleInfo, includeHovered),
    selectSelectedDomain,
  ],
  (graphState, relevantDomain, selectedNodes): DirectEdgeType[] => {
    if (!graphState) return [];

    return readGraph(graphState, (ops, state) =>
      ops.filterEdgesToShow(state, selectedNodes, relevantDomain),
    );
  },
);

export const onEdgesChanged = ({
  tupleInfo,
  graphType,
  changes,
}: {
  tupleInfo: TupleInfo;
  graphType: GraphType;
  changes: EdgeChange<DirectEdgeType>[];
}): AppThunk => {
  return (dispatch, getState) => {
    const { name: tupleName, type: tupleType } = tupleInfo;

    const managerState = getState().present.graphView;
    const selectedEdges = selectEdges(getState(), tupleInfo, graphType);
    const tupleId = getTupleId(tupleInfo);

    const newEdges = applyEdgeChanges(
      changes,
      managerState[tupleId].state[graphType].edges,
    );

    const containedRemoveChange = changes.some(
      (change) => change.type === "remove",
    );

    const relevantEdges = edgesToRelation(selectedEdges);

    //TODO: Questionable use-case for this function
    const [relation, relationSyncedEdges] = readGraph(
      managerState[tupleId].state[graphType],
      (ops, state) => ops.edgesToRelation(state, newEdges, relevantEdges),
    );

    const creator =
      tupleType === "predicate"
        ? updateInterpretationPredicates
        : updateFunctionSymbols;

    dispatch(
      setEdges({
        tupleInfo,
        graphType,
        edges: relationSyncedEdges,
      }),
    );
    dispatch(creator({ key: tupleName, value: relation }));
    if (containedRemoveChange) dispatch(UndoActions.checkpoint());
  };
};

export const onConnected = ({
  tupleInfo,
  graphType,
  connection,
  breakPrevious = false,
}: {
  tupleInfo: TupleInfo;
  graphType: GraphType;
  connection: Connection;
  breakPrevious?: boolean;
}): AppThunk => {
  return (dispatch, getState) => {
    const { name: tupleName, type: tupleType } = tupleInfo;

    const managerState = getState().present.graphView;
    const selectedEdges = selectEdges(getState(), tupleInfo, graphType);
    const tupleId = getTupleId(tupleInfo);

    let newEdges = [...managerState[tupleId].state[graphType].edges];

    if (breakPrevious)
      newEdges = newEdges.filter((e) => e.source !== connection.source);

    newEdges = addEdge(connection, newEdges);

    const relevantEdges = [
      ...edgesToRelation(selectedEdges),
      [connection.source, connection.target],
    ] as [string, string][];

    const [relation] = readGraph(
      managerState[tupleId].state[graphType],
      (ops, state) => ops.edgesToRelation(state, newEdges, relevantEdges),
    );

    const updater = interpretationUpdaters[tupleType];

    dispatch(updater({ key: tupleName, value: relation }));
    dispatch(UndoActions.checkpoint());
  };
};

export const leftoverDeleted = ({
  tupleInfo,
  graphType,
  deletedNode,
}: {
  tupleInfo: TupleInfo;
  graphType: GraphType;
  deletedNode: string;
}): AppThunk => {
  return (dispatch, getState) => {
    const { name: tupleName, type: tupleType } = tupleInfo;

    const managerState = getState().present.graphView;
    const selectedEdges = selectEdges(getState(), tupleInfo, graphType);
    const tupleId = getTupleId(tupleInfo);

    const { newNodes, relation } = readGraph(
      managerState[tupleId].state[graphType],
      (ops, state) => {
        const { nodes, edges } = ops.deleteLeftover(state, deletedNode);
        const [relation] = ops.edgesToRelation(
          state,
          edges,
          edgesToRelation(selectedEdges),
        );

        return { newNodes: nodes, relation };
      },
    );

    const updater = interpretationUpdaters[tupleType];

    dispatch(setNodes({ tupleInfo, graphType, nodes: newNodes }));
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
