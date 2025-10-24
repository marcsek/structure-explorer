import type { PredicateNodeType } from "./graphComponents/PredicateNode";
import type { DirectEdgeType } from "./graphComponents/DirectEdge";
import {
  createSelector,
  createSlice,
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
  processToggleNodes,
  type GraphState,
  type GraphType,
  type Plugin,
} from "./plugins.ts";
import {
  selectParsedFunctions,
  selectParsedPredicates,
} from "../../language/languageSlice.ts";
import {
  selectStructure,
  updateFunctionSymbols,
  updateInterpretationPredicates,
} from "../../structure/structureSlice.ts";

export type TupleType = "function" | "predicate";

export type GraphManagerState = Record<
  string,
  { tupleType: TupleType; state: GraphState; hoveredPredicate: string }
>;

type WithGraphId<T = object> = { id: string; type: GraphType } & T;

export const graphManagerSlice = createSlice({
  name: "graphManager",
  initialState: {} as GraphManagerState,
  reducers: {
    //setStructure(
    //  _,
    //  action: PayloadAction<{ struct: Structure; lang: Language }>,
    //) {
    //  const { struct, lang } = action.payload;
    //  return initGraphManagerFromStruct(struct, lang);
    //},

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

    onNodesChanged(
      state,
      action: PayloadAction<
        WithGraphId<{ changes: NodeChange<PredicateNodeType>[] }>
      >,
    ) {
      const { id, type, changes } = action.payload;
      state[id].state[type].nodes = applyNodeChanges(
        changes,
        state[id].state[type].nodes,
      );
    },

    predicateToggled(
      state,
      action: PayloadAction<WithGraphId<{ predicate: string }>>,
    ) {
      const { id, type, predicate } = action.payload;

      const selected = state[id].state[type].selectedPreds;

      if (selected.includes(predicate))
        state[id].state[type].selectedPreds = selected.filter(
          (pred) => pred != predicate,
        );
      else selected.push(predicate);
    },

    nodeToggled(state, action: PayloadAction<WithGraphId<{ node?: string }>>) {
      const { id, type, node: toggledNode = "" } = action.payload;

      if (!state[id]) return;

      const graphState = state[id].state[type];

      (state[id].state[type] as GraphState[typeof type]) = processToggleNodes(
        plugins[type],
        graphState,
        toggledNode,
      );
    },

    predicateHovered(
      state,
      action: PayloadAction<WithGraphId<{ predicate: string }>>,
    ) {
      const { id, predicate } = action.payload;

      if (!state[id]) return;

      state[id].hoveredPredicate = predicate;
    },

    tuplesChanged(
      state,
      action: PayloadAction<{
        domain: string[];
        preds: [string, number][];
        funcs: [string, number][];
        tupleIntr: Record<string, string[][]>;
      }>,
    ) {
      const { domain, preds, funcs, tupleIntr } = action.payload;

      const tuples = [
        ...preds.map((pred) => [...pred, "predicate"] as const),
        ...funcs.map((func) => [...func, "function"] as const),
      ];

      tuples.forEach(([name, artity, type]) => {
        if (
          (artity !== 2 && (type !== "function" || artity !== 1)) ||
          name in state
        )
          return;

        const tuple = {
          name,
          intr: [...(tupleIntr[name] ?? [])] as BinaryRelation<string>,
        };

        state[name] = {
          tupleType: type,
          state: {
            oriented: plugins.oriented.init(domain, tuple, type),
            hasse: plugins.hasse.init(domain, tuple, type),
            bipartite: plugins.bipartite.init(domain, tuple, type),
          },
          hoveredPredicate: "",
        };
      });

      const tupleNames = [...preds, ...funcs].map((tuple) => tuple[0]);
      for (const key in state) if (!tupleNames.includes(key)) delete state[key];
    },

    tupleInterpretationChanged(
      state,
      action: PayloadAction<{ name: string; intr: string[][] }>,
    ) {
      const { name, intr } = action.payload;

      if (!(name in state)) return;

      const graphs = state[name];
      for (const graphType of graphTypes) {
        const graphState = graphs.state[graphType];
        const plugin = plugins[graphType];

        (graphs.state[graphType] as GraphState[typeof graphType]) =
          processSyncPredIntr(
            plugin,
            graphState,
            intr as BinaryRelation<string>,
            graphs.tupleType,
          );
      }
    },

    domainChanged(state, action: PayloadAction<string[]>) {
      for (const [, graphs] of Object.entries(state)) {
        for (const graphType of graphTypes) {
          const graphState = graphs.state[graphType];
          const plugin = plugins[graphType];
          const domain = action.payload;

          (graphs.state[graphType] as GraphState[typeof graphType]) =
            processSyncNodes(plugin, graphState, domain, graphs.tupleType);
        }
      }
    },

    editorLocked(
      state,
      action: PayloadAction<WithGraphId<{ locked: boolean }>>,
    ) {
      const { id, type, locked } = action.payload;

      if (state[id])
        state[id].state[type].edges = state[id].state[type].edges.map((e) => ({
          ...e,
          selectable: !locked,
        }));
    },
  },
});

