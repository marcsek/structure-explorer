import { duplicates } from "../../../shared/core/utils";
import {
  copyTree,
  getSubtreeNodeIds,
  intervalVariables,
  parseMatch,
  rootNodeId,
  type CaseTreeBranch,
  type CaseTreeCase,
  type CaseTreeEntry,
  type CaseTreeNode,
} from "./caseTree";

export type GenerateTuplesResult =
  { ok: true; tuples: string[][] } | { ok: false };

export function generateTuples(
  rootId: string,
  nodes: Record<string, CaseTreeNode>,
  domain: Set<string>,
  arity: number,
) {
  const allowedVars = intervalVariables.slice(0, arity);

  const collect = (
    node: CaseTreeNode,
    partialTuple: (string[] | null)[],
  ): GenerateTuplesResult => {
    if (!node?.variable) return { ok: false };
    if (!allowedVars.includes(node.variable)) return { ok: false };

    const variableIdx = allowedVars.indexOf(node.variable);
    const partialTupleCpy = [...partialTuple];

    if (partialTupleCpy[variableIdx] !== null) return { ok: false };

    const expandBranch = (branch: CaseTreeBranch): GenerateTuplesResult => {
      if (branch.type === "ref")
        return collect(nodes[branch.nodeId], partialTupleCpy);

      if (!domain.has(branch.value)) return { ok: false };

      const generatableTuple = partialTupleCpy.map((e) =>
        e === null ? [...domain] : e,
      );

      return { ok: true, tuples: combinations(generatableTuple, branch.value) };
    };

    const tuples: string[][] = [];
    const seenMatches = new Set<string>();
    for (const nodeCase of node.cases) {
      const matches = parseMatch(nodeCase.match);

      if (
        matches.length === 0 ||
        matches.some((m) => !domain.has(m)) ||
        matches.some((m) => seenMatches.has(m)) ||
        duplicates(matches).length > 0
      )
        return { ok: false };

      matches.forEach((m) => seenMatches.add(m));
      partialTupleCpy[variableIdx] = [...matches];

      const result = expandBranch(nodeCase.branch);

      if (!result.ok) return result;

      tuples.push(...result.tuples);
    }

    const leftover = [...domain].filter((d) => !seenMatches.has(d));
    if (leftover.length === 0) return { ok: true, tuples };

    if (!node.default) return { ok: false };

    partialTupleCpy[variableIdx] = leftover;
    const defaultResult = expandBranch(node.default);
    if (!defaultResult.ok) return defaultResult;

    tuples.push(...defaultResult.tuples);

    return { ok: true, tuples };
  };

  return collect(nodes[rootId], Array(arity).fill(null));
}

function combinations(generatable: string[][], value: string): string[][] {
  let result: string[][] = [[]];

  for (const curr of generatable) {
    result = result.flatMap((combo) => curr.map((val) => [...combo, val]));
  }

  return result.map((tuple) => [...tuple, value]);
}

type Region = (string | null)[];

interface SliceClass {
  elements: string[];
  region: Region;
}

interface BuildContext {
  nodes: Record<string, CaseTreeNode>;
  values: Map<string, string>;
  domain: string[];
  domainSet: Set<string>;
  arity: number;
  allowedVars: string[];
  nextId: number;
  visited: Set<string>;
  changed: boolean;
}

const argsKey = (args: string[]) => args.join(",");

const freeRegion = (arity: number): Region => Array(arity).fill(null);

const fixedRegion = (
  region: Region,
  index: number,
  element: string,
): Region => {
  const fixed = [...region];
  fixed[index] = element;

  return fixed;
};

const firstFreeIndex = (region: Region) => Math.max(0, region.indexOf(null));

// WARNING Trees saved by older versions mix id formats (n{number} vs. n-{number}), so
// be careful when modifing this function.
function newNodeId(ctx: BuildContext) {
  while (`n${ctx.nextId}` in ctx.nodes) ctx.nextId++;

  return `n${ctx.nextId++}`;
}

