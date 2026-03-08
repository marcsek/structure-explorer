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

export type TreeValidationError =
  | { scope: "variable"; message: string }
  | { scope: "cases"; message: string }
  | {
      scope: "case";
      caseIdx: number;
      message: string;
      location: "match" | "value";
    }
  | { scope: "default"; message: string };

function createTreeValidationError<S extends TreeValidationError["scope"]>(
  scope: S,
  rest: Omit<Extract<TreeValidationError, { scope: S }>, "scope">,
) {
  return { scope, ...rest } as TreeValidationError;
}

export function validateTreeNode(
  rootId: string,
  nodes: Record<string, CaseTreeNode>,
  domain: Set<string>,
  maxDepth: number,
) {
  const allowedVars = variables.slice(0, maxDepth);
  const nodeIdStack = [{ nodeId: rootId, seenVars: new Set<string>() }];
  const nodeErrors: Record<string, TreeValidationError[]> = {};

  while (nodeIdStack.length > 0) {
    const { nodeId, seenVars } = nodeIdStack.pop()!;
    const node = nodes[nodeId];
    const errors: TreeValidationError[] = [];
    const seenVarsCpy = new Set(seenVars);

    if (!node.variable)
      errors.push(
        createTreeValidationError("variable", {
          message: `Variable must be specified.`,
        }),
      );

    if (!allowedVars.includes(node.variable))
      errors.push(
        createTreeValidationError("variable", {
          message: "Invalid variable name.",
        }),
      );

    if (seenVars.has(node.variable))
      errors.push(
        createTreeValidationError("variable", {
          message: "Variable can only appear once in the tree.",
        }),
      );

    if (allowedVars.includes(node.variable)) seenVarsCpy.add(node.variable);

    if (node.cases.length === 0)
      errors.push(
        createTreeValidationError("cases", { message: "Empty switch." }),
      );

    const cases = [
      ...node.cases.map((c) => ({ ...c, type: "case" as const })),
      { branch: node.default, type: "default" as const },
    ];

    const matches = new Set<string>();
    for (const [idx, nodeCase] of cases.entries()) {
      if (nodeCase.type === "case") {
        const match = nodeCase.match;

        if (!domain.has(match))
          errors.push(
            createTreeValidationError("case", {
              caseIdx: idx,
              location: "match",
              message: `Case element ${match === "" ? "is empty" : `${match} is not in domain`}.`,
            }),
          );

        if (matches.has(match))
          errors.push(
            createTreeValidationError("case", {
              caseIdx: idx,
              location: "match",
              message: "Case branch is already specified.",
            }),
          );

        matches.add(match);
      }

      if (!nodeCase.branch) continue;

      if (nodeCase.branch.type === "ref") {
        nodeIdStack.push({
          nodeId: nodeCase.branch.nodeId,
          seenVars: seenVarsCpy,
        });
        continue;
      }

      const value = nodeCase.branch.value;

      if (!domain.has(value))
        errors.push(
          createTreeValidationError("case", {
            caseIdx: idx,
            location: "value",
            message: `Value element ${value === "" ? "is empty" : `${value} is not in domain`}.`,
          }),
        );
    }

    if (!node?.default)
      errors.push(
        createTreeValidationError("default", {
          message: "Default case must be specified.",
        }),
      );

    nodeErrors[nodeId] = errors;
  }

  return nodeErrors;
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