export const selectTupleType = createSelector(
  [(state: RootState) => state.graphView, (_: RootState, id: string) => id],
  (graphView, id) => graphView[id].tupleType,
);

export const selectBinaryPreds = createSelector(
  [selectParsedPredicates],
  (preds) => {
    if (preds.error) return [];
    return [...preds.parsed.entries()].filter(([, arity]) => arity === 2);
  },
);

export const selectBinaryFunctions = createSelector(
  [selectParsedFunctions],
  (funcs) => {
    if (funcs.error) return [];
    return [...funcs.parsed.entries()].filter(([, arity]) => arity === 1);
  },
);

export const selectRelevantConstants = createSelector(
  [selectStructure, (_: RootState, predName: string) => predName],
  (struct, predName) =>
    [...struct.iC.keys()].filter((c) => struct.iC.get(c) === predName),
);

export const selectUnaryPreds = createSelector(
  [selectParsedPredicates],
  (preds) => {
    if (preds.error) return [];
    return [...preds.parsed.entries()].filter(([, arity]) => arity === 1);
  },
);

export const selectRelevantUnaryPreds = createSelector(
  [selectStructure, (_: RootState, predName: string) => predName],
  (struct, predName) =>
    [...struct.iP.keys()].filter((p) =>
      [...(struct.iP.get(p) ?? [])].some(
        (t) => t.length === 1 && t[0] === predName,
      ),
    ),
);

export const selectRelevantDomainElements = createSelector(
  [
    selectStructure,
    (state: RootState) => state,
    (_: RootState, id: string) => id,
    (_: RootState, __: string, type: GraphType) => type,
    (
      _: RootState,
      __: string,
      ___: GraphType,
      includeHovered: boolean = false,
    ) => includeHovered,
  ],
  (struct, state, id, type, includeHovered) => {
    const selectedPreds = [
      ...((state.graphView[id]?.state[type] as GraphState[typeof type])
        ?.selectedPreds ?? []),
    ];

    if (includeHovered && state.graphView[id].hoveredPredicate !== "")
      selectedPreds.push(state.graphView[id].hoveredPredicate);

    if (selectedPreds.length === 0) return undefined;

    return selectedPreds.flatMap((pred) =>
      [...(struct.iP.get(pred)?.values() ?? [])].flat(),
    );
  },
);

export const selectHoveredPredicateIntr = createSelector(
  [
    selectStructure,
    (state: RootState) => state,
    (_: RootState, id: string) => id,
  ],
  (struct, state, id) => {
    const hoveredPredicate = state.graphView[id]?.hoveredPredicate;

    if (!hoveredPredicate) return undefined;

    return [...(struct.iP.get(hoveredPredicate)?.values() ?? [])].flat();
  },
);

export const selectPosetValidity = createSelector(
  [
    selectRelevantDomainElements,
    (state: RootState) => state,
    (_: RootState, id: string) => id,
  ],
  (relevantDomain, state, id) => {
    const graphState = state.graphView[id]?.state.hasse;

    const vissibleNodes = graphState.nodes
      .filter(
        (node) =>
          graphState.selectedNodes.includes(node.id) &&
          (relevantDomain?.includes(node.id) ?? true),
      )
      .map((node) => node.id);

    const vissibleRelation = edgesToRelation(
      graphState.edges.filter(
        ({ source, target }) =>
          vissibleNodes.includes(source) && vissibleNodes.includes(target),
      ),
    );

    return isPoset(vissibleRelation);
  },
);

