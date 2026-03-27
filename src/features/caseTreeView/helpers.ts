import type {
  CaseTreeBranch,
  CaseTreeCase,
  CaseTreeEntry,
  CaseTreeNode,
} from "./caseTreeViewSlice";

export const intervalVariables = ["x", "y", "z", "u", "v", "w", "r", "s", "t"];

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
      type: "case";
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
  primary: boolean;
}

export interface IntervalViewRow {
  value: string;
  nodes: IntervalViewNode[];
  error: string;
  exhausted: boolean;
  placeholder: boolean;
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

    const exhausted = node.cases.length === domain.size - 1;

    const matches = new Set<string>();
    let rowHadError = nodeErrors.length > 0;
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

        rowHadError ||= !!matchError;

        viewCase = { type: "case", match, caseIdx: idx, error: matchError };

        matches.add(match);
      } else {
        viewCase = { type: "default", deletable };
      }

      const isPrimary = idx === 0;

      const intervalNode: IntervalViewNode = {
        id: nodeId,
        variable: node.variable,
        case: viewCase,
        errors: isPrimary ? nodeErrors : [],
        primary: isPrimary,
      };

      const primaryResetNodes = isPrimary
        ? [...currentIntervalNodes]
        : currentIntervalNodes.map((n) => ({
            ...n,
            primary: false,
            errors: [],
          }));

      const newIntervalNodes = [...primaryResetNodes, intervalNode];

      if (!rowHadError && cases.length === 1 && !exhausted) {
        rows.push({
          value: "",
          nodes: newIntervalNodes,
          error: "",
          exhausted,
          placeholder: true,
        });
      }

      if (!nodeCase.branch) {
        rows.push({
          value: "",
          nodes: newIntervalNodes,
          error: "Value element is empty.",
          exhausted,
          placeholder: false,
        });
        rowHadError = true;
      } else if (nodeCase.branch.type === "value") {
        const value = nodeCase.branch.value;
        const valueError = !domain.has(value)
          ? `Value element ${value === "" ? "is empty" : `${value} is not in domain`}.`
          : "";

        rows.push({
          value,
          nodes: newIntervalNodes,
          error: valueError,
          exhausted,
          placeholder: false,
        });

        rowHadError ||= !!valueError;
      } else {
        buildRow(nodeCase.branch.nodeId, usedVarsCpy, newIntervalNodes);
      }

      if (!rowHadError && idx === cases.length - 2 && !exhausted) {
        rows.push({
          value: "",
          nodes: newIntervalNodes,
          error: "",
          exhausted,
          placeholder: true,
        });
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
    if (node.case.type === "case") errors.push(node.case.error);
  }

  return errors.filter((e) => e !== "");
}

export function initializeTreeFromTuples(
  tuples: string[][],
  tupleArity: number,
) {
  const nodes: Record<string, CaseTreeNode> = {};

  let nodeCounter = 0;
  const nextId = () => (nodeCounter++ === 0 ? "root" : `n${nodeCounter}`);

  const buildNode = (depth: number, group: string[][]) => {
    const nodeId = nextId();
    const variable = intervalVariables[depth];

    const grouped = new Map<string, string[][]>();
    for (const tuple of group) {
      const key = tuple[depth];
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(tuple);
    }

    let groupIdx = 0;
    const cases: CaseTreeCase[] = [];
    let def: CaseTreeBranch | undefined;

    for (const [match, subGroup] of grouped) {
      let branch: CaseTreeBranch;

      if (depth === tupleArity - 1) {
        branch = { type: "value", value: subGroup[0][tupleArity] };
      } else {
        branch = { type: "ref", nodeId: buildNode(depth + 1, subGroup) };
      }

      if (groupIdx === tupleArity - 1) {
        def = branch;
      } else {
        cases.push({ match, branch });
      }

      groupIdx++;
    }

    nodes[nodeId] = { variable, cases, default: def };
    return nodeId;
  };

  const rootId = buildNode(0, tuples);
  return { rootId, nodes };
}

function checkPath(
  entry: CaseTreeEntry,
  nodeId: string,
  inputs: string[],
  depth: number,
  expected: string,
): void {
  const node = entry.nodes[nodeId];
  const inputVal = inputs[depth];
  const isLast = depth === inputs.length - 1;

  const existing = node.cases.find((c) => c.match === inputVal);
  const branch = existing?.branch ?? node.default;

  if (branch?.type === "value" && branch.value === expected) return;

  if (isLast) {
    if (existing) {
      existing.branch = { type: "value", value: expected };
    } else {
      node.cases.push({
        match: inputVal,
        branch: { type: "value", value: expected },
      });
    }

    return;
  }

  if (branch?.type === "ref") {
    if (existing) {
      checkPath(entry, branch.nodeId, inputs, depth + 1, expected);
    } else {
      const cloneId = cloneNode(entry, branch.nodeId);
      node.cases.push({
        match: inputVal,
        branch: { type: "ref", nodeId: cloneId },
      });
      checkPath(entry, cloneId, inputs, depth + 1, expected);
    }

    return;
  }

  const newId = getNextNodeId(entry.nodes);
  entry.nodes[newId] = {
    variable: intervalVariables[depth + 1],
    cases: [],
    default: branch ? { ...branch } : undefined,
  };

  if (existing) {
    existing.branch = { type: "ref", nodeId: newId };
  } else {
    node.cases.push({
      match: inputVal,
      branch: { type: "ref", nodeId: newId },
    });
  }

  checkPath(entry, newId, inputs, depth + 1, expected);
}

function cloneNode(entry: CaseTreeEntry, nodeId: string): string {
  const orig = entry.nodes[nodeId];
  const newId = getNextNodeId(entry.nodes);

  const cloneBranch = (b: CaseTreeBranch): CaseTreeBranch =>
    b.type === "value"
      ? { ...b }
      : { type: "ref", nodeId: cloneNode(entry, b.nodeId) };

  entry.nodes[newId] = {
    variable: orig.variable,
    cases: orig.cases.map((c) => ({
      match: c.match,
      branch: cloneBranch(c.branch),
    })),
    default: orig.default ? cloneBranch(orig.default) : undefined,
  };

  return newId;
}

export function updateCaseTree(entry: CaseTreeEntry, tuples: string[][]) {
  for (const tuple of tuples) {
    const inputs = tuple.slice(0, -1);
    const expected = tuple[tuple.length - 1];
    checkPath(entry, entry.rootId, inputs, 0, expected);
  }
}
