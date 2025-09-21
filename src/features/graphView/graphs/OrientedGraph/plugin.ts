import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { PredicateNodeType } from "../graphComponents/PredicateNode";
import type { Plugin } from "../plugins";

export type OrientedGraphState = {
  nodes: PredicateNodeType[];
  edges: DirectEdgeType[];
  selectedPreds: string[];
  selectedNodes: string[];
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

export const orientedGraphPlugin: Plugin<"oriented"> = {
  init(domain, predicate) {
    const iP = predicate.intr;

    const graph: OrientedGraphState = {
      nodes: [],
      edges: [],
      selectedPreds: [],
      selectedNodes: [...new Set(iP.flat())],
    };

    domain.forEach((domElement) =>
      graph.nodes.push(
        createNode(domElement, !graph.selectedNodes.includes(domElement)),
      ),
    );

    iP.forEach(([source, target]) =>
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
    const edgeById = new Map(prev.edges.map((e) => [e.id, e]));

    const newEdges = intr.map(
      ([from, to]) => edgeById.get(`eg-${from}->${to}`) ?? createEdge(from, to),
    );

    return { ...prev, edges: newEdges };
  },

  edgesToRelation(state) {
    return state.edges.map(({ source, target }) => [source, target]);
  },
};