// TODO: try to do better narrowing
export function makeSelectNodes<T extends GraphType>() {
  return createSelector(
    [
      (state: RootState) => state,
      (_: RootState, id: string) => id,
      (_: RootState, __: string, type: T) => type,
      selectRelevantDomainElements,
      selectHoveredPredicateIntr,
    ],
    (
      state: RootState,
      id: string,
      type: T,
      relevantDomain: ReturnType<typeof selectRelevantDomainElements>,
      hoveredPredicateIntr: ReturnType<typeof selectHoveredPredicateIntr>,
    ): GraphState[T]["nodes"] => {
      const plugin = plugins[type] as Plugin<T>;
      const graphState = state.graphView[id]?.state[type];

      if (!graphState) return [] as GraphState[T]["nodes"];

      return processFilterNodesToShow(
        plugin,
        graphState,
        relevantDomain,
        hoveredPredicateIntr,
      ) as GraphState[T]["nodes"];
    },
  );
}

export const selectEdges = createSelector(
  [
    (state: RootState) => state,
    (_: RootState, id: string) => id,
    (_: RootState, __: string, type: GraphType) => type,
    selectRelevantDomainElements,
  ],
  (state, id, type, relevantDomain) => {
    const plugin = plugins[type];
    const graphState = state.graphView[id]?.state[type];

    if (!graphState) return [] as GraphState[typeof type]["edges"];

    return processFilterEdgesToShow(plugin, graphState, relevantDomain);
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
    const managerState = getState().graphView;
    const tupleType = managerState[id].tupleType;
    const selectedEdges = selectEdges(getState(), id, type);

    const newEdges = applyEdgeChanges(
      changes,
      managerState[id].state[type].edges,
    );

    const relevantEdges = edgesToRelation(selectedEdges);

    const relation = processEdgesToRelation(
      plugins[type],
      {
        ...managerState[id].state[type],
        edges: newEdges,
      },
      relevantEdges,
    );

    const relationSyncedEdges = newEdges.filter(({ source, target }) =>
      relation.some(([from, to]) => source === from && target === to),
    );

    console.log("Edges Changed");

    const creator =
      tupleType === "predicate"
        ? updateInterpretationPredicates
        : updateFunctionSymbols;

    dispatch(setEdges({ id, type, edges: relationSyncedEdges }));
    dispatch(creator({ key: id, value: binaryRelationToString(relation) }));
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
    const managerState = getState().graphView;
    const tupleType = managerState[id].tupleType;
    let newEdges = [...managerState[id].state[type].edges];

    if (breakPrevious)
      newEdges = newEdges.filter((e) => e.source !== connection.source);

    newEdges = addEdge(connection, newEdges);

    const relevantEdges = [
      ...edgesToRelation(selectEdges(getState(), id, type)),
      [connection.source, connection.target],
    ] as [string, string][];

    const relation = processEdgesToRelation(
      plugins[type],
      {
        ...managerState[id].state[type],
        edges: newEdges,
      },
      relevantEdges,
    );

    console.log("On Connected");

    const creator =
      tupleType === "predicate"
        ? updateInterpretationPredicates
        : updateFunctionSymbols;

    dispatch(creator({ key: id, value: binaryRelationToString(relation) }));
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
    const managerState = getState().graphView;
    const tupleType = managerState[id].tupleType;

    const { nodes: newNodes, edges: newEdges } = processDeleteLeftover(
      plugins[type],
      managerState[id].state[type],
      deletedNode,
    );

    const relation = processEdgesToRelation(plugins[type], {
      ...managerState[id].state[type],
      edges: newEdges,
    });

    const creator =
      tupleType === "predicate"
        ? updateInterpretationPredicates
        : updateFunctionSymbols;

    dispatch(setNodes({ id, type, nodes: newNodes }));
    dispatch(creator({ key: id, value: binaryRelationToString(relation) }));
  };
};

export const binaryRelationToString = (relation: BinaryRelation<string>) =>
  relation.map((pair) => `(${pair.join(",")})`).join(", ");

export const edgesToRelation = (edges: Edge[]): BinaryRelation<string> =>
  edges.map(({ source, target }) => [source, target]);

export const {
  setNodes,
  setEdges,
  edgeAdded,
  onNodesChanged,
  predicateToggled,
  nodeToggled,
  tuplesChanged,
  tupleInterpretationChanged,
  domainChanged,
  editorLocked,
  predicateHovered,
} = graphManagerSlice.actions;

export default graphManagerSlice.reducer;