const emptyTree = (): CaseTreeEntry => ({
  rootId: rootNodeId,
  nodes: { [rootNodeId]: { variable: intervalVariables[0], cases: [] } },
});

function createContext(
  nodes: Record<string, CaseTreeNode>,
  tuples: string[][],
  domain: Set<string>,
  arity: number,
): BuildContext | undefined {
  if (arity < 1 || arity > intervalVariables.length || domain.size === 0)
    return;

  const values = new Map<string, string>();

  for (const tuple of tuples) {
    if (tuple.length !== arity + 1) return;
    if (tuple.some((element) => !domain.has(element))) return;

    const key = argsKey(tuple.slice(0, arity));
    if (values.has(key)) return;

    values.set(key, tuple[arity]);
  }

  if (values.size !== domain.size ** arity) return;

  return {
    nodes,
    values,
    domain: [...domain],
    domainSet: domain,
    arity,
    allowedVars: intervalVariables.slice(0, arity),
    nextId: 1,
    visited: new Set(),
    changed: false,
  };
}

function walkRegionValues(
  ctx: BuildContext,
  region: Region,
  visit: (value: string) => boolean,
) {
  const args = [...region] as string[];
  const free = region.flatMap((element, index) =>
    element === null ? [index] : [],
  );

  const walk = (depth: number): boolean => {
    if (depth === free.length) return visit(ctx.values.get(argsKey(args))!);

    for (const element of ctx.domain) {
      args[free[depth]] = element;

      if (!walk(depth + 1)) return false;
    }

    return true;
  };

  return walk(0);
}

const firstRegionValue = (ctx: BuildContext, region: Region) =>
  ctx.values.get(argsKey(region.map((element) => element ?? ctx.domain[0])))!;

function constantOf(ctx: BuildContext, region: Region) {
  const first = firstRegionValue(ctx, region);
  const uniform = walkRegionValues(ctx, region, (value) => value === first);

  return uniform ? first : undefined;
}

function sliceClasses(ctx: BuildContext, region: Region, index: number) {
  const classes = new Map<string, SliceClass>();

  for (const element of ctx.domain) {
    const elementRegion = fixedRegion(region, index, element);

    let signature = "";
    walkRegionValues(ctx, elementRegion, (value) => {
      signature += `${value},`;
      return true;
    });

    const sliceClass = classes.get(signature);

    if (sliceClass) sliceClass.elements.push(element);
    else classes.set(signature, { elements: [element], region: elementRegion });
  }

  return [...classes.values()];
}

function firstBranchingVariable(ctx: BuildContext, region: Region) {
  for (let index = 0; index < ctx.arity; index++) {
    if (region[index] !== null) continue;

    const classes = sliceClasses(ctx, region, index);
    if (classes.length > 1) return { index, classes };
  }
}

const largestClassIndex = (classes: SliceClass[]) =>
  classes.reduce(
    (largest, sliceClass, index) =>
      sliceClass.elements.length >= classes[largest].elements.length
        ? index
        : largest,
    0,
  );

function buildBranch(ctx: BuildContext, region: Region): CaseTreeBranch {
  const branching = firstBranchingVariable(ctx, region);

  if (!branching)
    return { type: "value", value: firstRegionValue(ctx, region) };

  const nodeId = newNodeId(ctx);
  ctx.nodes[nodeId] = buildNode(ctx, branching.index, branching.classes);

  return { type: "ref", nodeId };
}

function buildNode(
  ctx: BuildContext,
  index: number,
  classes: SliceClass[],
): CaseTreeNode {
  const defaultIndex = largestClassIndex(classes);

  return {
    variable: ctx.allowedVars[index],
    cases: classes
      .filter((_, classIndex) => classIndex !== defaultIndex)
      .map((sliceClass) => ({
        match: sliceClass.elements.join(","),
        branch: buildBranch(ctx, sliceClass.region),
      })),
    default: buildBranch(ctx, classes[defaultIndex].region),
  };
}

