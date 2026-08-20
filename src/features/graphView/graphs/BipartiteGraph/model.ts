import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { BinaryRelation } from "../common/relations";
import type { TupleType } from "../../../structure/tupleInfo";
import type { Connection, Edge } from "@xyflow/react";
import {
  type ConnectionValidity,
  edgeId,
  GraphModel,
  numberTupleToXYPosition,
  type GraphState,
  type NodeFlags,
  type PositionSeed,
} from "../common/GraphModel";
import type { PredicateNodeType } from "../graphComponents/PredicateNode";

export type OriginSet = "domain" | "range";

export type BipartiteNodeType = PredicateNodeType<{
  origin: OriginSet;
}>;

export interface BipartiteGraphState extends GraphState {
  kind: "bipartite";
  nodes: BipartiteNodeType[];
}

const prefix = { domain: "d-", range: "r-" } as const;

export default class BipartiteGraphModel extends GraphModel<BipartiteGraphState> {
  readonly supportsSelfLoops = false;

  protected empty(): BipartiteGraphState {
    return { kind: "bipartite", nodes: [], edges: [] };
  }

  protected elementOf(id: string) {
    return id.slice(prefix.domain.length);
  }

  private originOf(id: string): OriginSet {
    return id.startsWith(prefix.domain) ? "domain" : "range";
  }

  protected createEdge(
    from: string,
    to: string,
    { duplicate = false, error = false } = {},
  ): DirectEdgeType {
    return {
      id: edgeId(from, to, duplicate),
      source: `${prefix.domain}${from}`,
      target: `${prefix.range}${to}`,
      data: { duplicate, error },
    };
  }

  protected createNodes(
    element: string,
    { leftover = false, error = false }: NodeFlags,
    seed?: PositionSeed,
  ): BipartiteNodeType[] {
    const create = (origin: OriginSet): BipartiteNodeType => {
      const id = `${prefix[origin]}${element}`;
      const imported = seed?.positions?.[id];

      return {
        id,
        type: "predicate",
        position: imported
          ? numberTupleToXYPosition(imported)
          : { x: Infinity, y: Infinity },
        data: {
          label: element,
          origin,
          error: origin === "domain" ? error : false,
          leftover,
        },
        connectable: origin === "domain" ? undefined : false,
        deletable: false,
      };
    };

    return [create("domain"), create("range")];
  }

  syncPredIntr(
    prev: BipartiteGraphState,
    relation: BinaryRelation<string>,
    tupleType: TupleType,
  ): BipartiteGraphState {
    const graph = super.syncPredIntr(prev, relation, tupleType);

    return {
      ...graph,
      nodes: graph.nodes.map((node) =>
        node.data.origin === "domain"
          ? node
          : { ...node, data: { ...node.data, error: false } },
      ),
    };
  }

  filterEdgesToShow(state: BipartiteGraphState) {
    return state.edges;
  }

  validateConnection(
    edges: DirectEdgeType[],
    connection: Connection | Edge,
  ): ConnectionValidity {
    const duplicate = edges.some(
      (edge) =>
        connection.source === edge.source && connection.target === edge.target,
    );

    if (duplicate) return [false, "Edge already exists."];

    if (this.originOf(connection.source) === this.originOf(connection.target))
      return [false, "Only edges from domain to range nodes are valid."];

    return [true];
  }
}
