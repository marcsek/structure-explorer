import BipartiteGraphModel, {
  type BipartiteGraphState,
} from "./bipartite/model";
import HasseDiagramModel, { type HasseDiagramState } from "./hasse/model";
import OrientedGraphModel, { type OrientedGraphState } from "./oriented/model";
import type { GraphModel, GraphState } from "./GraphModel";

export const graphTypes = ["oriented", "hasse", "bipartite"] as const;
export type GraphType = (typeof graphTypes)[number];

export type GraphStates = {
  oriented: OrientedGraphState;
  bipartite: BipartiteGraphState;
  hasse: HasseDiagramState;
};

export type GraphModelFor<K extends GraphType> = GraphModel<GraphStates[K]>;

export const graphs: { [K in GraphType]: GraphModelFor<K> } = {
  oriented: new OrientedGraphModel(),
  hasse: new HasseDiagramModel(),
  bipartite: new BipartiteGraphModel(),
};

export type AnyGraphState = GraphStates[GraphType];

type GraphVisitor<R> = <S extends GraphState>(
  graph: GraphModel<S>,
  state: S,
) => R;

export const modelFor = (type: GraphType) =>
  graphs[type] as unknown as GraphModel<never>;

export function readGraph<R>(state: AnyGraphState, visit: GraphVisitor<R>): R {
  return visit(modelFor(state.kind), state as never);
}

export function updateGraph(
  states: GraphStates,
  type: GraphType,
  visit: <S extends GraphState>(graph: GraphModel<S>, state: S) => S,
): void {
  states[type] = visit(modelFor(type), states[type] as never);
}
