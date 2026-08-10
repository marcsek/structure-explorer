import type { TextViewType } from "../textView/textViews";

export type TupleType = "function" | "predicate";

export interface TupleInfo {
  type: TupleType;
  name: string;
  arity: number;
}

export const getTupleId = (type: TupleType, key: string) => `${type}-${key}`;

export const tupleTypeToTextViewType = (type: TupleType): TextViewType => {
  switch (type) {
    case "predicate":
      return "predicate_interpretation";
    case "function":
      return "function_interpretation";
  }
};
