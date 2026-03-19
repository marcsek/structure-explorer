import type Formula from "../model/formula/Formula";

export function getRandomElement<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function latex(parts: string[] = []) {
  const push = (s: string) => latex([...parts, s]);
  const pushOnLast = (wrap: (l: string) => string) => {
    const last = parts.at(-1) ?? "";
    return latex([...parts.slice(0, -1), wrap(last)]);
  };
  const escape = (s: string) => s.replace(/_/g, "\\_");

  return {
    M: () => push("\\mathcal{M}"),
    models: (m: boolean) => push(m ? "\\models" : "\\not\\models"),
    formula: (f: Formula) => push(f.toTex()),
    valuation: (vars?: string) => push(`[e${vars ?? ""}]`),
    valuationPairs: (p: Map<string, string>) =>
      Array.from(p)
        .map(([from, to]) => `(${from} / ${latex().text(to).get()})`)
        .join(" "),
    altValuation: (vars?: string) => push(`[e'${vars ?? ""}]`),
    rawValuation: (vars?: string) => push(`e${vars ?? ""}`),
    text: (s: string) => push(`\\text{${escape(s)}}`),
    escape: (s: string) => push(escape(s)),
    raw: (s: string) => push(s),
    sub: (s: string) => pushOnLast((l) => `${l}_{${s}}`),
    sup: (s: string) => pushOnLast((l) => `${l}^{${s}}`),
    get: () => parts.join(" "),
  };
}
