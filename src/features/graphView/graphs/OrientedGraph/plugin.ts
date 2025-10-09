import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { PredicateNodeType } from "../graphComponents/PredicateNode";
import type { Plugin } from "../plugins";

export type OrientedGraphState = {
  nodes: PredicateNodeType[];
  edges: DirectEdgeType[];
  selectedPreds: string[];
  selectedNodes: string[];
};

const createNode = (
  id: string,
  hidden = false,
  leftOver = false,
): PredicateNodeType => {
  return {
    id: id,
    type: "predicate",
    position: { x: 0, y: 0 },
    data: { label: id, leftOver },
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
  init(domain, predicate, type) {
    const iP = predicate.intr;

    const graph: OrientedGraphState = {
      nodes: [],
      edges: [],
      selectedPreds: [],
      selectedNodes: [...new Set(iP.flat())],
    };

    if (type === "function") return graph;

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
    const nodeById = new Map(
      prev.nodes.map((n) => [
        n.id,
        // need to reset leftOver state
        { ...n, data: { ...n.data, leftOver: false } },
      ]),
    );

    const newNodes = domain.map(
      (element) => nodeById.get(element) ?? createNode(element, true),
    );

    const hasConnectingEdge = (nodeId: string) =>
      prev.edges.some(({ source, target }) =>
        [source, target].includes(nodeId),
      );

    const leftOverNodes = prev.nodes
      .filter((node) => !domain.includes(node.id) && hasConnectingEdge(node.id))
      .map((node) => ({ ...node, data: { ...node.data, leftOver: true } }));

    const allNodes = [...newNodes, ...leftOverNodes];

    const selectedNodes = allNodes
      .filter((node) => !node.hidden)
      .map((node) => node.id);

    return { ...prev, nodes: allNodes, selectedNodes };
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

    const newNodes = prev.nodes.filter(
      (n) =>
        !n.data.leftOver ||
        newEdges.some(
          ({ source, target }) => source === n.id || target === n.id,
        ),
    );

    return { ...prev, edges: newEdges, nodes: newNodes };
  },

  edgesToRelation(state) {
    return state.edges.map(({ source, target }) => [source, target]);
  },
};
