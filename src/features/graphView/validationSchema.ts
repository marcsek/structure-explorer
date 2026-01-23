import z from "zod";
import { graphTypes } from "./graphs/plugins";

export const serializedGraphViewStateSchema = z.record(
  z.string(),
  z.record(
    z.enum(graphTypes),
    z.record(z.string(), z.tuple([z.number(), z.number()])),
  ),
);

export type SerializedGraphViewState = z.infer<
  typeof serializedGraphViewStateSchema
>;
