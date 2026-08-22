import {
  parseConstants,
  SyntaxError as ParserSyntaxError,
} from "@fmfi-uk-1-ain-412/js-fol-parser";
import { createSemanticError, createSyntaxError } from "../errors";
import { duplicates } from "../utils";
import { plural, toBe } from "../wordForms";

export function parseQueryVariables(text: string) {
  try {
    return { parsed: parseConstants(text) };
  } catch (error) {
    if (error instanceof ParserSyntaxError) {
      return {
        error: createSyntaxError(
          error.message.replace(/constant/i, (match) =>
            match[0] === "C" ? "Variable" : "variable",
          ),
          error.location,
        ),
      };
    }

    throw error;
  }
}

export function validateQueryVariables(variables: string[]) {
  if (variables.length === 0) {
    return createSemanticError(`No query variables specified.`);
  }

  const repeated = duplicates(variables);

  if (repeated.length > 0) {
    return createSemanticError(
      `Query ${plural(repeated.length, "variable")} ${repeated.join(", ")} ` +
        `${toBe(repeated.length)} listed ` +
        `more than once. Query variables must be distinct.`,
    );
  }
}
