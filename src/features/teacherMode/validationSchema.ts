import { z } from "zod";

export const serializedTeacherModeStateSchema = z.object({
  teacherMode: z.union([z.boolean(), z.undefined()]).optional(),
});

export type SerializedTeacherModeState = z.infer<
  typeof serializedTeacherModeStateSchema
>;

export const serializedTeacherModeStateDefault =
  (): SerializedTeacherModeState => ({ teacherMode: false });
