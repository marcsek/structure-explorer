import { plural, toBe } from "../../../shared/core/wordForms";
import type { CaseTreeBranch, CaseTreeNode } from "../caseTreeViewSlice";
import { intervalVariables, parseMatch } from "./caseTree";

export type CasePathCase =
  | {
      type: "case";
      caseIdx: number;
      match: string;
      error: string;
      firstOccurence: boolean;
    }
  | { type: "default"; leftoverMatches: string[]; deletable: boolean };

export interface CasePathNode {
  id: string;
  variable: string;
  case: CasePathCase;
  error: string;
  firstOccurence: boolean;
  exhausted: boolean;
}

export interface CasePath {
  value: string;
  valueError: string;
  error: string;
  nodes: CasePathNode[];
  placeholder: boolean;
}

interface NodeDraft {
  id: string;
  variable: string;
  error: string;
  covered: boolean;
  case:
    | { type: "case"; caseIdx: number; match: string; error: string }
    | { type: "default"; leftoverMatches: string[]; deletable: boolean };
}

interface RowDraft {
  value: string;
  valueError: string;
  placeholder: boolean;
  nodeDrafts: NodeDraft[];
}

export function flattenCaseTree(
  rootId: string,
  nodes: Record<string, CaseTreeNode>,
  domain: Set<string>,
  maxDepth: number,
): CasePath[] {
  const allowedVars = intervalVariables.slice(0, maxDepth);
  const drafts: RowDraft[] = [];

  const buildRows = (
    nodeId: string,
    usedVars: Set<string>,
    trail: NodeDraft[],
    parentHasError: boolean,
  ) => {
    const node = nodes[nodeId];
    const variableError = getVariableError(node, allowedVars, usedVars);
    const nestedUsedVars = new Set(usedVars).add(node.variable);

    const cases = node.cases.map((c) => ({
      ...c,
      matches: parseMatch(c.match),
    }));
    const coveredElements = new Set(
      cases.flatMap((c) => c.matches).filter((m) => domain.has(m)),
    );
    const covered = coveredElements.size === domain.size;

    let hasError = parentHasError || variableError !== "";

    const nodeDraft = (nodeCase: NodeDraft["case"]): NodeDraft => ({
      id: nodeId,
      variable: node.variable,
      error: variableError,
      covered,
      case: nodeCase,
    });

    const emitBranch = (
      branch: CaseTreeBranch | undefined,
      nodeDrafts: NodeDraft[],
    ) => {
      if (branch?.type === "ref") {
        buildRows(branch.nodeId, nestedUsedVars, nodeDrafts, hasError);
        return;
      }

      const value = branch?.value ?? "";
      const valueError = getValueError(value, domain);

      hasError ||= valueError !== "";
      drafts.push({ value, valueError, placeholder: false, nodeDrafts });
    };

    const seenMatches = new Set<string>();

    cases.forEach(({ match, matches, branch }, caseIdx) => {
      const error = getMatchError(matches, seenMatches, domain);

      matches.forEach((m) => seenMatches.add(m));
      hasError ||= error !== "";

      emitBranch(branch, [
        ...trail,
        nodeDraft({ type: "case", caseIdx, match, error }),
      ]);
    });

    if (!hasError && !covered)
      drafts.push({
        value: "",
        valueError: "",
        placeholder: true,
        nodeDrafts: [
          ...trail,
          nodeDraft({
            type: "case",
            caseIdx: cases.length,
            match: "",
            error: "",
          }),
        ],
      });

    if (covered) return;

    emitBranch(node.default, [
      ...trail,
      nodeDraft({
        type: "default",
        leftoverMatches: [...domain].filter((e) => !coveredElements.has(e)),
        deletable: trail.length > 0 && cases.length === 0,
      }),
    ]);
  };

  buildRows(rootId, new Set(), [], false);

  return toCasePaths(drafts);
}

function toCasePaths(drafts: RowDraft[]): CasePath[] {
  const spanned = drafts.filter((d) => !d.placeholder).map((d) => d.nodeDrafts);
  let rowIdx = -1;

  return drafts.map((draft) => {
    if (draft.placeholder)
      return {
        value: "",
        valueError: "",
        error: "",
        placeholder: true,
        nodes: draft.nodeDrafts.map(toGhostNode),
      };

    rowIdx++;
    const above = spanned[rowIdx - 1] ?? [];
    const below = spanned[rowIdx + 1] ?? [];

    const nodes = draft.nodeDrafts.map((nodeDraft, depth) => {
      const previous = above.at(depth);

      const { id, variable, error, case: draftCase, covered } = nodeDraft;

      const startsNode = previous?.id !== id;
      const startsCase = previous !== nodeDraft;
      const endsNode = below.at(depth)?.id !== id;

      return {
        id,
        variable,
        case:
          draftCase.type === "case"
            ? {
                ...nodeDraft.case,
                firstOccurence: startsCase,
                error: startsCase ? draftCase.error : "",
              }
            : draftCase,
        error: startsNode ? error : "",
        firstOccurence: startsNode,
        exhausted: covered && endsNode,
      } as CasePathNode;
    });

    return {
      value: draft.value,
      valueError: draft.valueError,
      error: firstError(draft.valueError, nodes),
      placeholder: false,
      nodes,
    };
  });
}

const toGhostNode = (
  draft: NodeDraft,
  idx: number,
  drafts: NodeDraft[],
): CasePathNode => ({
  id: draft.id,
  variable: draft.variable,
  case:
    draft.case.type === "case"
      ? { ...draft.case, firstOccurence: idx === drafts.length - 1 }
      : draft.case,
  error: "",
  firstOccurence: false,
  exhausted: false,
});

function getValueError(value: string, domain: Set<string>) {
  return domain.has(value)
    ? ""
    : `Value element ${value === "" ? "is empty" : `${value} is not in domain`}.`;
}

function getMatchError(
  matches: string[],
  seenMatches: Set<string>,
  domain: Set<string>,
) {
  const outsideDomain = matches.filter((m) => !domain.has(m));
  if (outsideDomain.length > 0)
    return `Case element ${outsideDomain[0]} is not in domain.`;

  const respecified = matches.filter((m) => seenMatches.has(m));
  if (respecified.length > 0)
    return `${plural(respecified.length, "Case")} for ${respecified.join(",")} ${toBe(respecified.length)} already specified.`;

  return "";
}

function getVariableError(
  node: CaseTreeNode,
  allowedVars: string[],
  usedVars: Set<string>,
) {
  if (!node.variable) return "Variable must be specified.";

  if (!allowedVars.includes(node.variable)) return "Invalid variable name.";

  if (usedVars.has(node.variable))
    return "Variable can only appear once in the tree.";

  return "";
}

const firstError = (valueError: string, nodes: CasePathNode[]) =>
  [
    valueError,
    ...nodes.flatMap((node) => [
      node.error,
      node.case.type === "case" ? node.case.error : "",
    ]),
  ].find((e) => e !== "") ?? "";
