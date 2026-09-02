import z from "zod";
import { serializedCaseTreeViewStateDefault } from "../caseTreeView/validationSchema";
import { serializedEditorToolbarStateDefault } from "../editorToolbar/validationSchema";
import { serializedFormulasStateDefault } from "../formulas/validationSchema";
import { serializedGraphViewStateDefault } from "../graphView/validationSchema";
import { serializedLanguageStateDefault } from "../language/validationSchema";
import { serializedPredicatePaletteStateDefault } from "../predicatePalette/validationSchema";
import { serializedQueriesStateDefault } from "../queries/validationSchema";
import { serializedStructureStateDefault } from "../structure/validationSchema";
import { serializedTeacherModeStateDefault } from "../teacherMode/validationSchema";
import { serializedVariablesStateDefault } from "../variables/validationSchema";
import { MINIMAL_SUPPORTED_VERSION, migrateToCurrent } from "./migrations";
import { currentFields, SERIALIZED_STATE_VERSION } from "./migrations/versions";

export { MINIMAL_SUPPORTED_VERSION, SERIALIZED_STATE_VERSION };

export const MAXIMAL_SUPPORTED_VERSION = SERIALIZED_STATE_VERSION;

export const serializedAppStateSchema = z.object({
  version: z.literal(SERIALIZED_STATE_VERSION),
  ...currentFields,
});

export type SerializedAppState = z.infer<typeof serializedAppStateSchema>;

const createSchemaDefaults = (): SerializedAppState => ({
  version: SERIALIZED_STATE_VERSION,
  language: serializedLanguageStateDefault(),
  structure: serializedStructureStateDefault(),
  variables: serializedVariablesStateDefault(),
  teacherMode: serializedTeacherModeStateDefault(),
  graphView: serializedGraphViewStateDefault(),
  formulas: serializedFormulasStateDefault(),
  queries: serializedQueriesStateDefault(),
  editorToolbar: serializedEditorToolbarStateDefault(),
  caseTreeView: serializedCaseTreeViewStateDefault(),
  predicatePalette: serializedPredicatePaletteStateDefault(),
});

export function parseSerializedAppStateWithDefaults(data: unknown): {
  data: SerializedAppState;
  errors: string[];
} {
  const parsedInput = z.looseObject({}).safeParse(data);

  if (!parsedInput.success)
    return {
      data: createSchemaDefaults(),
      errors: [z.prettifyError(parsedInput.error)],
    };

  const { data: migrated, errors } = migrateToCurrent(parsedInput.data);

  return { data: { ...createSchemaDefaults(), ...migrated }, errors };
}
