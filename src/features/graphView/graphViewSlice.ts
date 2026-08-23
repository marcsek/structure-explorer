import type { PredicateNodeType } from "./canvas/nodes/PredicateNode";
import type { DirectEdgeType } from "./canvas/edges/DirectEdge";
import {
  createSelector,
  createSlice,
  isAnyOf,
  type PayloadAction,
} from "@reduxjs/toolkit";
import type { AppThunk, RootState } from "../../app/store.ts";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { isPoset } from "./graphs/hasse/poset";
import { edgesToRelation, type BinaryRelation } from "./graphs/utils.ts";
import {
  graphs,
  graphTypes,
  readGraph,
  updateGraph,
  type AnyGraphState,
  type GraphStates,
  type GraphType,
  type GraphModelFor,
} from "./graphs/registry.ts";
import type { GraphModel, GraphState } from "./graphs/GraphModel.ts";
import { type LanguageState } from "../language/languageSlice.ts";
import {
  selectTupleLock,
  updateDomain,
  updateFunctionSymbols,
  updateInterpretationPredicates,
  type StructureState,
} from "../structure/structureSlice.ts";
import {
  selectHatchedDomain,
  selectHoveredDomainElements,
  selectRelevantDomainElements,
  selectSelectedDomain,
  selectUnaryFilterDomainEnabled,
} from "../editorToolbar/editorToolbarSlice.ts";
import {
  getTupleId,
  isBinaryTuple,
  type TupleIdentity,
  type TupleInfo,
  type TupleType,
} from "../structure/tupleInfo";
import { UndoActions } from "../undoHistory/undoHistory.ts";
import type { SerializedGraphViewState } from "./validationSchema.ts";

export type GraphViewState = Record<
  string,
  {
    tupleType: TupleType;
    state: GraphStates;
  }
>;

type GraphTarget<T = object> = {
  tupleInfo: TupleInfo;
  graphType: GraphType;
} & T;

export const initialGraphViewState: GraphViewState = {};

export const graphViewSlice = createSlice({
  name: "graphView",
  initialState: initialGraphViewState,
  reducers: {
    setNodes(
      state,
      action: PayloadAction<GraphTarget<{ nodes: PredicateNodeType[] }>>,
    ) {
      updateEntry(state, action.payload, (graph, { nodes }) => {
        graph.nodes = nodes;
      });
    },

    setEdges(
      state,
      action: PayloadAction<GraphTarget<{ edges: DirectEdgeType[] }>>,
    ) {
      updateEntry(state, action.payload, (graph, { edges }) => {
        graph.edges = edges;
      });
    },

    graphDidInitialLayout(
      state,
      action: PayloadAction<GraphTarget<{ didLayout: boolean }>>,
    ) {
      updateEntry(state, action.payload, (graph, { didLayout }) => {
        graph.didLayout = didLayout;
      });
    },

    onNodesChanged(
      state,
      action: PayloadAction<
        GraphTarget<{ changes: NodeChange<PredicateNodeType>[] }>
      >,
    ) {
      updateEntry(state, action.payload, (graph, { changes }) => {
        graph.nodes = applyNodeChanges(changes, graph.nodes);
      });
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
      const {
        structure,
        language,
        positions,
        overwrite = false,
      } = action.payload;

      const newState: GraphViewState = overwrite ? {} : state;

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
        const tupleId = getTupleId({ type: tupleType, name: tupleName });

        if (!isBinaryTuple(tupleType, arity) || tupleId in newState) return;

        const tuple = {
          name: tupleName,
          intr: [
            ...(getTupleIntr(tupleType)[tupleName]?.value ?? []),
          ] as BinaryRelation<string>,
        };

        const graphPositions = positions?.[tupleId];

        newState[tupleId] = {
          tupleType: tupleType,
          state: Object.fromEntries(
            graphTypes.map((graphType) => [
              graphType,
              graphs[graphType].init(
                domain,
                tuple,
                tupleType,
                graphPositions?.[graphType],
              ),
            ]),
          ) as GraphStates,
        };
      });

      if (!overwrite) {
        const binaryTupleIds = new Set(
          tuples
            .filter(([, arity, tupleType]) => isBinaryTuple(tupleType, arity))
            .map(([tupleName, , tupleType]) =>
              getTupleId({ type: tupleType, name: tupleName }),
            ),
        );

        for (const tupleId in newState) {
          if (!binaryTupleIds.has(tupleId)) delete newState[tupleId];
        }
      }

      return newState;
    },
  },

  extraReducers(builder) {
    builder.addCase(updateDomain, (state, action) => {
      const domain = action.payload;

      for (const [, entry] of Object.entries(state)) {
        for (const graphType of graphTypes) {
          if (graphs[graphType].isCompatible(entry.tupleType))
            updateGraph(entry.state, graphType, (ops, graphState) =>
              ops.syncNodes(graphState, domain, entry.tupleType),
            );
        }
      }
    });

    builder.addMatcher(
      isAnyOf(updateInterpretationPredicates, updateFunctionSymbols),
      (state, action) => {
        const { value, key: tupleName } = action.payload;
        const tupleType = tupleUpdaterToTupleType[action.type];

        const relation = value as BinaryRelation<string>;

        withEntry(state, { type: tupleType, name: tupleName }, (entry) => {
          for (const graphType of graphTypes) {
            if (graphs[graphType].isCompatible(entry.tupleType))
              updateGraph(entry.state, graphType, (ops, graphState) =>
                ops.syncPredIntr(graphState, relation, entry.tupleType),
              );
          }
        });
      },
    );
  },
});

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

