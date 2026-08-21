import z from "zod";
import { graphTypes } from "./graphs/registry";

export const serializedGraphViewStateSchema = z.record(
  z.string(),
  z.partialRecord(
    z.enum(graphTypes),
    z.record(z.string(), z.tuple([z.number(), z.number()])),
  ),
);

export type SerializedGraphViewState = z.infer<
  typeof serializedGraphViewStateSchema
>;

export const serializedGraphViewStateDefault =
  (): SerializedGraphViewState => ({});
