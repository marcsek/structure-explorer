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
  error = false,
): BipartiteNodeType => {
  return {
    id: `${origin === "domain" ? "d" : "r"}-${id}`,
    type: "predicate",
    position: { x: Infinity, y: Infinity },
    data: { label: id, origin, error },
    connectable: origin === "domain" ? undefined : false,
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
  init(domain, predicate, type) {
    const iP = predicate.intr;

    const initiallySelected =
      type === "function"
        ? [...new Set(domain.flat())]
        : [...new Set(iP.flat())];

    const graph: BipartiteGraphState = {
      nodes: [],
      edges: [],
      selectedPreds: [],
      selectedNodes: initiallySelected,
    };

    domain.forEach((domElement) => {
      const hidden = !graph.selectedNodes.includes(domElement);
      const error =
        type === "function" &&
        iP.filter(([d]) => d === domElement).length !== 1;

      graph.nodes.push(createNode(domElement, "domain", hidden, error));
      graph.nodes.push(createNode(domElement, "range", hidden));
    });

    graph.nodes = layoutNodes(graph.nodes);

    iP.forEach(([source, target]) => {
      graph.edges.push(createEdge(source, target));
    });

    return graph;
  },

  syncNodes(prev, domain, tupleType) {
    const nodeById = new Map(
      prev.nodes.map((n) => [
        n.id,
        // need to reset leftOver state
        { ...n, data: { ...n.data, leftOver: false } },
      ]),
    );

    const initiallyHidden = tupleType !== "function";

    const shouldError = (id: string) =>
      prev.edges.filter((e) => e.source.slice("d-".length) === id).length !==
        1 && tupleType === "function";

    const newNodes = domain.flatMap((element) => [
      nodeById.get(`d-${element}`) ??
        createNode(element, "domain", initiallyHidden, shouldError(element)),
      nodeById.get(`r-${element}`) ??
        createNode(element, "range", initiallyHidden),
    ]);

    const hasConnectingEdge = (nodeId: string) =>
      prev.edges.some(
        ({ source, target }) =>
          [source, target].includes(`d-${nodeId}`) ||
          [source, target].includes(`r-${nodeId}`),
      );

    const leftOverNodes = prev.nodes
      .filter(
        (node) =>
          !domain.includes(node.id.slice("d-".length)) &&
          hasConnectingEdge(node.id.slice("d-".length)),
      )
      .map((node) => ({ ...node, data: { ...node.data, leftOver: true } }));

    const allNodes = [...newNodes, ...leftOverNodes];

    const selectedNodes = allNodes
      .filter((node) => !node.hidden)
      .map((node) => node.id.slice("d-".length));

    return { ...prev, nodes: layoutNodes(allNodes), selectedNodes };
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

  syncPredIntr(prev, intr, tupleType) {
    const edgeById = new Map(prev.edges.map((e) => [e.id, e]));

    let newNodes = prev.nodes;
    const newEdges = intr.map(
      ([from, to]) => edgeById.get(`eg-${from}->${to}`) ?? createEdge(from, to),
    );

    newNodes = prev.nodes.filter(
      (n) =>
        !n.data.leftOver ||
        newEdges.some(
          ({ source, target }) =>
            [source, target].includes(`d-${n.id.slice("d-".length)}`) ||
            [source, target].includes(`r-${n.id.slice("d-".length)}`),
        ),
    );

    if (tupleType === "function") {
      const shouldError = (id: string) =>
        intr.filter(([from]) => from === id).length !== 1;

      newNodes = prev.nodes.map((node) =>
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
    return state.edges.map(({ source, target }) => [
      source.slice("d-".length),
      target.slice("r-".length),
    ]);
  },
};
