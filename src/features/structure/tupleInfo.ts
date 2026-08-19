import type { TextViewType } from "../textView/textViews";

export type TupleType = "function" | "predicate";

export interface TupleInfo {
  type: TupleType;
  name: string;
  arity: number;
}

export type TupleIdentity = Pick<TupleInfo, "type" | "name">;

export const getTupleId = ({ type, name }: TupleIdentity) => `${type}-${name}`;

export const getKeyFromTupleId = (tupleId: string) =>
  tupleId.substring(tupleId.lastIndexOf("-") + 1);

export const tupleTypeToTextViewType = (type: TupleType): TextViewType => {
  switch (type) {
    case "predicate":
      return "predicate_interpretation";
    case "function":
      return "function_interpretation";
  }
};
