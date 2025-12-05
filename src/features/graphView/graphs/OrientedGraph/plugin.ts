import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { PredicateNodeType } from "../graphComponents/PredicateNode";
import type { BinaryRelation } from "../HasseDiagram/posetHelpers";
import type { Plugin } from "../plugins";

export type OrientedGraphState = {
  nodes: PredicateNodeType[];
  edges: DirectEdgeType[];
  warning?: string;
};

const createNode = (
  id: string,
  {
    leftover = false,
    error = false,
  }: { leftover?: boolean; error?: boolean } = {},
): PredicateNodeType => {
  return {
    id: id,
    type: "predicate",
    position: { x: 0, y: 0 },
    data: { label: id, leftover, error },
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
    source,
    target,
    data: { duplicate, error },
    selectable: !duplicate && !error,
  };
};

export const orientedGraphPlugin: Plugin<"oriented"> = {
  init(domain, predicate, type) {
    const iP = predicate.intr;

    const graph: OrientedGraphState = {
      nodes: [],
      edges: [],
    };

    domain.forEach((domElement) => {
      const error =
        type === "function" &&
        iP.filter(([d]) => d === domElement).length !== 1;

      graph.nodes.push(createNode(domElement, { error }));
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

    const extraElements = iP
      .flat()
      .filter((element) => !domain.includes(element));

    extraElements.forEach((element) =>
      graph.nodes.push(createNode(element, { leftover: true, error: false })),
    );

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
      tupleType === "function" &&
      prev.edges.filter((e) => e.source === id).length !== 1;

    const newNodes = domain.map(
      (element) =>
        nodeById.get(element) ??
        createNode(element, { error: shouldError(element) }),
    );

    const connectingEdges = (nodeId: string) =>
      new Set(
        prev.edges
          .filter(({ source, target }) => [source, target].includes(nodeId))
          .flatMap(({ source, target }) => [source, target]),
      );

    const leftoverNodes = prev.nodes
      .filter(
        (node) =>
          !domain.includes(node.id) && connectingEdges(node.id).size > 0,
      )
      .map((node) => ({
        ...node,
        data: { ...node.data, leftover: true },
      }));

    const allNodes = [...newNodes, ...leftoverNodes];

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
        (selectedNodes.includes(node.id) &&
          (relevantNodesWithHovered.length === 0 ||
            !unaryFilterDomain ||
            relevantNodesWithHovered?.includes(node.id))),
    );

    const isGhost = (node: PredicateNodeType) =>
      !node.data.leftover &&
      selectedNodes.includes(node.id) &&
      !(relevantNodes?.includes(node.id) ?? true) &&
      hoveredPredicateIntr?.flat().includes(node.id);

    const d = filteredNodes.map((node) =>
      isGhost(node)
        ? { ...node, data: { ...node.data, ghost: true }, selectable: false }
        : node,
    );
    return d;
  },

  filterEdgesToShow(state) {
    return state.edges;
  },

  toggleNodes(state, node, selectedNodes) {
    let newSelected = [...selectedNodes];
    const allNodes = state.nodes;

    if (node === "") newSelected = allNodes.map((node) => node.id);
    else if (newSelected.includes(node))
      newSelected = newSelected.filter((selectedNode) => selectedNode != node);
    else newSelected.push(node);

    return [state, newSelected];
  },

  syncPredIntr(prev, intr, tupleType) {
    const edgeById = new Map(prev.edges.map((e) => [e.id, e]));
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
      .filter((element) => !prev.nodes.some((node) => node.id === element));

    extraElements.forEach((element) =>
      newNodes.push(createNode(element, { leftover: true })),
    );

    newNodes = newNodes.filter(
      (node) =>
        !node.data.leftover ||
        newEdges.some(
          ({ source, target }) => source === node.id || target === node.id,
        ),
    );

    if (tupleType === "function") {
      const shouldError = (id: string) =>
        intr.filter(([from]) => from === id).length !== 1;

      newNodes = newNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          error: shouldError(node.id),
        },
      }));
    }

    return { ...prev, edges: newEdges, nodes: newNodes };
  },

  edgesToRelation(state) {
    const relation = state.edges.map(({ source, target }) => [
      source,
      target,
    ]) as BinaryRelation<string>;

    return [relation, state.edges];
  },

  deleteLeftover(state, deleted) {
    const newNodes = state.nodes.filter((node) => node.id !== deleted);

    const newEdges = state.edges.filter(
      ({ source, target }) => source !== deleted && target !== deleted,
    );

    return { nodes: newNodes, edges: newEdges };
  },
};
