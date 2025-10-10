import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { PredicateNodeType } from "../graphComponents/PredicateNode";
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
  isPoset: boolean;
};

const createNode = (id: string, hidden = false): PredicateNodeType => {
  return {
    id: id,
    type: "predicate",
    position: { x: 0, y: 0 },
    data: { label: id },
    hidden,
  };
};

const createEdge = (source: string, target: string): DirectEdgeType => {
  return {
    id: `eg-${source}->${target}`,
    source,
    target,
  };
};

export const hasseDiagramPlugin: Plugin<"hasse"> = {
  init(domain, predicate, type) {
    const iP = predicate.intr;

    const graph: HasseDiagramState = {
      nodes: [],
      edges: [],
      isPoset: true,
      selectedPreds: [],
      selectedNodes: [...new Set(iP.flat())],
    };

    if (type === "function") return graph;

    if (!isPoset(iP as [string, string][])) {
      graph.isPoset = false;
      return graph;
    }

    domain.forEach((domElement) =>
      graph.nodes.push(
        createNode(domElement, !graph.selectedNodes.includes(domElement)),
      ),
    );

    const hasseEdges = reducePosetRelations(iP);
    hasseEdges.forEach(([source, target]) =>
      graph.edges.push(createEdge(source, target)),
    );

    return graph;
  },

  syncNodes(prev, domain) {
    const nodeById = new Map(prev.nodes.map((n) => [n.id, n]));

    const newNodes = domain.map(
      (element) => nodeById.get(element) ?? createNode(element, true),
    );

    const selectedNodes = newNodes
      .filter((node) => !node.hidden)
      .map((node) => node.id);

    return { ...prev, nodes: newNodes, selectedNodes };
  },

  hideNodes(prev, toggledNode) {
    let selected = [...prev.selectedNodes];
    if (selected.includes(toggledNode))
      selected = selected.filter((pred) => pred != toggledNode);
    else selected.push(toggledNode);

    const newNodes = prev.nodes.map((node) => ({
      ...node,
      hidden: !selected.includes(node.id),
    }));

    return { ...prev, nodes: newNodes, selectedNodes: selected };
  },

  syncPredIntr(prev, intr) {
    let newIntr = [...intr];
    const poset = isPoset(newIntr);

    if (poset) newIntr = reducePosetRelations(newIntr);
    else return { ...prev, isPoset: poset };

    const edgeById = new Map(prev.edges.map((e) => [e.id, e]));

    const newEdges = newIntr.map(
      ([from, to]) => edgeById.get(`eg-${from}->${to}`) ?? createEdge(from, to),
    );

    const selectedNodeIds = [...new Set(intr.flat())];
    const newNodes = prev.nodes.map((node) => ({
      ...node,
      hidden: !selectedNodeIds.includes(node.id),
    }));

    return {
      ...prev,
      edges: newEdges,
      isPoset: poset,
      nodes: newNodes,
      selectedNodes: selectedNodeIds,
    };
  },

  edgesToRelation(state) {
    const relation = state.edges.map(({ source, target }) => [
      source,
      target,
    ]) as BinaryRelation<string>;

    const domain = state.nodes.map((node) => node.id);
    return expandReducedPoset(relation, new Set(domain));
  },

  deleteLeftover(state) {
    // TODO
    return { nodes: state.nodes, edges: state.edges };
  },
};
