import type { DomainElement } from "../../model/Structure";

export type DomainTuple = DomainElement[];

export const domainTupleKey = (tuple: DomainTuple) => tuple.join(",");

export const formatDomainTuple = (tuple: DomainTuple) =>
  tuple.length === 1 ? tuple[0] : `(${domainTupleKey(tuple)})`;

export const domainTupleNoun = (length: number) =>
  length === 1 ? "element" : `${length}-tuple`;
