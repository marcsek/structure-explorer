import type { CaseTreeNode } from "./caseTreeViewSlice";

export const intervalVariables = ["x", "y", "z", "v", "w"];

export type GenerateTuplesResult =
  | { ok: true; tuples: string[][] }
  | { ok: false };

export function generateTuples(
  rootId: string,
  nodes: Record<string, CaseTreeNode>,
  domain: Set<string>,
  maxDepth: number,
) {
  const allowedVars = intervalVariables.slice(0, maxDepth);

  const dfs = (
    node: CaseTreeNode,
    partialTuple: (string[] | null)[],
  ): GenerateTuplesResult => {
    if (!node?.default || !node.variable) return { ok: false };
    if (!allowedVars.includes(node.variable)) return { ok: false };

    const variableIdx = allowedVars.indexOf(node.variable);
    const partialTupleCpy = [...partialTuple];

    if (partialTupleCpy[variableIdx] !== null) return { ok: false };

    const cases = [
      ...node.cases.map((c) => ({ ...c, type: "case" as const })),
      { branch: node.default, type: "default" as const },
    ];

    const tuples: string[][] = [];
    const matches = new Set<string>();
    for (const nodeCase of cases) {
      if (nodeCase.type === "case") {
        if (!domain.has(nodeCase.match) || matches.has(nodeCase.match))
          return { ok: false };

        matches.add(nodeCase.match);

        partialTupleCpy[variableIdx] = [nodeCase.match];
      } else {
        partialTupleCpy[variableIdx] = [...domain].filter(
          (d) => !matches.has(d),
        );
      }

      if (nodeCase.branch.type === "ref") {
        const result = dfs(nodes[nodeCase.branch.nodeId], partialTupleCpy);

        if (!result.ok) return result;

        tuples.push(...result.tuples);

        continue;
      }

      if (!domain.has(nodeCase.branch.value)) return { ok: false };

      const generatableTuple = partialTupleCpy.map((e) =>
        e === null ? [...domain] : e,
      );

      tuples.push(...combinations(generatableTuple, nodeCase.branch.value));
    }

    return { ok: true, tuples };
  };

  return dfs(nodes[rootId], Array(maxDepth).fill(null));
}

function combinations(generatable: string[][], value: string): string[][] {
  let result: string[][] = [[]];

  for (const curr of generatable) {
    result = result.flatMap((combo) => curr.map((val) => [...combo, val]));
  }

  return result.map((tuple) => [...tuple, value]);
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

export type IntervalViewCase =
  | {
      type: "match";
      match: string;
      caseIdx: number;
      error: string;
    }
  | {
      type: "default";
      deletable: boolean;
    };

export interface IntervalViewNode {
  id: string;
  variable: string;
  case: IntervalViewCase;
  errors: string[];
}

export interface IntervalViewRow {
  value: string;
  nodes: IntervalViewNode[];
  error: string;
  exhausted: boolean;
}

export function getStructuredIntervalView(
  rootId: string,
  nodes: Record<string, CaseTreeNode>,
  domain: Set<string>,
  maxDepth: number,
) {
  const allowedVars = intervalVariables.slice(0, maxDepth);
  const rows: IntervalViewRow[] = [];

  const buildRow = (
    nodeId: string,
    usedVars: Set<string>,
    currentIntervalNodes: IntervalViewNode[],
  ) => {
    const node = nodes[nodeId];
    const nodeErrors = getTreeNodeValidation(node, allowedVars, usedVars);

    const cases = [
      ...node.cases.map((c) => ({ ...c, type: "case" as const })),
      { branch: node.default, type: "default" as const },
    ];

    const usedVarsCpy = new Set(usedVars);
    usedVarsCpy.add(node.variable);

    const exhausted = node.cases.length === domain.size;

    const matches = new Set<string>();
    for (const [idx, nodeCase] of cases.entries()) {
      const deletable = currentIntervalNodes.length > 0 && cases.length === 1;

      let viewCase: IntervalViewCase | undefined;

      if (nodeCase.type === "case") {
        const match = nodeCase.match;

        let matchError = "";
        if (!domain.has(match))
          matchError = `Match element ${match === "" ? "is empty" : `${match} is not in domain`}.`;
        if (matches.has(match))
          matchError = "Match branch is already specified.";

        viewCase = { type: "match", match, caseIdx: idx, error: matchError };

        matches.add(match);
      } else {
        viewCase = { type: "default", deletable };
      }

      const intervalNode: IntervalViewNode = {
        id: nodeId,
        variable: node.variable,
        case: viewCase,
        errors: nodeErrors,
      };

      const newIntervalNodes = [...currentIntervalNodes, intervalNode];

      if (!nodeCase.branch) {
        rows.push({
          value: "",
          nodes: newIntervalNodes,
          error: "Value element is empty.",
          exhausted,
        });
      } else if (nodeCase.branch.type === "value") {
        const value = nodeCase.branch.value;
        rows.push({
          value,
          nodes: newIntervalNodes,
          error: !domain.has(value)
            ? `Value element ${value === "" ? "is empty" : `${value} is not in domain`}.`
            : "",
          exhausted,
        });
      } else {
        buildRow(nodeCase.branch.nodeId, usedVarsCpy, newIntervalNodes);
      }
    }
  };

  buildRow(rootId, new Set(), []);
  return rows;
}

function getTreeNodeValidation(
  node: CaseTreeNode,
  allowedVars: string[],
  usedVars: Set<string>,
) {
  const errors: string[] = [];

  if (!node.variable) errors.push("Variable must be specified.");

  if (!allowedVars.includes(node.variable))
    errors.push("Invalid variable name.");

  if (usedVars.has(node.variable))
    errors.push("Variable can only appear once in the tree.");

  return errors;
}

export function getAllIntervalViewRowErrors(row: IntervalViewRow) {
  const errors: string[] = [];

  errors.push(row.error);

  for (const node of row.nodes) {
    errors.push(...node.errors);
    if (node.case.type === "match") errors.push(node.case.error);
  }

  return errors.filter((e) => e !== "");
}