function rebuiltNode(ctx: BuildContext, region: Region): CaseTreeNode {
  const branching = firstBranchingVariable(ctx, region);

  if (branching) return buildNode(ctx, branching.index, branching.classes);

  return {
    variable: ctx.allowedVars[firstFreeIndex(region)],
    cases: [],
    default: { type: "value", value: firstRegionValue(ctx, region) },
  };
}

// Source: Claude Opus 5.
export function initializeTreeFromTuples(
  tuples: string[][],
  domain: Set<string>,
  arity: number,
): CaseTreeEntry {
  const nodes: Record<string, CaseTreeNode> = {};
  const ctx = createContext(nodes, tuples, domain, arity);

  if (!ctx) return emptyTree();

  const rootBranch = buildBranch(ctx, freeRegion(arity));

  if (rootBranch.type === "value") {
    nodes[rootNodeId] = {
      variable: intervalVariables[0],
      cases: [],
      default: rootBranch,
    };
  } else {
    nodes[rootNodeId] = nodes[rootBranch.nodeId];
    delete nodes[rootBranch.nodeId];
  }

  return { rootId: rootNodeId, nodes };
}

function cloneBranch(
  ctx: BuildContext,
  branch: CaseTreeBranch,
  cloning: Set<string> = new Set(),
): CaseTreeBranch {
  if (branch.type === "value") return { ...branch };

  const original = ctx.nodes[branch.nodeId];
  if (!original || cloning.has(branch.nodeId))
    return { type: "value", value: "" };

  const nested = new Set(cloning).add(branch.nodeId);
  const nodeId = newNodeId(ctx);

  ctx.nodes[nodeId] = {
    variable: original.variable,
    cases: original.cases.map((nodeCase) => ({
      match: nodeCase.match,
      branch: cloneBranch(ctx, nodeCase.branch, nested),
    })),
    default: original.default && cloneBranch(ctx, original.default, nested),
  };

  return { type: "ref", nodeId };
}

function normalizeMatch(
  ctx: BuildContext,
  match: string,
  claimed: Set<string>,
) {
  const parsed = parseMatch(match);
  const elements = [...new Set(parsed)].filter(
    (element) => ctx.domainSet.has(element) && !claimed.has(element),
  );

  return {
    elements,
    text: elements.length === parsed.length ? match : elements.join(","),
  };
}

function groupByClass(
  elements: string[],
  classOf: Map<string, SliceClass>,
): SliceClass[] {
  const groups = new Map<SliceClass, string[]>();

  for (const element of elements) {
    const sliceClass = classOf.get(element);
    if (!sliceClass) continue;

    const group = groups.get(sliceClass);

    if (group) group.push(element);
    else groups.set(sliceClass, [element]);
  }

  return [...groups].map(([sliceClass, grouped]) => ({
    elements: grouped,
    region: sliceClass.region,
  }));
}

function preferredGroup(
  ctx: BuildContext,
  groups: SliceClass[],
  branch: CaseTreeBranch | undefined,
) {
  if (branch?.type === "value") {
    const unchanged = groups.findIndex(
      (group) => constantOf(ctx, group.region) === branch.value,
    );

    if (unchanged !== -1) return unchanged;
  }

  return largestClassIndex(groups);
}

function repairBranch(
  ctx: BuildContext,
  branch: CaseTreeBranch | undefined,
  region: Region,
): CaseTreeBranch {
  const constant = constantOf(ctx, region);

  if (constant !== undefined) {
    if (branch?.type === "value" && branch.value === constant) return branch;

    ctx.changed = true;
    return { type: "value", value: constant };
  }

  if (branch?.type === "ref" && ctx.nodes[branch.nodeId]) {
    const owned = ctx.visited.has(branch.nodeId)
      ? cloneBranch(ctx, branch)
      : branch;

    if (owned.type === "ref") {
      if (owned !== branch) ctx.changed = true;

      ctx.visited.add(owned.nodeId);
      repairNode(ctx, owned.nodeId, region);

      return owned;
    }
  }

  ctx.changed = true;
  return buildBranch(ctx, region);
}

