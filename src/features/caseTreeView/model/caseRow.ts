import { intervalVariables } from "./caseTree";
import type { CasePath, CasePathNode } from "./flattenTree";
import type { CaseRef } from "./targets";

export interface RowFlags {
  placeholder: boolean;
  locked: boolean;
}

export const caseRefOf = (node: CasePathNode): CaseRef =>
  node.case.type === "case"
    ? { kind: "case", nodeId: node.id, caseIdx: node.case.caseIdx }
    : { kind: "default", nodeId: node.id };

export const getAllowedVars = (tupleArity: number) =>
  intervalVariables.slice(0, tupleArity);

export function getSingleBranchPath(paths: CasePath[]) {
  const pure = paths.filter((p) => !p.placeholder);

  if (pure.length !== 1) return null;

  const [path] = pure;
  if (path.nodes.length !== 1 || path.nodes[0].case.type !== "default")
    return null;

  return path;
}

const emptyCaseNode = (node: CasePathNode): CasePathNode => ({
  id: "",
  variable: node.variable,
  case: { type: "case", caseIdx: 0, error: "", match: "", primary: false },
  errors: [],
  primary: false,
  exhausted: false,
});

export const getDisplayNodes = (path: CasePath) =>
  path.placeholder
    ? [
        ...path.nodes.slice(0, -1),
        emptyCaseNode(path.nodes[path.nodes.length - 1]),
      ]
    : path.nodes;

export const getUnusedVars = (nodes: CasePathNode[], allowedVars: string[]) =>
  allowedVars.filter((v) => !nodes.some((n) => n.variable === v));

export function getRemoveRef(
  nodes: CasePathNode[],
  idx: number,
): CaseRef | null {
  const node = nodes[idx];

  if (node.case.type === "case") return caseRefOf(node);
  if (!node.case.deletable) return null;

  const parent = idx > 0 ? nodes[idx - 1] : undefined;

  return parent ? caseRefOf(parent) : null;
}
