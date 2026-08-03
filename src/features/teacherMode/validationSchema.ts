import { z } from "zod";
import { initialTeacherModeState } from "./teacherModeSlice";

export const serializedTeacherModeStateSchema = z.object({
  teacherMode: z.union([z.boolean(), z.undefined()]).optional(),
});

export type SerializedTeacherModeState = z.infer<
  typeof serializedTeacherModeStateSchema
>;

export const serializedTeacherModeStateDefault: SerializedTeacherModeState =
  initialTeacherModeState;
