import { duplicates } from "../../../shared/core/utils";
import { list, toBe } from "../../../shared/core/wordForms";
import {
  intervalVariables,
  parseMatch,
  type CaseTreeBranch,
  type CaseTreeNode,
} from "./caseTree";

interface CaseDraft {
  type: "case";
  caseIdx: number;
  match: string;
  error: string;
}

interface DefaultDraft {
  type: "default";
  leftoverMatches: string[];
  deletable: boolean;
}

export type CasePathCase = (CaseDraft & { editable: boolean }) | DefaultDraft;

export interface CasePathNode {
  id: string;
  variable: string;
  case: CasePathCase;
  error: string;
  editable: boolean;
  exhausted: boolean;
}

export interface CasePath {
  id: string;
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
  case: CaseDraft | DefaultDraft;
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
  arity: number,
): CasePath[] {
  const allowedVars = intervalVariables.slice(0, arity);
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

const pathId = (nodeDrafts: NodeDraft[]) =>
  nodeDrafts
    .map((d) => `${d.id}#${d.case.type === "case" ? d.case.caseIdx : "d"}`)
    .join("-");

function toCasePaths(drafts: RowDraft[]): CasePath[] {
  const spanned = drafts.filter((d) => !d.placeholder).map((d) => d.nodeDrafts);
  let rowIdx = -1;

  return drafts.map((draft) => {
    if (draft.placeholder)
      return {
        id: pathId(draft.nodeDrafts),
        value: "",
        valueError: "",
        error: "",
        placeholder: true,
        nodes: draft.nodeDrafts.map(toGhostNode),
      };

    rowIdx++;
    const above = spanned[rowIdx - 1] ?? [];
    const below = spanned[rowIdx + 1] ?? [];

    const nodes = draft.nodeDrafts.map((nodeDraft, depth): CasePathNode => {
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
                ...draftCase,
                editable: startsCase,
                error: startsCase ? draftCase.error : "",
              }
            : draftCase,
        error: startsNode ? error : "",
        editable: startsNode,
        exhausted: covered && endsNode,
      };
    });

    return {
      id: pathId(draft.nodeDrafts),
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
      ? { ...draft.case, editable: idx === drafts.length - 1 }
      : draft.case,
  error: "",
  editable: false,
  exhausted: false,
});

function getValueError(value: string, domain: Set<string>) {
  return domain.has(value)
    ? ""
    : `Value ${value === "" ? "is empty" : `${value} is not in the domain`}.`;
}

function getMatchError(
  matches: string[],
  seenMatches: Set<string>,
  domain: Set<string>,
) {
  if (matches.length === 0) return `Case has no elements.`;

  const outsideDomain = matches.filter((m) => !domain.has(m));
  if (outsideDomain.length > 0)
    return `Element ${outsideDomain[0]} is not in the domain.`;

  const respecified = matches.filter((m) => seenMatches.has(m));
  if (respecified.length > 0)
    return `${respecified.join(", ")} ${toBe(respecified.length)} already covered above.`;

  const duplicated = duplicates(matches);
  if (duplicated.length > 0)
    return `${duplicated.join(", ")} ${toBe(duplicated.length)} repeated in this case.`;

  return "";
}

function getVariableError(
  node: CaseTreeNode,
  allowedVars: string[],
  usedVars: Set<string>,
) {
  if (!node.variable) return "Variable is missing.";

  if (!allowedVars.includes(node.variable))
    return `Variable must be ${list(allowedVars, "or")}.`;

  if (usedVars.has(node.variable))
    return `Variable ${node.variable} is already used above.`;

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
