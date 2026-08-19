import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { PredicateNodeType } from "../graphComponents/PredicateNode";
import {
  expandReducedPoset,
  reducePosetRelations,
  staysValidHasseWithEdge,
  type BinaryRelation,
} from "./posetHelpers";
import type { Connection, Edge } from "@xyflow/react";
import {
  type ConnectionValidity,
  edgeId,
  GraphModel,
  type NodeFlags,
  scatteredSeedPosition,
  type GraphState,
  type PositionSeed,
} from "../common/GraphModel";

export interface HasseDiagramState extends GraphState {
  kind: "hasse";
}

export default class HasseDiagramModel extends GraphModel<HasseDiagramState> {
  protected readonly representsFunctions = false;

  protected empty(): HasseDiagramState {
    return { kind: "hasse", nodes: [], edges: [] };
  }

  protected createNodes(
    element: string,
    { leftover = false }: NodeFlags,
    seed?: PositionSeed,
  ): PredicateNodeType[] {
    return [
      {
        id: element,
        type: "predicate",
        position: scatteredSeedPosition(element, seed),
        data: { label: element, leftover },
        deletable: false,
      },
    ];
  }

  protected createEdge(
    from: string,
    to: string,
    { duplicate = false } = {},
  ): DirectEdgeType {
    return {
      id: edgeId(from, to, duplicate),
      source: from,
      target: to,
      data: { duplicate, helper: false },
      selectable: !duplicate,
    };
  }

  filterEdgesToShow(
    state: HasseDiagramState,
    selectedNodes: string[],
    relevantNodes?: string[],
  ) {
    const visibleNodes = state.nodes
      .filter(
        (node) =>
          node.data.leftover ||
          (selectedNodes.includes(node.id) &&
            (relevantNodes?.includes(node.id) ?? true)),
      )
      .map((node) => node.id);

    const filteredRelation = this.relationOf(
      state.edges.filter(
        ({ source, target }) =>
          visibleNodes.includes(source) && visibleNodes.includes(target),
      ),
    );

    const reducedRelation = reducePosetRelations(filteredRelation);
    const unfilteredReducedRelation = reducePosetRelations(
      this.relationOf(state.edges),
    );

    const inUnfiltered = (source: string, target: string) =>
      unfilteredReducedRelation.some(
        ([from, to]) => source === from && target === to,
      );

    const unfilteredEdges = state.edges.filter(
      ({ source, target, data }) =>
        data?.duplicate || inUnfiltered(source, target),
    );

    const helperEdges = state.edges
      .filter(
        ({ source, target }) =>
          reducedRelation.some(
            ([from, to]) => source === from && target === to,
          ) && !inUnfiltered(source, target),
      )
      .map((e) => ({
        ...e,
        data: { ...e.data, helper: true },
        selectable: false,
      }));

    return [...unfilteredEdges, ...helperEdges];
  }

  validateConnection(
    edges: DirectEdgeType[],
    connection: Connection | Edge,
  ): ConnectionValidity {
    const relation = this.relationOf(
      edges.filter((edge) => !edge.data?.helper),
    );

    return staysValidHasseWithEdge(relation, [
      connection.source,
      connection.target,
    ]);
  }

  visibleEdgesToRelation(
    state: HasseDiagramState,
    visibleEdges: DirectEdgeType[],
  ): BinaryRelation<string> {
    const domain = new Set(state.nodes.map((node) => node.id));
    const expanded = expandReducedPoset(this.relationOf(visibleEdges), domain);

    const duplicates = this.relationOf(
      visibleEdges.filter(({ data }) => data?.duplicate),
    );

    return [...expanded, ...duplicates];
  }
}
