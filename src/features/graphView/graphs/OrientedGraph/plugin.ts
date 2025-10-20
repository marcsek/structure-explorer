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
  {
    hidden = false,
    leftover = false,
  }: { hidden?: boolean; leftover?: boolean } = {},
): PredicateNodeType => {
  return {
    id: id,
    type: "predicate",
    position: { x: 0, y: 0 },
    data: { label: id, leftover },
    hidden,
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
        createNode(domElement, {
          hidden: !graph.selectedNodes.includes(domElement),
        }),
      ),
    );

    const presentIds = new Set();
    iP.forEach(([from, to]) => {
      let edgeId = `eg-${from}->${to}`;

      if (!presentIds.has(edgeId)) {
        presentIds.add(edgeId);
        graph.edges.push(createEdge(from, to));
        return;
      }

      edgeId += "-duplicate";
      if (!presentIds.has(edgeId)) {
        presentIds.add(edgeId);
        graph.edges.push(createEdge(from, to, true));
      }
    });

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

    const newNodes = domain.map(
      (element) =>
        nodeById.get(element) ?? createNode(element, { hidden: true }),
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
        hidden: false,
      }));

    //leftoverNodes.forEach((node) => {
    //  const connecting = connectingEdges(node.id);
    //  newNodes = newNodes.map((newNode) =>
    //    connecting.has(newNode.id) ? { ...newNode, hidden: false } : newNode,
    //  );
    //});

    const allNodes = [...newNodes, ...leftoverNodes];

    const selectedNodes = allNodes
      .filter((node) => !node.hidden)
      .map((node) => node.id);

    return { ...prev, nodes: allNodes, selectedNodes };
  },

  hideNodes(prev, toggledNode, relevantNodes) {
    let selected = [...prev.selectedNodes];

    if (toggledNode === "") selected = prev.nodes.map((node) => node.id);
    else if (selected.includes(toggledNode))
      selected = selected.filter((pred) => pred != toggledNode);
    else if (toggledNode !== "none") selected.push(toggledNode);

    let newRelevantNodes = selected;
    if (relevantNodes.length > 0)
      newRelevantNodes = selected.filter((node) =>
        relevantNodes.includes(node),
      );

    const newNodes = prev.nodes.map((node) => ({
      ...node,
      hidden: !newRelevantNodes.includes(node.id),
    }));

    return { ...prev, nodes: newNodes, selectedNodes: selected };
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

  edgesToRelation(state) {
    return state.edges.map(({ source, target }) => [source, target]);
  },

  deleteLeftover(state, deleted) {
    const newNodes = state.nodes.filter((node) => node.id !== deleted);

    const newEdges = state.edges.filter(
      ({ source, target }) => source !== deleted && target !== deleted,
    );

    return { nodes: newNodes, edges: newEdges };
  },
};
