import { intervalVariables } from "./caseTree";
import type { CasePath, CasePathNode } from "./flattenTree";
import type { CaseRef } from "./targets";

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

export const getUnusedVars = (nodes: CasePathNode[], allowedVars: string[]) =>
  allowedVars.filter((v) => !nodes.some((n) => n.variable === v));

export function getRemoveRef(nodes: CasePathNode[]): CaseRef | null {
  const node = nodes.at(-1);
  const parent = nodes.at(-2);

  if (!node) return null;
  if (node.case.type === "case") return caseRefOf(node);
  if (!node.case.deletable || !parent) return null;

  return caseRefOf(parent);
}
