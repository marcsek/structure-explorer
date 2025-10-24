import {
  bipartiteGraphPlugin,
  type BipartiteGraphState,
} from "./BipartiteGraph/plugin";
import type { TupleType } from "./graphSlice";
import {
  hasseDiagramPlugin,
  type HasseDiagramState,
} from "./HasseDiagram/plugin";
import type { BinaryRelation } from "./HasseDiagram/posetHelpers";
import {
  orientedGraphPlugin,
  type OrientedGraphState,
} from "./OrientedGraph/plugin";

export type GraphState = {
  oriented: OrientedGraphState;
  bipartite: BipartiteGraphState;
  hasse: HasseDiagramState;
};

export const graphTypes = ["oriented", "hasse", "bipartite"] as const;
export type GraphType = (typeof graphTypes)[number];

export interface Plugin<K extends GraphType> {
  init(
    domain: string[],
    predicate: { name: string; intr: BinaryRelation<string> },
    tupleType: TupleType,
  ): GraphState[K];
  syncNodes(
    prev: GraphState[K],
    domain: string[],
    tupleType: TupleType,
  ): GraphState[K];
  // hideNodes(
  //   prev: GraphState[K],
  //   toggledNode: string,
  //   relevantNodes: string[] | null,
  // ): GraphState[K];
  filterNodesToShow(
    state: GraphState[K],
    relevantNodes?: string[],
    hoveredPredicateIntr?: string[],
  ): GraphState[K]["nodes"];
  filterEdgesToShow(
    state: GraphState[K],
    relevantNodes?: string[],
  ): GraphState[K]["edges"];
  toggleNodes(state: GraphState[K], node: string): GraphState[K];
  syncPredIntr(
    prev: GraphState[K],
    intr: BinaryRelation<string>,
    tupleType: TupleType,
  ): GraphState[K];
  deleteLeftover(
    state: GraphState[K],
    deleted: string,
  ): Pick<GraphState[K], "nodes" | "edges">;
  edgesToRelation(
    state: GraphState[K],
    relevantEdges?: [string, string][],
  ): BinaryRelation<string>;
}

export const plugins = {
  oriented: orientedGraphPlugin,
  bipartite: bipartiteGraphPlugin,
  hasse: hasseDiagramPlugin,
};

// Functions below are used just to help typescript narrow "Plugin" and "GraphState" unions

export function processSyncNodes<K extends GraphType>(
  plugin: Plugin<K>,
  prev: GraphState[K],
  domain: string[],
  tupleType: TupleType,
): GraphState[K] {
  return plugin.syncNodes(prev, domain, tupleType);
}

// export function processHideNodes<K extends GraphType>(
//   plugin: Plugin<K>,
//   prev: GraphState[K],
//   toggledNode: string,
//   relevantNodes: string[] | null,
// ): GraphState[K] {
//   return plugin.hideNodes(prev, toggledNode, relevantNodes);
// }
//
export function processToggleNodes<K extends GraphType>(
  plugin: Plugin<K>,
  prev: GraphState[K],
  node: string,
): GraphState[K] {
  return plugin.toggleNodes(prev, node);
}

export function processFilterNodesToShow<K extends GraphType>(
  plugin: Plugin<K>,
  state: GraphState[K],
  relevantNodes?: string[],
  hoveredPredicateIntr?: string[],
): GraphState[K]["nodes"] {
  return plugin.filterNodesToShow(state, relevantNodes, hoveredPredicateIntr);
}

export function processFilterEdgesToShow<K extends GraphType>(
  plugin: Plugin<K>,
  state: GraphState[K],
  relevantNodes?: string[],
): GraphState[K]["edges"] {
  return plugin.filterEdgesToShow(state, relevantNodes);
}

export function processSyncPredIntr<K extends GraphType>(
  plugin: Plugin<K>,
  prev: GraphState[K],
  intr: BinaryRelation<string>,
  tupleType: TupleType,
): GraphState[K] {
  return plugin.syncPredIntr(prev, intr, tupleType);
}

export function processDeleteLeftover<K extends GraphType>(
  plugin: Plugin<K>,
  state: GraphState[K],
  deleted: string,
): Pick<GraphState[K], "nodes" | "edges"> {
  return plugin.deleteLeftover(state, deleted);
}

export function processEdgesToRelation<K extends GraphType>(
  plugin: Plugin<K>,
  state: GraphState[K],
  relevantEdges?: [string, string][],
): BinaryRelation<string> {
  return plugin.edgesToRelation(state, relevantEdges);
}
