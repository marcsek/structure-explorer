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
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import { isPoset } from "./HasseDiagram/posetHelpers";
import { edgesToRelation, type BinaryRelation } from "./common/relations.ts";
import {
  graphs,
  graphTypes,
  readGraph,
  updateGraph,
  type AnyGraphState,
  type GraphModelFor,
  type GraphStates,
  type GraphType,
} from "./graphRegistry.ts";
import type { GraphModel, GraphState } from "./common/GraphModel.ts";
import { type LanguageState } from "../../language/languageSlice.ts";
import {
  selectTupleLock,
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

      if (!state[tupleId]) return;

      state[tupleId].state[graphType].nodes = nodes;
    },

    setEdges(
      state,
      action: PayloadAction<WithGraphId<{ edges: DirectEdgeType[] }>>,
    ) {
      const { tupleInfo, graphType, edges } = action.payload;

      const tupleId = getTupleId(tupleInfo);

      if (!state[tupleId]) return;

      state[tupleId].state[graphType].edges = edges;
    },

    graphDidInitialLayout(
      state,
      action: PayloadAction<WithGraphId<{ didLayout: boolean }>>,
    ) {
      const { tupleInfo, graphType, didLayout } = action.payload;

      const tupleId = getTupleId(tupleInfo);

      if (!state[tupleId]) return;

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

        if (!state[tupleId]) return;

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
          if (graphs[graphType].isCompatible(entry.tupleType))
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
          if (graphs[graphType].isCompatible(entry.tupleType))
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
  breakPrevious = false,
}: {
  tupleInfo: TupleInfo;
  graphType: GraphType;
  connection: Connection;
  breakPrevious?: boolean;
}): AppThunk => {
  return (dispatch, getState) => {
    const state = getState();
    const graphState =
      state.present.graphView[getTupleId(tupleInfo)]?.state[graphType];

    if (!graphState) return;

    let visibleEdges = selectEdges(state, tupleInfo, graphType);

    if (breakPrevious)
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
  warningChanged,
  syncGraphView,
  graphDidInitialLayout,
} = graphManagerSlice.actions;

export default graphManagerSlice.reducer;
