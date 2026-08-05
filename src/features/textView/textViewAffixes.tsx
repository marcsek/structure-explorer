import type { ReactNode } from "react";
import { InlineMath } from "react-katex";
import type { TextViewType } from "./textViews";

export const tupleLatexName = (name: string) =>
  `i(\\text{\\textsf{${name.replace(/_/g, "\\_")}}})`;

export interface TextViewAffixes {
  prefix: ReactNode;
  suffix: ReactNode;
}

export const getAffixes = (
  type: TextViewType,
  name: string,
): TextViewAffixes => {
  switch (type) {
    case "domain":
      return {
        prefix: <InlineMath>{"D = \\{"}</InlineMath>,
        suffix: <InlineMath>{"\\}"}</InlineMath>,
      };
    case "constant_interpretation":
      return {
        prefix: <InlineMath>{`${tupleLatexName(name)} = `}</InlineMath>,
        suffix: null,
      };
    case "predicate_interpretation":
    case "function_interpretation":
      return {
        prefix: <InlineMath>{`${tupleLatexName(name)} = \\{`}</InlineMath>,
        suffix: <InlineMath>{`\\}`}</InlineMath>,
      };
    case "variables":
      return {
        prefix: <InlineMath>{"e = \\{"}</InlineMath>,
        suffix: <InlineMath>{"\\}"}</InlineMath>,
      };
    case "constants":
    case "predicates":
    case "functions":
      return {
        prefix: (
          <InlineMath>{`\\mathcal{${type.at(0)?.toUpperCase()}}_{\\mathcal{L}} = \\{`}</InlineMath>
        ),
        suffix: <InlineMath>{"\\}"}</InlineMath>,
      };
    default:
      return { prefix: null, suffix: null };
  }
};
