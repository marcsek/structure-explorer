export type TupleType = "function" | "predicate";

export interface TupleInfo {
  type: TupleType;
  name: string;
  arity: number;
}

export type TupleIdentity = Pick<TupleInfo, "type" | "name">;

export const getTupleId = ({ type, name }: TupleIdentity) => `${type}-${name}`;

export const getTupleLength = (type: TupleType, arity: number) =>
  type === "function" ? arity + 1 : arity;

export const isBinaryTuple = (type: TupleType, arity: number) =>
  getTupleLength(type, arity) === 2;
