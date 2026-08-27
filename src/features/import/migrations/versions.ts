import { serializedCaseTreeViewStateSchema } from "../../caseTreeView/validationSchema";
import { serializedEditorToolbarStateSchema } from "../../editorToolbar/validationSchema";
import { serializedFormulasStateSchema } from "../../formulas/validationSchema";
import { serializedGraphViewStateSchema } from "../../graphView/validationSchema";
import { serializedLanguageStateSchema } from "../../language/validationSchema";
import { serializedQueriesStateSchema } from "../../queries/validationSchema";
import { serializedStructureStateSchema } from "../../structure/validationSchema";
import { serializedTeacherModeStateSchema } from "../../teacherMode/validationSchema";
import { serializedVariablesStateSchema } from "../../variables/validationSchema";
import { editorToolbarSchemaV1 } from "./oldSchemas/editorToolbar.v1";
import type { LooseState, SchemaFields } from "./parseFields";

export const v1Fields = {
  language: serializedLanguageStateSchema,
  structure: serializedStructureStateSchema,
  variables: serializedVariablesStateSchema,
  teacherMode: serializedTeacherModeStateSchema,
  graphView: serializedGraphViewStateSchema,
  formulas: serializedFormulasStateSchema,
  queries: serializedQueriesStateSchema,
  editorToolbar: editorToolbarSchemaV1,
  caseTreeView: serializedCaseTreeViewStateSchema,
} satisfies SchemaFields;

export const v2Fields = {
  ...v1Fields,
  editorToolbar: serializedEditorToolbarStateSchema,
} satisfies SchemaFields;

export type V1Fields = typeof v1Fields;
export type V2Fields = typeof v2Fields;

export type V1State = LooseState<V1Fields>;
export type V2State = LooseState<V2Fields>;

export const SERIALIZED_STATE_VERSION = 2;

export const currentFields = v2Fields;
export type CurrentFields = typeof currentFields;
