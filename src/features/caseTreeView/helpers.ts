import type {
  CaseTreeBranch,
  CaseTreeCase,
  CaseTreeEntry,
  CaseTreeNode,
} from "./caseTreeViewSlice";

export const intervalVariables = ["x", "y", "z", "u", "v", "w", "r", "s", "t"];

export type GenerateTuplesResult =
  { ok: true; tuples: string[][] } | { ok: false };

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
    const seenMatches = new Set<string>();
    for (const nodeCase of cases) {
      if (nodeCase.type === "case") {
        const matches = parseMatch(nodeCase.match);

        if (
          !matches.some((m) => domain.has(m)) ||
          matches.some((m) => seenMatches.has(m))
        )
          return { ok: false };

        matches.forEach((m) => seenMatches.add(m));

        partialTupleCpy[variableIdx] = [...matches];
      } else {
        partialTupleCpy[variableIdx] = [...domain].filter(
          (d) => !seenMatches.has(d),
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
      primary: boolean;
    }
  | {
      type: "default";
      deletable: boolean;
      leftoverMatches: string[];
    };

export interface IntervalViewNode {
  id: string;
  variable: string;
  case: IntervalViewCase;
  errors: string[];
  primary: boolean;
  exhausted: boolean;
}

export interface IntervalViewRow {
  value: string;
  nodes: IntervalViewNode[];
  error: string;
  exhausted: boolean;
  exhaustedVars: string[];
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
    parentExhaustedVars: string[],
    parentHadError: boolean = false,
  ) => {
    const node = nodes[nodeId];
    const nodeErrors = getTreeNodeValidation(node, allowedVars, usedVars);

    const cases = [
      ...node.cases.map((c) => ({
        ...c,
        type: "case" as const,
        matches: parseMatch(c.match),
      })),
      { branch: node.default, type: "default" as const },
    ];

    const usedVarsCpy = new Set(usedVars);
    usedVarsCpy.add(node.variable);

    const allMatches = cases.flatMap((c) =>
      c.type === "case" ? [...c.matches] : "def",
    );
    const casesExhausted = allMatches.length === domain.size + 1;
    const exhaustedVars = [...parentExhaustedVars];

    const seenMatches = new Set<string>();
    let rowHadError = nodeErrors.length > 0 || parentHadError;
    for (const [idx, nodeCase] of cases.entries()) {
      const deletable = currentIntervalNodes.length > 0 && cases.length === 1;

      let viewCase: IntervalViewCase | undefined;

      if (nodeCase.type === "case") {
        let matchError = "";
        for (const match of nodeCase.matches) {
          if (!domain.has(match))
            matchError = `Case element ${match === "" ? "is empty" : `${match} is not in domain`}.`;
          if (seenMatches.has(match))
            matchError = "Case branch is already specified.";

          rowHadError ||= !!matchError;

          seenMatches.add(match);
        }

        viewCase = {
          type: "case",
          match: nodeCase.match,
          caseIdx: idx,
          error: matchError,
          primary: true,
        };
      } else {
        const leftoverMatches = [...domain].filter((e) => !seenMatches.has(e));
        viewCase = { type: "default", deletable, leftoverMatches };
      }

      const isLastCase = casesExhausted
        ? idx === cases.length - 2
        : idx === cases.length - 1;
      const exhausted = casesExhausted && isLastCase;

      if (exhausted) exhaustedVars.push(node.variable);

      const isPrimary = idx === 0;

      console.log(currentIntervalNodes, cases, idx);
      let localIntervalNodes = currentIntervalNodes.map((n) => ({
        ...n,
        exhausted: n.exhausted && isLastCase,
      }));

      if (!isPrimary) {
        localIntervalNodes = localIntervalNodes.map((n) => ({
          ...n,
          case: { ...n.case, primary: false, error: "" },
        }));
      }

      const intervalNode: IntervalViewNode = {
        id: nodeId,
        variable: node.variable,
        case: viewCase,
        errors: isPrimary ? nodeErrors : [],
        primary: isPrimary,
        exhausted,
      };

      const primaryResetNodes = isPrimary
        ? [...localIntervalNodes]
        : localIntervalNodes.map((n) => ({
            ...n,
            primary: false,
            errors: [],
          }));

      const newIntervalNodes = [...primaryResetNodes, intervalNode];

      if (intervalNode.case.type === "default" && casesExhausted) {
        continue;
      }

      if (!rowHadError && cases.length === 1 && !exhausted) {
        rows.push({
          value: "",
          nodes: newIntervalNodes,
          error: "",
          exhausted,
          exhaustedVars: [],
          placeholder: true,
        });
      }

      if (!nodeCase.branch) {
        rows.push({
          value: "",
          nodes: newIntervalNodes,
          error: "Value element is empty.",
          exhausted,
          exhaustedVars: isLastCase ? exhaustedVars : [],
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
          exhaustedVars: isLastCase ? exhaustedVars : [],
          placeholder: false,
        });

        rowHadError ||= !!valueError;
      } else {
        buildRow(
          nodeCase.branch.nodeId,
          usedVarsCpy,
          newIntervalNodes,
          exhaustedVars,
          rowHadError,
        );
      }

      if (!rowHadError && idx === cases.length - 2) {
        rows.push({
          value: "",
          nodes: newIntervalNodes,
          error: "",
          exhausted: casesExhausted,
          exhaustedVars: isLastCase ? exhaustedVars : [],
          placeholder: true,
        });
      }
    }
  };

  buildRow(rootId, new Set(), [], []);
  console.log(rows);
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

    const allEntries: { match: string; branch: CaseTreeBranch }[] = [];
    for (const [match, subGroup] of grouped) {
      let branch: CaseTreeBranch;
      if (depth === tupleArity - 1) {
        branch = { type: "value", value: subGroup[0][tupleArity] };
      } else {
        branch = buildNode(depth + 1, subGroup);
      }

      allEntries.push({ match, branch });
    }

    const valueCounts = new Map<string, number>();
    let defaultValue: string | undefined;
    let maxCount = 0;

    for (const { branch } of allEntries) {
      if (branch.type === "value") {
        const newCount = (valueCounts.get(branch.value) ?? 0) + 1;
        valueCounts.set(branch.value, newCount);

        if (newCount > maxCount) {
          maxCount = newCount;
          defaultValue = branch.value;
        }
      }
    }

    const allValues = allEntries.every((e) => e.branch.type === "value");
    if (allValues && valueCounts.size === 1) return allEntries[0].branch;

    const cases: CaseTreeCase[] = [];
    let def: CaseTreeBranch | undefined;

    if (defaultValue !== undefined && maxCount > 1) {
      def = { type: "value", value: defaultValue };

      for (const { match, branch } of allEntries) {
        if (branch.type === "value" && branch.value === defaultValue) continue;
        cases.push({ match, branch });
      }
    } else {
      // TODO: Possibly don't generate default here
      for (let i = 0; i < allEntries.length; i++) {
        if (i === allEntries.length - 1) {
          def = allEntries[i].branch;
        } else {
          cases.push(allEntries[i]);
        }
      }
    }

    nodes[nodeId] = { variable, cases, default: def };
    return { type: "ref", nodeId } as const;
  };

  const rootBranch = buildNode(0, tuples);

  if (rootBranch.type === "ref") {
    return { rootId: rootBranch.nodeId, nodes };
  }

  const rootId = "root";
  nodes[rootId] = {
    variable: intervalVariables[0],
    cases: [],
    default: rootBranch,
  };

  return { rootId, nodes };
}

