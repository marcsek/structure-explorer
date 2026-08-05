export type TupleType = "function" | "predicate";

export interface TupleInfo {
  type: TupleType;
  name: string;
  arity: number;
}

export const getTupleId = (type: TupleType, key: string) => `${type}-${key}`;