const _selectNodes = createSelector(
  [
    (_: RootState, __: TupleInfo, type: GraphType) => type,
    (state: RootState, tupleInfo: TupleInfo, type: GraphType) =>
      state.present.graphView[getTupleId(tupleInfo)]?.state[type]?.nodes,
    (state: RootState, tupleInfo: TupleInfo) =>
      selectRelevantDomainElements(state, tupleInfo, false),
    selectHoveredDomainElements,
    selectSelectedDomain,
    selectUnaryFilterDomainEnabled,
    (state: RootState, tupleInfo: TupleInfo) =>
      selectHatchedDomain(state, tupleInfo),
  ],
  (
    type,
    nodes,
    relevantDomain,
    hoveredPredicateIntr,
    selectedNodes,
    unaryFilterDomain,
    hatchedDomain,
  ): PredicateNodeType[] => {
    if (!nodes) return [];

    const model = graphs[type] as GraphModelFor<typeof type>;

    return model.filterNodesToShow(
      nodes,
      unaryFilterDomain,
      selectedNodes,
      relevantDomain,
      hoveredPredicateIntr,
      hatchedDomain,
    );
  },
);

export const selectNodes = <T extends GraphType>(
  state: RootState,
  tupleInfo: TupleInfo,
  type: T,
): GraphStates[T]["nodes"] =>
  _selectNodes(state, tupleInfo, type) as GraphStates[T]["nodes"];

export const selectEdges = createSelector(
  [
    (state: RootState, tupleInfo: TupleInfo, type: GraphType) =>
      state.present.graphView[getTupleId(tupleInfo)]?.state[type],
    (
      state: RootState,
      tupleInfo: TupleInfo,
      _type: GraphType,
      includeHovered: boolean = false,
    ) => selectRelevantDomainElements(state, tupleInfo, includeHovered),
    selectSelectedDomain,
    (state: RootState, tupleInfo: TupleInfo) =>
      selectTupleLock(state, tupleInfo),
  ],
  (graphState, relevantDomain, selectedNodes, locked): DirectEdgeType[] => {
    if (!graphState) return [];

    const edges = readGraph(graphState, (ops, state) =>
      ops.filterEdgesToShow(state, selectedNodes, relevantDomain),
    );

    if (!locked) return edges;

    return edges.map((edge) => ({
      ...edge,
      selectable: false,
      selected: false,
    }));
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
    const state = getState();
    const graphState =
      state.present.graphView[getTupleId(tupleInfo)]?.state[graphType];

    if (!graphState) return;

    dispatch(
      setEdges({
        tupleInfo,
        graphType,
        edges: applyEdgeChanges(changes, graphState.edges),
      }),
    );

    if (!changes.some((change) => change.type === "remove")) return;

    const visibleEdges = applyEdgeChanges(
      changes,
      selectEdges(state, tupleInfo, graphType),
    );

    dispatch(
      updateInterpretation(tupleInfo, graphState, (ops, graph) =>
        ops.visibleEdgesToRelation(graph, visibleEdges),
      ),
    );
    dispatch(UndoActions.checkpoint());
  };
};

