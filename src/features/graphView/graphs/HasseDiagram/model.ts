import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { PredicateNodeType } from "../graphComponents/PredicateNode";
import {
  expandReducedPoset,
  reducePosetRelations,
  staysValidHasseWithEdge,
} from "./posetHelpers";
import type { BinaryRelation } from "../common/relations";
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
import type { TupleType } from "../../../structure/tupleInfo";

export interface HasseDiagramState extends GraphState {
  kind: "hasse";
}

export default class HasseDiagramModel extends GraphModel<HasseDiagramState> {
  isCompatible(tupleType: TupleType): boolean {
    return tupleType === "predicate";
  }

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

    const coversInWhole = reducePosetRelations(this.relationOf(state.edges));
    const coversInVisible = reducePosetRelations(
      this.relationOf(
        state.edges.filter(
          ({ source, target }) =>
            visibleNodes.includes(source) && visibleNodes.includes(target),
        ),
      ),
    );

    const isCover = (
      covers: BinaryRelation<string>,
      { source, target }: DirectEdgeType,
    ) => covers.some(([from, to]) => from === source && to === target);

    return state.edges.flatMap((edge) => {
      if (edge.data?.duplicate || isCover(coversInWhole, edge)) return edge;

      if (!isCover(coversInVisible, edge)) return [];

      return {
        ...edge,
        data: { ...edge.data, helper: true },
        selectable: false,
        selected: false,
      };
    });
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
