import {
  bipartiteGraphPlugin,
  type BipartiteGraphState,
} from "./BipartiteGraph/plugin";
import {
  hasseDiagramPlugin,
  type HasseDiagramState,
} from "./HasseDiagram/plugin";
import type { BinaryRelation } from "./HasseDiagram/posetHelpers";
import {
  orientedGraphPlugin,
  type OrientedGraphState,
} from "./OrientedGraph/plugin";
import type { TupleType } from "../../structure/structureSlice";

export const graphTypes = ["oriented", "hasse", "bipartite"] as const;
export type GraphType = (typeof graphTypes)[number];

export type GraphState = {
  oriented: OrientedGraphState;
  bipartite: BipartiteGraphState;
  hasse: HasseDiagramState;
};

export interface Plugin<K extends GraphType> {
  init(
    domain: string[],
    predicate: { name: string; intr: BinaryRelation<string> },
    tupleType: TupleType,
    positions?: Record<string, [number, number]>,
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
    nodes: GraphState[K]["nodes"],
    unaryFilterDomain: boolean,
    selectedNodes: string[],
    relevantNodes?: string[],
    hoveredPredicateIntr?: string[][],
  ): GraphState[K]["nodes"];
  filterEdgesToShow(
    state: GraphState[K],
    selectedNodes: string[],
    relevantNodes?: string[],
  ): GraphState[K]["edges"];
  toggleNodes(
    state: GraphState[K],
    node: string,
    selectedNodes: string[],
  ): [GraphState[K], string[]];
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
  ): [BinaryRelation<string>, GraphState[K]["edges"]];
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
  selectedNodes: string[],
): [GraphState[K], string[]] {
  return plugin.toggleNodes(prev, node, selectedNodes);
}

export function processFilterNodesToShow<K extends GraphType>(
  plugin: Plugin<K>,
  nodes: GraphState[K]["nodes"],
  unaryFilterDomain: boolean,
  selectedNodes: string[],
  relevantNodes?: string[],
  hoveredPredicateIntr?: string[][],
): GraphState[K]["nodes"] {
  return plugin.filterNodesToShow(
    nodes,
    unaryFilterDomain,
    selectedNodes,
    relevantNodes,
    hoveredPredicateIntr,
  );
}

export function processFilterEdgesToShow<K extends GraphType>(
  plugin: Plugin<K>,
  state: GraphState[K],
  selectedNodes: string[],
  relevantNodes?: string[],
): GraphState[K]["edges"] {
  return plugin.filterEdgesToShow(state, selectedNodes, relevantNodes);
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
): [BinaryRelation<string>, GraphState[K]["edges"]] {
  return plugin.edgesToRelation(state, relevantEdges);
}
