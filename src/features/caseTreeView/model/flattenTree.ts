import { plural, toBe } from "../../../shared/core/wordForms";
import type { CaseTreeNode } from "../caseTreeViewSlice";
import { intervalVariables, parseMatch } from "./caseTree";

export type CasePathCase =
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

export interface CasePathNode {
  id: string;
  variable: string;
  case: CasePathCase;
  errors: string[];
  primary: boolean;
  exhausted: boolean;
}

export interface CasePath {
  value: string;
  nodes: CasePathNode[];
  error: string;
  exhausted: boolean;
  exhaustedVars: string[];
  placeholder: boolean;
}

export function flattenCaseTree(
  rootId: string,
  nodes: Record<string, CaseTreeNode>,
  domain: Set<string>,
  maxDepth: number,
) {
  const allowedVars = intervalVariables.slice(0, maxDepth);
  const rows: CasePath[] = [];

  const buildRow = (
    nodeId: string,
    usedVars: Set<string>,
    currentPathNodes: CasePathNode[],
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
      const deletable = currentPathNodes.length > 0 && cases.length === 1;

      let viewCase: CasePathCase | undefined;

      if (nodeCase.type === "case") {
        let matchError = "";

        const respecified = nodeCase.matches.filter((m) => seenMatches.has(m));
        const respecLen = respecified.length;
        if (respecLen > 0)
          matchError = `${plural(respecLen, "Case")} for ${respecified.join(",")} ${toBe(respecLen)} already specified.`;

        for (const match of nodeCase.matches) {
          if (!domain.has(match))
            matchError = `Case element ${match === "" ? "is empty" : `${match} is not in domain`}.`;

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

      let localPathNodes = currentPathNodes.map((n) => ({
        ...n,
        exhausted: n.exhausted && isLastCase,
      }));

      if (!isPrimary) {
        localPathNodes = localPathNodes.map((n) => ({
          ...n,
          case: { ...n.case, primary: false, error: "" },
        }));
      }

      const pathNode: CasePathNode = {
        id: nodeId,
        variable: node.variable,
        case: viewCase,
        errors: isPrimary ? nodeErrors : [],
        primary: isPrimary,
        exhausted,
      };

      const primaryResetNodes = isPrimary
        ? [...localPathNodes]
        : localPathNodes.map((n) => ({
            ...n,
            primary: false,
            errors: [],
          }));

      const newPathNodes = [...primaryResetNodes, pathNode];

      if (pathNode.case.type === "default" && casesExhausted) {
        continue;
      }

      if (!rowHadError && cases.length === 1 && !exhausted) {
        rows.push({
          value: "",
          nodes: newPathNodes,
          error: "",
          exhausted,
          exhaustedVars: [],
          placeholder: true,
        });
      }

      if (!nodeCase.branch) {
        rows.push({
          value: "",
          nodes: newPathNodes,
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
          nodes: newPathNodes,
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
          newPathNodes,
          exhaustedVars,
          rowHadError,
        );
      }

      if (!rowHadError && idx === cases.length - 2) {
        rows.push({
          value: "",
          nodes: newPathNodes,
          error: "",
          exhausted: casesExhausted,
          exhaustedVars: isLastCase ? exhaustedVars : [],
          placeholder: true,
        });
      }
    }
  };

  buildRow(rootId, new Set(), [], []);
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

export function hasCasePathError(row: CasePath) {
  if (row.error !== "") return true;

  return row.nodes.some(
    (node) =>
      node.errors.length > 0 ||
      (node.case.type === "case" && node.case.error !== ""),
  );
}

export function getCasePathErrors(row: CasePath) {
  const errors: string[] = [];

  errors.push(row.error);

  for (const node of row.nodes) {
    errors.push(...node.errors);
    if (node.case.type === "case") errors.push(node.case.error);
  }

  return errors.filter((e) => e !== "");
}
