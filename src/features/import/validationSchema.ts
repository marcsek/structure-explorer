import z from "zod";
import { serializedFormulasStateSchema } from "../formulas/validationSchema";
import { serializedGraphViewStateSchema } from "../graphView/validationSchema";
import { serializedLanguageStateSchema } from "../language/validationSchema";
import { serializedStructureStateSchema } from "../structure/validationSchema";
import { serializedTeacherModeStateSchema } from "../teacherMode/validationSchema";
import { serializedVariablesStateSchema } from "../variables/validationSchema";

export const MINIMAL_SUPPORTED_VERSION = 1;
export const MAXIMAL_SUPPORTED_VERSION = 1;

export const SERIALIZED_STATE_VERSION = 1;

export const versionSchema = z
  .number()
  .int()
  .min(MINIMAL_SUPPORTED_VERSION)
  .max(MAXIMAL_SUPPORTED_VERSION)
  .default(SERIALIZED_STATE_VERSION);

export const serializedAppStateSchema = z.object({
  version: versionSchema,
  language: serializedLanguageStateSchema,
  structure: serializedStructureStateSchema,
  variables: serializedVariablesStateSchema,
  teacherMode: serializedTeacherModeStateSchema,
  graphView: serializedGraphViewStateSchema,
  formulas: serializedFormulasStateSchema,
});

export type SerializedAppState = z.infer<typeof serializedAppStateSchema>;
