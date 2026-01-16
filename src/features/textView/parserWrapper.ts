import {
  parseTuples as folParserParseTuples,
  type Expectation,
  type Location,
} from "@fmfi-uk-1-ain-412/js-fol-parser";

// TODO: Unused
export const parseTuplesUnique = (
  input: string,
  tupleType: "predicate" | "function",
) => {
  const interpretation = folParserParseTuples(input);

  const normalizeTuple = (tuple: string[]) =>
    tupleType === "function" ? tuple.slice(0, -1) : tuple;

  const seen = new Set<string>();

  for (const tuple of interpretation) {
    const actualTuple = normalizeTuple(tuple);
    const serialized = JSON.stringify(actualTuple);

    if (seen.has(serialized)) {
      const arity = actualTuple.length;
      const size = arity === 1 ? "element" : `${arity}-tuple`;
      const message =
        tupleType === "predicate"
          ? `${size} (${actualTuple}) is already in predicate.`
          : `${size} (${actualTuple}) has already defined value.`;

      throw new SyntaxError(message);
    }

    seen.add(serialized);
  }

  return interpretation;
};

export class SyntaxError {
  message: string;
  expected?: Expectation;
  found?: string;
  location?: Location;

  constructor(
    message: string,
    expected?: Expectation,
    found?: string,
    location?: Location,
  ) {
    this.message = message;
    this.expected = expected;
    this.found = found;
    this.location = location;
  }
}
