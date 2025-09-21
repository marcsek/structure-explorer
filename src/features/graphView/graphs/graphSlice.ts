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
  type EdgeChange,
  type NodeChange,
} from "@xyflow/react";
import {
  expandReducedPoset,
  type BinaryRelation,
} from "./HasseDiagram/posetHelpers";
import {
  graphTypes,
  plugins,
  processEdgesToRelation,
  processHideNodes,
  processSyncNodes,
  processSyncPredIntr,
  type GraphState,
  type GraphType,
} from "./plugins.ts";
import { selectParsedPredicates } from "../../language/languageSlice.ts";
import {
  selectStructure,
  updateInterpretationPredicates,
} from "../../structure/structureSlice.ts";

export type GraphManagerState = Record<string, GraphState>;

type WithGraphId<T> = { id: string; type: GraphType } & T;

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
      state[id][type].nodes = nodes;
    },

    setEdges(
      state,
      action: PayloadAction<WithGraphId<{ edges: DirectEdgeType[] }>>,
    ) {
      const { id, type, edges } = action.payload;
      state[id][type].edges = edges;
    },

    edgeAdded(
      state,
      action: PayloadAction<WithGraphId<{ edge: DirectEdgeType }>>,
    ) {
      const { id, type, edge } = action.payload;
      state[id][type].edges = [...state[id][type].edges, edge];
    },

    onNodesChanged(
      state,
      action: PayloadAction<
        WithGraphId<{ changes: NodeChange<PredicateNodeType>[] }>
      >,
    ) {
      const { id, type, changes } = action.payload;
      state[id][type].nodes = applyNodeChanges(changes, state[id][type].nodes);
    },

    predicateToggled(
      state,
      action: PayloadAction<WithGraphId<{ predicate: string }>>,
    ) {
      const { id, type, predicate } = action.payload;

      const selected = state[id][type].selectedPreds;
      if (selected.includes(predicate))
        state[id][type].selectedPreds = selected.filter(
          (pred) => pred != predicate,
        );
      else selected.push(predicate);
    },

    nodeToggled(state, action: PayloadAction<WithGraphId<{ node: string }>>) {
      const { id, type, node } = action.payload;

      (state[id][type] as GraphState[typeof type]) = processHideNodes(
        plugins[type],
        state[id][type],
        node,
      );
    },

    predicatesChanged(
      state,
      action: PayloadAction<{
        domain: string[];
        preds: [string, number][];
        predicateIntr: Record<string, string[][]>;
      }>,
    ) {
      const { domain, preds, predicateIntr } = action.payload;

      preds.forEach(([name, artity]) => {
        if (artity !== 2 || name in state) return;

        const predicate = {
          name,
          intr: [...(predicateIntr[name] ?? [])] as BinaryRelation<string>,
        };

        state[name] = {
          oriented: plugins.oriented.init(domain, predicate),
          hasse: plugins.hasse.init(domain, predicate),
          bipartite: plugins.bipartite.init(domain, predicate),
        };
      });

      const predNames = preds.map((pred) => pred[0]);
      for (const key in state) if (!predNames.includes(key)) delete state[key];
    },

    predicateInterpretationChanged(
      state,
      action: PayloadAction<{ name: string; intr: string[][] }>,
    ) {
      const { name, intr } = action.payload;

      if (!(name in state)) return;

      const graphs = state[name];
      for (const graphType of graphTypes) {
        const graphState = graphs[graphType];
        const plugin = plugins[graphType];

        (graphs[graphType] as GraphState[typeof graphType]) =
          processSyncPredIntr(
            plugin,
            graphState,
            intr as BinaryRelation<string>,
          );
      }
    },

    domainChanged(state, action: PayloadAction<string[]>) {
      for (const [, graphs] of Object.entries(state)) {
        for (const graphType of graphTypes) {
          const graphState = graphs[graphType];
          const plugin = plugins[graphType];
          const domain = action.payload;

          (graphs[graphType] as GraphState[typeof graphType]) =
            processSyncNodes(plugin, graphState, domain);
        }
      }
    },
  },
});

export const selectBinaryPreds = createSelector(
  [selectParsedPredicates],
  (preds) => {
    if (preds.error) return [];
    return [...preds.parsed.entries()].filter(([, arity]) => arity === 2);
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

    const newEdges = applyEdgeChanges(changes, managerState[id][type].edges);

    const relation = processEdgesToRelation(plugins[type], {
      ...managerState[id][type],
      edges: newEdges,
    });

    console.log("Edges Changed");

    dispatch(setEdges({ id, type, edges: newEdges }));
    dispatch(
      updateInterpretationPredicates({
        key: id,
        value: binaryRelationToString(relation),
      }),
    );
  };
};

export const onConnected = ({
  id,
  type,
  connection,
}: {
  id: string;
  type: GraphType;
  connection: Connection;
}): AppThunk => {
  return (dispatch, getState) => {
    const managerState = getState().graphView;

    const newEdges = addEdge(connection, managerState[id][type].edges);

    const relation = processEdgesToRelation(plugins[type], {
      ...managerState[id][type],
      edges: newEdges,
    });

    console.log("On Connected");

    dispatch(
      updateInterpretationPredicates({
        key: id,
        value: binaryRelationToString(relation),
      }),
    );
  };
};

export const selectedNodesChanged = ({
  id,
  type,
  toggledNode,
}: {
  id: string;
  type: GraphType;
  toggledNode: string;
}): AppThunk => {
  return (dispatch, getState) => {
    dispatch(nodeToggled({ id, type, node: toggledNode }));

    if (type === "hasse" && getState().graphView[id][type].isPoset) {
      const graphState = getState().graphView[id][type];
      const vissibleNodes = graphState.nodes
        .filter((node) => !node.hidden)
        .map((node) => node.id);

      const vissibleEdges = graphState.edges
        .filter(
          ({ source, target }) =>
            vissibleNodes.includes(source) && vissibleNodes.includes(target),
        )
        .map(({ source, target }) => [
          source,
          target,
        ]) as BinaryRelation<string>;

      const relation = expandReducedPoset(
        vissibleEdges,
        new Set(vissibleNodes),
      );

      dispatch(
        updateInterpretationPredicates({
          key: id,
          value: binaryRelationToString(relation),
        }),
      );
    }
  };
};

//const initGraphManagerFromStruct = (struct: Structure, lang: Language) => {
//  const managerState: GraphManagerState = {};
//
//  const binaryPreds = Object.keys(lang.predicates).filter(
//    (pred) => lang.predicates[pred].arity === 2,
//  );
//
//  binaryPreds.forEach((binaryPred) => {
//    managerState[binaryPred] = {
//      oriented: plugins.oriented.init(struct, binaryPred),
//      hasse: plugins.hasse.init(struct, binaryPred),
//      bipartite: plugins.bipartite.init(struct, binaryPred),
//    };
//  });
//
//  return managerState;
//};

const binaryRelationToString = (relation: BinaryRelation<string>) =>
  relation.map((pair) => `(${pair.join(",")})`).join(", ");

export const {
  //setStructure,
  setNodes,
  setEdges,
  edgeAdded,
  onNodesChanged,
  predicateToggled,
  nodeToggled,
  predicatesChanged,
  predicateInterpretationChanged,
  domainChanged,
} = graphManagerSlice.actions;

export default graphManagerSlice.reducer;
