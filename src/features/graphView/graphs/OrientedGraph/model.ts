import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { PredicateNodeType } from "../graphComponents/PredicateNode";
import type { BinaryRelation } from "../HasseDiagram/posetHelpers";
import {
  edgeId,
  GraphModel,
  type NodeFlags,
  scatteredSeedPosition,
  type GraphState,
  type PositionSeed,
} from "../common/GraphModel";

export interface OrientedGraphState extends GraphState {
  kind: "oriented";
}

export default class OrientedGraphModel extends GraphModel<OrientedGraphState> {
  protected empty(): OrientedGraphState {
    return { kind: "oriented", nodes: [], edges: [] };
  }

  protected createNodes(
    element: string,
    { leftover = false, error = false }: NodeFlags,
    seed?: PositionSeed,
  ): PredicateNodeType[] {
    return [
      {
        id: element,
        type: "predicate",
        position: scatteredSeedPosition(element, seed),
        data: { label: element, leftover, error },
        deletable: false,
      },
    ];
  }

  protected createEdge(
    from: string,
    to: string,
    { duplicate = false, error = false } = {},
  ): DirectEdgeType {
    return {
      id: edgeId(from, to, duplicate),
      source: from,
      target: to,
      data: { duplicate, error },
      selectable: !duplicate && !error,
    };
  }

  filterEdgesToShow(state: OrientedGraphState) {
    return state.edges;
  }

  edgesToRelation(
    _state: OrientedGraphState,
    edges: DirectEdgeType[],
  ): [BinaryRelation<string>, DirectEdgeType[]] {
    const relation = edges.map(({ source, target }) => [
      source,
      target,
    ]) as BinaryRelation<string>;

    return [relation, edges];
  }
}
