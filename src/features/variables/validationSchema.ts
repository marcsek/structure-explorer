import { z } from "zod";
import { lockable } from "../../common/validation";

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
