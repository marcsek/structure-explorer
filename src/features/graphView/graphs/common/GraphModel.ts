import type { Connection, Edge, XYPosition } from "@xyflow/react";
import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { PredicateNodeType } from "../graphComponents/PredicateNode";
import type { BinaryRelation } from "../HasseDiagram/posetHelpers";
import type { TupleType } from "../../../structure/tupleInfo";

export const numberTupleToXYPosition = ([x, y]: [
  number,
  number,
]): XYPosition => ({ x, y });

export type NodeFlags = { leftover?: boolean; error?: boolean };

export type PositionSeed = {
  positions?: Record<string, [number, number]>;
  didLayout?: boolean;
};

export const scatteredSeedPosition = (
  id: string,
  seed?: PositionSeed,
): XYPosition => {
  const imported = seed?.positions?.[id];
  if (imported) return numberTupleToXYPosition(imported);

  if (!seed?.didLayout) return { x: 0, y: 0 };

  const min = -150;
  const max = 150;
  const random = () => Math.floor(Math.random() * (max - min + 1)) + min;

  return { x: random(), y: random() };
};

export type GraphState = {
  nodes: PredicateNodeType[];
  edges: DirectEdgeType[];
  didLayout?: boolean;
  warning?: string;
};

type NodeOf<S extends GraphState> = S["nodes"][number];

// Valid connection, or invalid with an optional reason to show as a warning.
export type ConnectionValidity = [valid: boolean, error?: string];

export const edgeId = (from: string, to: string, duplicate = false) =>
  `eg-${from}->${to}${duplicate ? "-duplicate" : ""}`;

export abstract class GraphModel<S extends GraphState> {
  protected readonly representsFunctions: boolean = true;
  protected readonly persistentLayout?: (
    nodes: NodeOf<S>[],
    dragging?: string[],
  ) => NodeOf<S>[];

  protected abstract empty(): S;

  protected abstract createNodes(
    element: string,
    flags: NodeFlags,
    seed?: PositionSeed,
  ): NodeOf<S>[];

  protected abstract createEdge(
    from: string,
    to: string,
    flags?: { duplicate?: boolean; error?: boolean },
  ): DirectEdgeType;

  protected elementOf(id: string): string {
    return id;
  }

  private laidOut(nodes: NodeOf<S>[], dragging?: string[]): NodeOf<S>[] {
    return this.persistentLayout?.(nodes, dragging) ?? nodes;
  }

  abstract filterEdgesToShow(
    state: S,
    selectedNodes: string[],
    relevantNodes?: string[],
  ): DirectEdgeType[];

  abstract edgesToRelation(
    state: S,
    edges: DirectEdgeType[],
    relevantEdges?: [string, string][],
  ): [BinaryRelation<string>, DirectEdgeType[]];

  abstract validateConnection(
    edges: DirectEdgeType[],
    connection: Connection | Edge,
  ): ConnectionValidity;

  init(
    domain: string[],
    predicate: { name: string; intr: BinaryRelation<string> },
    tupleType: TupleType,
    positions?: Record<string, [number, number]>,
  ): S {
    const relation = predicate.intr;
    const graph: S = { ...this.empty(), didLayout: !!positions };

    if (tupleType === "function" && !this.representsFunctions) return graph;

    const seed: PositionSeed = { positions };

    graph.nodes = domain.flatMap((element) => {
      const error =
        tupleType === "function" &&
        relation.filter(([d]) => d === element).length !== 1;

      return this.createNodes(element, { error }, seed);
    });

    graph.edges = this.buildEdges(relation, tupleType);

    const leftovers = new Set(
      relation.flat().filter((element) => !domain.includes(element)),
    );

    leftovers.forEach((element) =>
      graph.nodes.push(
        ...this.createNodes(element, { leftover: true, error: false }),
      ),
    );

    graph.nodes = this.laidOut(graph.nodes);

    return graph;
  }

  syncNodes(prev: S, domain: string[], tupleType: TupleType): S {
    const nodeById = new Map(
      prev.nodes.map((node) => [
        node.id,
        // need to reset leftover state
        { ...node, data: { ...node.data, leftover: false } },
      ]),
    );

    const seed: PositionSeed = { didLayout: prev.didLayout };

    const shouldError = (element: string) =>
      tupleType === "function" &&
      prev.edges.filter((e) => this.elementOf(e.source) === element).length !==
        1;

    const newNodes = domain.flatMap((element) =>
      this.createNodes(element, { error: shouldError(element) }, seed).map(
        (node) => nodeById.get(node.id) ?? node,
      ),
    );

    const leftoverNodes = prev.nodes
      .filter(
        (node) =>
          !domain.includes(this.elementOf(node.id)) &&
          this.hasConnection(prev.edges, this.elementOf(node.id)),
      )
      .map((node) => ({ ...node, data: { ...node.data, leftover: true } }));

    return { ...prev, nodes: this.laidOut([...newNodes, ...leftoverNodes]) };
  }