export const onConnected = ({
  tupleInfo,
  graphType,
  connection,
}: {
  tupleInfo: TupleInfo;
  graphType: GraphType;
  connection: Connection;
}): AppThunk => {
  return (dispatch, getState) => {
    const state = getState();
    const graphState =
      state.present.graphView[getTupleId(tupleInfo)]?.state[graphType];

    if (!graphState) return;

    const model = graphs[graphType];

    if (connection.source === connection.target && !model.supportsSelfLoops)
      return;

    let visibleEdges = selectEdges(state, tupleInfo, graphType);

    if (tupleInfo.type === "function")
      visibleEdges = visibleEdges.filter((e) => e.source !== connection.source);

    visibleEdges = addEdge(connection, visibleEdges);

    dispatch(
      updateInterpretation(tupleInfo, graphState, (ops, graph) =>
        ops.visibleEdgesToRelation(graph, visibleEdges),
      ),
    );
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
    const state = getState();
    const graphState =
      state.present.graphView[getTupleId(tupleInfo)]?.state[graphType];

    if (!graphState) return;

    const visibleEdges = selectEdges(state, tupleInfo, graphType);

    const nodes = readGraph(graphState, (ops, graph) =>
      ops.nodesWithout(graph, deletedNode),
    );

    dispatch(setNodes({ tupleInfo, graphType, nodes }));
    dispatch(
      updateInterpretation(tupleInfo, graphState, (ops, graph) =>
        ops.visibleEdgesToRelation(
          graph,
          ops.edgesWithout(visibleEdges, deletedNode),
        ),
      ),
    );
    dispatch(UndoActions.checkpoint());
  };
};

const updateInterpretation = (
  tupleInfo: TupleInfo,
  graphState: AnyGraphState,
  toRelation: <S extends GraphState>(
    ops: GraphModel<S>,
    graph: S,
  ) => BinaryRelation<string>,
) =>
  interpretationUpdaters[tupleInfo.type]({
    key: tupleInfo.name,
    value: readGraph(graphState, toRelation),
  });

type GraphEntry = GraphViewState[string];

function withEntry(
  state: GraphViewState,
  tupleInfo: TupleIdentity,
  update: (entry: GraphEntry) => void,
) {
  const entry = state[getTupleId(tupleInfo)];
  if (entry) update(entry);
}

function updateEntry<P extends GraphTarget>(
  state: GraphViewState,
  payload: P,
  update: (graphState: GraphStates[GraphType], payload: P) => void,
) {
  withEntry(state, payload.tupleInfo, (entry) =>
    update(entry.state[payload.graphType], payload),
  );
}

const interpretationUpdaters = {
  predicate: updateInterpretationPredicates,
  function: updateFunctionSymbols,
} as const;

const tupleUpdaterToTupleType = {
  [updateInterpretationPredicates.type]: "predicate",
  [updateFunctionSymbols.type]: "function",
} satisfies Record<string, TupleType>;

export const {
  setNodes,
  setEdges,
  onNodesChanged,
  syncGraphView,
  graphDidInitialLayout,
} = graphViewSlice.actions;

export default graphViewSlice.reducer;