function splitCase(
  ctx: BuildContext,
  branch: CaseTreeBranch,
  match: string,
  groups: SliceClass[],
): CaseTreeCase[] {
  const kept = preferredGroup(ctx, groups, branch);
  const branches = groups.map((_, index) =>
    index === kept ? branch : cloneBranch(ctx, branch),
  );

  if (groups.length > 1) ctx.changed = true;

  return groups.map((group, index) => ({
    match:
      groups.length === 1 && index === kept ? match : group.elements.join(","),
    branch: repairBranch(ctx, branches[index], group.region),
  }));
}

function repairNode(ctx: BuildContext, nodeId: string, region: Region) {
  const node = ctx.nodes[nodeId];
  const index = ctx.allowedVars.indexOf(node.variable);

  if (index === -1 || region[index] !== null) {
    ctx.nodes[nodeId] = rebuiltNode(ctx, region);
    ctx.changed = true;
    return;
  }

  const classes = sliceClasses(ctx, region, index);
  const classOf = new Map<string, SliceClass>();

  for (const sliceClass of classes) {
    for (const element of sliceClass.elements) {
      classOf.set(element, sliceClass);
    }
  }

  const claimed = new Set<string>();
  const cases: CaseTreeCase[] = [];

  for (const nodeCase of node.cases) {
    const { elements, text } = normalizeMatch(ctx, nodeCase.match, claimed);

    if (elements.length === 0) {
      ctx.changed = true;
      continue;
    }

    if (text !== nodeCase.match) ctx.changed = true;

    elements.forEach((element) => claimed.add(element));
    cases.push(
      ...splitCase(ctx, nodeCase.branch, text, groupByClass(elements, classOf)),
    );
  }

  const leftover = ctx.domain.filter((element) => !claimed.has(element));

  if (leftover.length === 0) {
    if (node.default) ctx.changed = true;

    node.cases = cases;
    node.default = undefined;
    return;
  }

  const groups = groupByClass(leftover, classOf);
  const kept = preferredGroup(ctx, groups, node.default);
  const previous = node.default;

  groups.forEach((group, groupIndex) => {
    if (groupIndex === kept) return;

    ctx.changed = true;
    cases.push({
      match: group.elements.join(","),
      branch: repairBranch(
        ctx,
        previous && cloneBranch(ctx, previous),
        group.region,
      ),
    });
  });

  node.cases = cases;
  node.default = repairBranch(ctx, previous, groups[kept].region);
}

function pruneUnreachable(ctx: BuildContext, rootId: string) {
  const reachable = getSubtreeNodeIds(rootId, ctx.nodes);

  for (const nodeId of Object.keys(ctx.nodes)) {
    if (reachable.has(nodeId)) continue;

    delete ctx.nodes[nodeId];
    ctx.changed = true;
  }
}

// Source: Claude Opus 5.
export function rebuildCaseTree(
  entry: CaseTreeEntry,
  tuples: string[][],
  domain: Set<string>,
  arity: number,
): { tree: CaseTreeEntry; changed: boolean } {
  const tree = copyTree(entry);
  const ctx = createContext(tree.nodes, tuples, domain, arity);

  if (!ctx) return { tree: entry, changed: false };

  ctx.visited.add(tree.rootId);

  if (tree.nodes[tree.rootId]) repairNode(ctx, tree.rootId, freeRegion(arity));
  else {
    tree.nodes[tree.rootId] = rebuiltNode(ctx, freeRegion(arity));
    ctx.changed = true;
  }

  pruneUnreachable(ctx, tree.rootId);

  return ctx.changed
    ? { tree, changed: true }
    : { tree: entry, changed: false };
}
