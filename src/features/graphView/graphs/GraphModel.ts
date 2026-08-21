import type { Connection, Edge } from "@xyflow/react";
import type { DirectEdgeType } from "../canvas/edges/DirectEdge";
import type { PredicateNodeType } from "../canvas/nodes/PredicateNode";
import type { TupleType } from "../../structure/tupleInfo";
import { edgeId, type BinaryRelation, type PositionSeed } from "./utils";

export type NodeFlags = { leftover?: boolean; error?: boolean };

export type GraphState = {
  nodes: PredicateNodeType[];
  edges: DirectEdgeType[];
  didLayout?: boolean;
};

type NodeOf<S extends GraphState> = S["nodes"][number];

export type ConnectionValidity = [valid: boolean, error?: string];

export abstract class GraphModel<S extends GraphState> {
  readonly supportsSelfLoops: boolean = true;

  isCompatible(_tupleType: TupleType): boolean {
    return true;
  }

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

  abstract filterEdgesToShow(
    state: S,
    selectedNodes: string[],
    relevantNodes?: string[],
  ): DirectEdgeType[];

  visibleEdgesToRelation(
    _state: S,
    visibleEdges: DirectEdgeType[],
  ): BinaryRelation<string> {
    return this.relationOf(visibleEdges);
  }

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

    if (!this.isCompatible(tupleType)) return graph;

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

    const newNodes = domain.flatMap((element) => {
      const error = shouldError(element);

      return this.createNodes(element, { error }, seed).map((node) => {
        const existing = nodeById.get(node.id);
        return existing
          ? { ...existing, data: { ...existing.data, error } }
          : node;
      });
    });

    const leftoverNodes = prev.nodes
      .filter(
        (node) =>
          !domain.includes(this.elementOf(node.id)) &&
          this.hasConnection(prev.edges, this.elementOf(node.id)),
      )
      .map((node) => ({ ...node, data: { ...node.data, leftover: true } }));

    return { ...prev, nodes: [...newNodes, ...leftoverNodes] };
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

    if (tupleType === "function" && this.isCompatible("function")) {
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
    hovered?: ReadonlySet<string>,
  ): S["nodes"] {
    const elementOf = (node: NodeOf<S>) => this.elementOf(node.id);

    const relevantNodesWithHovered = [
      ...(relevantNodes ?? selectedNodes),
      ...(hovered ?? []),
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
      (hovered?.has(elementOf(node)) ?? false);

    const isHatched = (node: NodeOf<S>) =>
      unaryFilterDomain &&
      (hovered?.size ?? 0) !== 0 &&
      !node.data.leftover &&
      selectedNodes.includes(elementOf(node)) &&
      relevantNodes === undefined &&
      hovered !== undefined &&
      !hovered.has(elementOf(node));

    return filteredNodes.map((node) => {
      let nodeData = node.data;
      if (isGhost(node)) nodeData = { ...nodeData, ghost: true };
      else if (isHatched(node)) nodeData = { ...nodeData, hatched: true };

      return {
        ...node,
        data: nodeData,
        selectable:
          nodeData.ghost || nodeData.hatched ? false : node.selectable,
      };
    });
  }

  nodesWithout(state: S, deleted: string): S["nodes"] {
    const element = this.elementOf(deleted);

    return state.nodes.filter((node) => this.elementOf(node.id) !== element);
  }

  edgesWithout(edges: DirectEdgeType[], deleted: string): DirectEdgeType[] {
    const element = this.elementOf(deleted);

    return edges.filter(
      ({ source, target }) =>
        this.elementOf(source) !== element &&
        this.elementOf(target) !== element,
    );
  }

  protected relationOf(edges: DirectEdgeType[]): BinaryRelation<string> {
    return edges.map(({ source, target }) => [
      this.elementOf(source),
      this.elementOf(target),
    ]);
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
          tupleType === "function" &&
          this.isCompatible("function") &&
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