function parseMatch(match: string) {
  return match
    .trim()
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s);
}

function findMatchingCase(
  node: CaseTreeNode,
  inputVal: string,
): CaseTreeCase | undefined {
  return node.cases.find((c) => parseMatch(c.match).includes(inputVal));
}

function splitValueFromCase(
  node: CaseTreeNode,
  caseItem: CaseTreeCase,
  inputVal: string,
): void {
  const values = parseMatch(caseItem.match);
  const remaining = values.filter((v) => v !== inputVal);

  if (remaining.length === 0) {
    node.cases = node.cases.filter((c) => c !== caseItem);
  } else {
    caseItem.match = remaining.join(",");
  }
}

function checkPath(
  entry: CaseTreeEntry,
  nodeId: string,
  inputs: string[],
  depth: number,
  expected: string,
  variablesLeft: string[],
) {
  const node = entry.nodes[nodeId];

  const varIndex = intervalVariables.indexOf(node.variable);
  const inputVal = inputs[varIndex !== -1 ? varIndex : depth];
  const isLast = depth === inputs.length - 1;

  const newVarsLeft = variablesLeft.filter((v) => v !== node.variable);

  const existing = findMatchingCase(node, inputVal);
  const isMultiMatch = existing ? parseMatch(existing.match).length > 1 : false;

  const branch = existing?.branch ?? node.default;

  if (branch?.type === "value" && branch.value === expected) return;

  if (isLast) {
    if (existing) {
      if (!isMultiMatch) {
        existing.branch = { type: "value", value: expected };
        return;
      }

      splitValueFromCase(node, existing, inputVal);
      node.cases.push({
        match: inputVal,
        branch: { type: "value", value: expected },
      });
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
      if (isMultiMatch) {
        splitValueFromCase(node, existing, inputVal);
        const cloneId = cloneNode(entry, branch.nodeId);
        node.cases.push({
          match: inputVal,
          branch: { type: "ref", nodeId: cloneId },
        });
        checkPath(entry, cloneId, inputs, depth + 1, expected, newVarsLeft);
      } else {
        checkPath(
          entry,
          branch.nodeId,
          inputs,
          depth + 1,
          expected,
          newVarsLeft,
        );
      }
    } else {
      const cloneId = cloneNode(entry, branch.nodeId);
      node.cases.push({
        match: inputVal,
        branch: { type: "ref", nodeId: cloneId },
      });
      checkPath(entry, cloneId, inputs, depth + 1, expected, newVarsLeft);
    }
    return;
  }

  const newId = getNextNodeId(entry.nodes);
  entry.nodes[newId] = {
    variable: newVarsLeft[0],
    cases: [],
    default: branch ? { ...branch } : undefined,
  };

  if (existing) {
    if (isMultiMatch) {
      splitValueFromCase(node, existing, inputVal);
      node.cases.push({
        match: inputVal,
        branch: { type: "ref", nodeId: newId },
      });
    } else {
      existing.branch = { type: "ref", nodeId: newId };
    }
  } else {
    node.cases.push({
      match: inputVal,
      branch: { type: "ref", nodeId: newId },
    });
  }

  checkPath(entry, newId, inputs, depth + 1, expected, newVarsLeft);
}

function cloneNode(entry: CaseTreeEntry, nodeId: string) {
  const orig = entry.nodes[nodeId];
  const newId = getNextNodeId(entry.nodes);

  const cloneBranch = (b: CaseTreeBranch): CaseTreeBranch =>
    b.type === "value"
      ? { ...b }
      : { type: "ref", nodeId: cloneNode(entry, b.nodeId) };

  // Makes sure next node id generates correctly
  entry.nodes[newId] = { cases: [], variable: "" };

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

export function copyNode(node: CaseTreeNode): CaseTreeNode {
  const casesCopy = node.cases.map((c) => ({ ...c, branch: { ...c.branch } }));

  return {
    ...node,
    cases: casesCopy,
    default: node.default ? { ...node.default } : undefined,
  };
}

export function updateCaseTree(entry: CaseTreeEntry, tuples: string[][]) {
  for (const tuple of tuples) {
    const inputs = tuple.slice(0, -1);
    const expected = tuple[tuple.length - 1];
    checkPath(entry, entry.rootId, inputs, 0, expected, [...intervalVariables]);
  }
}
