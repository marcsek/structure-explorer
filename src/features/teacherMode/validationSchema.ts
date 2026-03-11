import { z } from "zod";
import { initialTeacherModeState } from "./teacherModeslice";

export const serializedTeacherModeStateSchema = z.object({
  teacherMode: z.union([z.boolean(), z.undefined()]),
});

export type SerializedTeacherModeState = z.infer<
  typeof serializedTeacherModeStateSchema
>;

export const serializedTeacherModeStateDefault: SerializedTeacherModeState =
  initialTeacherModeState;
