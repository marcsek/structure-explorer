import { useEffect, useRef } from "react";

function comparatorEqual<T>(
  arrayNew: T[],
  arrayOld: T[],
  comparator: Comparator<T>,
) {
  return (
    arrayOld.length > arrayNew.length ||
    arrayNew.every(
      (entry, i) => i < arrayOld.length && comparator(entry, arrayOld[i]),
    )
  );
}

type Comparator<T> = (a: T, b: T) => boolean;
type DepEntry<T> = [T[], Comparator<T>];

export function useComparatorEffect<T>(
  effect: React.EffectCallback,
  deps: DepEntry<T>[],
) {
  const prevDeps = useRef<React.DependencyList>();
  const initialRender = useRef<boolean>(true);

  const depsChanged =
    !prevDeps.current ||
    deps.some(
      ([array, comp], i) =>
        !comparatorEqual(array, prevDeps.current?.[i][0] ?? [], comp),
    );

  useEffect(() => {
    if (initialRender.current) {
      prevDeps.current = deps;
      initialRender.current = false;
      return;
    }

    if (depsChanged) {
      prevDeps.current = deps;
      return effect();
    }

    prevDeps.current = deps;
  });
}
