import type { GraphType } from "../graphView/graphs/registry";

export type EditorType =
  "text" | "matrix" | "database" | "caseTree" | GraphType;

export type DrawerEditorType = Exclude<EditorType, "text">;