  syncPredIntr(
    prev: S,
    relation: BinaryRelation<string>,
    tupleType: TupleType,
  ) {
    const newEdges = this.buildEdges(
      relation,
      tupleType,
      new Map(prev.edges.map((e) => [e.id, e])),
    );

    const known = new Set(prev.nodes.map((node) => this.elementOf(node.id)));
    const extraElements = new Set(
      relation.flat().filter((element) => !known.has(element)),
    );

    let newNodes = [...prev.nodes];
    extraElements.forEach((element) =>
      newNodes.push(...this.createNodes(element, { leftover: true })),
    );

    newNodes = newNodes.filter(
      (node) =>
        !node.data.leftover ||
        this.hasConnection(newEdges, this.elementOf(node.id)),
    );

    if (tupleType === "function" && this.representsFunctions) {
      const invalid = (element: string) =>
        relation.filter(([from]) => from === element).length !== 1;

      newNodes = newNodes.map((node) => ({
        ...node,
        data: { ...node.data, error: invalid(this.elementOf(node.id)) },
      }));
    }

    return { ...prev, edges: newEdges, nodes: newNodes };
  }

  filterNodesToShow(
    nodes: S["nodes"],
    unaryFilterDomain: boolean,
    selectedNodes: string[],
    relevantNodes?: string[],
    hoveredPredicateIntr?: string[][],
  ): S["nodes"] {
    const hovered = hoveredPredicateIntr?.flat();
    const elementOf = (node: NodeOf<S>) => this.elementOf(node.id);

    const relevantNodesWithHovered = [
      ...(relevantNodes ?? selectedNodes),
      ...new Set(hovered ?? []),
    ];

    const filteredNodes = nodes.filter(
      (node) =>
        node.data.leftover ||
        (selectedNodes.includes(elementOf(node)) &&
          (relevantNodesWithHovered.length === 0 ||
            !unaryFilterDomain ||
            relevantNodesWithHovered.includes(elementOf(node)))),
    );

    const isGhost = (node: NodeOf<S>) =>
      !node.data.leftover &&
      selectedNodes.includes(elementOf(node)) &&
      !(relevantNodes?.includes(elementOf(node)) ?? true) &&
      hovered?.includes(elementOf(node));

    const isHatched = (node: NodeOf<S>) =>
      unaryFilterDomain &&
      (hovered?.length ?? 0) !== 0 &&
      !node.data.leftover &&
      selectedNodes.includes(elementOf(node)) &&
      relevantNodes === undefined &&
      hovered &&
      !hovered.includes(elementOf(node));

    const dragging = nodes
      .filter((node) => node.dragging)
      .map((node) => node.id);

    return this.laidOut(
      filteredNodes.map((node) => {
        let nodeData = node.data;
        if (isGhost(node)) nodeData = { ...nodeData, ghost: true };
        else if (isHatched(node)) nodeData = { ...nodeData, hatched: true };

        return {
          ...node,
          data: nodeData,
          selectable:
            nodeData.ghost || nodeData.hatched ? false : node.selectable,
        };
      }),
      dragging,
    );
  }

  deleteLeftover(
    state: S,
    deleted: string,
  ): { nodes: S["nodes"]; edges: DirectEdgeType[] } {
    const element = this.elementOf(deleted);

    return {
      nodes: state.nodes.filter((node) => this.elementOf(node.id) !== element),
      edges: state.edges.filter(
        ({ source, target }) =>
          this.elementOf(source) !== element &&
          this.elementOf(target) !== element,
      ),
    };
  }

  protected buildEdges(
    relation: BinaryRelation<string>,
    tupleType: TupleType,
    existing?: Map<string, DirectEdgeType>,
  ): DirectEdgeType[] {
    const present = new Set<string>();
    const edges: DirectEdgeType[] = [];

    relation.forEach(([from, to]) => {
      const id = edgeId(from, to);

      if (!present.has(id)) {
        present.add(id);

        const error =
          this.representsFunctions &&
          tupleType === "function" &&
          relation.filter(([f]) => f === from).length > 1;

        if (!existing) {
          edges.push(this.createEdge(from, to, { error }));
          return;
        }

        const edge = existing.get(id) ?? this.createEdge(from, to);
        edge.data ??= {};
        edge.data.error = error;
        edges.push({ ...edge, selectable: true });
        return;
      }

      const duplicateId = edgeId(from, to, true);
      if (present.has(duplicateId)) return;

      present.add(duplicateId);
      edges.push(
        existing?.get(duplicateId) ??
          this.createEdge(from, to, { duplicate: true }),
      );

      edges.find((e) => e.id === id)!.selectable = false;
    });

    return edges;
  }

  private hasConnection(edges: DirectEdgeType[], element: string) {
    return edges.some(
      ({ source, target }) =>
        this.elementOf(source) === element ||
        this.elementOf(target) === element,
    );
  }
}
