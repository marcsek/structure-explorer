import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { PredicateNodeType } from "../graphComponents/PredicateNode";
import { edgesToRelation as convertEdgesToRelation } from "../graphSlice";
import type { Plugin } from "../plugins";
import {
  expandReducedPoset,
  isPoset,
  reducePosetRelations,
  type BinaryRelation,
} from "./posetHelpers";

export type HasseDiagramState = {
  nodes: PredicateNodeType[];
  edges: DirectEdgeType[];
  selectedPreds: string[];
  selectedNodes: string[];
};

const createNode = (
  id: string,
  { leftover = false }: { leftover?: boolean } = {},
): PredicateNodeType => {
  return {
    id: id,
    type: "predicate",
    position: { x: 0, y: 0 },
    data: { label: id, leftover },
  };
};

const createEdge = (
  source: string,
  target: string,
  duplicate: boolean = false,
): DirectEdgeType => {
  return {
    id: `eg-${source}->${target}${duplicate ? "-duplicate" : ""}`,
    source,
    target,
    data: { duplicate },
  };
};

export const hasseDiagramPlugin: Plugin<"hasse"> = {
  init(domain, predicate, type) {
    const iP = predicate.intr;

    const graph: HasseDiagramState = {
      nodes: [],
      edges: [],
      selectedPreds: [],
      selectedNodes: [...new Set(domain.flat())],
    };

    if (type === "function") return graph;

    if (!isPoset(iP as [string, string][])) return graph;

    domain.forEach((domElement) => graph.nodes.push(createNode(domElement)));

    iP.forEach(([source, target]) =>
      graph.edges.push(createEdge(source, target)),
    );

    const extraElements = iP
      .flat()
      .filter((element) => !domain.includes(element));

    extraElements.forEach((element) =>
      graph.nodes.push(createNode(element, { leftover: true })),
    );

    return graph;
  },

  syncNodes(prev, domain) {
    const nodeById = new Map(
      prev.nodes.map((n) => [
        n.id,
        // need to reset leftover state
        { ...n, data: { ...n.data, leftover: false } },
      ]),
    );

    const prevDomain = prev.nodes.map((node) => node.id);
    const addedElements = domain.filter(
      (element) => !prevDomain.includes(element),
    );

    const newNodes = domain.map(
      (element) => nodeById.get(element) ?? createNode(element),
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
    const selectedNodes = [...prev.selectedNodes, ...addedElements].filter(
      (node) => domain.includes(node),
    );

    return { ...prev, nodes: allNodes, selectedNodes };
  },

  filterNodesToShow(state, relevantNodes, hoveredPredicateIntr) {
    const selected = [...state.selectedNodes];

    const relevantNodesWithHovered = [
      ...(relevantNodes ?? []),
      ...(hoveredPredicateIntr ?? []),
    ];

    const filteredNodes = state.nodes.filter(
      (node) =>
        node.data.leftover ||
        (selected.includes(node.id) &&
          (relevantNodesWithHovered.length === 0 ||
            relevantNodesWithHovered?.includes(node.id))),
    );

    const isGhost = (node: PredicateNodeType) =>
      !node.data.leftover &&
      selected.includes(node.id) &&
      !(relevantNodes?.includes(node.id) ?? true) &&
      hoveredPredicateIntr?.includes(node.id);

    return filteredNodes.map((node) =>
      isGhost(node)
        ? { ...node, data: { ...node.data, ghost: true }, selectable: false }
        : node,
    );
  },

  filterEdgesToShow(state, relevantNodes) {
    const selected = [...state.selectedNodes];

    const filteredNodes = state.nodes
      .filter(
        (node) =>
          node.data.leftover ||
          (selected.includes(node.id) &&
            (relevantNodes?.includes(node.id) ?? true)),
      )
      .map((node) => node.id);

    const filteredRelation = convertEdgesToRelation(
      state.edges.filter(
        ({ source, target }) =>
          filteredNodes.includes(source) && filteredNodes.includes(target),
      ),
    );

    const reducedRelation = reducePosetRelations(filteredRelation);

    return state.edges.filter(
      ({ source, target, data }) =>
        data?.duplicate ||
        reducedRelation.some(([from, to]) => source === from && target === to),
    );
  },

  toggleNodes(state, node) {
    let newSelected = [...state.selectedNodes];
    const allNodes = state.nodes;

    if (node === "") newSelected = allNodes.map((node) => node.id);
    else if (newSelected.includes(node))
      newSelected = newSelected.filter((selectedNode) => selectedNode != node);
    else newSelected.push(node);

    return { ...state, selectedNodes: newSelected };
  },

  syncPredIntr(prev, intr) {
    const edgeById = new Map(prev.edges.map((e) => [e.id, e]));
    const presentIds = new Set();

    const newEdges: DirectEdgeType[] = [];
    intr.forEach(([from, to]) => {
      let edgeId = `eg-${from}->${to}`;

      if (!presentIds.has(edgeId)) {
        presentIds.add(edgeId);
        const edge = edgeById.get(edgeId) ?? createEdge(from, to);
        newEdges.push(edge);
        return;
      }

      edgeId += "-duplicate";
      if (!presentIds.has(edgeId)) {
        presentIds.add(edgeId);
        const edge = edgeById.get(edgeId) ?? createEdge(from, to, true);
        newEdges.push(edge);
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

    return { ...prev, edges: newEdges, nodes: newNodes };
  },

  edgesToRelation(state, relevantEdges) {
    const relevantRelation = convertEdgesToRelation(
      state.edges.filter(({ source, target }) =>
        relevantEdges?.some(([from, to]) => source === from && target === to),
      ),
    );

    const domain = new Set(state.nodes.map((node) => node.id));
    const expanded = expandReducedPoset(relevantRelation, domain);
    const relevantExpanded = expandReducedPoset(
      relevantEdges ?? ([] as BinaryRelation<string>),
      domain,
    );

    const notInExpanded = convertEdgesToRelation(
      state.edges.filter(
        ({ source, target, data }) =>
          (!expanded.some(([from, to]) => source === from && target === to) &&
            !relevantExpanded?.some(
              ([from, to]) => source === from && target === to,
            )) ||
          data?.duplicate,
      ),
    );

    const relation = [...expanded, ...notInExpanded];

    const relationSyncedEdges = state.edges.filter(({ source, target }) =>
      relation.some(([from, to]) => source === from && target === to),
    );

    return [relation, relationSyncedEdges];
  },

  deleteLeftover(state, deleted) {
    const newNodes = state.nodes.filter((node) => node.id !== deleted);

    const newEdges = state.edges.filter(
      ({ source, target }) => source !== deleted && target !== deleted,
    );

    return { nodes: newNodes, edges: newEdges };
  },
};
