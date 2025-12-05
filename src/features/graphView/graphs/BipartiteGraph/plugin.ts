import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { BinaryRelation } from "../HasseDiagram/posetHelpers";
import type { Plugin } from "../plugins";
import type { BipartiteNodeType } from "./BipartiteGraph";
import { computeLayoutBipartite } from "./layout";

export type BipartiteGraphState = {
  nodes: BipartiteNodeType[];
  edges: DirectEdgeType[];
  warning?: string;
};

const createNode = (
  id: string,
  origin: BipartiteNodeType["data"]["origin"],
  {
    error = false,
    leftover = false,
  }: { error?: boolean; leftover?: boolean } = {},
): BipartiteNodeType => {
  return {
    id: `${origin === "domain" ? "d" : "r"}-${id}`,
    type: "predicate",
    position: { x: Infinity, y: Infinity },
    data: { label: id, origin, error, leftover },
    connectable: origin === "domain" ? undefined : false,
  };
};

const createEdge = (
  source: string,
  target: string,
  duplicate: boolean = false,
  error: boolean = false,
): DirectEdgeType => {
  return {
    id: `eg-${source}->${target}${duplicate ? "-duplicate" : ""}`,
    source: `d-${source}`,
    target: `r-${target}`,
    data: { duplicate, error },
    selectable: !duplicate && !error,
  };
};

