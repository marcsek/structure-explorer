import type { DirectEdgeType } from "../graphComponents/DirectEdge";
import type { Plugin } from "../plugins";
import type { BipartiteNodeType } from "./BipartiteGraph";
import { layoutNodes } from "./layout";

export type BipartiteGraphState = {
  nodes: BipartiteNodeType[];
  edges: DirectEdgeType[];
  selectedPreds: string[];
  selectedNodes: string[];
};

const createNode = (
  id: string,
  origin: BipartiteNodeType["data"]["origin"],
  hidden = false,
): BipartiteNodeType => {
  return {
    id: `${origin === "domain" ? "d" : "r"}-${id}`,
    type: "predicate",
    position: { x: 0, y: 0 },
    data: { label: id, origin },
    hidden,
  };
};

const createEdge = (source: string, target: string): DirectEdgeType => {
  return {
    id: `eg-${source}->${target}`,
    source: `d-${source}`,
    target: `r-${target}`,
  };
};

export const bipartiteGraphPlugin: Plugin<"bipartite"> = {
  init(domain, predicate) {
    const iP = predicate.intr;

    const graph: BipartiteGraphState = {
      nodes: [],
      edges: [],
      selectedPreds: [],
      selectedNodes: [...new Set(iP.flat())],
    };

    domain.forEach((domElement) => {
      const hidden = !graph.selectedNodes.includes(domElement);
      graph.nodes.push(createNode(domElement, "domain", hidden));
      graph.nodes.push(createNode(domElement, "range", hidden));
    });

    graph.nodes = layoutNodes(graph.nodes);

    iP.forEach(([source, target]) => {
      graph.edges.push(createEdge(source, target));
    });

    return graph;
  },

  syncNodes(prev, domain) {
    const nodeById = new Map(prev.nodes.map((n) => [n.id, n]));

    const newNodes = domain.flatMap((element) => [
      nodeById.get(`d-${element}`) ?? createNode(element, "domain", true),
      nodeById.get(`r-${element}`) ?? createNode(element, "range", true),
    ]);

    const selectedNodes = newNodes
      .filter((node) => !node.hidden)
      .map((node) => node.id.slice("d-".length));

    return { ...prev, nodes: layoutNodes(newNodes), selectedNodes };
  },

  hideNodes(prev, toggledNode) {
    let selected = [...prev.selectedNodes];
    if (selected.includes(toggledNode))
      selected = selected.filter((pred) => pred != toggledNode);
    else selected.push(toggledNode);

    const newNodes = prev.nodes.map((node) => {
      const hidden = !selected.includes(node.id.slice("d-".length));
      const resetPos = { x: Infinity, y: Infinity };

      return {
        ...node,
        hidden,
        position: hidden ? resetPos : node.position,
      };
    });

    // React Flow doesn't correctly handle hiding edges connecting hidden nodes,
    // so it's done manually in this case. Otherwise it's not needed.
    const newEdges = prev.edges.map((edge) => ({
      ...edge,
      hidden:
        !selected.includes(edge.source.slice("d-".length)) ||
        !selected.includes(edge.target.slice("d-".length)),
    }));

    return {
      ...prev,
      nodes: layoutNodes(newNodes),
      edges: newEdges,
      selectedNodes: selected,
    };
  },

  syncPredIntr(prev, intr) {
    const edgeById = new Map(prev.edges.map((e) => [e.id, e]));

    const newEdges = intr.map(
      ([from, to]) => edgeById.get(`eg-${from}->${to}`) ?? createEdge(from, to),
    );

    return { ...prev, edges: newEdges };
  },

  edgesToRelation(state) {
    return state.edges.map(({ source, target }) => [
      source.slice("d-".length),
      target.slice("r-".length),
    ]);
  },
};
