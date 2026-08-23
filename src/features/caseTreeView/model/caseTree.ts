import type { CaseTreeNode } from "../caseTreeViewSlice";

export const intervalVariables = ["x", "y", "z", "u", "v", "w", "r", "s", "t"];

export function parseMatch(match: string) {
  return match
    .trim()
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s);
}

export function getSubstreeNodeIds(
  rootId: string,
  nodes: Record<string, CaseTreeNode>,
) {
  const nodeStack = [nodes[rootId]];
  const foundIds = new Set([rootId]);

  while (nodeStack.length > 0) {
    const node = nodeStack.pop()!;

    const branches = [...node.cases.map((c) => c.branch)];
    if (node.default) branches.push(node.default);

    for (const branch of branches) {
      if (branch.type === "value") continue;

      foundIds.add(branch.nodeId);

      nodeStack.push(nodes[branch.nodeId]);
    }
  }

  return foundIds;
}

export function getNextNodeId(nodes: Record<string, CaseTreeNode>) {
  const ids = new Set(Object.keys(nodes));

  let i = 1;
  while (ids.has(`n-${i}`)) i++;

  return `n-${i}`;
}

export function copyNode(node: CaseTreeNode): CaseTreeNode {
  const casesCopy = node.cases.map((c) => ({ ...c, branch: { ...c.branch } }));

  return {
    ...node,
    cases: casesCopy,
    default: node.default ? { ...node.default } : undefined,
  };
}