export const bipartiteGraphPlugin: Plugin<"bipartite"> = {
  init(domain, predicate, type) {
    const iP = predicate.intr;

    const graph: BipartiteGraphState = {
      nodes: [],
      edges: [],
    };

    domain.forEach((domElement) => {
      const error =
        type === "function" &&
        iP.filter(([d]) => d === domElement).length !== 1;

      graph.nodes.push(createNode(domElement, "domain", { error }));
      graph.nodes.push(createNode(domElement, "range"));
    });

    const leftovers = new Set(
      iP.flat().filter((element) => !domain.includes(element)),
    );

    leftovers.forEach((element) => {
      graph.nodes.push(
        createNode(element, "domain", {
          error: false,
          leftover: true,
        }),
      );
      graph.nodes.push(
        createNode(element, "range", {
          error: false,
          leftover: true,
        }),
      );
    });

    const presentIds = new Set();
    iP.forEach(([from, to]) => {
      let edgeId = `eg-${from}->${to}`;

      if (!presentIds.has(edgeId)) {
        const shouldError =
          type === "function" && iP.filter(([f]) => f === from).length > 1;

        presentIds.add(edgeId);
        graph.edges.push(createEdge(from, to, false, shouldError));
        return;
      }

      edgeId += "-duplicate";
      if (!presentIds.has(edgeId)) {
        presentIds.add(edgeId);
        graph.edges.push(createEdge(from, to, true));

        const validDuplicate = graph.edges.find(
          (e) => e.id === edgeId.slice(0, -"-duplicate".length),
        )!;
        validDuplicate.selectable = false;
      }
    });

    graph.nodes = computeLayoutBipartite(graph.nodes);

    return graph;
  },

  syncNodes(prev, domain, tupleType) {
    const nodeById = new Map(
      prev.nodes.map((n) => [
        n.id,
        // need to reset leftover state
        { ...n, data: { ...n.data, leftover: false } },
      ]),
    );

    const shouldError = (id: string) =>
      prev.edges.filter((e) => e.source.slice("d-".length) === id).length !==
        1 && tupleType === "function";

    const newNodes = domain.flatMap((element) => [
      nodeById.get(`d-${element}`) ??
        createNode(element, "domain", {
          error: shouldError(element),
        }),
      nodeById.get(`r-${element}`) ?? createNode(element, "range"),
    ]);

    const hasConnectingEdge = (nodeId: string) =>
      prev.edges.some(
        ({ source, target }) =>
          [source, target].includes(`d-${nodeId}`) ||
          [source, target].includes(`r-${nodeId}`),
      );

    const leftoverNodes = prev.nodes
      .filter(
        (node) =>
          !domain.includes(node.id.slice("d-".length)) &&
          hasConnectingEdge(node.id.slice("d-".length)),
      )
      .map((node) => ({
        ...node,
        data: { ...node.data, leftover: true },
      }));

    const allNodes = computeLayoutBipartite([...newNodes, ...leftoverNodes]);

    return { ...prev, nodes: allNodes };
  },

  filterNodesToShow(
    state,
    unaryFilterDomain,
    selectedNodes,
    relevantNodes,
    hoveredPredicateIntr,
  ) {
    const relevantNodesWithHovered = [
      ...(relevantNodes ?? []),
      ...new Set(hoveredPredicateIntr?.flat() ?? []),
    ];

    const filteredNodes = state.nodes.filter(
      (node) =>
        node.data.leftover ||
        (selectedNodes.includes(node.id.slice("d-".length)) &&
          (relevantNodesWithHovered.length === 0 ||
            !unaryFilterDomain ||
            relevantNodesWithHovered?.includes(node.id.slice("d-".length)))),
    );

    const isGhost = (node: BipartiteNodeType) =>
      !node.data.leftover &&
      selectedNodes.includes(node.id.slice("d-".length)) &&
      !(relevantNodes?.includes(node.id.slice("d-".length)) ?? true) &&
      hoveredPredicateIntr?.flat().includes(node.id.slice("d-".length));

    const dragging = state.nodes
      .filter((node) => node.dragging)
      .map((node) => node.id);

    return computeLayoutBipartite(
      filteredNodes.map((node) =>
        isGhost(node)
          ? { ...node, data: { ...node.data, ghost: true }, selectable: false }
          : node,
      ),
      dragging,
    );
  },

  filterEdgesToShow(state) {
    return state.edges;
  },

  toggleNodes(state, node, selectedNodes) {
    let newSelected = [...selectedNodes];
    const allNodes = state.nodes;

    if (node === "")
      newSelected = [
        ...new Set(allNodes.map((node) => node.id.slice("d-".length))),
      ];
    else if (newSelected.includes(node))
      newSelected = newSelected.filter((selectedNode) => selectedNode != node);
    else newSelected.push(node);

    return [state, newSelected];
  },

  syncPredIntr(prev, intr, tupleType) {
    const resetEdges = prev.edges.map((e) => ({
      ...e,
      data: { ...e.data, error: false },
    }));

    const edgeById = new Map(resetEdges.map((e) => [e.id, e]));
    const presentIds = new Set();

    const newEdges: DirectEdgeType[] = [];
    intr.forEach(([from, to]) => {
      let edgeId = `eg-${from}->${to}`;

      if (!presentIds.has(edgeId)) {
        const shouldError =
          tupleType === "function" &&
          intr.filter(([f]) => f === from).length > 1;

        presentIds.add(edgeId);
        const edge = edgeById.get(edgeId) ?? createEdge(from, to);

        edge.data ??= {};
        edge.data.error = shouldError;

        newEdges.push({ ...edge, selectable: true });
        return;
      }

      edgeId += "-duplicate";
      if (!presentIds.has(edgeId)) {
        presentIds.add(edgeId);
        const edge = edgeById.get(edgeId) ?? createEdge(from, to, true);
        newEdges.push(edge);

        const validDuplicate = newEdges.find(
          (e) => e.id === edgeId.slice(0, -"-duplicate".length),
        )!;
        validDuplicate.selectable = false;
      }
    });

    let newNodes = [...prev.nodes];

    const extraElements = intr
      .flat()
      .filter(
        (element) =>
          !prev.nodes.some((node) => node.id.slice("d-".length) === element),
      );

    extraElements.forEach((element) => {
      newNodes.push(createNode(element, "domain", { leftover: true }));
      newNodes.push(createNode(element, "range", { leftover: true }));
    });

    newNodes = newNodes.filter((node) => {
      if (!node.data.leftover) return true;

      const baseId = node.id.slice("d-".length);
      return newEdges.some(
        ({ source, target }) =>
          source === `d-${baseId}` || target === `r-${baseId}`,
      );
    });

    if (tupleType === "function") {
      const shouldError = (id: string) =>
        intr.filter(([from]) => from === id).length !== 1;

      newNodes = newNodes.map((node) =>
        node.data.origin === "domain"
          ? {
              ...node,
              data: {
                ...node.data,
                error: shouldError(node.id.slice("d-".length)),
              },
            }
          : node,
      );
    }

    return { ...prev, edges: newEdges, nodes: newNodes };
  },

  edgesToRelation(state) {
    const relation = state.edges.map(({ source, target }) => [
      source.slice("d-".length),
      target.slice("r-".length),
    ]) as BinaryRelation<string>;

    return [relation, state.edges];
  },

  deleteLeftover(state, deleted) {
    const newNodes = state.nodes.filter(
      (node) => node.id.slice("d-".length) !== deleted.slice("d-".length),
    );

    const baseId = deleted.slice("d-".length);
    const newEdges = state.edges.filter(
      ({ source, target }) =>
        source.slice("d-".length) !== baseId &&
        target.slice("r-".length) !== baseId,
    );

    return { nodes: newNodes, edges: newEdges };
  },
};
