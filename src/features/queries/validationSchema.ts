import z from "zod";
import { initialQueriesState } from "./queriesSlice.ts";

const queriesStateSchema = z.object({
  text: z.string(),
  variablesText: z.string(),
  stale: z.boolean().default(false),
  locked: z.boolean(),
});

export const serializedQueriesStateSchema = z
  .object({
    queries: z.array(queriesStateSchema),
  })
  .default({ queries: [] });

export type SerializedQueriesState = z.infer<
  typeof serializedQueriesStateSchema
>;

export const SerializedQueriesStateDefault: SerializedQueriesState =
  initialQueriesState;
