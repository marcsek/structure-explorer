import type { CaseTreeNode } from "./caseTreeViewSlice";

const variables = ["x", "y", "z", "v", "w"];

export type GenerateTuplesResult =
  | { ok: true; tuples: string[][] }
  | { ok: false };

export function generateTuples(
  rootId: string,
  nodes: Record<string, CaseTreeNode>,
  domain: Set<string>,
  maxDepth: number,
) {
  const allowedVars = variables.slice(0, maxDepth);

  const dfs = (
    node: CaseTreeNode,
    partialTuple: (string[] | null)[],
  ): GenerateTuplesResult => {
    if (!node?.default || !node.variable || node.cases.length === 0)
      return { ok: false };
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

export type CaseViewBranch =
  | { type: "value"; value: string; error: string }
  | { type: "ref"; switch: CaseViewSwitch };

export type CaseViewCase =
  | {
      type: "case";
      match: string;
      branch: CaseViewBranch;
      error: string;
    }
  | {
      type: "default";
      branch: CaseViewBranch | undefined;
      error: string;
    };

export interface CaseViewSwitch {
  id: string;
  variable: string;
  cases: CaseViewCase[];
  exhausted: boolean;
  depth: number;
  errors: TreeSwitchError[];
}

export type TreeSwitchError =
  | { scope: "variable"; message: string }
  | { scope: "cases"; message: string };

export function getStructuredCaseView(
  rootId: string,
  nodes: Record<string, CaseTreeNode>,
  domain: Set<string>,
  maxDepth: number,
) {
  const allowedVars = variables.slice(0, maxDepth);

  const buildSwitch = (
    nodeId: string,
    seenVars: Set<string>,
    depth: number,
  ): CaseViewSwitch => {
    const node = nodes[nodeId];
    const nodeErrors = getTreeNodeValidation(node, allowedVars, seenVars);

    const cases = [
      ...node.cases.map((c) => ({ ...c, type: "case" as const })),
      { branch: node.default, type: "default" as const },
    ];

    const seenVarsCpy = new Set(seenVars);
    if (allowedVars.includes(node.variable)) seenVarsCpy.add(node.variable);

    const exhausted = node.cases.length === domain.size;

    const matches = new Set<string>();
    const newCases: CaseViewCase[] = [];
    for (const nodeCase of cases) {
      let newBranch: CaseViewBranch | undefined;
      if (nodeCase.branch?.type === "ref") {
        const childSwitch = buildSwitch(
          nodeCase.branch.nodeId,
          seenVarsCpy,
          depth + 1,
        );

        newBranch = { type: "ref", switch: childSwitch };
      } else if (nodeCase.branch?.type === "value") {
        const value = nodeCase.branch.value;

        newBranch = {
          type: "value",
          value,
          error: !domain.has(value)
            ? `Value element ${value === "" ? "is empty" : `${value} is not in domain`}.`
            : "",
        };
      }

      if (nodeCase.type === "case" && newBranch) {
        const match = nodeCase.match;
        let matchError = "";

        if (!domain.has(match))
          matchError = `Case element ${match === "" ? "is empty" : `${match} is not in domain`}.`;

        if (matches.has(match))
          matchError = "Case branch is already specified.";

        newCases.push({
          type: "case",
          match: nodeCase.match,
          branch: newBranch,
          error: matchError,
        });

        matches.add(match);
      } else if (nodeCase.type === "default") {
        newCases.push({
          type: "default",
          branch: newBranch,
          error: !node.default ? "Default case must be specified." : "",
        });
      }
    }

    const newSwitch: CaseViewSwitch = {
      id: nodeId,
      variable: node.variable,
      cases: newCases,
      errors: nodeErrors,
      exhausted,
      depth,
    };

    return newSwitch;
  };

  return buildSwitch(rootId, new Set(), 1);
}

function getTreeNodeValidation(
  node: CaseTreeNode,
  allowedVars: string[],
  seenVars: Set<string>,
) {
  const errors: TreeSwitchError[] = [];

  if (!node.variable)
    errors.push({ scope: "variable", message: "Variable must be specified." });

  if (!allowedVars.includes(node.variable))
    errors.push({ scope: "variable", message: "Invalid variable name." });

  if (seenVars.has(node.variable))
    errors.push({
      scope: "variable",
      message: "Variable can only appear once in the tree.",
    });

  if (node.cases.length === 0)
    errors.push({ scope: "cases", message: "Empty switch." });

  return errors;
}

export function getAllCaseViewErrors(root: CaseViewSwitch) {
  const errors: string[] = [];

  errors.push(...root.errors.map((e) => e.message).filter((m) => m !== ""));

  for (const switchCase of root.cases) {
    if (switchCase.error) errors.push(switchCase.error);
    if (switchCase.branch?.type === "value" && switchCase.branch.error)
      errors.push(switchCase.branch.error);
    else if (switchCase.branch?.type === "ref")
      errors.push(...getAllCaseViewErrors(switchCase.branch.switch));
  }

  return errors;
}
