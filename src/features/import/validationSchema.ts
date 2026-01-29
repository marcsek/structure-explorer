import z from "zod";
import {
  SerializedFormulasStateDefault,
  serializedFormulasStateSchema,
} from "../formulas/validationSchema";
import {
  serializedGraphViewStateDefault,
  serializedGraphViewStateSchema,
} from "../graphView/validationSchema";
import {
  serializedLanguageStateDefault,
  serializedLanguageStateSchema,
} from "../language/validationSchema";
import {
  serializedStructureStateDefault,
  serializedStructureStateSchema,
} from "../structure/validationSchema";
import {
  serializedTeacherModeStateDefault,
  serializedTeacherModeStateSchema,
} from "../teacherMode/validationSchema";
import {
  serializedVariablesStateDefault,
  serializedVariablesStateSchema,
} from "../variables/validationSchema";
import {
  serializedEditorToolbarStateDefault,
  serializedEditorToolbarStateSchema,
} from "../editorToolbar/validationSchema";

export const MINIMAL_SUPPORTED_VERSION = 1;
export const MAXIMAL_SUPPORTED_VERSION = 1;

export const SERIALIZED_STATE_VERSION = 1;

export const versionSchema = z
  .number()
  .int()
  .min(MINIMAL_SUPPORTED_VERSION)
  .max(MAXIMAL_SUPPORTED_VERSION)
  .default(SERIALIZED_STATE_VERSION);

const schemaFields = {
  version: versionSchema,
  language: serializedLanguageStateSchema,
  structure: serializedStructureStateSchema,
  variables: serializedVariablesStateSchema,
  teacherMode: serializedTeacherModeStateSchema,
  graphView: serializedGraphViewStateSchema,
  formulas: serializedFormulasStateSchema,
  editorToolbar: serializedEditorToolbarStateSchema,
} as const;

export const serializedAppStateSchema = z.object(schemaFields);
export type SerializedAppState = z.infer<typeof serializedAppStateSchema>;

const schemaDefaults: SerializedAppState = {
  version: SERIALIZED_STATE_VERSION,
  language: serializedLanguageStateDefault,
  structure: serializedStructureStateDefault,
  variables: serializedVariablesStateDefault,
  teacherMode: serializedTeacherModeStateDefault,
  graphView: serializedGraphViewStateDefault,
  formulas: SerializedFormulasStateDefault,
  editorToolbar: serializedEditorToolbarStateDefault,
};

export function parseSerializedAppStateWithDefaults(data: unknown): {
  data: SerializedAppState;
  errors: string[];
} {
  const errors: string[] = [];
  const input = (data ?? {}) as Record<string, unknown>;
  const result = {} as SerializedAppState;

  for (const [field, schema] of Object.entries(schemaFields)) {
    const key = field as keyof typeof schemaFields;
    const parsed = schema.safeParse(input[key]);

    if (parsed.success) {
      // Typescript won't be able to narrow this.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = parsed.data;
    } else {
      // Same here.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (result as any)[key] = schemaDefaults[key];
      errors.push(z.prettifyError(parsed.error));
    }
  }

  return { data: result, errors };
}
