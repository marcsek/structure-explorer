import type { GraphType } from "../graphView/graphs/plugins";

export type EditorType =
  | "text"
  | "matrix"
  | "database"
  | "caseTree"
  | GraphType;

export type DrawerEditorType = Exclude<EditorType, "text">;
