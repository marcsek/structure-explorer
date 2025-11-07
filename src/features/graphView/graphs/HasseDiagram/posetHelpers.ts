export type BinaryRelation<T> = [T, T][];

export function isPoset<T>(relation: BinaryRelation<T>) {
  const succMap = buildSuccessorMap(relation);

  // Ref.
  //for (const x of elements) {
  //  if (!succMap.get(x)?.has(x)) return false;
  //}

  // Antisym.
  for (const [a, b] of relation) {
    if (a !== b && succMap.get(b)?.has(a)) return false;
  }

  // Trans.
  for (const [a, b] of relation) {
    for (const c of succMap.get(b) || []) {
      if (!succMap.get(a)?.has(c)) return false;
    }
  }

  return true;
}

// Performs transitive reduction of a given poset
export function reducePosetRelations<T>(relation: BinaryRelation<T>) {
  const succMap = buildSuccessorMap(relation);

  const edges: BinaryRelation<T> = [];
  for (const [a, b] of relation) {
    if (a === b) {
      edges.push([a, b]);
      continue;
    }

    succMap.get(a)?.delete(b);

    if (!isReachable(a, b, succMap)) edges.push([a, b]);

    succMap.get(a)?.add(b);
  }

  return edges;
}

export function expandReducedPoset<T>(
  relation: BinaryRelation<T>,
  elements: Set<T>,
) {
  const succMap = buildSuccessorMap(relation);

  const expanded: BinaryRelation<T> = [];
  for (const from of elements) {
    const visited = new Set<T>();
    const stack: T[] = [from];

    //expanded.push([from, from]);

    while (stack.length > 0) {
      const element = stack.pop()!;

      for (const neighbour of succMap.get(element) || []) {
        if (visited.has(neighbour)) continue;

        visited.add(neighbour);
        stack.push(neighbour);

        expanded.push([from, neighbour]);
      }
    }
  }

  return expanded;
}

export function staysValidHasseWithEdge<T>(
  relation: BinaryRelation<T>,
  [from, to]: [T, T],
  preserveEdges: boolean = true,
): [boolean, string] {
  if (from === to) return [false, "Source same as target."];

  const succMap = buildSuccessorMap(relation);

  if (succMap.get(from)?.has(to)) return [false, "Edge already exists."];

  if (isReachable(to, from, succMap)) return [false, "Edge creates a cycle."];

  if (isReachable(from, to, succMap))
    return [false, "Indirect path already exists."];

  if (preserveEdges) {
    if (!succMap.has(from)) succMap.set(from, new Set());
    succMap.get(from)!.add(to);

    for (const [a, b] of relation) {
      // Ignoring self edges
      if (a === b) continue;

      succMap.get(a)?.delete(b);

      if (isReachable(a, b, succMap))
        return [
          false,
          "Edge introduces redundancy considering the whole interpretation.",
        ];

      succMap.get(a)?.add(b);
    }
  }

  return [true, ""];
}

function buildSuccessorMap<T>(relation: BinaryRelation<T>) {
  const succMap = new Map<T, Set<T>>();

  for (const [a, b] of relation) {
    if (!succMap.has(a)) succMap.set(a, new Set());
    succMap.get(a)!.add(b);
  }

  return succMap;
}

function isReachable<T>(from: T, to: T, succMap: Map<T, Set<T>>) {
  const visited = new Set<T>();
  const stack: T[] = [from];

  while (stack.length > 0) {
    const element = stack.pop()!;

    if (element === to) return true;

    for (const neighbour of succMap.get(element) || []) {
      if (visited.has(neighbour)) continue;

      visited.add(neighbour);
      stack.push(neighbour);
    }
  }

  return false;
}
