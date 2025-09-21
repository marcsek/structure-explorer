import type { AppMiddleware } from "../app/store";
import { updateDomain } from "./structure/structureSlice";
import { parseDomain, SyntaxError } from "@fmfi-uk-1-ain-412/js-fol-parser";

export const parserMiddleware: AppMiddleware =
  (store) => (next) => (action) => {
    if (updateDomain.match(action)) {
      action.payload.parsed = { res: store.getState().structure.parsedDomain };
      try {
        const parsedDomain = parseDomain(action.payload.raw);
        if (parsedDomain.length === 0)
          action.payload.parsed.error = new Error("Domain cannot be empty");

        action.payload.parsed = { res: parsedDomain };
      } catch (error) {
        if (error instanceof SyntaxError) {
          const errorObj = { ...error };
          action.payload.parsed.error = errorObj;
        } else {
          throw error;
        }
      }
    }

    return next(action);
  };
