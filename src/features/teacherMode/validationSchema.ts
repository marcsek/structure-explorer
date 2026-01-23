import { z } from "zod";

export const serializedTeacherModeStateSchema = z.object({
  teacherMode: z.union([z.boolean(), z.undefined()]),
});

export type SerializedTeacherModeState = z.infer<
  typeof serializedTeacherModeStateSchema
>;
