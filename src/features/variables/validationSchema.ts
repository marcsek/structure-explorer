import { z } from "zod";
import { lockable } from "../../shared/core/validation";

const variableRepresentationSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const serializedVariablesStateSchema = lockable(
  z.array(variableRepresentationSchema),
);

export type SerializedVariablesState = z.infer<
  typeof serializedVariablesStateSchema
>;

export const serializedVariablesStateDefault =
  (): SerializedVariablesState => ({
    value: [],
    locked: false,
  });
