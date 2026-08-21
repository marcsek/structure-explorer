import { graphTypes } from "../graphView/graphs/registry";

export const editorTypes = [
  "text",
  "matrix",
  "database",
  "caseTree",
  ...graphTypes,
] as const;

export type EditorType = (typeof editorTypes)[number];

export type DrawerEditorType = Exclude<EditorType, "text">;
