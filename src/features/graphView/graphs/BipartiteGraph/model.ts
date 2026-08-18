import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { BinaryRelation } from "../HasseDiagram/posetHelpers";
import type { TupleType } from "../../../structure/tupleInfo";
import type { BipartiteNodeType, OriginSet } from "./BipartiteGraph";
import { computeLayoutBipartite } from "./layout";
import {
  edgeId,
  GraphModel,
  numberTupleToXYPosition,
  type GraphState,
  type NodeFlags,
  type PositionSeed,
} from "../common/GraphModel";

export interface BipartiteGraphState extends GraphState {
  kind: "bipartite";
  nodes: BipartiteNodeType[];
}

const prefix = { domain: "d-", range: "r-" } as const;

export default class BipartiteGraphModel extends GraphModel<BipartiteGraphState> {
  protected readonly persistentLayout = computeLayoutBipartite;

  protected empty(): BipartiteGraphState {
    return { kind: "bipartite", nodes: [], edges: [] };
  }

  protected elementOf(id: string) {
    return id.slice(prefix.domain.length);
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
      selectable: !duplicate && !error,
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

  edgesToRelation(
    _state: BipartiteGraphState,
    edges: DirectEdgeType[],
  ): [BinaryRelation<string>, DirectEdgeType[]] {
    const relation = edges.map(({ source, target }) => [
      this.elementOf(source),
      this.elementOf(target),
    ]) as BinaryRelation<string>;

    return [relation, edges];
  }
}
