export type CaseTreeBranch =
  { type: "value"; value: string } | { type: "ref"; nodeId: string };

export interface CaseTreeCase {
  match: string;
  branch: CaseTreeBranch;
}

export interface CaseTreeNode {
  variable: string;
  cases: CaseTreeCase[];
  default?: CaseTreeBranch;
}

export interface CaseTreeEntry {
  rootId: string;
  nodes: Record<string, CaseTreeNode>;
}

export const rootNodeId = "root";

// WARNING Trees saved by older versions mix id formats (n{number} vs. n-{number}), so
// be careful when modifing this function.
export function getNextNodeId(nodes: Record<string, CaseTreeNode>) {
  let i = 1;
  while (`n${i}` in nodes) i++;

  return `n${i}`;
}

export const intervalVariables = ["x", "y", "z", "u", "v", "w", "r", "s", "t"];

export function parseMatch(match: string) {
  return match
    .trim()
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s);
}

export function getSubtreeNodeIds(
  rootId: string,
  nodes: Record<string, CaseTreeNode>,
) {
  const nodeStack = [nodes[rootId]];
  const foundIds = new Set([rootId]);

  while (nodeStack.length > 0) {
    const node = nodeStack.pop();
    if (!node) continue;

    const branches = [...node.cases.map((c) => c.branch)];
    if (node.default) branches.push(node.default);

    for (const branch of branches) {
      if (branch.type === "value" || foundIds.has(branch.nodeId)) continue;

      foundIds.add(branch.nodeId);

      nodeStack.push(nodes[branch.nodeId]);
    }
  }

  return foundIds;
}

export function copyTree(tree: CaseTreeEntry): CaseTreeEntry {
  const nodes = Object.fromEntries(
    Object.entries(tree.nodes).map(([k, node]) => [k, copyNode(node)]),
  );

  return { rootId: tree.rootId, nodes };
}

export function copyNode(node: CaseTreeNode): CaseTreeNode {
  const casesCopy = node.cases.map((c) => ({ ...c, branch: { ...c.branch } }));

  return {
    ...node,
    cases: casesCopy,
    default: node.default ? { ...node.default } : undefined,
  };
}
