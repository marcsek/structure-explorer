import type { ReactNode } from "react";
import { InlineMath } from "react-katex";
import type { TextViewType } from "./textViews";

export const tupleLatexName = (name: string, arity?: number) =>
  `i(\\text{\\textsf{${name.replace(/_/g, "\\_")}}}${arity ? `^${arity}` : ""})`;

export interface TextViewAffixes {
  prefix: ReactNode;
  suffix: ReactNode;
}

type TextViewTypeWithName =
  | "constant_interpretation"
  | "predicate_interpretation"
  | "function_interpretation";

export type GetAffixesArgs =
  | {
      type: TextViewTypeWithName;
      name: string;
      displayName?: string;
    }
  | {
      type: Exclude<TextViewType, TextViewTypeWithName>;
    };

export const getAffixes = (args: GetAffixesArgs): TextViewAffixes => {
  switch (args.type) {
    case "domain":
      return {
        prefix: <InlineMath>{"D = \\{"}</InlineMath>,
        suffix: <InlineMath>{"\\}"}</InlineMath>,
      };
    case "constant_interpretation":
      return {
        prefix: (
          <InlineMath>{`${args.displayName ?? tupleLatexName(args.name)} = `}</InlineMath>
        ),
        suffix: null,
      };
    case "predicate_interpretation":
    case "function_interpretation":
      return {
        prefix: (
          <InlineMath>{`${args.displayName ?? tupleLatexName(args.name)} = \\{`}</InlineMath>
        ),
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
          <InlineMath>{`\\mathcal{${args.type.at(0)?.toUpperCase()}}_{\\mathcal{L}} = \\{`}</InlineMath>
        ),
        suffix: <InlineMath>{"\\}"}</InlineMath>,
      };
    default:
      return { prefix: null, suffix: null };
  }
};
